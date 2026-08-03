import { Inject, Injectable, Logger } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common/exceptions/bad-request.exception';
import {
  Agent,
  OpenAIProvider,
  Runner,
  tool,
  type AgentInputItem,
  type FunctionTool,
  type RunContext,
  type ToolOutputImage,
  type ToolOutputText,
} from '@openai/agents';
import OpenAI from 'openai';
import { z } from 'zod';
import { DEFAULT_TOOL_ITERATION_LIMIT } from '../../constants';
import { createSafetyIdentifier } from '../../utils/crypto.utils';
import { SessionService } from '../auth/service/session.service';
import { OPEN_AI_MODULE_OPTIONS, OpenAiModuleOptions } from './open-ai.options';

/**
 * Result returned from an OpenAI Agents function tool to the model.
 */
export type OpenAiToolOutput =
  | string
  | ToolOutputText
  | ToolOutputImage
  | Record<string, unknown>
  | unknown[];

/**
 * Progress event pushed by tools through the local run context.
 */
export type OpenAiProgressEvent = {
  type: 'progress';
  stage: string;
  message: string;
};

/**
 * Local Agents SDK context shared with tool implementations.
 *
 * Tools call `addProgress()`; `run()` drains `progressEvents` and yields them.
 */
export type OpenAiRunContext = {
  readonly progressEvents: OpenAiProgressEvent[];
  addProgress(stage: string, message: string): void;
};

/**
 * Agents SDK function tool used by feature services.
 */
export type OpenAiTool<Context extends OpenAiRunContext = OpenAiRunContext> =
  FunctionTool<Context, z.ZodObject, OpenAiToolOutput>;

export type OpenAiToolOptions<
  Parameters extends z.ZodObject,
  Context extends OpenAiRunContext = OpenAiRunContext,
> = {
  name: string;
  description: string;
  parameters: Parameters;
  execute(
    argumentsValue: z.infer<Parameters>,
    runContext?: RunContext<Context>,
  ): OpenAiToolOutput | Promise<OpenAiToolOutput>;
};

export type OpenAiRunOptions<
  OutputSchema extends z.ZodObject,
  Context extends OpenAiRunContext = OpenAiRunContext,
> = {
  name?: string;
  model: string;
  instructions: string;
  speed: 'priority' | 'default';
  reasoningEffort: 'low' | 'medium' | 'high';
  input: string | AgentInputItem[];
  outputType: OutputSchema;
  tools: OpenAiTool<Context>[];
  context?: Context;
  previousResponseId?: string;
  toolIterationLimit?: number;
};

export type OpenAiRunEvent<ParsedResult> =
  | {
      type: 'response_started';
      iteration: number;
    }
  | OpenAiProgressEvent
  | {
      type: 'result';
      output: ParsedResult;
      responseId: string;
    };

/**
 * Provides the configured OpenAI client and reusable Agents SDK workflows.
 *
 * Feature services own prompts, tool declarations, and tool implementations.
 * This service owns SDK initialization and the standard agent run loop.
 */
@Injectable()
export class OpenAiService {
  readonly client: OpenAI;
  private readonly runner: Runner;

  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
    @Inject(SessionService)
    private readonly session: SessionService,
    @Inject(OPEN_AI_MODULE_OPTIONS)
    readonly options: OpenAiModuleOptions,
  ) {
    this.client = new OpenAI({
      apiKey: options.apiKey,
      timeout: options.timeoutMs,
    });

    this.runner = new Runner({
      modelProvider: new OpenAIProvider({
        openAIClient: this.client as never,
      }),
      tracingDisabled: true,
    });
  }

  /**
   * Creates a local run context that tools can use to emit progress events.
   */
  public createRunContext(): OpenAiRunContext {
    const progressEvents: OpenAiProgressEvent[] = [];

    return {
      progressEvents,
      addProgress(stage, message) {
        progressEvents.push({
          type: 'progress',
          stage,
          message,
        });
      },
    };
  }

  /**
   * Validates unknown input and transforms the parsed value into the shape
   * required by an OpenAI agent request.
   *
   * The transformer receives the schema output, so Zod coercions and
   * transformations are reflected in its input type.
   */
  public parseOpenAiInput<Schema extends z.ZodType, Result>(
    input: unknown,
    schema: Schema,
    transformer: (input: z.output<Schema>) => Result,
  ): Result {
    return transformer(schema.parse(input));
  }

  /**
   * Defines an Agents SDK function tool from one authoritative Zod schema.
   */
  public defineOpenAiTool<
    Parameters extends z.ZodObject,
    Context extends OpenAiRunContext = OpenAiRunContext,
  >(options: OpenAiToolOptions<Parameters, Context>): OpenAiTool<Context> {
    return tool({
      name: options.name,
      description: options.description,
      parameters: options.parameters as z.ZodObject,
      execute: async (argumentsValue, runContext) =>
        options.execute(
          argumentsValue as z.infer<Parameters>,
          runContext as RunContext<Context> | undefined,
        ),
      errorFunction: (_context: RunContext, error: unknown): string =>
        JSON.stringify({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : 'The OpenAI tool could not be executed.',
        }),
    }) as OpenAiTool<Context>;
  }

  /**
   * Rejects models that are not configured for this deployment.
   *
   * @throws {BadRequestException} When the model id is outside the allowlist.
   */
  public assertModelAllowed(modelId: string): void {
    if (!this.isModelAllowed(modelId)) {
      throw new BadRequestException(
        'The selected AI model is not available for template editing.',
      );
    }
  }

  /**
   * Runs an Agents SDK request until the model returns a final structured result.
   *
   * Function calls are executed by the SDK and their outputs are automatically
   * sent back to the model using the response conversation.
   */
  public async *run<
    OutputSchema extends z.ZodObject,
    Context extends OpenAiRunContext = OpenAiRunContext,
  >(
    options: OpenAiRunOptions<OutputSchema, Context>,
  ): AsyncGenerator<OpenAiRunEvent<z.infer<OutputSchema>>> {
    const {
      name = 'OpenAI Agent',
      model,
      instructions,
      speed,
      reasoningEffort,
      input,
      outputType,
      tools,
      previousResponseId,
      toolIterationLimit = DEFAULT_TOOL_ITERATION_LIMIT,
    } = options;

    this.assertModelAllowed(model);

    const context = options.context ?? (this.createRunContext() as Context);

    const agent = new Agent<Context, OutputSchema>({
      name,
      instructions,
      model,
      outputType,
      tools,
      modelSettings: {
        store: true,
        parallelToolCalls: true,
        reasoning: {
          effort: reasoningEffort,
        },
        providerData: {
          service_tier: speed,
          safety_identifier: createSafetyIdentifier(
            this.session.authorizedUser.id,
          ),
        },
      },
    });

    const stream = await this.runner.run(agent, input, {
      stream: true,
      maxTurns: toolIterationLimit,
      previousResponseId,
      context,
    });

    let iteration = -1;

    for await (const event of stream) {
      if (
        event.type === 'raw_model_stream_event' &&
        event.data.type === 'response_started'
      ) {
        iteration += 1;
        yield {
          type: 'response_started',
          iteration,
        };
      }

      if (
        event.type === 'run_item_stream_event' &&
        event.name === 'tool_called' &&
        event.item.type === 'tool_call_item'
      ) {
        const toolName = event.item.toolName;

        if (toolName) {
          this.logger.log('OpenAI tool call started', OpenAiService.name, {
            toolName,
            iteration,
          });
        }
      }

      if (
        event.type === 'run_item_stream_event' &&
        event.name === 'tool_output'
      ) {
        this.logger.log('OpenAI tool call completed', OpenAiService.name, {
          iteration,
        });
      }

      yield* this.drainProgressEvents(context);
    }

    await stream.completed;

    yield* this.drainProgressEvents(context);

    const output = stream.finalOutput;
    const responseId = stream.lastResponseId;

    if (output === undefined || output === null) {
      throw new Error('OpenAI returned no structured result.');
    }

    if (!responseId) {
      throw new Error('OpenAI returned no response id.');
    }

    yield {
      type: 'result',
      output: output as z.infer<OutputSchema>,
      responseId,
    };
  }

  protected isModelAllowed(modelId: string): boolean {
    return this.options.modelAllowlist.includes(modelId);
  }

  private *drainProgressEvents(
    context: OpenAiRunContext,
  ): Generator<OpenAiProgressEvent> {
    while (context.progressEvents.length > 0) {
      const event = context.progressEvents.shift();

      if (event) {
        yield event;
      }
    }
  }
}

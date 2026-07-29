import { Inject, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { zodResponsesFunction } from 'openai/helpers/zod';
import type {
  ParsedResponse,
  ParsedResponseFunctionToolCall,
  ResponseCreateParamsNonStreaming,
  ResponseInput,
  ResponseInputItem,
  Tool,
} from 'openai/resources/responses/responses';
import { z } from 'zod';
import { OPEN_AI_MODULE_OPTIONS, OpenAiModuleOptions } from './open-ai.options';

const DEFAULT_TOOL_ITERATION_LIMIT = 10;

export type OpenAiToolOutput = ResponseInputItem.FunctionCallOutput['output'];

/**
 * Runtime-independent shape used to collect and dispatch OpenAI function tools.
 *
 * The context is owned by the feature and is never included in the model
 * request. It can contain authenticated state, injected Nest services, or any
 * other application-only dependency needed by a tool implementation.
 */
export type OpenAiTool<Context> = {
  name: string;
  definition: Tool;
  execute(
    argumentsValue: unknown,
    context: Context,
  ): OpenAiToolOutput | Promise<OpenAiToolOutput>;
};

export type OpenAiRunOptions = Omit<
  ResponseCreateParamsNonStreaming,
  'input' | 'model' | 'previous_response_id' | 'stream'
> & {
  input: string | ResponseInput;
  previousResponseId?: string;
  toolIterationLimit?: number;
  handleToolCall: (
    toolCall: ParsedResponseFunctionToolCall,
    argumentsValue: unknown,
  ) => OpenAiToolOutput | Promise<OpenAiToolOutput>;
};

export type OpenAiRunEvent<ParsedResult> =
  | {
      type: 'response_started';
      iteration: number;
    }
  | {
      type: 'tool_call';
      iteration: number;
      toolCall: ParsedResponseFunctionToolCall;
    }
  | {
      type: 'result';
      response: ParsedResponse<ParsedResult>;
    };

/**
 * Provides the configured OpenAI client and reusable Responses API workflows.
 *
 * Feature services own prompts, tool declarations, and tool implementations.
 * This service owns SDK initialization and the standard function-tool loop.
 */
@Injectable()
export class OpenAiService {
  readonly client: OpenAI;

  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
    @Inject(OPEN_AI_MODULE_OPTIONS)
    readonly options: OpenAiModuleOptions,
  ) {
    this.client = new OpenAI({
      apiKey: options.apiKey,
      timeout: options.timeoutMs,
    });
  }

  /**
   * Validates unknown input and transforms the parsed value into the shape
   * required by an OpenAI request.
   *
   * The transformer receives the schema output, so Zod coercions and
   * transformations are reflected in its input type.
   */
  parseInput<Schema extends z.ZodType, Result>(
    input: unknown,
    schema: Schema,
    transformer: (input: z.output<Schema>) => Result,
  ): Result {
    return transformer(schema.parse(input));
  }

  /**
   * Defines an OpenAI Responses function tool from one authoritative Zod schema.
   *
   * The OpenAI helper converts the schema to strict JSON Schema for the model
   * and makes `responses.parse()` validate arguments before tool dispatch.
   */
  defineOpenAiTool<Parameters extends z.ZodType, Context>(options: {
    name: string;
    description: string;
    parameters: Parameters;
    execute(
      argumentsValue: z.infer<Parameters>,
      context: Context,
    ): OpenAiToolOutput | Promise<OpenAiToolOutput>;
  }): OpenAiTool<Context> {
    return {
      name: options.name,
      definition: zodResponsesFunction({
        name: options.name,
        description: options.description,
        parameters: options.parameters,
      }),
      async execute(argumentsValue, context) {
        try {
          return await options.execute(
            argumentsValue as z.infer<Parameters>,
            context,
          );
        } catch (error) {
          return JSON.stringify({
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'The OpenAI tool could not be executed.',
          });
        }
      },
    };
  }

  /**
   * Returns the wire definitions passed to `responses.parse()`.
   */
  getOpenAiToolDefinitions<Context>(
    tools: readonly OpenAiTool<Context>[],
  ): Tool[] {
    return tools.map(({ definition }) => definition);
  }

  /**
   * Dispatches an already parsed Responses function call to its typed handler.
   */
  executeOpenAiTool<Context>(
    tools: readonly OpenAiTool<Context>[],
    name: string,
    argumentsValue: unknown,
    context: Context,
  ): OpenAiToolOutput | Promise<OpenAiToolOutput> {
    const tool = tools.find((candidate) => candidate.name === name);

    if (!tool) {
      throw new Error(`Unknown OpenAI tool: ${name}`);
    }

    return tool.execute(argumentsValue, context);
  }

  /**
   * Runs a Responses API request until the model returns a final response.
   *
   * Function calls are delegated to the feature handler and their outputs are
   * automatically sent back to the model using the response conversation.
   */
  async *run<ParsedResult>(
    options: OpenAiRunOptions,
  ): AsyncGenerator<OpenAiRunEvent<ParsedResult>> {
    const {
      input: initialInput,
      previousResponseId: initialPreviousResponseId,
      toolIterationLimit = DEFAULT_TOOL_ITERATION_LIMIT,
      handleToolCall,
      ...responseOptions
    } = options;

    let input = initialInput;
    let previousResponseId = initialPreviousResponseId;

    for (let iteration = 0; iteration < toolIterationLimit; iteration += 1) {
      yield {
        type: 'response_started',
        iteration,
      };

      const response = await this.client.responses.parse<
        ResponseCreateParamsNonStreaming,
        ParsedResult
      >({
        ...responseOptions,
        model: this.options.model,
        input,
        ...(previousResponseId
          ? { previous_response_id: previousResponseId }
          : {}),
      });
      const toolCalls = response.output.filter(
        (item): item is ParsedResponseFunctionToolCall =>
          item.type === 'function_call',
      );

      if (!toolCalls.length) {
        yield {
          type: 'result',
          response,
        };
        return;
      }

      const toolOutputs: ResponseInput = [];

      for (const toolCall of toolCalls) {
        yield {
          type: 'tool_call',
          iteration,
          toolCall,
        };

        const startedAt = Date.now();
        const logContext = {
          toolName: toolCall.name,
          toolCallId: toolCall.call_id,
          iteration,
        };

        this.logger.log(
          'OpenAI tool call started',
          OpenAiService.name,
          logContext,
        );

        let output: OpenAiToolOutput;

        try {
          output = await handleToolCall(toolCall, toolCall.parsed_arguments);

          this.logger.log('OpenAI tool call completed', OpenAiService.name, {
            ...logContext,
            durationMs: Date.now() - startedAt,
          });
        } catch (error) {
          this.logger.error('OpenAI tool call failed', OpenAiService.name, {
            ...logContext,
            durationMs: Date.now() - startedAt,
            error,
          });

          throw error;
        }

        toolOutputs.push({
          type: 'function_call_output',
          call_id: toolCall.call_id,
          output,
        });
      }

      input = toolOutputs;
      previousResponseId = response.id;
    }

    throw new Error(
      `OpenAI exceeded the tool iteration limit of ${toolIterationLimit}.`,
    );
  }
}

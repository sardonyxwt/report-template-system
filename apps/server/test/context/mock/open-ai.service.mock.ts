import { Injectable } from '@nestjs/common';
import type { z } from 'zod';
import {
  OpenAiService,
  type OpenAiModuleOptions,
  type OpenAiTool,
  type OpenAiToolOptions,
} from 'platform/common-server';

@Injectable()
export class OpenAiServiceMock extends OpenAiService {
  static readonly modelAllowlist: OpenAiModuleOptions['modelAllowlist'] = [
    'test-model-standard',
    'test-model-fast',
  ];

  override isModelAllowed(modelId: string): boolean {
    return OpenAiServiceMock.modelAllowlist.includes(modelId);
  }

  override defineOpenAiTool<Parameters extends z.ZodType, Context>(
    options: OpenAiToolOptions<Parameters, Context>,
  ): OpenAiTool<Context> {
    return super.defineOpenAiTool(options);
  }
}

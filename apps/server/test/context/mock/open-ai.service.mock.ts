import { Injectable } from '@nestjs/common';
import {
  OpenAiService,
  type OpenAiModuleOptions,
} from 'platform/common-server';

@Injectable()
export class OpenAiServiceMock extends OpenAiService {
  static readonly modelAllowlist: OpenAiModuleOptions['modelAllowlist'] = [
    'test-model-standard',
    'test-model-fast',
  ];

  protected override isModelAllowed(modelId: string): boolean {
    return OpenAiServiceMock.modelAllowlist.includes(modelId);
  }
}

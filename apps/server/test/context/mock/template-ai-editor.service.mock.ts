import { Injectable } from '@nestjs/common';
import {
  TemplateAiEditEvent,
  TemplateAiEditRequest,
} from 'platform/common-base';
import { TemplateAiEditorService } from '../../../src/future/template/template-ai-editor.service';

@Injectable()
export class TemplateAiEditorServiceMock extends TemplateAiEditorService {
  static events: TemplateAiEditEvent[] = [];

  override async *editEvents(
    request: TemplateAiEditRequest,
  ): AsyncGenerator<TemplateAiEditEvent> {
    TemplateAiEditorServiceMock.events = [
      {
        type: 'progress',
        data: {
          stage: 'queued',
          message: 'Request accepted. Starting AI…',
        },
      },
      {
        type: 'progress',
        data: {
          stage: 'reviewing',
          message: 'AI is checking the visual result…',
        },
      },
      {
        type: 'result',
        data: {
          data: {
            blocks: [...request.data.blocks].reverse(),
          },
          contextId: 'response-test',
        },
      },
    ];

    yield* TemplateAiEditorServiceMock.events;
  }
}

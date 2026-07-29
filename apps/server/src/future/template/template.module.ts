import { Module } from '@nestjs/common';
import { TemplateAiEditorService } from './template-ai-editor.service';
import { TemplateApi } from './template.api';
import { TemplateService } from './template.service';

/**
 * Nest feature module for template CRUD, preview, and AI-assisted editing.
 */
@Module({
  controllers: [TemplateApi],
  providers: [TemplateAiEditorService, TemplateService],
})
export class TemplateFutureModule {}

import { Module } from '@nestjs/common';
import { TemplateApi } from './template.api';
import { TemplateService } from './template.service';

@Module({
  controllers: [TemplateApi],
  providers: [TemplateService],
})
export class TemplateFutureModule {}

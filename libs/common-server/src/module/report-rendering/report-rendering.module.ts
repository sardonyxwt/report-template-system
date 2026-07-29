import { DynamicModule, Module } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces/modules/module-metadata.interface';
import { ReportHtmlService } from './report-html.service';
import { ReportImageService } from './report-image.service';
import { ReportPdfService } from './report-pdf.service';

/**
 * Global utility module for report HTML, image, and PDF rendering services.
 */
@Module({})
export class ReportRenderingModule {
  private static readonly PROVIDERS = [
    ReportHtmlService,
    ReportImageService,
    ReportPdfService,
  ] satisfies ModuleMetadata['providers'];

  /**
   * Registers report rendering utilities globally for the application.
   */
  static forRoot(): DynamicModule {
    return {
      global: true,
      module: ReportRenderingModule,
      providers: ReportRenderingModule.PROVIDERS,
      exports: ReportRenderingModule.PROVIDERS,
    };
  }
}

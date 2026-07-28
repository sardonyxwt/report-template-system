import type { ReportDataJson } from './report.types';
import type { TemplateDataJson } from './template.types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    type TemplateData = TemplateDataJson;
    type ReportData = ReportDataJson;
  }
}

export type { ReportDataJson, TemplateDataJson };

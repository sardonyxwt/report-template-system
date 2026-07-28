import type {
  ReportData as PrismaReportData,
  TemplateData as PrismaTemplateData,
} from './data';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    type ReportData = PrismaReportData;
    type TemplateData = PrismaTemplateData;
  }
}

export {};

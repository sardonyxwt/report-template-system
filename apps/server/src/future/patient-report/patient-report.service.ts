import { Inject, Injectable, Logger, StreamableFile } from '@nestjs/common';
import {
  PDF_MIMETYPE,
  PatientReportAggregateRequest,
  PatientReportCreateRequest,
  PatientReportResponse,
  PatientReportsResponse,
} from 'platform/common-base';
import {
  PrismaService,
  ReportHtmlService,
  ReportPdfService,
  SessionService,
} from 'platform/common-server';
import { patientReportInclude, Prisma } from 'platform/prisma';

/**
 * Manages patient report records and their rendered PDF representation.
 */
@Injectable()
export class PatientReportService {
  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(SessionService)
    private readonly session: SessionService,
    @Inject(ReportHtmlService)
    private readonly reportHtmlService: ReportHtmlService,
    @Inject(ReportPdfService)
    private readonly reportPdfService: ReportPdfService,
  ) {}

  /**
   * Creates a patient report after validating report/template compatibility.
   */
  async create(
    data: PatientReportCreateRequest,
  ): Promise<PatientReportResponse> {
    const [report, template] = await this.prisma.runAll(
      (tx) =>
        [
          tx.clinicReport.findFirstOrThrow({
            where: { id: data.reportId },
            include: { clinic: true },
          }),
          tx.template.findFirstOrThrow({
            where: { id: data.templateId },
            include: { clinic: true },
          }),
        ] as const,
    );

    this.session.abilityGuard('patientReports', 'create', {
      reportManagerId: report.clinic.managerId,
      reportClinicId: report.clinicId,
      templateManagerId: template.clinic.managerId,
      templateClinicId: template.clinicId,
    });

    const patientReport = await this.prisma.tx.patientReport.create({
      data,
      include: patientReportInclude.include,
    });

    this.logger.log('Patient report created', PatientReportService.name, {
      reportId: patientReport.reportId,
      templateId: patientReport.templateId,
    });

    return patientReport;
  }

  /**
   * Deletes a patient report after checking access through its clinic.
   */
  async delete(reportId: number): Promise<PatientReportResponse> {
    this.logger.log(
      'Delete patient report requested',
      PatientReportService.name,
      { reportId },
    );

    return this.prisma.run(async (tx) => {
      const patientReport = await tx.patientReport.findFirstOrThrow({
        where: { reportId },
        select: {
          report: {
            select: {
              clinic: { select: { managerId: true } },
            },
          },
        },
      });

      this.session.abilityGuard('patientReports', 'delete', {
        managerId: patientReport.report.clinic.managerId,
      });

      const deletedPatientReport = await tx.patientReport.delete({
        where: { reportId },
        include: patientReportInclude.include,
      });

      this.logger.log('Patient report deleted', PatientReportService.name, {
        reportId: deletedPatientReport.reportId,
      });

      return deletedPatientReport;
    });
  }

  /**
   * Renders the stored report/template pair and returns a downloadable PDF.
   */
  async downloadPdf(reportId: number): Promise<StreamableFile> {
    const patientReport = await this.prisma.tx.patientReport.findUniqueOrThrow({
      where: { reportId },
      select: {
        report: {
          select: {
            patientId: true,
            createdAt: true,
            data: true,
            clinic: {
              select: {
                managerId: true,
              },
            },
          },
        },
        template: {
          select: {
            data: true,
          },
        },
      },
    });

    this.session.abilityGuard('patientReports', 'read', {
      managerId: patientReport.report.clinic.managerId,
      patientId: patientReport.report.patientId,
    });

    const html = this.reportHtmlService.render(
      patientReport.template.data,
      patientReport.report.data,
    );

    const pdf = await this.reportPdfService.render(html);

    this.logger.log('Patient report PDF generated', PatientReportService.name, {
      reportId,
    });

    return new StreamableFile(pdf, {
      type: PDF_MIMETYPE,
      disposition: `attachment; filename="${this.pdfFilename(
        patientReport.report.createdAt,
      )}"`,
      length: pdf.length,
    });
  }

  private pdfFilename(createdAt: Date): string {
    const timestamp = createdAt
      .toISOString()
      .replace(/\.\d{3}Z$/, 'Z')
      .replaceAll(':', '-');

    return `patient-report-${timestamp}.pdf`;
  }

  /**
   * Finds patient reports and authorizes every returned row.
   */
  async findMany({
    where,
    orderBy,
    cursor,
    take,
    skip,
  }: PatientReportAggregateRequest): Promise<PatientReportsResponse> {
    const [items, total] = await this.prisma.runAll(
      (tx) =>
        [
          tx.patientReport.findMany({
            where,
            orderBy,
            cursor: cursor as Prisma.PatientReportWhereUniqueInput | undefined,
            take,
            skip,
            include: patientReportInclude.include,
          }),
          tx.patientReport.count({ where }),
        ] as const,
    );

    for (const patientReport of items) {
      this.session.abilityGuard('patientReports', 'read', {
        managerId: patientReport.report.clinic.managerId,
        patientId: patientReport.report.patientId,
      });
    }

    return {
      items,
      total,
      perPage: take ?? total,
    };
  }
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  PatientReportAggregateRequest,
  PatientReportCreateRequest,
  PatientReportResponse,
  PatientReportsResponse,
} from 'platform/common-base';
import { PrismaService, SessionService } from 'platform/common-server';
import { patientReportInclude, Prisma } from 'platform/prisma';

@Injectable()
export class PatientReportService {
  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(SessionService)
    private readonly session: SessionService,
  ) {}

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

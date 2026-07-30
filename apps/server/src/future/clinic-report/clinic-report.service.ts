import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ClinicReportAggregateRequest,
  ClinicReportCreateRequest,
  ClinicReportResponse,
  ClinicReportsResponse,
  reportFixture,
} from 'platform/common-base';
import { PrismaService, SessionService } from 'platform/common-server';
import { includeClinicReport, Prisma } from 'platform/prisma';

/**
 * Manages clinic reports and enforces clinic-manager authorization.
 */
@Injectable()
export class ClinicReportService {
  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(SessionService)
    private readonly session: SessionService,
  ) {}

  /**
   * Creates a report for an existing clinic patient with default block data.
   */
  async create(data: ClinicReportCreateRequest): Promise<ClinicReportResponse> {
    return this.prisma.run(async (tx) => {
      const patient = await tx.patient.findFirstOrThrow({
        where: {
          userId: data.patientId,
          clinicId: data.clinicId,
        },
        select: {
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
          clinic: {
            select: {
              managerId: true,
              name: true,
            },
          },
        },
      });

      this.session.abilityGuard('clinicReports', 'create', {
        managerId: patient.clinic.managerId,
      });

      const report = await tx.clinicReport.create({
        data: {
          ...data,
          data: reportFixture.createReportDataForPatient(
            patient.user.fullName ?? patient.user.email,
            patient.clinic.name,
          ),
        },
        include: includeClinicReport,
      });

      this.logger.log('Clinic report created', ClinicReportService.name, {
        reportId: report.id,
        clinicId: report.clinicId,
        patientId: report.patientId,
      });

      return report;
    });
  }

  /**
   * Deletes a clinic report after checking access against its clinic manager.
   */
  async delete(id: number): Promise<ClinicReportResponse> {
    this.logger.log(
      'Delete clinic report requested',
      ClinicReportService.name,
      {
        reportId: id,
      },
    );

    return this.prisma.run(async (tx) => {
      const report = await tx.clinicReport.findFirstOrThrow({
        where: { id },
        select: { clinic: { select: { managerId: true } } },
      });

      this.session.abilityGuard('clinicReports', 'delete', {
        managerId: report.clinic.managerId,
      });

      const deletedReport = await tx.clinicReport.delete({
        where: { id },
        include: includeClinicReport,
      });

      this.logger.log('Clinic report deleted', ClinicReportService.name, {
        reportId: deletedReport.id,
      });

      return deletedReport;
    });
  }

  /**
   * Finds clinic reports and authorizes every returned row.
   */
  async findMany({
    where,
    orderBy,
    cursor,
    take,
    skip,
  }: ClinicReportAggregateRequest): Promise<ClinicReportsResponse> {
    const [items, total] = await this.prisma.runAll(
      (tx) =>
        [
          tx.clinicReport.findMany({
            where,
            orderBy,
            cursor: cursor as Prisma.ClinicReportWhereUniqueInput | undefined,
            take,
            skip,
            include: includeClinicReport,
          }),
          tx.clinicReport.count({ where }),
        ] as const,
    );

    for (const report of items) {
      this.session.abilityGuard('clinicReports', 'read', {
        managerId: report.clinic.managerId,
      });
    }

    return {
      items,
      total,
      perPage: take ?? total,
    };
  }
}

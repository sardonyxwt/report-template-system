import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ClinicReportAggregateRequest,
  ClinicReportCreateRequest,
  ClinicReportResponse,
  ClinicReportsResponse,
} from 'platform/common-base';
import { PrismaService, SessionService } from 'platform/common-server';
import { Prisma, ReportData } from 'platform/prisma';

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

  async create(data: ClinicReportCreateRequest): Promise<ClinicReportResponse> {
    return this.prisma.run(async (tx) => {
      const patient = await tx.patient.findFirstOrThrow({
        where: {
          userId: data.patientId,
          clinicId: data.clinicId,
        },
        select: {
          clinic: {
            select: {
              managerId: true,
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
          data: {
            blocks: [
              {
                type: 'summary',
                value: {
                  content: 'Patient health summary',
                  author: 'Test Doctor',
                },
              },
            ],
          } satisfies ReportData,
        },
      });

      this.logger.log('Clinic report created', ClinicReportService.name, {
        reportId: report.id,
        clinicId: report.clinicId,
        patientId: report.patientId,
      });

      return report;
    });
  }

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
            include: {
              clinic: {
                select: {
                  managerId: true,
                },
              },
            },
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

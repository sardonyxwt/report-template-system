import { Inject, Injectable } from '@nestjs/common';
import {
  ClinicReportAggregateRequest,
  ClinicReportsResponse,
} from 'platform/common-base';
import { PrismaService, SessionService } from 'platform/common-server';
import { Prisma } from 'platform/prisma';

@Injectable()
export class ClinicReportService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(SessionService)
    private readonly session: SessionService,
  ) {}

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

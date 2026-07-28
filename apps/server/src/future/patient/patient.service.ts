import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  PatientAggregateRequest,
  PatientCreateRequest,
  PatientResponse,
  PatientsResponse,
} from 'platform/common-base';
import { PrismaService, SessionService } from 'platform/common-server';
import { Prisma } from 'platform/prisma';

@Injectable()
export class PatientService {
  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(SessionService)
    private readonly session: SessionService,
  ) {}

  async create(data: PatientCreateRequest): Promise<PatientResponse> {
    return this.prisma.run(async (tx) => {
      const clinic = await tx.clinic.findFirstOrThrow({
        where: { id: data.clinicId },
      });

      const user = await tx.user.findFirstOrThrow({
        where: {
          email: {
            equals: data.email,
            mode: 'insensitive',
          },
        },
        include: {
          manager: true,
          patient: true,
        },
      });

      this.session.abilityGuard('patients', 'create', {
        managerId: clinic.managerId,
        userRole: user.role,
        isAssigned: user.manager !== null || user.patient !== null,
      });

      const patient = await tx.patient.create({
        data: {
          clinicId: data.clinicId,
          userId: user.id,
        },
        include: {
          user: true,
        },
      });

      this.logger.log('Patient created', PatientService.name, {
        userId: patient.userId,
        clinicId: patient.clinicId,
      });

      return patient;
    });
  }

  async findMany({
    where,
    orderBy,
    cursor,
    take,
    skip,
  }: PatientAggregateRequest): Promise<PatientsResponse> {
    const [items, total] = await this.prisma.runAll(
      (tx) =>
        [
          tx.patient.findMany({
            where,
            orderBy,
            cursor: cursor as Prisma.PatientWhereUniqueInput | undefined,
            take,
            skip,
            include: {
              user: true,
              clinic: {
                select: {
                  managerId: true,
                },
              },
            },
          }),
          tx.patient.count({ where }),
        ] as const,
    );

    for (const patient of items) {
      this.session.abilityGuard('patients', 'read', {
        managerId: patient.clinic.managerId,
      });
    }

    return {
      items,
      total,
      perPage: take ?? total,
    };
  }
}

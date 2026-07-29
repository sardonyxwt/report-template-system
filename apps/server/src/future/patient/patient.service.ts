import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  PatientAggregateRequest,
  PatientCreateRequest,
  PatientResponse,
  PatientsResponse,
} from 'platform/common-base';
import { PrismaService, SessionService } from 'platform/common-server';
import { includePatient, Prisma } from 'platform/prisma';

/**
 * Manages clinic patient assignments and manager-scoped access.
 */
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

  /**
   * Assigns an eligible existing user to a clinic as a patient.
   */
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
        include: includePatient,
      });

      this.logger.log('Patient created', PatientService.name, {
        userId: patient.userId,
        clinicId: patient.clinicId,
      });

      return patient;
    });
  }

  /**
   * Removes a patient assignment after checking clinic-manager access.
   */
  async delete(userId: number): Promise<PatientResponse> {
    this.logger.log('Delete patient requested', PatientService.name, {
      userId,
    });

    const patient = await this.prisma.tx.patient.findFirstOrThrow({
      where: { userId },
      select: { clinic: { select: { managerId: true } } },
    });

    this.session.abilityGuard('patients', 'delete', {
      managerId: patient.clinic.managerId,
    });

    const deletedPatient = await this.prisma.tx.patient.delete({
      where: { userId },
      include: includePatient,
    });

    this.logger.log('Patient deleted', PatientService.name, {
      userId: deletedPatient.userId,
      clinicId: deletedPatient.clinicId,
    });

    return deletedPatient;
  }

  /**
   * Finds patients and authorizes every returned row.
   */
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
            include: includePatient,
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

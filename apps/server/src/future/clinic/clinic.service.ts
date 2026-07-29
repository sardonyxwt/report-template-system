import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ClinicAggregateRequest,
  ClinicCreateRequest,
  ClinicResponse,
  ClinicsResponse,
  ClinicUpdateRequest,
} from 'platform/common-base';
import { PrismaService, SessionService } from 'platform/common-server';
import { includeClinic, Prisma } from 'platform/prisma';

/**
 * Implements clinic persistence and manager-scoped authorization rules.
 */
@Injectable()
export class ClinicService {
  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(SessionService)
    private readonly session: SessionService,
  ) {}

  /**
   * Creates a clinic after validating its manager and caller permissions.
   */
  async create(data: ClinicCreateRequest): Promise<ClinicResponse> {
    await this.prisma.tx.manager.findFirstOrThrow({
      where: { userId: data.managerId },
    });

    this.session.abilityGuard('clinics', 'create', {
      managerId: data.managerId,
    });

    const { ...clinicFields } = data;

    const clinic = await this.prisma.tx.clinic.create({
      data: clinicFields,
      include: includeClinic,
    });

    this.logger.log('Clinic created', ClinicService.name, {
      clinicId: clinic.id,
      managerId: clinic.managerId,
    });

    return clinic;
  }

  /**
   * Updates a clinic after enforcing ownership-aware update permissions.
   */
  async update(data: ClinicUpdateRequest): Promise<ClinicResponse> {
    this.logger.log('Update clinic requested', ClinicService.name, {
      clinicId: data.id,
    });

    const clinic = await this.prisma.tx.clinic.findFirstOrThrow({
      where: { id: data.id },
    });

    this.session.abilityGuard('clinics', 'update', {
      clinic,
      updates: data,
    });

    const { ...clinicFields } = data;

    this.logger.log('Update clinic started', ClinicService.name, {
      clinicId: data.id,
    });

    const updatedClinic = await this.prisma.tx.clinic.update({
      where: { id: data.id },
      data: clinicFields,
      include: includeClinic,
    });

    this.logger.log('Clinic updated', ClinicService.name, {
      clinicId: updatedClinic.id,
    });

    return updatedClinic;
  }

  /**
   * Deletes a clinic after checking access against its manager.
   */
  async delete(id: number): Promise<ClinicResponse> {
    this.logger.log('Delete clinic requested', ClinicService.name, {
      clinicId: id,
    });

    const clinic = await this.prisma.tx.clinic.findFirstOrThrow({
      select: { managerId: true },
      where: { id },
    });

    this.session.abilityGuard('clinics', 'delete', {
      managerId: clinic.managerId,
    });

    const deletedClinic = await this.prisma.tx.clinic.delete({
      where: { id },
      include: includeClinic,
    });

    this.logger.log('Clinic deleted', ClinicService.name, {
      clinicId: deletedClinic.id,
    });

    return deletedClinic;
  }

  /**
   * Finds clinics and authorizes every returned row for the current session.
   */
  async findMany({
    where,
    orderBy,
    cursor,
    take,
    skip,
  }: ClinicAggregateRequest): Promise<ClinicsResponse> {
    const [items, total] = await this.prisma.runAll(
      (tx) =>
        [
          tx.clinic.findMany({
            where,
            orderBy,
            cursor: cursor as Prisma.ClinicWhereUniqueInput | undefined,
            take,
            skip,
            include: includeClinic,
          }),
          tx.clinic.count({ where }),
        ] as const,
    );

    for (const clinic of items) {
      this.session.abilityGuard('clinics', 'read', {
        managerId: clinic.managerId,
      });
    }

    return { items, total, perPage: take ?? total };
  }
}

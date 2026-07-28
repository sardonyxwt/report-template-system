import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ClinicAggregateRequest,
  ClinicCreateRequest,
  ClinicResponse,
  ClinicsResponse,
  ClinicUpdateRequest,
} from 'platform/common-base';
import { PrismaService, SessionService } from 'platform/common-server';
import { Prisma } from 'platform/prisma';

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

  async create(data: ClinicCreateRequest): Promise<ClinicResponse> {
    await this.prisma.tx.manager.findFirstOrThrow({
      where: { userId: data.managerId },
    });

    this.session.abilityGuard('clinics', 'create', {
      managerId: data.managerId,
    });

    const { ...clinicFields } = data;

    const clinic = await this.prisma.tx.clinic.create({ data: clinicFields });

    this.logger.log('Clinic created', ClinicService.name, {
      clinicId: clinic.id,
      managerId: clinic.managerId,
    });

    return clinic;
  }

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
    });

    this.logger.log('Clinic updated', ClinicService.name, {
      clinicId: updatedClinic.id,
    });

    return updatedClinic;
  }

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

    const deletedClinic = await this.prisma.tx.clinic.delete({ where: { id } });

    this.logger.log('Clinic deleted', ClinicService.name, {
      clinicId: deletedClinic.id,
    });

    return deletedClinic;
  }

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

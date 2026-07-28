import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  TemplateAggregateRequest,
  TemplateCreateRequest,
  TemplateResponse,
  TemplatesResponse,
  TemplateUpdateRequest,
} from 'platform/common-base';
import { PrismaService, SessionService } from 'platform/common-server';
import { Prisma } from 'platform/prisma';

@Injectable()
export class TemplateService {
  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(SessionService)
    private readonly session: SessionService,
  ) {}

  async create(data: TemplateCreateRequest): Promise<TemplateResponse> {
    const clinic = await this.prisma.tx.clinic.findFirstOrThrow({
      where: { id: data.clinicId },
    });

    this.session.abilityGuard('templates', 'create', {
      managerId: clinic.managerId,
    });

    const template = await this.prisma.tx.template.create({ data });

    this.logger.log('Template created', TemplateService.name, {
      templateId: template.id,
      clinicId: template.clinicId,
    });

    return template;
  }

  async update(data: TemplateUpdateRequest): Promise<TemplateResponse> {
    this.logger.log('Update template requested', TemplateService.name, {
      templateId: data.id,
    });

    const template = await this.prisma.tx.template.findFirstOrThrow({
      where: { id: data.id },
      select: { clinic: { select: { managerId: true } } },
    });

    this.session.abilityGuard('templates', 'update', {
      managerId: template.clinic.managerId,
    });

    this.logger.log('Update template started', TemplateService.name, {
      templateId: data.id,
    });

    const updatedTemplate = await this.prisma.tx.template.update({
      where: { id: data.id },
      data,
    });

    this.logger.log('Template updated', TemplateService.name, {
      templateId: updatedTemplate.id,
    });

    return updatedTemplate;
  }

  async delete(id: number): Promise<TemplateResponse> {
    this.logger.log('Delete template requested', TemplateService.name, {
      templateId: id,
    });

    const template = await this.prisma.tx.template.findFirstOrThrow({
      where: { id },
      select: { clinic: { select: { managerId: true } } },
    });

    this.session.abilityGuard('templates', 'delete', {
      managerId: template.clinic.managerId,
    });

    const deletedTemplate = await this.prisma.tx.template.delete({
      where: { id },
    });

    this.logger.log('Template deleted', TemplateService.name, {
      templateId: deletedTemplate.id,
    });

    return deletedTemplate;
  }

  async findMany({
    where,
    orderBy,
    cursor,
    take,
    skip,
  }: TemplateAggregateRequest): Promise<TemplatesResponse> {
    const [items, total] = await this.prisma.runAll(
      (tx) =>
        [
          tx.template.findMany({
            where,
            orderBy,
            cursor: cursor as Prisma.TemplateWhereUniqueInput | undefined,
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
          tx.template.count({ where }),
        ] as const,
    );

    for (const template of items) {
      this.session.abilityGuard('templates', 'read', {
        managerId: template.clinic.managerId,
      });
    }

    return {
      items,
      total,
      perPage: take ?? total,
    };
  }
}

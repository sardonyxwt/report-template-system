import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  reportFixture,
  TemplateAggregateRequest,
  TemplateAiEditEvent,
  TemplateAiEditRequest,
  TemplateCreateRequest,
  TemplatePreviewRequest,
  TemplateResponse,
  TemplatesResponse,
  TemplateUpdateRequest,
} from 'platform/common-base';
import {
  OpenAiService,
  PrismaService,
  ReportHtmlService,
  resolveEventStreamErrorMessage,
  SessionService,
} from 'platform/common-server';
import { includeTemplate, Prisma } from 'platform/prisma';
import { TemplateAiEditorService } from './template-ai-editor.service';

/**
 * Implements report template persistence, preview, and AI editing operations.
 */
@Injectable()
export class TemplateService {
  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(SessionService)
    private readonly session: SessionService,
    @Inject(ReportHtmlService)
    private readonly reportHtmlService: ReportHtmlService,
    @Inject(OpenAiService)
    private readonly openAi: OpenAiService,
    @Inject(TemplateAiEditorService)
    private readonly templateAiEditorService: TemplateAiEditorService,
  ) {}

  /**
   * Creates a template after checking access to its clinic.
   */
  async create(data: TemplateCreateRequest): Promise<TemplateResponse> {
    const clinic = await this.prisma.tx.clinic.findFirstOrThrow({
      where: { id: data.clinicId },
    });

    this.session.abilityGuard('templates', 'create', {
      managerId: clinic.managerId,
    });

    const template = await this.prisma.tx.template.create({
      data,
      include: includeTemplate,
    });

    this.logger.log('Template created', TemplateService.name, {
      templateId: template.id,
      clinicId: template.clinicId,
    });

    return template;
  }

  /**
   * Updates a template after enforcing clinic-manager access.
   */
  async update(data: TemplateUpdateRequest): Promise<TemplateResponse> {
    this.logger.log('Update template requested', TemplateService.name, {
      templateId: data.id,
    });

    const updatingTemplate = await this.prisma.tx.template.findFirstOrThrow({
      where: { id: data.id },
      select: { clinic: { select: { managerId: true } } },
    });

    this.session.abilityGuard('templates', 'update', {
      managerId: updatingTemplate.clinic.managerId,
    });

    this.logger.log('Update template started', TemplateService.name, {
      templateId: data.id,
    });

    const { ...templateFields } = data;

    const updatedTemplate = await this.prisma.tx.template.update({
      where: { id: templateFields.id },
      data: { ...templateFields },
      include: includeTemplate,
    });

    this.logger.log('Template updated', TemplateService.name, {
      templateId: updatedTemplate.id,
    });

    return updatedTemplate;
  }

  /**
   * Renders unsaved template data against the synthetic report fixture.
   *
   * @throws {BadRequestException} When Handlebars cannot render the markup.
   */
  preview({ data, blockType }: TemplatePreviewRequest): string {
    this.session.abilityGuard('templates', 'preview');

    try {
      if (blockType) {
        const block = data.blocks.find(({ type }) => type === blockType);

        if (!block) {
          throw new Error(`Template block is missing: ${blockType}.`);
        }

        return this.reportHtmlService.renderBlock(block, reportFixture.default);
      }

      return this.reportHtmlService.render(data, reportFixture.default);
    } catch {
      throw new BadRequestException(
        'Template markup could not be rendered with preview data.',
      );
    }
  }

  /**
   * Returns an authorized stream of AI edit progress and result events.
   *
   * Model allowlist is checked before the stream starts so invalid models fail
   * with HTTP 400 instead of an in-stream error event.
   */
  aiEditEvents(
    data: TemplateAiEditRequest,
  ): AsyncGenerator<TemplateAiEditEvent> {
    this.session.abilityGuard('templates', 'aiEdit');
    this.openAi.assertModelAllowed(data.model);

    return this.streamAiEditEvents(data);
  }

  /**
   * Deletes a template after checking access through its clinic.
   */
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
      include: includeTemplate,
    });

    this.logger.log('Template deleted', TemplateService.name, {
      templateId: deletedTemplate.id,
    });

    return deletedTemplate;
  }

  /**
   * Finds templates and authorizes every returned row.
   */
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
            include: includeTemplate,
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

  private async *streamAiEditEvents(
    data: TemplateAiEditRequest,
  ): AsyncGenerator<TemplateAiEditEvent> {
    try {
      yield* this.templateAiEditorService.editEvents(data);
    } catch (error) {
      yield {
        type: 'error',
        data: {
          message: resolveEventStreamErrorMessage(error),
        },
      };
    }
  }
}

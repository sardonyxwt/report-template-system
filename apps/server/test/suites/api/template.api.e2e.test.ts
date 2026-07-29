import { HttpStatus } from '@nestjs/common';
import {
  TemplateAiEditEvent,
  TemplateResponse,
  TemplatesResponse,
  TemplateUpdateRequest,
} from 'platform/common-base';
import { endpoints } from '../../../src/endpoints';
import { withAppContext } from '../../context/app.context';
import { OpenAiServiceMock } from '../../context/mock/open-ai.service.mock';
import { TemplateAiEditorServiceMock } from '../../context/mock/template-ai-editor.service.mock';
import { clinicFixtures } from '../../fixture/clinic.fixture';
import { templateFixtures } from '../../fixture/template.fixture';

const { context, macros } = withAppContext();

describe('api.template', () => {
  it('allows a manager to create, update, find, and delete a template', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [manager, authorizedManager] =
      await macros.createAuthorizedManager(admin);
    const clinic = await context.prisma.clinic.create({
      data: clinicFixtures.clinic(manager.userId),
    });

    const createRes = await context
      .apiCall({
        ...endpoints.template.create,
        accessToken: authorizedManager.accessToken!,
      })
      .send(templateFixtures.template(clinic.id));

    expect(createRes.status).toBe(HttpStatus.CREATED);

    const templateData = createRes.body as TemplateResponse;
    const updateTemplateRequestDto: TemplateUpdateRequest = {
      ...templateData,
      name: 'Updated Template',
    };
    const updateRes = await context
      .apiCall({
        ...endpoints.template.update,
        accessToken: authorizedManager.accessToken!,
      })
      .send(updateTemplateRequestDto);

    expect(updateRes.status).toBe(HttpStatus.OK);

    const findManyRes = await context
      .apiCall({
        ...endpoints.template.findMany,
        accessToken: authorizedManager.accessToken!,
      })
      .send({ where: { id: templateData.id } });

    expect(findManyRes.status).toBe(HttpStatus.OK);
    expect((findManyRes.body as TemplatesResponse).total).toBe(1);

    const deleteRes = await context.apiCall({
      method: endpoints.template.delete.method,
      path: endpoints.template.delete.build(templateData.id),
      accessToken: authorizedManager.accessToken!,
    });

    expect(deleteRes.status).toBe(HttpStatus.OK);
  });

  it('allows an admin to manage templates in any clinic', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [manager] = await macros.createAuthorizedManager(admin);
    const clinic = await context.prisma.clinic.create({
      data: clinicFixtures.clinic(manager.userId),
    });

    const createRes = await context
      .apiCall({
        ...endpoints.template.create,
        accessToken: admin.accessToken,
      })
      .send(templateFixtures.template(clinic.id));

    expect(createRes.status).toBe(HttpStatus.CREATED);

    const templateData = createRes.body as TemplateResponse;
    const findManyRes = await context
      .apiCall({
        ...endpoints.template.findMany,
        accessToken: admin.accessToken,
      })
      .send({ where: { id: templateData.id } });

    expect(findManyRes.status).toBe(HttpStatus.OK);
  });

  it('requires every template block exactly once', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [manager] = await macros.createAuthorizedManager(admin);
    const clinic = await context.prisma.clinic.create({
      data: clinicFixtures.clinic(manager.userId),
    });
    const request = templateFixtures.template(clinic.id);

    const missingBlockRes = await context
      .apiCall({
        ...endpoints.template.create,
        accessToken: admin.accessToken,
      })
      .send({
        ...request,
        data: {
          ...request.data,
          blocks: request.data.blocks.slice(0, -1),
        },
      });

    expect(missingBlockRes.status).toBe(HttpStatus.BAD_REQUEST);

    const duplicateBlockRes = await context
      .apiCall({
        ...endpoints.template.create,
        accessToken: admin.accessToken,
      })
      .send({
        ...request,
        data: {
          ...request.data,
          blocks: [
            ...request.data.blocks.slice(0, -1),
            request.data.blocks[0]!,
          ],
        },
      });

    expect(duplicateBlockRes.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('allows template preview for admins and managers only', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [, authorizedManager] = await macros.createAuthorizedManager(admin);
    const user = await macros.createAuthorizedUserWithEmail(
      'template-preview-user@gmail.com',
    );
    const data = templateFixtures.template(1).data;

    for (const accessToken of [
      admin.accessToken,
      authorizedManager.accessToken!,
    ]) {
      const response = await context
        .apiCall({
          ...endpoints.template.preview,
          accessToken,
        })
        .send({ data });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.headers['cache-control']).toBe('no-store');
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('<!doctype html>');
      expect(response.text).toContain('data-report-block="cover"');

      const blockResponse = await context
        .apiCall({
          ...endpoints.template.preview,
          accessToken,
        })
        .send({ data, blockType: 'summary' });

      expect(blockResponse.status).toBe(HttpStatus.OK);
      expect(blockResponse.text).toContain('data-report-block="summary"');
      expect(blockResponse.text).not.toContain('data-report-block="cover"');
    }

    const userResponse = await context
      .apiCall({
        ...endpoints.template.preview,
        accessToken: user.accessToken!,
      })
      .send({ data });

    expect(userResponse.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('streams a global AI edit with the complete reordered template', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [, authorizedManager] = await macros.createAuthorizedManager(admin);
    const data = templateFixtures.template(1).data;
    const selectedModel = OpenAiServiceMock.modelAllowlist[0];

    const response = await context
      .apiCall({
        ...endpoints.template.aiEditStream,
        accessToken: authorizedManager.accessToken!,
      })
      .send({
        data,
        prompt: 'Reverse the block order and improve the layout.',
        model: selectedModel,
        speed: true,
      });
    const events = response.text
      .trim()
      .split('\n\n')
      .map((frame) => {
        const fields = frame.split('\n');
        const type = fields
          .find((field) => field.startsWith('event:'))
          ?.slice('event:'.length)
          .trim();
        const eventData = fields
          .find((field) => field.startsWith('data:'))
          ?.slice('data:'.length)
          .trim();

        return {
          type,
          data: JSON.parse(eventData ?? ''),
        } as TemplateAiEditEvent;
      });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(TemplateAiEditorServiceMock.request).toMatchObject({
      model: selectedModel,
      speed: true,
    });
    expect(events).toEqual(TemplateAiEditorServiceMock.events);
  });

  it('rejects an AI model outside the server allowlist', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [, authorizedManager] = await macros.createAuthorizedManager(admin);

    const response = await context
      .apiCall({
        ...endpoints.template.aiEditStream,
        accessToken: authorizedManager.accessToken!,
      })
      .send({
        data: templateFixtures.template(1).data,
        prompt: 'Improve the layout.',
        model: 'unlisted-model',
      });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('denies access to templates of another manager', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [owner] = await macros.createAuthorizedManager(admin);
    const [, anotherManager] = await macros.createAuthorizedManagerWithEmail(
      admin,
      'template-manager-2@gmail.com',
    );
    const clinic = await context.prisma.clinic.create({
      data: clinicFixtures.clinic(owner.userId),
    });
    const template = await context.prisma.template.create({
      data: templateFixtures.template(clinic.id),
    });

    const findManyRes = await context
      .apiCall({
        ...endpoints.template.findMany,
        accessToken: anotherManager.accessToken!,
      })
      .send({ where: { id: template.id } });

    expect(findManyRes.status).toBe(HttpStatus.FORBIDDEN);
  });
});

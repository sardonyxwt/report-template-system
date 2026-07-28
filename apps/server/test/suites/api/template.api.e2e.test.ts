import { HttpStatus } from '@nestjs/common';
import {
  TemplateResponse,
  TemplatesResponse,
  TemplateUpdateRequest,
} from 'platform/common-base';
import { endpoints } from '../../../src/endpoints';
import { withAppContext } from '../../context/app.context';
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

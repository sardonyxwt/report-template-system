import { HttpStatus } from '@nestjs/common';
import {
  ClinicResponse,
  ClinicUpdateRequest,
  ClinicsResponse,
} from 'platform/common-base';
import { endpoints } from '../../../src/endpoints';
import { withAppContext } from '../../context/app.context';
import { clinicFixtures } from '../../fixture/clinic.fixture';

const { context, macros } = withAppContext();

describe('api.clinic', () => {
  it('allows a manager to create multiple clinics and manage them', async () => {
    const admin = await macros.createAuthorizedAdmin();

    const [manager, authorizedManager] =
      await macros.createAuthorizedManager(admin);

    const firstClinicRes = await context
      .apiCall({
        ...endpoints.clinic.create,
        accessToken: authorizedManager.accessToken!,
      })
      .send(clinicFixtures.clinic(manager.userId, { name: 'First Clinic' }));

    const secondClinicRes = await context
      .apiCall({
        ...endpoints.clinic.create,
        accessToken: authorizedManager.accessToken!,
      })
      .send(clinicFixtures.clinic(manager.userId, { name: 'Second Clinic' }));

    expect(firstClinicRes.status).toBe(HttpStatus.CREATED);
    expect(secondClinicRes.status).toBe(HttpStatus.CREATED);

    const firstClinicData = firstClinicRes.body as ClinicResponse;

    const updateClinicRequestDto: ClinicUpdateRequest = {
      ...firstClinicData,
      name: 'Updated Clinic',
    };
    const updateRes = await context
      .apiCall({
        ...endpoints.clinic.update,
        accessToken: authorizedManager.accessToken!,
      })
      .send(updateClinicRequestDto);

    expect(updateRes.status).toBe(HttpStatus.OK);
    expect((updateRes.body as ClinicResponse).name).toBe(
      updateClinicRequestDto.name,
    );

    const findManyRes = await context
      .apiCall({
        ...endpoints.clinic.findMany,
        accessToken: authorizedManager.accessToken!,
      })
      .send({ where: { managerId: manager.userId } });

    expect(findManyRes.status).toBe(HttpStatus.OK);
    expect((findManyRes.body as ClinicsResponse).total).toBe(2);

    const deleteRes = await context.apiCall({
      method: endpoints.clinic.delete.method,
      path: endpoints.clinic.delete.build(
        (secondClinicRes.body as ClinicResponse).id,
      ),
      accessToken: authorizedManager.accessToken!,
    });

    expect(deleteRes.status).toBe(HttpStatus.OK);
  });

  it('allows an admin to create, read, update, and delete any clinic', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [manager] = await macros.createAuthorizedManager(admin);

    const createRes = await context
      .apiCall({
        ...endpoints.clinic.create,
        accessToken: admin.accessToken,
      })
      .send(clinicFixtures.clinic(manager.userId));

    expect(createRes.status).toBe(HttpStatus.CREATED);

    const clinicData = createRes.body as ClinicResponse;
    const findManyRes = await context
      .apiCall({
        ...endpoints.clinic.findMany,
        accessToken: admin.accessToken,
      })
      .send({ where: { id: clinicData.id } });

    expect(findManyRes.status).toBe(HttpStatus.OK);

    const updateRes = await context
      .apiCall({
        ...endpoints.clinic.update,
        accessToken: admin.accessToken,
      })
      .send({ ...clinicData, name: 'Admin Updated Clinic' });

    expect(updateRes.status).toBe(HttpStatus.OK);

    const deleteRes = await context.apiCall({
      method: endpoints.clinic.delete.method,
      path: endpoints.clinic.delete.build(clinicData.id),
      accessToken: admin.accessToken,
    });

    expect(deleteRes.status).toBe(HttpStatus.OK);
  });

  it('denies access to another manager clinic', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [owner, authorizedOwner] =
      await macros.createAuthorizedManager(admin);
    const [, anotherManager] = await macros.createAuthorizedManagerWithEmail(
      admin,
      'manager-2@gmail.com',
    );

    const createRes = await context
      .apiCall({
        ...endpoints.clinic.create,
        accessToken: authorizedOwner.accessToken!,
      })
      .send(clinicFixtures.clinic(owner.userId));
    const clinicData = createRes.body as ClinicResponse;

    const findManyRes = await context
      .apiCall({
        ...endpoints.clinic.findMany,
        accessToken: anotherManager.accessToken!,
      })
      .send({ where: { id: clinicData.id } });

    expect(findManyRes.status).toBe(HttpStatus.FORBIDDEN);
  });
});

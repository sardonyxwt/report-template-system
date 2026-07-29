import { HttpStatus } from '@nestjs/common';
import { PatientResponse, PatientsResponse } from 'platform/common-base';
import { endpoints } from '../../../src/endpoints';
import { withAppContext } from '../../context/app.context';
import { clinicFixtures } from '../../fixture/clinic.fixture';
import { patientFixtures } from '../../fixture/patient.fixture';

const { context, macros } = withAppContext();

describe('api.patient', () => {
  it('adds an unassigned user by case-insensitive email', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [manager, authorizedManager] =
      await macros.createAuthorizedManager(admin);
    const user = await macros.createAuthorizedUserWithEmail(
      'patient-1@gmail.com',
    );
    const clinic = await context.prisma.clinic.create({
      data: clinicFixtures.clinic(manager.userId),
    });

    const createRes = await context
      .apiCall({
        ...endpoints.patient.create,
        accessToken: authorizedManager.accessToken!,
      })
      .send(patientFixtures.patient(clinic.id, user.email.toUpperCase()));

    expect(createRes.status).toBe(HttpStatus.CREATED);
    expect((createRes.body as PatientResponse).userId).toBe(user.id);

    const findManyRes = await context
      .apiCall({
        ...endpoints.patient.findMany,
        accessToken: authorizedManager.accessToken!,
      })
      .send({ where: { clinicId: clinic.id } });

    expect(findManyRes.status).toBe(HttpStatus.OK);
    expect((findManyRes.body as PatientsResponse).items[0]?.user.email).toBe(
      user.email,
    );
  });

  it('allows an admin to add a patient to any clinic', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [manager] = await macros.createAuthorizedManager(admin);
    const user = await macros.createAuthorizedUserWithEmail(
      'admin-patient@gmail.com',
    );
    const clinic = await context.prisma.clinic.create({
      data: clinicFixtures.clinic(manager.userId),
    });

    const res = await context
      .apiCall({
        ...endpoints.patient.create,
        accessToken: admin.accessToken,
      })
      .send(patientFixtures.patient(clinic.id, user.email));

    expect(res.status).toBe(HttpStatus.CREATED);
  });

  it('allows a manager to delete a patient from their clinic', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [manager, authorizedManager] =
      await macros.createAuthorizedManager(admin);
    const user = await macros.createAuthorizedUserWithEmail(
      'manager-delete-patient@gmail.com',
    );
    const clinic = await context.prisma.clinic.create({
      data: clinicFixtures.clinic(manager.userId),
    });
    await context.prisma.patient.create({
      data: {
        userId: user.id,
        clinicId: clinic.id,
      },
    });

    const deleteRes = await context.apiCall({
      method: endpoints.patient.delete.method,
      path: endpoints.patient.delete.build(user.id),
      accessToken: authorizedManager.accessToken!,
    });

    expect(deleteRes.status).toBe(HttpStatus.OK);
    expect((deleteRes.body as PatientResponse).userId).toBe(user.id);
    await expect(
      context.prisma.patient.findUnique({ where: { userId: user.id } }),
    ).resolves.toBeNull();
    await expect(
      context.prisma.user.findUnique({ where: { id: user.id } }),
    ).resolves.not.toBeNull();
  });

  it('allows an admin to delete a patient from any clinic', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [manager] = await macros.createAuthorizedManager(admin);
    const user = await macros.createAuthorizedUserWithEmail(
      'admin-delete-patient@gmail.com',
    );
    const clinic = await context.prisma.clinic.create({
      data: clinicFixtures.clinic(manager.userId),
    });
    await context.prisma.patient.create({
      data: {
        userId: user.id,
        clinicId: clinic.id,
      },
    });

    const deleteRes = await context.apiCall({
      method: endpoints.patient.delete.method,
      path: endpoints.patient.delete.build(user.id),
      accessToken: admin.accessToken,
    });

    expect(deleteRes.status).toBe(HttpStatus.OK);
  });

  it('rejects admin, manager, and already assigned users', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [manager, authorizedManager] =
      await macros.createAuthorizedManager(admin);
    const user = await macros.createAuthorizedUserWithEmail(
      'patient-2@gmail.com',
    );
    const clinic = await context.prisma.clinic.create({
      data: clinicFixtures.clinic(manager.userId),
    });

    const adminRes = await context
      .apiCall({
        ...endpoints.patient.create,
        accessToken: authorizedManager.accessToken!,
      })
      .send(patientFixtures.patient(clinic.id, admin.email));
    const managerRes = await context
      .apiCall({
        ...endpoints.patient.create,
        accessToken: authorizedManager.accessToken!,
      })
      .send(patientFixtures.patient(clinic.id, authorizedManager.email));

    expect(adminRes.status).toBe(HttpStatus.BAD_REQUEST);
    expect(managerRes.status).toBe(HttpStatus.BAD_REQUEST);

    const firstAssignmentRes = await context
      .apiCall({
        ...endpoints.patient.create,
        accessToken: authorizedManager.accessToken!,
      })
      .send(patientFixtures.patient(clinic.id, user.email));
    const secondAssignmentRes = await context
      .apiCall({
        ...endpoints.patient.create,
        accessToken: authorizedManager.accessToken!,
      })
      .send(patientFixtures.patient(clinic.id, user.email));

    expect(firstAssignmentRes.status).toBe(HttpStatus.CREATED);
    expect(secondAssignmentRes.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('denies creating and reading patients in another manager clinic', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [owner] = await macros.createAuthorizedManager(admin);
    const [, anotherManager] = await macros.createAuthorizedManagerWithEmail(
      admin,
      'patient-manager-2@gmail.com',
    );
    const user = await macros.createAuthorizedUserWithEmail(
      'patient-3@gmail.com',
    );
    const clinic = await context.prisma.clinic.create({
      data: clinicFixtures.clinic(owner.userId),
    });

    const createRes = await context
      .apiCall({
        ...endpoints.patient.create,
        accessToken: anotherManager.accessToken!,
      })
      .send(patientFixtures.patient(clinic.id, user.email));

    expect(createRes.status).toBe(HttpStatus.FORBIDDEN);

    await context.prisma.patient.create({
      data: {
        userId: user.id,
        clinicId: clinic.id,
      },
    });

    const findManyRes = await context
      .apiCall({
        ...endpoints.patient.findMany,
        accessToken: anotherManager.accessToken!,
      })
      .send({ where: { userId: user.id } });

    expect(findManyRes.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('denies deleting a patient from another manager clinic', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [owner] = await macros.createAuthorizedManager(admin);
    const [, anotherManager] = await macros.createAuthorizedManagerWithEmail(
      admin,
      'patient-delete-manager-2@gmail.com',
    );
    const user = await macros.createAuthorizedUserWithEmail(
      'protected-patient@gmail.com',
    );
    const clinic = await context.prisma.clinic.create({
      data: clinicFixtures.clinic(owner.userId),
    });
    await context.prisma.patient.create({
      data: {
        userId: user.id,
        clinicId: clinic.id,
      },
    });

    const deleteRes = await context.apiCall({
      method: endpoints.patient.delete.method,
      path: endpoints.patient.delete.build(user.id),
      accessToken: anotherManager.accessToken!,
    });

    expect(deleteRes.status).toBe(HttpStatus.FORBIDDEN);
    await expect(
      context.prisma.patient.findUnique({ where: { userId: user.id } }),
    ).resolves.not.toBeNull();
  });
});

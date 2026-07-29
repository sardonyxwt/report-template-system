import { HttpStatus } from '@nestjs/common';
import {
  ClinicReportResponse,
  ClinicReportsResponse,
} from 'platform/common-base';
import { endpoints } from '../../../src/endpoints';
import { withAppContext } from '../../context/app.context';
import { clinicReportFixtures } from '../../fixture/clinic-report.fixture';
import { clinicFixtures } from '../../fixture/clinic.fixture';

const { context, macros } = withAppContext();

describe('api.clinic-report', () => {
  it('allows the clinic manager and admin to create a clinic report with example data', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [manager, authorizedManager] =
      await macros.createAuthorizedManager(admin);
    const patient = await macros.createAuthorizedUserWithEmail(
      'create-report-patient@gmail.com',
    );
    const clinic = await context.prisma.clinic.create({
      data: clinicFixtures.clinic(manager.userId),
    });
    await context.prisma.patient.create({
      data: {
        userId: patient.id,
        clinicId: clinic.id,
      },
    });

    const createRes = await context
      .apiCall({
        ...endpoints.clinicReport.create,
        accessToken: authorizedManager.accessToken!,
      })
      .send({
        patientId: patient.id,
        clinicId: clinic.id,
      });

    expect(createRes.status).toBe(HttpStatus.CREATED);

    const report = createRes.body as ClinicReportResponse;
    expect(report.patientId).toBe(patient.id);
    expect(report.clinicId).toBe(clinic.id);
    expect(report.data.blocks[0]).toMatchObject({
      type: 'cover',
      value: {
        title: `${patient.fullName}’s Health Report`,
        clinic: clinic.name,
        patient: {
          name: patient.fullName,
        },
        preparedBy: {
          details: [clinic.name],
        },
      },
    });
    expect(
      Date.parse(
        report.data.blocks[0]?.type === 'cover'
          ? report.data.blocks[0].value.generatedAt
          : '',
      ),
    ).not.toBeNaN();
    expect(report.data.blocks.map((block) => block.type)).toEqual([
      'cover',
      'summary',
      'story',
      'goals',
      'plan',
      'orders',
      'timeline',
      'coach',
      'healthDeepDive',
    ]);
    const adminCreateRes = await context
      .apiCall({
        ...endpoints.clinicReport.create,
        accessToken: admin.accessToken,
      })
      .send({
        patientId: patient.id,
        clinicId: clinic.id,
      });

    expect(adminCreateRes.status).toBe(HttpStatus.CREATED);
    await expect(
      context.prisma.clinicReport.findUnique({
        where: { id: report.id },
      }),
    ).resolves.not.toBeNull();
  });

  it('denies clinic report creation to a patient and another manager', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [owner] = await macros.createAuthorizedManager(admin);
    const [, anotherManager] = await macros.createAuthorizedManagerWithEmail(
      admin,
      'create-report-manager-2@gmail.com',
    );
    const patient = await macros.createAuthorizedUserWithEmail(
      'create-report-patient-2@gmail.com',
    );
    const clinic = await context.prisma.clinic.create({
      data: clinicFixtures.clinic(owner.userId),
    });
    await context.prisma.patient.create({
      data: {
        userId: patient.id,
        clinicId: clinic.id,
      },
    });
    const request = {
      patientId: patient.id,
      clinicId: clinic.id,
    };

    const patientRes = await context
      .apiCall({
        ...endpoints.clinicReport.create,
        accessToken: patient.accessToken!,
      })
      .send(request);
    const anotherManagerRes = await context
      .apiCall({
        ...endpoints.clinicReport.create,
        accessToken: anotherManager.accessToken!,
      })
      .send(request);

    expect(patientRes.status).toBe(HttpStatus.FORBIDDEN);
    expect(anotherManagerRes.status).toBe(HttpStatus.FORBIDDEN);
    await expect(context.prisma.clinicReport.count()).resolves.toBe(0);
  });

  it('allows an owner manager and admin to read a clinic report', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [manager, authorizedManager] =
      await macros.createAuthorizedManager(admin);
    const patient = await macros.createAuthorizedUserWithEmail(
      'report-patient@gmail.com',
    );
    const clinic = await context.prisma.clinic.create({
      data: clinicFixtures.clinic(manager.userId),
    });
    await context.prisma.patient.create({
      data: {
        userId: patient.id,
        clinicId: clinic.id,
      },
    });
    const report = await context.prisma.clinicReport.create({
      data: clinicReportFixtures.report(clinic.id, patient.id),
    });

    const managerRes = await context
      .apiCall({
        ...endpoints.clinicReport.findMany,
        accessToken: authorizedManager.accessToken!,
      })
      .send({ where: { id: report.id } });
    const adminRes = await context
      .apiCall({
        ...endpoints.clinicReport.findMany,
        accessToken: admin.accessToken,
      })
      .send({ where: { id: report.id } });

    expect(managerRes.status).toBe(HttpStatus.OK);
    expect(adminRes.status).toBe(HttpStatus.OK);
    expect((managerRes.body as ClinicReportsResponse).total).toBe(1);
  });

  it('denies another manager and the patient access to clinic reports', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [owner] = await macros.createAuthorizedManager(admin);
    const [, anotherManager] = await macros.createAuthorizedManagerWithEmail(
      admin,
      'report-manager-2@gmail.com',
    );
    const patient = await macros.createAuthorizedUserWithEmail(
      'report-patient-2@gmail.com',
    );
    const clinic = await context.prisma.clinic.create({
      data: clinicFixtures.clinic(owner.userId),
    });
    await context.prisma.patient.create({
      data: {
        userId: patient.id,
        clinicId: clinic.id,
      },
    });
    const report = await context.prisma.clinicReport.create({
      data: clinicReportFixtures.report(clinic.id, patient.id),
    });

    const anotherManagerRes = await context
      .apiCall({
        ...endpoints.clinicReport.findMany,
        accessToken: anotherManager.accessToken!,
      })
      .send({ where: { id: report.id } });
    const patientRes = await context
      .apiCall({
        ...endpoints.clinicReport.findMany,
        accessToken: patient.accessToken!,
      })
      .send({ where: { id: report.id } });

    expect(anotherManagerRes.status).toBe(HttpStatus.FORBIDDEN);
    expect(patientRes.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('allows the owner manager and admin to delete clinic reports', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [manager, authorizedManager] =
      await macros.createAuthorizedManager(admin);
    const patient = await macros.createAuthorizedUserWithEmail(
      'delete-clinic-report-patient@gmail.com',
    );
    const clinic = await context.prisma.clinic.create({
      data: clinicFixtures.clinic(manager.userId),
    });
    await context.prisma.patient.create({
      data: {
        userId: patient.id,
        clinicId: clinic.id,
      },
    });
    const managerReport = await context.prisma.clinicReport.create({
      data: clinicReportFixtures.report(clinic.id, patient.id),
    });
    const adminReport = await context.prisma.clinicReport.create({
      data: clinicReportFixtures.report(clinic.id, patient.id),
    });

    const managerRes = await context.apiCall({
      method: endpoints.clinicReport.delete.method,
      path: endpoints.clinicReport.delete.build(managerReport.id),
      accessToken: authorizedManager.accessToken!,
    });
    const adminRes = await context.apiCall({
      method: endpoints.clinicReport.delete.method,
      path: endpoints.clinicReport.delete.build(adminReport.id),
      accessToken: admin.accessToken,
    });

    expect(managerRes.status).toBe(HttpStatus.OK);
    expect(adminRes.status).toBe(HttpStatus.OK);
    await expect(context.prisma.clinicReport.count()).resolves.toBe(0);
  });

  it('denies clinic report deletion to another manager and a patient', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [owner] = await macros.createAuthorizedManager(admin);
    const [, anotherManager] = await macros.createAuthorizedManagerWithEmail(
      admin,
      'delete-clinic-report-manager-2@gmail.com',
    );
    const patient = await macros.createAuthorizedUserWithEmail(
      'delete-clinic-report-denied-patient@gmail.com',
    );
    const clinic = await context.prisma.clinic.create({
      data: clinicFixtures.clinic(owner.userId),
    });
    await context.prisma.patient.create({
      data: {
        userId: patient.id,
        clinicId: clinic.id,
      },
    });
    const report = await context.prisma.clinicReport.create({
      data: clinicReportFixtures.report(clinic.id, patient.id),
    });

    for (const accessToken of [
      anotherManager.accessToken!,
      patient.accessToken!,
    ]) {
      const response = await context.apiCall({
        method: endpoints.clinicReport.delete.method,
        path: endpoints.clinicReport.delete.build(report.id),
        accessToken,
      });

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    }

    await expect(
      context.prisma.clinicReport.findUnique({ where: { id: report.id } }),
    ).resolves.not.toBeNull();
  });
});

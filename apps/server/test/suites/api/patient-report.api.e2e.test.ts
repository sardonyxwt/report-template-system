import { HttpStatus } from '@nestjs/common';
import {
  PatientReportResponse,
  PatientReportsResponse,
} from 'platform/common-base';
import { endpoints } from '../../../src/endpoints';
import { withAppContext } from '../../context/app.context';
import { clinicReportFixtures } from '../../fixture/clinic-report.fixture';
import { clinicFixtures } from '../../fixture/clinic.fixture';
import { templateFixtures } from '../../fixture/template.fixture';

const { context, macros } = withAppContext();

describe('api.patient-report', () => {
  it('creates and exposes current report data to manager, admin, and patient', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [manager, authorizedManager] =
      await macros.createAuthorizedManager(admin);
    const patient = await macros.createAuthorizedUserWithEmail(
      'patient-report@gmail.com',
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
    const template = await context.prisma.template.create({
      data: templateFixtures.template(clinic.id),
    });
    const report = await context.prisma.clinicReport.create({
      data: clinicReportFixtures.report(clinic.id, patient.id),
    });

    const createRes = await context
      .apiCall({
        ...endpoints.patientReport.create,
        accessToken: authorizedManager.accessToken!,
      })
      .send({
        reportId: report.id,
        templateId: template.id,
      });

    expect(createRes.status).toBe(HttpStatus.CREATED);
    expect((createRes.body as PatientReportResponse).report.id).toBe(report.id);

    for (const accessToken of [
      authorizedManager.accessToken!,
      admin.accessToken,
      patient.accessToken!,
    ]) {
      const findManyRes = await context
        .apiCall({
          ...endpoints.patientReport.findMany,
          accessToken,
        })
        .send({ where: { reportId: report.id } });

      expect(findManyRes.status).toBe(HttpStatus.OK);
      const patientReportsData = findManyRes.body as PatientReportsResponse;
      expect(patientReportsData.total).toBe(1);
      expect(patientReportsData.items[0]?.report.id).toBe(report.id);
    }
  });

  it('rejects a template from another clinic', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [manager] = await macros.createAuthorizedManager(admin);
    const patient = await macros.createAuthorizedUserWithEmail(
      'mismatch-patient@gmail.com',
    );
    const firstClinic = await context.prisma.clinic.create({
      data: clinicFixtures.clinic(manager.userId, { name: 'First Clinic' }),
    });
    const secondClinic = await context.prisma.clinic.create({
      data: clinicFixtures.clinic(manager.userId, { name: 'Second Clinic' }),
    });
    await context.prisma.patient.create({
      data: {
        userId: patient.id,
        clinicId: firstClinic.id,
      },
    });
    const template = await context.prisma.template.create({
      data: templateFixtures.template(secondClinic.id),
    });
    const report = await context.prisma.clinicReport.create({
      data: clinicReportFixtures.report(firstClinic.id, patient.id),
    });

    const res = await context
      .apiCall({
        ...endpoints.patientReport.create,
        accessToken: admin.accessToken,
      })
      .send({
        reportId: report.id,
        templateId: template.id,
      });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('denies another manager and another patient', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [owner] = await macros.createAuthorizedManager(admin);
    const [, anotherManager] = await macros.createAuthorizedManagerWithEmail(
      admin,
      'patient-report-manager-2@gmail.com',
    );
    const patient = await macros.createAuthorizedUserWithEmail(
      'owned-patient@gmail.com',
    );
    const anotherPatient = await macros.createAuthorizedUserWithEmail(
      'another-patient@gmail.com',
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
    const template = await context.prisma.template.create({
      data: templateFixtures.template(clinic.id),
    });
    const report = await context.prisma.clinicReport.create({
      data: clinicReportFixtures.report(clinic.id, patient.id),
    });
    await context.prisma.patientReport.create({
      data: {
        reportId: report.id,
        templateId: template.id,
      },
    });

    const managerRes = await context
      .apiCall({
        ...endpoints.patientReport.findMany,
        accessToken: anotherManager.accessToken!,
      })
      .send({ where: { reportId: report.id } });
    const patientRes = await context
      .apiCall({
        ...endpoints.patientReport.findMany,
        accessToken: anotherPatient.accessToken!,
      })
      .send({ where: { reportId: report.id } });

    expect(managerRes.status).toBe(HttpStatus.FORBIDDEN);
    expect(patientRes.status).toBe(HttpStatus.FORBIDDEN);
  });
});

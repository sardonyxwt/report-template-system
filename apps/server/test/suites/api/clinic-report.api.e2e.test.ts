import { HttpStatus } from '@nestjs/common';
import { ClinicReportsResponse } from 'platform/common-base';
import { endpoints } from '../../../src/endpoints';
import { withAppContext } from '../../context/app.context';
import { clinicReportFixtures } from '../../fixture/clinic-report.fixture';
import { clinicFixtures } from '../../fixture/clinic.fixture';

const { context, macros } = withAppContext();

describe('api.clinic-report', () => {
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
});

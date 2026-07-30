export type {
  AuthProvider,
  User,
  Manager,
  Clinic,
  Patient,
  Template,
  ClinicReport,
  PatientReport,
} from './schema';
export {
  AuthProviderTypeSchema,
  UserRoleSchema,
  AuthProviderSchema,
  UserSchema,
  ManagerSchema,
  ClinicSchema,
  PatientSchema,
  TemplateSchema,
  ClinicReportSchema,
  PatientReportSchema,
} from './schema';
export * from './data';
export * from './aggregations';

export { UserRole, AuthProviderType, Prisma } from 'platform/prisma/types';

export * from './include/clinic.include';
export * from './include/clinic-report.include';
export * from './include/manager.include';
export * from './include/patient.include';
export * from './include/patient-report.include';
export * from './include/template.include';
export * from './include/user.include';

import './prisma.types';

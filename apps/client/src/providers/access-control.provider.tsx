import {
  type PropsWithChildren,
  createContext,
  useContext,
  useMemo,
} from 'react';
import { type UserAbilities } from 'platform/common-base';
import { useAuth } from './auth.provider';

type BooleanAbilityGroup<Group> = {
  [Action in keyof Group]: Group[Action] extends (
    ...args: infer Arguments
  ) => unknown
    ? (...args: Arguments) => boolean
    : never;
};

export type AccessControl = {
  [Entity in keyof UserAbilities]: BooleanAbilityGroup<UserAbilities[Entity]>;
};

const AccessControlContext = createContext<AccessControl | undefined>(
  undefined,
);

export const AccessControlProvider = ({ children }: PropsWithChildren) => {
  const { abilities } = useAuth();

  const value = useMemo<AccessControl>(
    () => ({
      users: {
        read: (args) => abilities.users.read(args).granted,
        create: () => abilities.users.create().granted,
        update: (args) => abilities.users.update(args).granted,
        delete: (args) => abilities.users.delete(args).granted,
      },
      managers: {
        create: () => abilities.managers.create().granted,
        delete: () => abilities.managers.delete().granted,
      },
      clinics: {
        create: (args) => abilities.clinics.create(args).granted,
        read: (args) => abilities.clinics.read(args).granted,
        update: (args) => abilities.clinics.update(args).granted,
        delete: (args) => abilities.clinics.delete(args).granted,
      },
      patients: {
        create: (args) => abilities.patients.create(args).granted,
        read: (args) => abilities.patients.read(args).granted,
        delete: (args) => abilities.patients.delete(args).granted,
      },
      templates: {
        preview: () => abilities.templates.preview().granted,
        aiEdit: () => abilities.templates.aiEdit().granted,
        create: (args) => abilities.templates.create(args).granted,
        read: (args) => abilities.templates.read(args).granted,
        update: (args) => abilities.templates.update(args).granted,
        delete: (args) => abilities.templates.delete(args).granted,
      },
      clinicReports: {
        create: (args) => abilities.clinicReports.create(args).granted,
        read: (args) => abilities.clinicReports.read(args).granted,
        delete: (args) => abilities.clinicReports.delete(args).granted,
      },
      patientReports: {
        create: (args) => abilities.patientReports.create(args).granted,
        read: (args) => abilities.patientReports.read(args).granted,
        delete: (args) => abilities.patientReports.delete(args).granted,
      },
    }),
    [abilities],
  );

  return (
    <AccessControlContext.Provider value={value}>
      {children}
    </AccessControlContext.Provider>
  );
};

export const useAccessControl = () => {
  const context = useContext(AccessControlContext);
  if (!context) {
    throw new Error(
      'useAccessControl must be used inside AccessControlProvider.',
    );
  }
  return context;
};

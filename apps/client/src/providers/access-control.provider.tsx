import {
  type PropsWithChildren,
  createContext,
  useContext,
  useMemo,
} from 'react';
import { type AbilityChecker, type UserAbilities } from 'platform/common-base';
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

const mapEntityAbilities = <Entity extends Record<string, AbilityChecker>>(
  entityAbilities: Entity,
): BooleanAbilityGroup<Entity> =>
  Object.fromEntries(
    Object.entries(entityAbilities).map(([action, checker]) => [
      action,
      (...args: unknown[]) => checker(...args).granted,
    ]),
  ) as BooleanAbilityGroup<Entity>;

const mapAbilitiesToAccessControl = (abilities: UserAbilities): AccessControl =>
  Object.fromEntries(
    Object.entries(abilities).map(([entity, entityAbilities]) => [
      entity,
      mapEntityAbilities(entityAbilities),
    ]),
  ) as AccessControl;

const AccessControlContext = createContext<AccessControl | undefined>(
  undefined,
);

export const AccessControlProvider = ({ children }: PropsWithChildren) => {
  const { abilities } = useAuth();

  const value = useMemo(
    () => mapAbilitiesToAccessControl(abilities),
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

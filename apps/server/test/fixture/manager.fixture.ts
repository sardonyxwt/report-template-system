import { ManagerCreateRequest } from 'platform/common-base';

export const managerFixtures = {
  manager(
    userId: number,
    overrides: Partial<Omit<ManagerCreateRequest, 'userId'>> = {},
  ) {
    return {
      userId,
      ...overrides,
    } satisfies ManagerCreateRequest;
  },
};

import { Prisma, UserRole } from 'platform/prisma';

const defaultFixture = {
  email: 'user@gmail.com',
  role: UserRole.User,
} satisfies Prisma.UserCreateInput;

export const userFixtures = {
  get user() {
    return defaultFixture;
  },
  get admin() {
    return {
      ...defaultFixture,
      role: UserRole.Admin,
      email: 'admin@gmail.com',
    } satisfies Prisma.UserCreateInput;
  },
};

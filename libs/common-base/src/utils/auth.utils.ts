import { User, UserRole } from 'platform/prisma';
import { JwtStrategyPayload } from '../data/auth/auth.types';

export const isWho = (role?: UserRole) => ({
  isGuest: !role,
  isUser: role === UserRole.User,
  isAdmin: role === UserRole.Admin,
  isManager: role === UserRole.Manager,
});

export type IsWho = ReturnType<typeof isWho>;

export type JwtStrategyPayloadCreationData = Pick<User, 'id' | 'role'>;

/**
 * Converts a user/profile object into the compact payload stored in JWTs.
 */
export const userResponseToJwtStrategyPayload = (
  data?: JwtStrategyPayloadCreationData,
): JwtStrategyPayload | undefined => {
  if (!data) {
    return;
  }

  return {
    id: data.id,
    role: data.role,
  };
};

/**
 * Generates an uppercase random code from a caller-provided symbol alphabet.
 */
export const generateCode = (symbols: string, length: number) => {
  let result = '';

  for (; result.length < length; ) {
    result += symbols.charAt(Math.floor(Math.random() * symbols.length));
  }

  return result;
};

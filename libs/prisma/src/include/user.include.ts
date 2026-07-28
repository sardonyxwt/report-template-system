import { includeUserProfile } from './user/user-profile.include';
import { includeUserSimple } from './user/user-simple.include';
import { includeUser } from './user/user.include';

export const userInclude = {
  includeProfile: includeUserProfile,
  include: includeUser,
  includeSimple: includeUserSimple,
};

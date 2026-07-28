import { includeManagerSimple } from './manager/manager-simple.include';
import { includeManager } from './manager/manager.include';

export const managerInclude = {
  include: includeManager,
  includeSimple: includeManagerSimple,
};

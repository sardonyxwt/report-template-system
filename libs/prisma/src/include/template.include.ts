import { Prisma } from 'platform/prisma/types';

export const includeTemplate = {
  clinic: true,
} satisfies Prisma.TemplateInclude;

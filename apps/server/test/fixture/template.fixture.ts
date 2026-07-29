import { TemplateCreateRequest } from 'platform/common-base';

const blocks = [
  'cover',
  'summary',
  'story',
  'goals',
  'plan',
  'orders',
  'timeline',
  'coach',
  'healthDeepDive',
] as const;

export const templateFixtures = {
  template(
    clinicId: number,
    overrides: Partial<Omit<TemplateCreateRequest, 'clinicId'>> = {},
  ) {
    return {
      clinicId,
      name: 'Test Template',
      data: {
        blocks: blocks.map((type) => ({
          type,
          enabled: true,
          template: `<section>${type}</section>`,
        })),
      },
      ...overrides,
    } satisfies TemplateCreateRequest;
  },
};

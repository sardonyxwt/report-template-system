import { TemplateCreateRequest } from 'platform/common-base';

export const templateFixtures = {
  template(
    clinicId: number,
    overrides: Partial<Omit<TemplateCreateRequest, 'clinicId'>> = {},
  ) {
    return {
      clinicId,
      name: 'Test Template',
      data: {
        blocks: [
          {
            type: 'summary',
            enabled: true,
            template: '<section>{{content}}</section>',
          },
        ],
      },
      ...overrides,
    } satisfies TemplateCreateRequest;
  },
};

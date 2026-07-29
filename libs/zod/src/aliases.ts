import { z, ZodType } from 'zod';

export const aliases = {
  json: z.any(),
  email: z
    .email('Enter a valid email address.')
    .meta({ example: 'example@mail.com' }),
  numberId: z.number().int().nonnegative(),
  stringId: z.uuid(),
  notEmptyString: z.string().trim().min(1),
  preprocessString: <I extends ZodType>(schema: I) =>
    z.preprocess(
      (v) =>
        v === 'undefined' || v === '' ? undefined : v === 'null' ? null : v,
      schema,
    ),
  preprocessBoolean: <I extends ZodType>(schema: I) =>
    z.preprocess(
      (v) =>
        v === 'undefined' || v === ''
          ? undefined
          : v === 'null'
            ? null
            : v === 'true' || v === 'false'
              ? JSON.parse(v)
              : v,
      schema,
    ),
  preprocessNumber: <I extends ZodType>(schema: I) =>
    z.preprocess((v) => {
      try {
        return v === 'undefined' || v === ''
          ? undefined
          : v === 'null'
            ? null
            : typeof v === 'string'
              ? parseFloat(v)
              : v;
      } catch {
        return v;
      }
    }, schema),
};

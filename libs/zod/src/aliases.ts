import { z, ZodType } from 'zod';

const notEmptyString = z.string().trim().min(1);

export const aliases = {
  json: z.any(),
  email: z
    .email('Enter a valid email address.')
    .meta({ example: 'example@mail.com' }),
  numberId: z.number().int().nonnegative(),
  stringId: z.uuid(),
  notEmptyString,
  notEmptyStringArray: z.array(notEmptyString).min(1),
  preprocessString: <I extends ZodType>(schema: I) =>
    z.preprocess(
      (v) =>
        v === 'undefined' || v === '' ? undefined : v === 'null' ? null : v,
      schema,
    ),
  preprocessStringArray: <I extends ZodType>(schema: I) =>
    z.preprocess(
      (value) =>
        typeof value === 'string'
          ? value
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : value,
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

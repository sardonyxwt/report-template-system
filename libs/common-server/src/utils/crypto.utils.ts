import { createHash } from 'node:crypto';

export const createSafetyIdentifier = (value: string | number): string =>
  createHash('sha256').update(String(value)).digest('hex');

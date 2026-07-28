import { z } from 'zod';

const ClientEnvironmentSchema = z.object({
  VITE_API_URL: z.url(),
});

const environment = ClientEnvironmentSchema.parse(import.meta.env);

export const clientEnvironment = {
  apiUrl: environment.VITE_API_URL.replace(/\/$/, ''),
} as const;

import { z } from 'zod';
import { aliases } from 'platform/zod';

const ClientEnvironmentSchema = z.object({
  VITE_API_URL: z.url(),
  VITE_OPENAI_MODEL_ALLOWLIST: aliases.preprocessStringArray(
    aliases.notEmptyStringArray.refine(
      (models) => new Set(models).size === models.length,
      'VITE_OPENAI_MODEL_ALLOWLIST must not contain duplicate model IDs.',
    ),
  ),
});

const environment = ClientEnvironmentSchema.parse(import.meta.env);

export const clientEnvironment = {
  apiUrl: environment.VITE_API_URL.replace(/\/$/, ''),
  openAiModelAllowlist: environment.VITE_OPENAI_MODEL_ALLOWLIST,
} as const;

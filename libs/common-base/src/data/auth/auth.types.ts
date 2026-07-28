import { z } from 'zod';
import {
  CheckSessionRequestSchema,
  CheckSessionResponseSchema,
  JwtStrategyPayloadSchema,
  ProfileResponseSchema,
  TokensResponseSchema,
} from './auth.data';

export type JwtStrategyPayload = z.infer<typeof JwtStrategyPayloadSchema>;
export type TokensResponse = z.infer<typeof TokensResponseSchema>;
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;
export type CheckSessionRequest = z.infer<typeof CheckSessionRequestSchema>;
export type CheckSessionResponse = z.infer<typeof CheckSessionResponseSchema>;

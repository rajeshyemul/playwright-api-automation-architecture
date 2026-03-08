import { z } from 'zod';

/**
 * AuthContract defines the runtime-validated shape of all authentication
 * request and response objects from the DummyJSON /auth endpoints.
 *
 * Architectural pattern:
 *   1. Define the Zod schema (the single source of truth)
 *   2. Derive the TypeScript type from the schema via z.infer<>
 *   3. Never write the interface manually — it would drift from the schema
 *
 * This ensures that every response parsed through these schemas is validated
 * at runtime, not just at compile time.
 */

export const LoginRequestSchema = z.object({
  username:      z.string().min(1),
  password:      z.string().min(1),
  expiresInMins: z.number().positive().optional(),
});

export const LoginResponseSchema = z.object({
  id:           z.number(),
  username:     z.string(),
  email:        z.string().email(),
  firstName:    z.string(),
  lastName:     z.string(),
  gender:       z.enum(['male', 'female']),
  image:        z.string().url(),
  accessToken:  z.string().min(1),
  refreshToken: z.string().min(1),
});

/**
 * Authenticated user profile — returned by GET /auth/me.
 * Same shape as login but WITHOUT accessToken/refreshToken.
 */
export const AuthUserSchema = z.object({
  id:        z.number(),
  username:  z.string(),
  email:     z.string().email(),
  firstName: z.string(),
  lastName:  z.string(),
  gender:    z.enum(['male', 'female']),
  image:     z.string().url(),
});


// TypeScript types — derived from schemas, never written manually
export type LoginRequest  = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type AuthUser      = z.infer<typeof AuthUserSchema>;

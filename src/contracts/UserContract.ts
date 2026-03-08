import { z } from 'zod';

/**
 * UserContract defines the complete DummyJSON user shape as Zod schemas.
 *
 * All 30+ fields from https://dummyjson.com/users are represented here.
 * Having the full schema means that if DummyJSON quietly removes or renames
 * a field, the contract tests will catch it before your application does.
 *
 * Schemas for nested objects (address, bank, company, hair, coordinates)
 * are defined separately and composed into the parent — this keeps each
 * schema focused and individually testable.
 */

// ── Nested schemas ──────────────────────────────────────────────────────────

const HairSchema = z.object({
  color: z.string(),
  type:  z.string(),
});

// DummyJSON returns null for coordinates on created users (fields not sent)
const CoordinatesSchema = z.object({
  lat: z.number().nullable(),
  lng: z.number().nullable(),
});

const AddressSchema = z.object({
  address:     z.string(),
  city:        z.string(),
  state:       z.string(),
  stateCode:   z.string(),
  postalCode:  z.string(),
  coordinates: CoordinatesSchema,
  country:     z.string(),
});

const BankSchema = z.object({
  cardExpire:  z.string(),
  cardNumber:  z.string(),
  cardType:    z.string(),
  currency:    z.string(),
  iban:        z.string(),
});

const CompanySchema = z.object({
  department: z.string(),
  name:       z.string(),
  title:      z.string(),
  address:    AddressSchema,
});

const CryptoSchema = z.object({
  coin:    z.string(),
  wallet:  z.string(),
  network: z.string(),
});

// ── Primary schemas ─────────────────────────────────────────────────────────

/**
 * Full user schema — covers both GET /users/:id and POST /users/add responses.
 *
 * Fields marked nullable() are returned as null by DummyJSON when a user is
 * created via POST /users/add because those fields were not included in the
 * request payload (height, weight, image, coordinates, etc.).
 */
export const UserSchema = z.object({
  id:            z.number(),
  firstName:     z.string(),
  lastName:      z.string(),
  maidenName:    z.string().nullable().optional(),
  age:           z.number().min(0).max(150).nullable().optional(),
  gender:        z.string(),          // DummyJSON may return empty string for created users
  email:         z.string(),
  phone:         z.string().nullable().optional(),
  username:      z.string().nullable().optional(),
  password:      z.string().nullable().optional(),
  birthDate:     z.string().nullable().optional(),
  image:         z.string().nullable().optional(),  // null on created users
  bloodGroup:    z.string().nullable().optional(),
  height:        z.number().positive().nullable().optional(),  // null on created users
  weight:        z.number().positive().nullable().optional(),  // null on created users
  eyeColor:      z.string().nullable().optional(),
  hair:          HairSchema.nullable().optional(),
  ip:            z.string().nullable().optional(),
  address:       AddressSchema.nullable().optional(),
  macAddress:    z.string().nullable().optional(),
  university:    z.string().nullable().optional(),
  bank:          BankSchema.nullable().optional(),
  company:       CompanySchema.nullable().optional(),
  ein:           z.string().nullable().optional(),
  ssn:           z.string().nullable().optional(),
  userAgent:     z.string().nullable().optional(),
  crypto:        CryptoSchema.nullable().optional(),
  role:          z.enum(['admin', 'moderator', 'user']).nullable().optional(),
});

/**
 * Paginated list of users — returned by GET /users and GET /users/search
 */
export const UsersListSchema = z.object({
  users: z.array(UserSchema),
  total: z.number().min(0),
  skip:  z.number().min(0),
  limit: z.number().min(0),
});

/**
 * Minimal schema for user creation — only the fields required by the API
 */
export const CreateUserSchema = z.object({
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  email:     z.string().email(),
  age:       z.number().min(0).max(150).optional(),
});

/**
 * Schema for the delete response from DummyJSON
 */
export const DeleteUserResponseSchema = z.object({
  id:        z.number(),
  firstName: z.string(),
  lastName:  z.string(),
  isDeleted: z.boolean(),
  deletedOn: z.string(),
});

// ── Derived TypeScript types ─────────────────────────────────────────────────

export type User               = z.infer<typeof UserSchema>;
export type UsersList          = z.infer<typeof UsersListSchema>;
export type CreateUserRequest  = z.infer<typeof CreateUserSchema>;
export type DeleteUserResponse = z.infer<typeof DeleteUserResponseSchema>;
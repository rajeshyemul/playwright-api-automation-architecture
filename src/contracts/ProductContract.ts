import { z } from 'zod';

/**
 * ProductContract defines the complete DummyJSON product shape as Zod schemas.
 *
 * All fields from https://dummyjson.com/products are represented here,
 * including nested objects (dimensions, reviews, meta).
 *
 * The same patterns used in UserContract apply here:
 *   - Nested schemas are defined first and composed into the parent
 *   - Fields that may be absent on created products are marked optional/nullable
 *   - A minimal CreateProductSchema covers only the fields the API requires
 */

// ── Nested schemas ──────────────────────────────────────────────────────────

const DimensionsSchema = z.object({
  width:  z.number(),
  height: z.number(),
  depth:  z.number(),
});

const ReviewSchema = z.object({
  rating:        z.number().min(1).max(5),
  comment:       z.string(),
  date:          z.string(),
  reviewerName:  z.string(),
  reviewerEmail: z.string(),
});

const MetaSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
  barcode:   z.string(),
  qrCode:    z.string(),
});

// ── Primary schemas ─────────────────────────────────────────────────────────

/**
 * Full product schema — covers GET /products/:id and GET /products responses.
 *
 * Fields marked optional/nullable may be absent when a product is created
 * via POST /products/add because they were not supplied in the request.
 */
export const ProductSchema = z.object({
  id:                   z.number(),
  title:                z.string(),
  description:          z.string().optional(),
  category:             z.string(),
  price:                z.number().nonnegative(),
  discountPercentage:   z.number().min(0).max(100).optional(),
  rating:               z.number().min(0).max(5).optional(),
  stock:                z.number().int().min(0).optional(),
  tags:                 z.array(z.string()).optional(),
  brand:                z.string().nullable().optional(),
  sku:                  z.string().nullable().optional(),
  weight:               z.number().optional(),
  dimensions:           DimensionsSchema.nullable().optional(),
  warrantyInformation:  z.string().optional(),
  shippingInformation:  z.string().optional(),
  availabilityStatus:   z.string().optional(),
  reviews:              z.array(ReviewSchema).optional(),
  returnPolicy:         z.string().optional(),
  minimumOrderQuantity: z.number().int().min(1).optional(),
  meta:                 MetaSchema.nullable().optional(),
  images:               z.array(z.string()).optional(),
  thumbnail:            z.string().nullable().optional(),
});

/**
 * Paginated list of products — returned by GET /products and GET /products/search
 */
export const ProductsListSchema = z.object({
  products: z.array(ProductSchema),
  total:    z.number().min(0),
  skip:     z.number().min(0),
  limit:    z.number().min(0),
});

/**
 * Minimal schema for product creation — only fields required by the API.
 */
export const CreateProductSchema = z.object({
  title:    z.string().min(1),
  price:    z.number().nonnegative(),
  category: z.string().min(1),
  stock:    z.number().int().min(0).optional(),
});

/**
 * Schema for the delete response from DummyJSON products
 */
export const DeleteProductResponseSchema = z.object({
  id:          z.number(),
  title:       z.string(),
  isDeleted:   z.boolean(),
  deletedOn:   z.string(),
});

// ── Derived TypeScript types ─────────────────────────────────────────────────

export type Product               = z.infer<typeof ProductSchema>;
export type ProductsList          = z.infer<typeof ProductsListSchema>;
export type CreateProductRequest  = z.infer<typeof CreateProductSchema>;
export type DeleteProductResponse = z.infer<typeof DeleteProductResponseSchema>;
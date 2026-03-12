/**
 * ProductModels re-exports types derived from ProductContract Zod schemas.
 *
 * Architectural note: types live here so other layers import from 'models'
 * (a stable interface) rather than from 'contracts' (the validation layer).
 * This separation means you can change the schema library without updating
 * every import across the codebase.
 */
export type {
  Product,
  ProductsList,
  CreateProductRequest,
  DeleteProductResponse,
} from '../contracts/ProductContract';
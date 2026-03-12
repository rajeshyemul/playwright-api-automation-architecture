import { ApiClient } from '../core/ApiClient';
import { ResponseValidator } from '../assertions/ResponseValidator';
import {
  ProductSchema, ProductsListSchema, CreateProductSchema, DeleteProductResponseSchema,
  Product, ProductsList, CreateProductRequest, DeleteProductResponse,
} from '../contracts/ProductContract';

/**
 * ProductService represents all business operations on the Product domain.
 *
 * Architectural pattern:
 *   - Methods accept typed input and return typed, schema-validated output
 *   - No raw APIResponse leaks out — callers receive domain objects, not HTTP
 *   - All validation happens via Zod schemas in ResponseValidator
 *   - Tests interact with this service, never with ApiClient directly
 *
 * Note: DummyJSON does not persist mutations — POST/PUT/PATCH/DELETE all return
 * the expected response shapes but don't write to a real database. These
 * operations validate the request/response contract for each workflow.
 */
export class ProductService {
  constructor(private readonly api: ApiClient) {}

  /**
   * Retrieve paginated list of products.
   * GET /products?limit={limit}&skip={skip}
   */
  async getProducts(params?: { limit?: number; skip?: number }): Promise<ProductsList> {
    const query = params
      ? `?limit=${params.limit ?? 10}&skip=${params.skip ?? 0}`
      : '';
    const response = await this.api.get(`/products${query}`);
    ResponseValidator.expectStatus(response, 200);
    return ResponseValidator.validateSchema(response, ProductsListSchema, 'getProducts');
  }

  /**
   * Retrieve a single product by ID.
   * GET /products/:id
   */
  async getProductById(productId: number): Promise<Product> {
    const response = await this.api.get(`/products/${productId}`);
    ResponseValidator.expectStatus(response, 200);
    return ResponseValidator.validateSchema(response, ProductSchema, 'getProductById');
  }

  /**
   * Search products by a query string.
   * GET /products/search?q={query}
   */
  async searchProducts(query: string): Promise<ProductsList> {
    const response = await this.api.get(`/products/search?q=${encodeURIComponent(query)}`);
    ResponseValidator.expectStatus(response, 200);
    return ResponseValidator.validateSchema(response, ProductsListSchema, 'searchProducts');
  }

  /**
   * Retrieve all products in a category.
   * GET /products/category/{category}
   */
  async getProductsByCategory(category: string): Promise<ProductsList> {
    const response = await this.api.get(`/products/category/${encodeURIComponent(category)}`);
    ResponseValidator.expectStatus(response, 200);
    return ResponseValidator.validateSchema(response, ProductsListSchema, 'getProductsByCategory');
  }

  /**
   * Create a new product.
   * POST /products/add
   */
  async createProduct(payload: CreateProductRequest): Promise<Product> {
    CreateProductSchema.parse(payload);
    const response = await this.api.post('/products/add', payload);
    ResponseValidator.expectStatus(response, 201);
    return ResponseValidator.validateSchema(response, ProductSchema, 'createProduct');
  }

  /**
   * Replace a product (full update).
   * PUT /products/:id
   */
  async updateProduct(productId: number, payload: Partial<CreateProductRequest>): Promise<Product> {
    const response = await this.api.put(`/products/${productId}`, payload);
    ResponseValidator.expectStatus(response, 200);
    return ResponseValidator.validateSchema(response, ProductSchema, 'updateProduct');
  }

  /**
   * Partially update a product.
   * PATCH /products/:id
   */
  async patchProduct(productId: number, payload: Partial<CreateProductRequest>): Promise<Product> {
    const response = await this.api.patch(`/products/${productId}`, payload);
    ResponseValidator.expectStatus(response, 200);
    return ResponseValidator.validateSchema(response, ProductSchema, 'patchProduct');
  }

  /**
   * Delete a product by ID.
   * DELETE /products/:id
   */
  async deleteProduct(productId: number): Promise<DeleteProductResponse> {
    const response = await this.api.delete(`/products/${productId}`);
    ResponseValidator.expectStatus(response, 200);
    return ResponseValidator.validateSchema(response, DeleteProductResponseSchema, 'deleteProduct');
  }
}
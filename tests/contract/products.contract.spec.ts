import { test, expect } from '../../src/fixtures/ApiFixture';
import { ResponseValidator } from '../../src/assertions/ResponseValidator';
import {
  ProductSchema, ProductsListSchema, DeleteProductResponseSchema,
  Product, DeleteProductResponse,
} from '../../src/contracts/ProductContract';
import { ProductFactory } from '../../src/test-data/ProductFactory';

/**
 * @contract — Product API schema contract tests
 *
 * Contract tests verify the API response shape has not changed.
 * They do not care about values — they care about structure.
 */

test.describe('@contract — Product API schema contracts', () => {

  test('GET /products response matches ProductsListSchema contract', async ({ apiClient, authService }) => {
    await authService.login();
    const response = await apiClient.get('/products?limit=3');
    await ResponseValidator.expectSchemaMatch(response, ProductsListSchema, 'contract:GET /products');
  });

  test('GET /products/:id response matches ProductSchema contract', async ({ apiClient, authService }) => {
    await authService.login();
    const response = await apiClient.get('/products/1');

    const product: Product = await ResponseValidator.validateSchema(
      response, ProductSchema, 'contract:GET /products/:id'
    );

    expect(typeof product.id).toBe('number');
    expect(typeof product.title).toBe('string');
    expect(typeof product.price).toBe('number');
    expect(typeof product.category).toBe('string');
  });

  test('POST /products/add response matches ProductSchema contract', async ({ apiClient, authService }) => {
    await authService.login();
    const payload = ProductFactory.create();
    const response = await apiClient.post('/products/add', payload);
    await ResponseValidator.expectSchemaMatch(response, ProductSchema, 'contract:POST /products/add');
  });

  test('PUT /products/:id response matches ProductSchema contract', async ({ apiClient, authService }) => {
    await authService.login();
    const payload = ProductFactory.create();
    const response = await apiClient.put('/products/1', payload);
    await ResponseValidator.expectSchemaMatch(response, ProductSchema, 'contract:PUT /products/:id');
  });

  test('DELETE /products/:id response matches DeleteProductResponseSchema contract', async ({ apiClient, authService }) => {
    await authService.login();
    const response = await apiClient.delete('/products/1');

    const deleted: DeleteProductResponse = await ResponseValidator.validateSchema(
      response, DeleteProductResponseSchema, 'contract:DELETE /products/:id'
    );

    expect(deleted.isDeleted).toBe(true);
  });

  test('GET /products/search response matches ProductsListSchema contract', async ({ apiClient, authService }) => {
    await authService.login();
    const response = await apiClient.get('/products/search?q=phone');
    await ResponseValidator.expectSchemaMatch(response, ProductsListSchema, 'contract:GET /products/search');
  });

  test('GET /products/category/:category response matches ProductsListSchema contract', async ({ apiClient, authService }) => {
    await authService.login();
    const response = await apiClient.get('/products/category/smartphones');
    await ResponseValidator.expectSchemaMatch(response, ProductsListSchema, 'contract:GET /products/category');
  });

});
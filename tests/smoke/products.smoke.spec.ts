import { test, expect } from '../../src/fixtures/ApiFixture';

/**
 * @smoke — Products API health checks
 *
 * Verify the Products service is reachable and returns structurally sound data.
 * These tests do not assert business logic — only that the service is up.
 */

test.describe('@smoke — Products API', () => {

  test('GET /products returns 200 with a non-empty list', async ({ authenticatedProductService }) => {
    const products = await authenticatedProductService.getProducts({ limit: 1 });

    expect(products.total).toBeGreaterThan(0);
    expect(products.products).toHaveLength(1);
  });

  test('GET /products/:id returns a product for a known ID', async ({ authenticatedProductService }) => {
    const product = await authenticatedProductService.getProductById(1);

    expect(product.id).toBe(1);
    expect(product.title).toBeTruthy();
    expect(product.price).toBeGreaterThan(0);
  });

  test('GET /products/search returns results for a common term', async ({ authenticatedProductService }) => {
    const results = await authenticatedProductService.searchProducts('phone');

    expect(results.total).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(results.products)).toBe(true);
  });

});
import { test, expect } from '../../src/fixtures/ApiFixture';
import { ProductFactory } from '../../src/test-data/ProductFactory';
import { Product, ProductsList } from '../../src/contracts/ProductContract';

/**
 * @integration — Product CRUD workflow tests
 *
 * DummyJSON does not persist mutations — POST/PUT/PATCH/DELETE all return
 * the expected response shapes but don't write to a real database. These tests
 * validate the request/response contract for each CRUD operation.
 *
 * Teardown: tests that create resources call registry.track() so the fixture
 * layer deletes them automatically after each test, keeping the environment clean.
 */

test.describe('@integration — Product CRUD', () => {

  test('GET /products returns a paginated list with correct shape', async ({ authenticatedProductService }) => {
    const products: ProductsList = await authenticatedProductService.getProducts({ limit: 5, skip: 0 });

    expect(products.products).toHaveLength(5);
    expect(products.total).toBeGreaterThan(0);
    expect(products.skip).toBe(0);
    expect(products.limit).toBe(5);
  });

  test('GET /products/:id returns the correct product', async ({ authenticatedProductService }) => {
    const product: Product = await authenticatedProductService.getProductById(1);

    expect(product.id).toBe(1);
    expect(product.title).toBeTruthy();
    expect(product.price).toBeGreaterThan(0);
    expect(product.category).toBeTruthy();
  });

  test('GET /products/:id for non-existent ID returns 404', async ({ apiClient, authService }) => {
    await authService.login();
    const response = await apiClient.get('/products/99999');

    expect(response.status()).toBe(404);
  });

  test('POST /products/add creates a product and returns it with an assigned ID', async ({ authenticatedProductService, registry }) => {
    const payload = ProductFactory.create();
    const created: Product = await authenticatedProductService.createProduct(payload);
    registry.track('product', created.id);   // register for cleanup

    expect(created.id).toBeDefined();
    expect(created.id).toBeGreaterThan(0);
    expect(created.title).toBe(payload.title);
    expect(created.price).toBe(payload.price);
    expect(created.category).toBe(payload.category);
  });

  test('POST /products/add with different products produces unique data', async ({ authenticatedProductService, registry }) => {
    const [payload1, payload2] = ProductFactory.createBulk(2);

    const product1: Product = await authenticatedProductService.createProduct(payload1);
    const product2: Product = await authenticatedProductService.createProduct(payload2);
    registry.track('product', product1.id);   // register both for cleanup
    registry.track('product', product2.id);

    expect(product1.title).not.toBe(product2.title);
    expect(product1.id).toBeDefined();
    expect(product2.id).toBeDefined();
  });

  test('PUT /products/:id replaces product fields', async ({ authenticatedProductService, registry }) => {
    const update = ProductFactory.create({ title: 'Updated Product Title' });
    const updated: Product = await authenticatedProductService.updateProduct(1, update);
    registry.track('product', updated.id);

    expect(updated.id).toBe(1);
    expect(updated.title).toBe('Updated Product Title');
  });

  test('PATCH /products/:id partially updates a product', async ({ authenticatedProductService, registry }) => {
    const patched: Product = await authenticatedProductService.patchProduct(1, {
      price: 49.99,
    });
    registry.track('product', patched.id);

    expect(patched.id).toBe(1);
    expect(patched.price).toBe(49.99);
  });

  test('DELETE /products/:id marks the product as deleted', async ({ authenticatedProductService }) => {
    const deleted = await authenticatedProductService.deleteProduct(1);

    expect(deleted.id).toBe(1);
    expect(deleted.isDeleted).toBe(true);
    expect(deleted.deletedOn).toBeTruthy();
  });

  test('GET /products/search finds products matching a query', async ({ authenticatedProductService }) => {
    const results: ProductsList = await authenticatedProductService.searchProducts('laptop');

    expect(results.products.length).toBeGreaterThan(0);
    const titles = results.products.map((p: Product) => p.title.toLowerCase());
    const anyMatch = titles.some((t: string) => t.includes('laptop'));
    expect(anyMatch).toBe(true);
  });

  test('GET /products/category returns products from that category', async ({ authenticatedProductService }) => {
    const results: ProductsList = await authenticatedProductService.getProductsByCategory('smartphones');

    expect(results.products.length).toBeGreaterThan(0);
    results.products.forEach((p: Product) => {
      expect(p.category).toBe('smartphones');
    });
  });

  test('Pagination: second page returns different products than first page', async ({ authenticatedProductService }) => {
    const page1: ProductsList = await authenticatedProductService.getProducts({ limit: 5, skip: 0 });
    const page2: ProductsList = await authenticatedProductService.getProducts({ limit: 5, skip: 5 });

    const ids1 = page1.products.map((p: Product) => p.id);
    const ids2 = page2.products.map((p: Product) => p.id);
    const overlap = ids1.filter((id: number) => ids2.includes(id));

    expect(overlap).toHaveLength(0);
  });

});
import { faker } from '@faker-js/faker';
import { CreateProductRequest } from '../contracts/ProductContract';

/**
 * ProductFactory generates deterministic, realistic test data for product operations.
 *
 * Architectural principle: tests never hard-code test data. Factories generate
 * unique data per invocation, which makes tests safe for parallel execution
 * and eliminates data-collision failures in shared environments.
 *
 * Override pattern: every factory method accepts a Partial<T> override so
 * tests can specify only the fields they care about while letting the factory
 * fill in everything else. This keeps tests focused on behavior, not data.
 */

const CATEGORIES = [
  'beauty', 'fragrances', 'furniture', 'groceries',
  'home-decoration', 'kitchen-accessories', 'laptops',
  'mens-shirts', 'mens-shoes', 'mens-watches',
  'mobile-accessories', 'motorcycle', 'skin-care',
  'smartphones', 'sports-accessories', 'sunglasses',
  'tablets', 'tops', 'vehicle', 'womens-bags',
  'womens-dresses', 'womens-jewellery', 'womens-shoes',
  'womens-watches',
] as const;

export type ProductCategory = typeof CATEGORIES[number];

export class ProductFactory {
  /**
   * Generate a valid product creation payload.
   * Use `overrides` to pin specific fields for a test scenario.
   *
   * @example
   * // Random product
   * const product = ProductFactory.create();
   *
   * // Force a specific category
   * const product = ProductFactory.create({ category: 'smartphones' });
   */
  static create(overrides?: Partial<CreateProductRequest>): CreateProductRequest {
    return {
      title:    faker.commerce.productName(),
      price:    parseFloat(faker.commerce.price({ min: 1, max: 1000 })),
      category: faker.helpers.arrayElement(CATEGORIES),
      stock:    faker.number.int({ min: 0, max: 500 }),
      ...overrides,
    };
  }

  /**
   * Generate multiple unique products in one call.
   */
  static createBulk(count: number, overrides?: Partial<CreateProductRequest>): CreateProductRequest[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Generate a product with a specific category.
   */
  static createInCategory(category: ProductCategory): CreateProductRequest {
    return this.create({ category });
  }

  /**
   * Generate a product with a specific price for pricing tests.
   */
  static createWithPrice(price: number): CreateProductRequest {
    return this.create({ price });
  }

  /**
   * Generate a product payload with intentionally invalid data.
   * Used in negative tests to verify schema validation.
   */
  static createInvalid(): Record<string, unknown> {
    return {
      title:    '',       // empty — violates min length
      price:    -99,      // negative — violates nonnegative
      category: null,     // null — violates type
    };
  }
}
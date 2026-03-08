import { faker } from '@faker-js/faker';
import { CreateUserRequest } from '../contracts/UserContract';

/**
 * UserFactory generates deterministic, realistic test data for user operations.
 *
 * Architectural principle: tests never hard-code test data. Factories generate
 * unique data per invocation, which makes tests safe for parallel execution
 * and eliminates data-collision failures in shared environments.
 *
 * Override pattern: every factory method accepts a Partial<T> override so
 * tests can specify only the fields they care about while letting the factory
 * fill in everything else. This keeps tests focused on behavior, not data.
 */
export class UserFactory {
  /**
   * Generate a valid user creation payload.
   * Use `overrides` to pin specific fields for a test scenario.
   *
   * @example
   * // Random user
   * const user = UserFactory.create();
   *
   * // Force a specific email domain
   * const user = UserFactory.create({ email: 'test@example.com' });
   */
  static create(overrides?: Partial<CreateUserRequest>): CreateUserRequest {
    return {
      firstName: faker.person.firstName(),
      lastName:  faker.person.lastName(),
      email:     faker.internet.email(),
      age:       faker.number.int({ min: 18, max: 65 }),
      ...overrides,
    };
  }

  /**
   * Generate multiple unique users in one call.
   * Useful for bulk-create tests or data-driven scenarios.
   */
  static createBulk(count: number, overrides?: Partial<CreateUserRequest>): CreateUserRequest[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Generate a user with a specific role context.
   * Useful for RBAC tests that need to assert role-based API behavior.
   */
  static createWithRole(role: 'admin' | 'moderator' | 'user'): CreateUserRequest & { role: string } {
    return { ...this.create(), role };
  }

  /**
   * Generate a user payload with intentionally invalid data.
   * Used in negative tests to verify server-side validation.
   */
  static createInvalid(): Record<string, unknown> {
    return {
      firstName: '',          // empty — violates min length
      lastName:  null,        // null — violates type
      email:     'not-email', // not an email address
      age:       -5,          // negative — violates min
    };
  }
}

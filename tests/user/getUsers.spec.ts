import { test, expect } from '../../src/fixtures/ApiFixture';
import { ResponseValidator } from '../../src/assertions/ResponseValidator';
import { UserFactory } from '../../src/test-data/UserFactory';

/**
 * User endpoint tests — general coverage
 *
 * These tests cover edge cases and specific user scenarios that don't fit
 * neatly into smoke, integration, or contract categories.
 */

test.describe('Users API — general', () => {

  test('Fetch all users returns a non-empty list', async ({ authService, authenticatedUserService }) => {
    const users = await authenticatedUserService.getUsers();

    expect(users.users.length).toBeGreaterThan(0);
    expect(users.total).toBeGreaterThan(0);
  });

  test('Fetch user by ID returns the correct user', async ({ authenticatedUserService }) => {
    const user = await authenticatedUserService.getUserById(2);

    ResponseValidator.expectStatus;
    expect(user.id).toBe(2);
    expect(user.firstName).toBeTruthy();
  });

  test('Created user has all required fields', async ({ authenticatedUserService }) => {
    const payload = UserFactory.create();
    const created = await authenticatedUserService.createUser(payload);

    expect(created.firstName).toBe(payload.firstName);
    expect(created.lastName).toBe(payload.lastName);
    expect(created.email).toBe(payload.email);
    expect(created.id).toBeDefined();
  });

  test('Each test run generates unique user data', () => {
    const user1 = UserFactory.create();
    const user2 = UserFactory.create();

    // Factory guarantees uniqueness — safe for parallel execution
    expect(user1.email).not.toBe(user2.email);
  });

});

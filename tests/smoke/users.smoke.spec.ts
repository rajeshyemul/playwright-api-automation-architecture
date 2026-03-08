import { test, expect } from '../../src/fixtures/ApiFixture';
import { ResponseValidator } from '../../src/assertions/ResponseValidator';

/**
 * @smoke — Users API health checks
 *
 * Verify the Users service is reachable and returns structurally sound data.
 * These tests do not assert business logic — only that the service is up.
 */

test.describe('@smoke — Users API', () => {

  test('GET /users returns 200', async ({ authenticatedUserService }) => {
    const users = await authenticatedUserService.getUsers({ limit: 1 });

    expect(users.total).toBeGreaterThan(0);
  });

  test('GET /users/:id returns a user for a known ID', async ({ authenticatedUserService }) => {
    const user = await authenticatedUserService.getUserById(1);

    expect(user.id).toBe(1);
    expect(user.firstName).toBeTruthy();
    expect(user.email).toContain('@');
  });

  test('GET /users/search returns results for a common name', async ({ authenticatedUserService }) => {
    const results = await authenticatedUserService.searchUsers('John');

    expect(results.total).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(results.users)).toBe(true);
  });

});

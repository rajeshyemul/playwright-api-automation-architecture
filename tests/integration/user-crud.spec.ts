import { test, expect } from '../../src/fixtures/ApiFixture';
import { UserFactory } from '../../src/test-data/UserFactory';
import { User, UsersList } from '../../src/contracts/UserContract';

/**
 * @integration — User CRUD workflow tests
 *
 * DummyJSON does not persist mutations: POST/PUT/PATCH/DELETE all return
 * the expected response shapes but don't write to a real database. These tests
 * validate the request/response contract for each CRUD operation.
 *
 * Teardown: tests that create resources call registry.track() so the fixture
 * layer deletes them automatically after each test, keeping the environment clean.
 */

test.describe('@integration — User CRUD', () => {

  test('GET /users returns a paginated list with correct shape', async ({ authenticatedUserService }) => {
    const users: UsersList = await authenticatedUserService.getUsers({ limit: 5, skip: 0 });

    expect(users.users).toHaveLength(5);
    expect(users.total).toBeGreaterThan(0);
    expect(users.skip).toBe(0);
    expect(users.limit).toBe(5);
  });

  test('GET /users/:id returns the correct user', async ({ authenticatedUserService }) => {
    const user: User = await authenticatedUserService.getUserById(1);

    expect(user.id).toBe(1);
    expect(user.firstName).toBeTruthy();
    expect(user.lastName).toBeTruthy();
    expect(user.email).toMatch(/.+@.+\..+/);
  });

  test('GET /users/:id for non-existent ID returns 404', async ({ apiClient, authService }) => {
    await authService.login();
    const response = await apiClient.get('/users/99999');

    expect(response.status()).toBe(404);
  });

  test('POST /users/add creates a user and returns it with an assigned ID', async ({ authenticatedUserService, registry }) => {
    const payload = UserFactory.create();
    const created: User = await authenticatedUserService.createUser(payload);
    registry.track('user', created.id);   // register for cleanup

    expect(created.id).toBeDefined();
    expect(created.id).toBeGreaterThan(0);
    expect(created.firstName).toBe(payload.firstName);
    expect(created.lastName).toBe(payload.lastName);
    expect(created.email).toBe(payload.email);
  });

  test('POST /users/add with different users produces unique data', async ({ authenticatedUserService, registry }) => {
    const [payload1, payload2] = UserFactory.createBulk(2);

    const user1: User = await authenticatedUserService.createUser(payload1);
    const user2: User = await authenticatedUserService.createUser(payload2);
    registry.track('user', user1.id);    // register both for cleanup
    registry.track('user', user2.id);

    expect(user1.email).not.toBe(user2.email);
    expect(user1.firstName).toBeDefined();
    expect(user2.firstName).toBeDefined();
  });

  test('PUT /users/:id replaces user fields', async ({ authenticatedUserService, registry }) => {
    const update = UserFactory.create({ firstName: 'UpdatedFirstName' });
    const updated: User = await authenticatedUserService.updateUser(1, update);
    registry.track('user', updated.id);

    expect(updated.id).toBe(1);
    expect(updated.firstName).toBe('UpdatedFirstName');
  });

  test('PATCH /users/:id partially updates a user', async ({ authenticatedUserService, registry }) => {
    const patched: User = await authenticatedUserService.patchUser(1, {
      firstName: 'PatchedName',
    });
    registry.track('user', patched.id);

    expect(patched.id).toBe(1);
    expect(patched.firstName).toBe('PatchedName');
  });

  test('DELETE /users/:id marks the user as deleted', async ({ authenticatedUserService }) => {
    const deleted = await authenticatedUserService.deleteUser(1);

    expect(deleted.id).toBe(1);
    expect(deleted.isDeleted).toBe(true);
    expect(deleted.deletedOn).toBeTruthy();
  });

  test('GET /users/search finds users matching a query', async ({ authenticatedUserService }) => {
    const results: UsersList = await authenticatedUserService.searchUsers('John');

    expect(results.users.length).toBeGreaterThan(0);
    const names = results.users.map((u: User) => `${u.firstName} ${u.lastName}`.toLowerCase());
    const anyMatch = names.some((n: string) => n.includes('john'));
    expect(anyMatch).toBe(true);
  });

  test('Pagination: second page returns different users than first page', async ({ authenticatedUserService }) => {
    const page1: UsersList = await authenticatedUserService.getUsers({ limit: 5, skip: 0 });
    const page2: UsersList = await authenticatedUserService.getUsers({ limit: 5, skip: 5 });

    const ids1 = page1.users.map((u: User) => u.id);
    const ids2 = page2.users.map((u: User) => u.id);
    const overlap = ids1.filter((id: number) => ids2.includes(id));

    expect(overlap).toHaveLength(0);
  });

});
import { test, expect } from '../../src/fixtures/ApiFixture';
import { ResponseValidator } from '../../src/assertions/ResponseValidator';
import {
  UserSchema, UsersListSchema, DeleteUserResponseSchema,
  User, DeleteUserResponse,
} from '../../src/contracts/UserContract';
import { UserFactory } from '../../src/test-data/UserFactory';

/**
 * @contract — User API schema contract tests
 *
 * Contract tests verify the API response shape has not changed.
 * They do not care about values — they care about structure.
 */

test.describe('@contract — User API schema contracts', () => {

  test('GET /users response matches UsersListSchema contract', async ({ apiClient, authService }) => {
    await authService.login();
    const response = await apiClient.get('/users?limit=3');
    // assertion-only — no return value needed
    await ResponseValidator.expectSchemaMatch(response, UsersListSchema, 'contract:GET /users');
  });

  test('GET /users/:id response matches UserSchema contract', async ({ apiClient, authService }) => {
    await authService.login();
    const response = await apiClient.get('/users/1');

    // validateSchema: typed return needed for field assertions below
    const user: User = await ResponseValidator.validateSchema(
      response, UserSchema, 'contract:GET /users/:id'
    );

    expect(typeof user.id).toBe('number');
    expect(typeof user.email).toBe('string');
    expect(['male', 'female']).toContain(user.gender);
    expect(['admin', 'moderator', 'user']).toContain(user.role);
  });

  test('POST /users/add response matches UserSchema contract', async ({ apiClient, authService }) => {
    await authService.login();
    const payload = UserFactory.create();
    const response = await apiClient.post('/users/add', payload);
    await ResponseValidator.expectSchemaMatch(response, UserSchema, 'contract:POST /users/add');
  });

  test('PUT /users/:id response matches UserSchema contract', async ({ apiClient, authService }) => {
    await authService.login();
    const payload = UserFactory.create();
    const response = await apiClient.put('/users/1', payload);
    await ResponseValidator.expectSchemaMatch(response, UserSchema, 'contract:PUT /users/:id');
  });

  test('DELETE /users/:id response matches DeleteUserResponseSchema contract', async ({ apiClient, authService }) => {
    await authService.login();
    const response = await apiClient.delete('/users/1');

    // validateSchema: typed return needed for isDeleted assertion
    const deleted: DeleteUserResponse = await ResponseValidator.validateSchema(
      response, DeleteUserResponseSchema, 'contract:DELETE /users/:id'
    );

    expect(deleted.isDeleted).toBe(true);
  });

  test('GET /users/search response matches UsersListSchema contract', async ({ apiClient, authService }) => {
    await authService.login();
    const response = await apiClient.get('/users/search?q=John');
    await ResponseValidator.expectSchemaMatch(response, UsersListSchema, 'contract:GET /users/search');
  });

});
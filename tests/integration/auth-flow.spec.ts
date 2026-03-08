import { test, expect } from '../../src/fixtures/ApiFixture';
import { AuthFactory } from '../../src/test-data/AuthFactory';
import { ResponseValidator } from '../../src/assertions/ResponseValidator';
import { LoginResponseSchema, LoginResponse, AuthUserSchema } from '../../src/contracts/AuthContract';

/**
 * @integration — Authentication workflow tests
 */

test.describe('@integration — Authentication flow', () => {

  test('Login returns a full user profile alongside the token', async ({ apiClient }) => {
    const response = await apiClient.post('/auth/login', AuthFactory.validCredentials());

    const profile: LoginResponse = await ResponseValidator.validateSchema(
      response, LoginResponseSchema, 'auth-flow:login'
    );

    expect(profile.accessToken).toBeTruthy();
    expect(profile.id).toBeGreaterThan(0);
    expect(profile.email).toMatch(/.+@.+\..+/);
    expect(profile.username).toBeTruthy();
    expect(profile.firstName).toBeTruthy();
    expect(profile.lastName).toBeTruthy();
  });

  test('Token from login can authenticate subsequent requests', async ({ authService, apiClient }) => {
    await authService.login();

    const response = await apiClient.get('/auth/me');
    await ResponseValidator.expectStatus(response, 200);

    // /auth/me returns user profile WITHOUT tokens — use AuthUserSchema
    const profile = await ResponseValidator.validateSchema(
      response, AuthUserSchema, 'auth-flow:auth/me'
    );
    expect(profile.username).toBeTruthy();
  });

  test('Invalid password returns 400 and no token', async ({ apiClient }) => {
    const response = await apiClient.post('/auth/login', AuthFactory.wrongPassword());

    await ResponseValidator.expectStatus(response, 400);

    const body = await response.json() as Record<string, unknown>;
    expect(body).not.toHaveProperty('accessToken');
  });

  test('Auth service reports authenticated state after login', async ({ authService }) => {
    // authService fixture creates a fresh AuthService per test, but authManager
    // is a singleton — clear it first to guarantee a clean starting state
    authService.logout();
    expect(authService.isAuthenticated()).toBe(false);
    await authService.login();
    expect(authService.isAuthenticated()).toBe(true);
  });

  test('Auth service clears state after logout', async ({ authService }) => {
    await authService.login();
    expect(authService.isAuthenticated()).toBe(true);

    authService.logout();
    expect(authService.isAuthenticated()).toBe(false);
  });

});
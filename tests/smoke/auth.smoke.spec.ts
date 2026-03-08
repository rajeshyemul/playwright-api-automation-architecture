import { test, expect } from '../../src/fixtures/ApiFixture';
import { AuthFactory } from '../../src/test-data/AuthFactory';
import { ResponseValidator } from '../../src/assertions/ResponseValidator';
import { LoginResponseSchema, LoginResponse } from '../../src/contracts/AuthContract';

/**
 * @smoke — Authentication health checks
 *
 * Smoke tests answer one question: is the service alive and responding?
 * They run on every deployment and must be fast, stable, and dependency-free.
 */

test.describe('@smoke — Authentication API', () => {

  test('POST /auth/login returns 200 with valid credentials', async ({ apiClient }) => {
    const credentials = AuthFactory.validCredentials();
    const response = await apiClient.post('/auth/login', credentials);

    ResponseValidator.expectStatus(response, 200);
    ResponseValidator.expectSuccess(response);
  });

  test('POST /auth/login returns a valid token structure', async ({ apiClient }) => {
    const credentials = AuthFactory.validCredentials();
    const response = await apiClient.post('/auth/login', credentials);

    const body: LoginResponse = await ResponseValidator.validateSchema(
      response,
      LoginResponseSchema,
      'smoke:login'
    );

    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
    expect(body.username).toBeTruthy();
  });

  test('POST /auth/login with invalid credentials returns 400', async ({ apiClient }) => {
    const credentials = AuthFactory.invalidCredentials();
    const response = await apiClient.post('/auth/login', credentials);

    ResponseValidator.expectStatus(response, 400);
  });

});

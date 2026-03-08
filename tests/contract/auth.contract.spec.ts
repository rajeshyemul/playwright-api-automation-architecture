import { test, expect } from '../../src/fixtures/ApiFixture';
import { ResponseValidator } from '../../src/assertions/ResponseValidator';
import { LoginResponseSchema, LoginResponse, AuthUserSchema } from '../../src/contracts/AuthContract';
import { AuthFactory } from '../../src/test-data/AuthFactory';

/**
 * @contract — Authentication API schema contract tests
 */

test.describe('@contract — Auth API schema contracts', () => {

  test('POST /auth/login response matches LoginResponseSchema contract', async ({ apiClient }) => {
    const response = await apiClient.post('/auth/login', AuthFactory.validCredentials());

    const profile: LoginResponse = await ResponseValidator.validateSchema(
      response, LoginResponseSchema, 'contract:POST /auth/login'
    );

    expect(profile.accessToken.length).toBeGreaterThan(20);
    expect(profile.refreshToken.length).toBeGreaterThan(20);
  });

  test('GET /auth/me response matches AuthUserSchema contract', async ({ apiClient, authService }) => {
    await authService.login();
    const response = await apiClient.get('/auth/me');

    // /auth/me returns profile WITHOUT tokens — use AuthUserSchema
    await ResponseValidator.expectSchemaMatch(
      response, AuthUserSchema, 'contract:GET /auth/me'
    );
  });

});
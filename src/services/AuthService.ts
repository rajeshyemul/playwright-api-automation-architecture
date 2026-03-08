import { ApiClient } from '../core/ApiClient';
import { authManager } from '../core/AuthManager';
import { configManager } from '../config/ConfigManager';
import { ResponseValidator } from '../assertions/ResponseValidator';
import { LoginResponseSchema, LoginResponse, AuthUserSchema, AuthUser } from '../contracts/AuthContract';

/**
 * AuthService exposes authentication workflows as business operations.
 *
 * It delegates token lifecycle management to AuthManager and exposes
 * only the intent-level API that tests need.
 */
export class AuthService {
  constructor(private readonly api: ApiClient) {}

  /**
   * Authenticate and cache the access token.
   * Subsequent calls within the same session return the cached token.
   */
  async login(expiresInMins = 30): Promise<string> {
    return authManager.login(this.api, expiresInMins);
  }

  /**
   * Login and return the full validated response body.
   * Useful for tests that assert on user profile fields in the auth response.
   */
  async loginAndGetProfile(): Promise<LoginResponse> {
    const response = await this.api.post('/auth/login', {
      username:      configManager.getUsername(),
      password:      configManager.getPassword(),
      expiresInMins: 30,
    });
    await ResponseValidator.expectStatus(response, 200);
    return ResponseValidator.validateSchema(response, LoginResponseSchema, 'loginAndGetProfile');
  }

  /**
   * Verify the current token is still valid by hitting the /auth/me endpoint.
   */
  async getAuthenticatedUser(): Promise<AuthUser> {
    const response = await this.api.get('/auth/me');
    await ResponseValidator.expectStatus(response, 200);
    return ResponseValidator.validateSchema(response, AuthUserSchema, 'getAuthenticatedUser');
  }

  /**
   * Clear all cached tokens. Call in afterEach for auth-negative tests.
   */
  logout(): void {
    authManager.clearTokens();
  }

  /**
   * Check if the user is currently authenticated.
   * @returns True if there's a valid, non-expired token; false otherwise.
   */
  isAuthenticated(): boolean {
    return authManager.getAccessToken() !== null && !authManager.isTokenExpired();
  }
}

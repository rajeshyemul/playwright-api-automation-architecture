import { ApiClient } from './ApiClient';
import { LoginRequest, LoginResponse } from '../models/AuthModels';
import { logger } from './Logger';
import { configManager } from '../config/ConfigManager';

/**
 * AuthManager owns the full authentication lifecycle.
 *
 * Responsibilities:
 *   - Login with credentials from ConfigManager (reads .env, never hardcoded)
 *   - Cache the access token to avoid repeated logins within the same session
 *   - Track token expiry and refresh proactively before expiry
 *   - Provide clearTokens() for teardown and negative test scenarios
 *
 * Token expiry strategy: DummyJSON returns expiresInMins. We store the
 * login timestamp and treat the token as expired 60 seconds before the
 * reported expiry, giving a safe buffer for slow test machines or CI.
 */

const EXPIRY_BUFFER_SECONDS = 60;

class AuthManager {
  private accessToken:  string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number | null = null; // Unix ms

  async login(apiClient: ApiClient, expiresInMins = 30): Promise<string> {
    if (this.accessToken && !this.isTokenExpired()) {
      logger.debug('Returning cached access token (still valid).');
      return this.accessToken!;
    }

    const credentials: LoginRequest = {
      username:      configManager.getUsername(),
      password:      configManager.getPassword(),
      expiresInMins,
    };

    logger.info('Authenticating user...', { username: credentials.username });

    const response = await apiClient.post('/auth/login', credentials);

    if (response.status() !== 200) {
      const errorBody = await response.text();
      throw new Error(
        `Login failed. Status: ${response.status()}, Body: ${errorBody}`
      );
    }

    const body: LoginResponse = await response.json();

    this.accessToken  = body.accessToken;
    this.refreshToken = body.refreshToken;

    // Calculate expiry in ms, minus the safety buffer
    const expiryMs = expiresInMins * 60 * 1000;
    const bufferMs = EXPIRY_BUFFER_SECONDS * 1000;
    this.tokenExpiresAt = Date.now() + expiryMs - bufferMs;

    logger.info('Authentication successful.', { username: body.username });

    return this.accessToken!;
  }

  getAccessToken(): string | null {
    return this.accessToken!;
  }

  isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) return true;
    return Date.now() >= this.tokenExpiresAt;
  }

  clearTokens(): void {
    this.accessToken  = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    logger.debug('Auth tokens cleared.');
  }
}

// Singleton: one auth manager shared across the framework
export const authManager = new AuthManager();

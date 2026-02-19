import { ApiClient } from './ApiClient';
import { LoginRequest, LoginResponse } from '../models/AuthModels';
import { logger } from './logger';

class AuthManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async login(apiClient: ApiClient): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    const credentials: LoginRequest = {
      username: 'emilys',
      password: 'emilyspass',
      expiresInMins: 30,
    };

    logger.info('Authenticating user...');

    const response = await apiClient.post('/auth/login', credentials);

    if (response.status() !== 200) {
      const errorBody = await response.text();
      throw new Error(
        `Login failed. Status: ${response.status()}, Body: ${errorBody}`
      );
    }

    const body: LoginResponse = await response.json();

    this.accessToken = body.accessToken;
    this.refreshToken = body.refreshToken;

    logger.info('Authentication successful.');

    return this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
  }
}

export const authManager = new AuthManager();
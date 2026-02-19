import { APIRequestContext, APIResponse } from '@playwright/test';
import { configManager } from '../config/configManager';
import { logger } from './logger';
import { authManager } from './AuthManager';

export class ApiClient {
  constructor(private request: APIRequestContext) {}

private buildHeaders(custom?: Record<string, string>) {
  const token = authManager.getAccessToken();

  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...custom,
  };
}

  async get(endpoint: string, headers?: Record<string, string>): Promise<APIResponse> {
    logger.info(`GET → ${endpoint}`);

    const response = await this.request.get(endpoint, {
      headers: this.buildHeaders(headers),
      timeout: configManager.getTimeout(),
    });

    logger.debug(await response.text());
    return response;
  }

  async post(
    endpoint: string,
    body: unknown,
    headers?: Record<string, string>
  ): Promise<APIResponse> {
    logger.info(`POST → ${endpoint}`);

    const response = await this.request.post(endpoint, {
      headers: this.buildHeaders(headers),
      data: body,
      timeout: configManager.getTimeout(),
    });

    logger.debug(await response.text());
    return response;
  }
}
import { APIRequestContext, APIResponse } from '@playwright/test';
import { configManager } from '../config/ConfigManager';
import { logger } from './Logger';
import { authManager } from './AuthManager';
import { metricsCollector } from '../observability/MetricsCollector';

/**
 * ApiClient is the single HTTP communication layer for the entire framework.
 *
 * Responsibilities:
 *   - Execute HTTP requests (GET, POST, PUT, PATCH, DELETE)
 *   - Inject authentication headers automatically
 *   - Apply request timeouts from ConfigManager
 *   - Log every request with method, endpoint, status, and duration
 *   - Record metrics for observability
 *   - Retry transient failures (5xx, network errors) with configurable count
 *
 * Services call ApiClient. Tests never call ApiClient directly.
 */
export class ApiClient {
  private readonly maxRetries: number;

  constructor(private readonly request: APIRequestContext) {
    this.maxRetries = configManager.getRetryCount();
  }

  private buildHeaders(custom?: Record<string, string>): Record<string, string> {
    const token = authManager.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...custom,
    };
  }

  private async executeWithRetry(
    fn: () => Promise<APIResponse>,
    method: string,
    endpoint: string
  ): Promise<APIResponse> {
    let lastResponse: APIResponse | null = null;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const start = Date.now();
      try {
        const response = await fn();
        const durationMs = Date.now() - start;
        const success = response.ok();

        metricsCollector.record({
          method,
          endpoint,
          statusCode: response.status(),
          durationMs,
          success,
          timestamp: new Date().toISOString(),
          retries: attempt,
        });

        logger.info(`${method} ${endpoint}`, {
          status:    response.status(),
          durationMs,
          attempt:   attempt > 0 ? attempt : undefined,
        });

        if (configManager.isDebug()) {
          const body = await response.text();
          logger.debug('Response body', { body: body.slice(0, 500) });
        }

        // Only retry on server errors
        if (!success && response.status() >= 500 && attempt < this.maxRetries) {
          logger.warn(`Retrying ${method} ${endpoint} (attempt ${attempt + 1}/${this.maxRetries})`, {
            status: response.status(),
          });
          lastResponse = response;
          continue;
        }

        return response;
      } catch (err) {
        lastError = err as Error;
        const durationMs = Date.now() - start;

        metricsCollector.record({
          method,
          endpoint,
          statusCode: 0,
          durationMs,
          success: false,
          timestamp: new Date().toISOString(),
          retries: attempt,
          errorMessage: lastError.message,
        });

        logger.error(`${method} ${endpoint} — network error`, { error: lastError.message });

        if (attempt < this.maxRetries) continue;
      }
    }

    if (lastError) throw lastError;
    return lastResponse!;
  }

  async get(endpoint: string, headers?: Record<string, string>): Promise<APIResponse> {
    return this.executeWithRetry(
      () => this.request.get(endpoint, {
        headers: this.buildHeaders(headers),
        timeout: configManager.getTimeout(),
      }),
      'GET', endpoint
    );
  }

  async post(endpoint: string, body: unknown, headers?: Record<string, string>): Promise<APIResponse> {
    return this.executeWithRetry(
      () => this.request.post(endpoint, {
        headers: this.buildHeaders(headers),
        data: body,
        timeout: configManager.getTimeout(),
      }),
      'POST', endpoint
    );
  }

  async put(endpoint: string, body: unknown, headers?: Record<string, string>): Promise<APIResponse> {
    return this.executeWithRetry(
      () => this.request.put(endpoint, {
        headers: this.buildHeaders(headers),
        data: body,
        timeout: configManager.getTimeout(),
      }),
      'PUT', endpoint
    );
  }

  async patch(endpoint: string, body: unknown, headers?: Record<string, string>): Promise<APIResponse> {
    return this.executeWithRetry(
      () => this.request.patch(endpoint, {
        headers: this.buildHeaders(headers),
        data: body,
        timeout: configManager.getTimeout(),
      }),
      'PATCH', endpoint
    );
  }

  async delete(endpoint: string, headers?: Record<string, string>): Promise<APIResponse> {
    return this.executeWithRetry(
      () => this.request.delete(endpoint, {
        headers: this.buildHeaders(headers),
        timeout: configManager.getTimeout(),
      }),
      'DELETE', endpoint
    );
  }
}
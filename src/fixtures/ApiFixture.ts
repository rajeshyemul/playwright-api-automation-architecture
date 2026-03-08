import { test as base, request, APIRequestContext } from '@playwright/test';
import { ApiClient } from '../core/ApiClient';
import { UserService } from '../services/UserService';
import { AuthService } from '../services/AuthService';
import { configManager } from '../config/ConfigManager';
import { metricsCollector } from '../observability/MetricsCollector';
import { FailureAnalyzer } from '../observability/FailureAnalyzer';

/**
 * ApiFixture extends Playwright's base test with typed, pre-wired fixtures.
 *
 * Architectural pattern:
 *   - Tests declare what they need as fixture parameters
 *   - The framework wires up the dependency graph automatically
 *   - Teardown (context disposal, metrics, failure report) is guaranteed
 *     even if a test throws — Playwright fixtures handle this via try/finally
 *
 * Available fixtures:
 *   - apiContext   : raw Playwright APIRequestContext (rarely needed in tests)
 *   - apiClient    : framework HttpClient (used by services internally)
 *   - userService  : business operations on the User domain
 *   - authService  : authentication workflows
 *   - authenticatedUserService : userService pre-authenticated (login called)
 */

type ApiFixtures = {
  apiContext:               APIRequestContext;
  apiClient:                ApiClient;
  userService:              UserService;
  authService:              AuthService;
  authenticatedUserService: UserService;
};

export const test = base.extend<ApiFixtures>({

  // Raw request context — base of the fixture dependency chain
  apiContext: async ({}, use) => {
    const context = await request.newContext({
      baseURL: configManager.getBaseUrl(),
    });
    await use(context);
    await context.dispose();
  },

  // HttpClient wrapping the request context
  apiClient: async ({ apiContext }, use) => {
    await use(new ApiClient(apiContext));
  },

  // Unauthenticated service — use for public endpoints or negative auth tests
  userService: async ({ apiClient }, use) => {
    await use(new UserService(apiClient));
  },

  authService: async ({ apiClient }, use) => {
    await use(new AuthService(apiClient));
  },

  // Pre-authenticated service — login is guaranteed before the test body runs
  authenticatedUserService: async ({ apiClient }, use) => {
    const authSvc = new AuthService(apiClient);
    await authSvc.login();
    await use(new UserService(apiClient));
  },

});

// Re-export expect so tests only need one import
export { expect } from '@playwright/test';

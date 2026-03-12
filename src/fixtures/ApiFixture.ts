import { test as base, request, APIRequestContext } from '@playwright/test';
import { ApiClient } from '../core/ApiClient';
import { UserService } from '../services/UserService';
import { AuthService } from '../services/AuthService';
import { ProductService } from '../services/ProductService';
import { configManager } from '../config/ConfigManager';
import { metricsCollector } from '../observability/MetricsCollector';
import { TestDataRegistry } from '../config/Testdataregistry';
import { TestDataCleanup } from '../config/Testdatacleanup';

/**
 * ApiFixture extends Playwright's base test with typed, pre-wired fixtures.
 *
 * Architectural pattern:
 *   - Tests declare what they need as fixture parameters
 *   - The framework wires up the dependency graph automatically
 *   - Teardown (context disposal, metrics, cleanup) is guaranteed even if a
 *     test throws — Playwright fixtures handle this via try/finally
 *
 * Available fixtures:
 *   - apiContext                 : raw Playwright APIRequestContext
 *   - apiClient                  : framework HttpClient (used by services)
 *   - authService                : authentication workflows
 *   - userService                : unauthenticated User domain operations
 *   - authenticatedUserService   : userService with login pre-called
 *   - productService             : unauthenticated Product domain operations
 *   - authenticatedProductService: productService with login pre-called
 *   - registry                   : TestDataRegistry — tracks created resources
 *                                  for automatic cleanup after the test
 */

type ApiFixtures = {
  apiContext:                   APIRequestContext;
  apiClient:                    ApiClient;
  userService:                  UserService;
  authService:                  AuthService;
  authenticatedUserService:     UserService;
  productService:               ProductService;
  authenticatedProductService:  ProductService;
  registry:                     TestDataRegistry;
  flushMetrics:                 void;
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

  // Unauthenticated product service
  productService: async ({ apiClient }, use) => {
    await use(new ProductService(apiClient));
  },

  // Pre-authenticated product service
  authenticatedProductService: async ({ apiClient }, use) => {
    const authSvc = new AuthService(apiClient);
    await authSvc.login();
    await use(new ProductService(apiClient));
  },

  /**
   * TestDataRegistry — tracks resources created during a test.
   *
   * After the test body completes (pass or fail), the fixture teardown runs
   * TestDataCleanup to delete every registered resource via the API.
   * This keeps the environment clean without requiring any cleanup code
   * inside the test itself.
   *
   * Usage:
   *   const user = await authenticatedUserService.createUser(payload);
   *   registry.track('user', user.id);
   */
  registry: async ({ apiClient }, use) => {
    const reg = new TestDataRegistry();
    await use(reg);

    // Teardown — runs after the test body, even if the test threw
    const cleanup = new TestDataCleanup(apiClient);
    await cleanup.cleanup(reg);
  },

  // Auto fixture — flushes per-worker metrics to disk after every test
  flushMetrics: [async ({}, use) => {
    await use();
    metricsCollector.flush();
  }, { auto: true }],

});

// Re-export expect so tests only need one import
export { expect } from '@playwright/test';
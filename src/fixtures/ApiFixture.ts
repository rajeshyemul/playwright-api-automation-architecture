import { test as base, request, APIRequestContext } from '@playwright/test';
import { ApiClient } from '../core/ApiClient';
import { UserService } from '../services/UserService';
import { AuthService } from '../services/AuthService';
import { configManager } from '../config/configManager';

export const test = base.extend<{
  apiContext: APIRequestContext;
  userService: UserService;
  authService: AuthService;
}>({
  apiContext: async ({}, use) => {
    const context = await request.newContext({
      baseURL: configManager.getBaseUrl(),
    });

    await use(context);
    await context.dispose();
  },

  userService: async ({ apiContext }, use) => {
    const client = new ApiClient(apiContext);
    await use(new UserService(client));
  },

  authService: async ({ apiContext }, use) => {
    const client = new ApiClient(apiContext);
    await use(new AuthService(client));
  },
});

export { expect } from '@playwright/test';
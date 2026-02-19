import { expect, APIResponse } from '@playwright/test';

export class ResponseValidator {
  static async expectStatus(response: APIResponse, expectedStatus: number) {
    expect(response.status()).toBe(expectedStatus);
  }

  static async expectJsonProperty(response: APIResponse, property: string) {
    const body = await response.json();
    expect(body).toHaveProperty(property);
  }
}
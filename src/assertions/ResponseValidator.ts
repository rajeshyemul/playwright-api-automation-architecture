import { expect, APIResponse } from '@playwright/test';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../core/Logger';

export class ResponseValidator {
  // ─── HTTP Assertions ──────────────────────────────────────────────────────

  static async expectStatus(
    response: APIResponse,
    expectedStatus: number
  ): Promise<void> {
    const actual = response.status();
    if (actual !== expectedStatus) {
      const body = await response.text().catch(() => '<unreadable>');
      logger.warn(
        `Status mismatch: expected ${expectedStatus}, got ${actual}. Body: ${body}`
      );
    }
    expect(actual).toBe(expectedStatus);
  }

  static async expectStatusIn(
    response: APIResponse,
    expectedStatuses: number[]
  ): Promise<void> {
    const actual = response.status();
    expect(expectedStatuses).toContain(actual);
  }

  static async expectSuccess(response: APIResponse): Promise<void> {
    const actual = response.status();
    expect(actual).toBeGreaterThanOrEqual(200);
    expect(actual).toBeLessThan(300);
  }

  static async expectJsonProperty(
    response: APIResponse,
    property: string
  ): Promise<void> {
    const body = await response.json();
    expect(body).toHaveProperty(property);
  }

  // ─── Schema Assertions ────────────────────────────────────────────────────

  /**
   * Validates response body against a Zod schema.
   * Returns the typed parsed data.
   * Used in SERVICE LAYER and wherever the parsed value is needed.
   * Throws a plain Error on failure (not Playwright expect).
   */
  static async validateSchema<T>(
    response: APIResponse,
    schema: ZodSchema<T>,
    label = 'Schema'
  ): Promise<T> {
    const body = await response.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const issues = formatZodError(result.error);
      throw new Error(`[${label}] Schema validation failed:\n${issues}`);
    }

    return result.data;
  }

  /**
   * Asserts response body matches a Zod schema using Playwright's expect().
   * Returns void — use validateSchema() when you need the typed data back.
   * Used in CONTRACT TESTS for assertion-only checks.
   */
  static async expectSchemaMatch<T>(
    response: APIResponse,
    schema: ZodSchema<T>,
    label = 'Schema'
  ): Promise<void> {
    const body = await response.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const issues = formatZodError(result.error);
      // Fail via Playwright assertion so it shows up in the HTML report
      expect(
        result.success,
        `[${label}] contract violation:\n${issues}`
      ).toBe(true);
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Formats a ZodError into a readable multiline string.
 *
 * FIX: Zod v4 changed ZodIssue.path from (string | number)[]
 * to PropertyKey[] (which includes `symbol`). We cast each key
 * to `string` explicitly to avoid TS2345 / assignability errors.
 */
function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path
        .map((key) => String(key))
        .join(' → ') || '(root)';
      return `  • ${path}: ${issue.message}`;
    })
    .join('\n');
}
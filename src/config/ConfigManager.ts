import * as dotenv from 'dotenv';

// Load .env at module initialization — before any other code reads process.env
dotenv.config();

export type Environment = 'dev' | 'qa' | 'stage' | 'prod';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * ConfigManager centralizes all environment-aware configuration.
 *
 * Architectural decision: all process.env access is funnelled through this
 * class. Nothing else in the framework reads process.env directly. This makes
 * configuration changes a single-file concern and enables easy mocking in tests.
 */
class ConfigManager {
  private readonly env = process.env;

  getEnvironment(): Environment {
    return (this.env.TEST_ENV as Environment) || 'dev';
  }

  getBaseUrl(): string {
    // In a real system each environment points to a different host.
    // DummyJSON is a single public API so all envs share one URL here,
    // but the pattern is deliberately preserved so teams can swap in real URLs.
    const urls: Record<Environment, string> = {
      dev:   'https://dummyjson.com',
      qa:    'https://dummyjson.com',
      stage: 'https://dummyjson.com',
      prod:  'https://dummyjson.com',
    };
    return urls[this.getEnvironment()];
  }

  getTimeout(): number {
    return Number(this.env.API_TIMEOUT) || 30_000;
  }

  getLogLevel(): LogLevel {
    return (this.env.LOG_LEVEL as LogLevel) || 'info';
  }

  isDebug(): boolean {
    return this.env.DEBUG === 'true';
  }

  isCI(): boolean {
    return this.env.CI === 'true';
  }

  getRetryCount(): number {
    return this.isCI() ? 2 : 0;
  }

  getUsername(): string {
    return this.env.TEST_USERNAME || 'kminchelle';
  }

  getPassword(): string {
    return this.env.TEST_PASSWORD || '0lelplR';
  }
}

// Singleton — one config instance for the entire framework
export const configManager = new ConfigManager();

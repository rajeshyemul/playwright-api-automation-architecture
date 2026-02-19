export type Environment = 'dev' | 'qa' | 'stage' | 'prod';

class ConfigManager {
  private readonly env = process.env;

  getEnvironment(): Environment {
    return (this.env.TEST_ENV as Environment) || 'dev';
  }

getBaseUrl(): string {
  const urls: Record<Environment, string> = {
    dev: 'https://dummyjson.com',
    qa: 'https://dummyjson.com',
    stage: 'https://dummyjson.com',
    prod: 'https://dummyjson.com'
  };

  return urls[this.getEnvironment()];
}

  getTimeout(): number {
    return Number(this.env.API_TIMEOUT) || 30000;
  }

  isCI(): boolean {
    return this.env.CI === 'true';
  }
}

export const configManager = new ConfigManager();
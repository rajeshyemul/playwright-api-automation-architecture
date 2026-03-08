import { configManager, LogLevel } from '../config/ConfigManager';

/**
 * Logger provides structured, timestamped logging across the framework.
 *
 * Log levels follow standard severity ordering: debug < info < warn < error.
 * The active level is controlled by the LOG_LEVEL environment variable, which
 * allows verbose output in local development and clean output in CI.
 */

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info:  1,
  warn:  2,
  error: 3,
};

class Logger {
  private activeLevel: LogLevel;

  constructor() {
    this.activeLevel = configManager.getLogLevel();
  }

  private timestamp(): string {
    return new Date().toISOString().replace('T', ' ').replace('Z', '');
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[this.activeLevel];
  }

  private format(entry: LogEntry): string {
    const base = `[${this.timestamp()}] [${entry.level.toUpperCase().padEnd(5)}] ${entry.message}`;
    if (entry.context && Object.keys(entry.context).length > 0) {
      return `${base} ${JSON.stringify(entry.context)}`;
    }
    return base;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      console.debug(this.format({ level: 'debug', message, context }));
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      console.info(this.format({ level: 'info', message, context }));
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      console.warn(this.format({ level: 'warn', message, context }));
    }
  }

  error(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      console.error(this.format({ level: 'error', message, context }));
    }
  }
}

export const logger = new Logger();

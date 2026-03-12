import { metricsCollector, MetricsCollector } from '../observability/MetricsCollector';
import { logger } from '../core/Logger';

/**
 * Global setup — runs once before the entire test suite.
 *
 * Responsibilities:
 *   - Delete the cross-process metrics buffer file so stale data from a
 *     previous run is never carried forward
 *   - Reset the in-memory singleton (safety net for same-process scenarios)
 *   - Log a clear run-start marker for easier log parsing in CI
 */
export default async function globalSetup(): Promise<void> {
  MetricsCollector.clearBuffer();   // wipe the on-disk NDJSON buffer
  metricsCollector.reset();         // wipe the in-memory singleton
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('Global Setup — test run started');
  logger.info('MetricsCollector buffer cleared — ready to record API calls');
  logger.info('═══════════════════════════════════════════════════════════');
}
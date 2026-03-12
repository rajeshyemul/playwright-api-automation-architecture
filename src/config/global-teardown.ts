import { MetricsCollector } from '../observability/MetricsCollector';
import { FailureAnalyzer } from '../observability/FailureAnalyzer';
import { logger } from '../core/Logger';

/**
 * Global teardown — runs once after the entire test suite completes.
 *
 * Responsibilities:
 *   - Load all metrics flushed to disk by the test workers (cross-process)
 *   - Print the API metrics summary (throughput, latency, success rates)
 *   - Print the failure analysis report (categorized diagnostics + suggestions)
 *
 * Why loadFromDisk()?
 *   Playwright runs global teardown in a separate Node.js process from the
 *   workers. The in-memory MetricsCollector singleton is always empty here.
 *   Workers call metricsCollector.flush() after each test to write metrics to
 *   reports/.metrics-buffer.ndjson, which this teardown reads back.
 */
export default async function globalTeardown(): Promise<void> {
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('Global Teardown — test run complete');
  logger.info('═══════════════════════════════════════════════════════════');

  // Reconstruct the full metrics picture from the on-disk buffer
  const collector = MetricsCollector.loadFromDisk();

  // 1. Print per-endpoint metrics (calls, success rate, latency percentiles)
  collector.printSummary();

  // 2. Print failure diagnostics using the loaded collector
  FailureAnalyzer.printReport(collector);

  logger.info('═══════════════════════════════════════════════════════════');
}
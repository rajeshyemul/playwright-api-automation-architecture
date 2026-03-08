import { logger } from '../core/Logger';

/**
 * MetricsCollector instruments every HTTP call made through the framework.
 *
 * Architectural note: observability is not a test-level concern — it belongs
 * in the infrastructure layer. By collecting metrics inside ApiClient, every
 * service and test automatically gains visibility without any additional code.
 *
 * At suite completion, printSummary() can be called from a global teardown
 * to surface endpoint-level health metrics: throughput, latency, failure rates.
 */

export interface RequestMetric {
  method:     string;
  endpoint:   string;
  statusCode: number;
  durationMs: number;
  success:    boolean;
  timestamp:  string;
  retries:    number;
}

export interface EndpointSummary {
  endpoint:    string;
  totalCalls:  number;
  successRate: string;
  avgMs:       number;
  p95Ms:       number;
  minMs:       number;
  maxMs:       number;
  failCount:   number;
}

class MetricsCollector {
  private metrics: RequestMetric[] = [];

  record(metric: RequestMetric): void {
    this.metrics.push(metric);
    logger.debug('Metric recorded', {
      method:     metric.method,
      endpoint:   metric.endpoint,
      status:     metric.statusCode,
      durationMs: metric.durationMs,
    });
  }

  getAll(): RequestMetric[] {
    return [...this.metrics];
  }

  getSummary(): EndpointSummary[] {
    const grouped = this.groupByEndpoint();

    return Object.entries(grouped).map(([endpoint, calls]) => {
      const durations = calls.map(c => c.durationMs).sort((a, b) => a - b);
      const failCount = calls.filter(c => !c.success).length;

      return {
        endpoint,
        totalCalls:  calls.length,
        successRate: `${(((calls.length - failCount) / calls.length) * 100).toFixed(1)}%`,
        avgMs:       Math.round(durations.reduce((s, d) => s + d, 0) / durations.length),
        p95Ms:       this.percentile(durations, 95),
        minMs:       durations[0],
        maxMs:       durations[durations.length - 1],
        failCount,
      };
    });
  }

  printSummary(): void {
    const summary = this.getSummary();

    if (summary.length === 0) {
      logger.info('No API calls recorded in this run.');
      return;
    }

    logger.info('─────────────────────────────────────────────────────────');
    logger.info('API Execution Metrics Summary');
    logger.info('─────────────────────────────────────────────────────────');

    summary.forEach(s => {
      logger.info(`${s.endpoint}`, {
        calls:       s.totalCalls,
        successRate: s.successRate,
        avgMs:       s.avgMs,
        p95Ms:       s.p95Ms,
        failures:    s.failCount,
      });
    });

    logger.info('─────────────────────────────────────────────────────────');
  }

  reset(): void {
    this.metrics = [];
  }

  private groupByEndpoint(): Record<string, RequestMetric[]> {
    return this.metrics.reduce<Record<string, RequestMetric[]>>((acc, m) => {
      const key = `${m.method} ${m.endpoint}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    }, {});
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
  }
}

// Singleton — shared across all workers in a test run
export const metricsCollector = new MetricsCollector();

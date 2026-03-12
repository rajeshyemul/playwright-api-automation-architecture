import { ApiClient } from '../core/ApiClient';
import { TestDataRegistry } from './Testdataregistry';
import { logger } from '../core/Logger';

/**
 * TestDataCleanup executes the actual API deletes for resources tracked by
 * TestDataRegistry. It is intentionally separate from the registry so the
 * registry remains a pure data structure with no HTTP dependencies.
 *
 * Architectural note:
 *   Cleanup runs in LIFO order (last created, first deleted). This matters
 *   when resources have dependencies, for example, if a comment belongs to
 *   a post, the comment must be deleted before the post. Registering in
 *   creation order and reversing at cleanup handles this automatically.
 *
 * Error handling:
 *   Cleanup failures are logged as warnings but never rethrown. A teardown
 *   error should never hide the original test failure. In CI, cleanup
 *   failures can be triaged separately from functional failures.
 */
export class TestDataCleanup {
  constructor(private readonly api: ApiClient) {}

  /**
   * Delete all resources tracked in the registry.
   * Runs LIFO: last registered resource is deleted first.
   *
   * @param registry - the TestDataRegistry populated during the test
   */
  async cleanup(registry: TestDataRegistry): Promise<void> {
    const resources = registry.getAll().reverse(); // LIFO order

    if (resources.length === 0) return;

    logger.debug(`TestDataCleanup: cleaning up ${resources.length} resource(s)`);

    for (const resource of resources) {
      try {
        await this.deleteResource(resource.domain, resource.id);
        logger.debug(`TestDataCleanup: deleted ${resource.domain} id=${resource.id}`);
      } catch (err) {
        // Log but never rethrow, teardown failures must not mask test failures
        logger.warn(`TestDataCleanup: failed to delete ${resource.domain} id=${resource.id}`, { err });
      }
    }

    registry.clear();
  }

  /**
   * Dispatch delete to the correct API endpoint by domain.
   *
   * Adding a new domain: add a case here and in ResourceDomain in TestDataRegistry.
   */
  private async deleteResource(domain: string, id: number): Promise<void> {
    switch (domain) {
      case 'user':
        await this.api.delete(`/users/${id}`);
        break;
      case 'product':
        await this.api.delete(`/products/${id}`);
        break;
      default:
        logger.warn(`TestDataCleanup: unknown domain "${domain}" — skipping id=${id}`);
    }
  }
}
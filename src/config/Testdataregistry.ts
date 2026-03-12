/**
 * TestDataRegistry tracks resources created during a single test so they can
 * be deleted in teardown, leaving the environment clean for the next test.
 *
 * Architectural pattern:
 *   - One registry instance is created per test via the fixture layer
 *   - Tests call registry.track() immediately after creating a resource
 *   - The teardown fixture calls registry.cleanup() which issues API deletes
 *   - If a delete fails, it is logged but does not fail the test, teardown
 *     failures should never mask real test failures
 *
 * Why a registry instead of test-level afterEach?
 *   - Keeps cleanup logic out of test files, tests stay focused on behavior
 *   - Works correctly under parallel execution (each worker has its own instance)
 *   - Centralizes the cleanup strategy so adding a new domain means adding one
 *     entry here, not touching every test file
 *
 * Usage in a test:
 *   test('creates a user', async ({ authenticatedUserService, registry }) => {
 *     const user = await authenticatedUserService.createUser(payload);
 *     registry.track('user', user.id);   // ← register for cleanup
 *     expect(user.id).toBeGreaterThan(0);
 *   });
 *
 * Note on DummyJSON:
 *   DummyJSON is a mock API: it does not persist created resources, so
 *   cleanup deletes are essentially no-ops. In a real project backed by a
 *   real database, these deletes would actually remove the rows, keeping the
 *   environment clean between runs.
 */

export type ResourceDomain = 'user' | 'product';

interface TrackedResource {
  domain: ResourceDomain;
  id:     number;
}

export class TestDataRegistry {
  private resources: TrackedResource[] = [];

  /**
   * Register a created resource for cleanup after the test.
   *
   * @param domain  - the API domain ('user' | 'product')
   * @param id      - the resource ID returned by the API
   *
   * @example
   * const user = await userService.createUser(payload);
   * registry.track('user', user.id);
   */
  track(domain: ResourceDomain, id: number): void {
    this.resources.push({ domain, id });
  }

  /**
   * Returns all tracked resources for a given domain.
   * Useful for assertions before cleanup.
   */
  getTracked(domain: ResourceDomain): number[] {
    return this.resources
      .filter(r => r.domain === domain)
      .map(r => r.id);
  }

  /**
   * Returns the full list of tracked resources in the order they were registered.
   */
  getAll(): TrackedResource[] {
    return [...this.resources];
  }

  /**
   * Clears the registry without issuing any API calls.
   * The fixture calls this after cleanup is complete.
   */
  clear(): void {
    this.resources = [];
  }
}
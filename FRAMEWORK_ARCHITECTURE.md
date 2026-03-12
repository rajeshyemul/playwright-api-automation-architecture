# API Automation Framework — Complete Architecture Guide

**Stack:** Playwright · TypeScript · Zod · Faker  
**Target API:** [DummyJSON](https://dummyjson.com) (public mock REST API)  
**Author:** Rajesh Yemul — Technical Director, Quality Engineering

---

## Table of Contents

1. [What This Framework Is and Why It Exists](#1-what-this-framework-is-and-why-it-exists)
2. [Technology Choices Explained](#2-technology-choices-explained)
3. [Project Structure — Every File and Folder](#3-project-structure--every-file-and-folder)
4. [Layer-by-Layer Architecture](#4-layer-by-layer-architecture)
   - [Layer 1 — Configuration](#layer-1--configuration-srcconfigconfigmanagerts)
   - [Layer 2 — Core Infrastructure](#layer-2--core-infrastructure-srccore)
   - [Layer 3 — Contracts and Models](#layer-3--contracts-and-models-srccontracts--srcmodels)
   - [Layer 4 — Assertions](#layer-4--assertions-srcassertions)
   - [Layer 5 — Services](#layer-5--services-srcservices)
   - [Layer 6 — Test Data](#layer-6--test-data-srctest-data)
   - [Layer 7 — Observability](#layer-7--observability-srcobservability)
   - [Layer 8 — Fixtures](#layer-8--fixtures-srcfixtures)
   - [Layer 9 — Tests](#layer-9--tests-tests)
   - [Layer 10 — Global Lifecycle](#layer-10--global-lifecycle)
5. [How Everything Connects — The Dependency Graph](#5-how-everything-connects--the-dependency-graph)
6. [End-to-End Flow: A Test Running From Start to Finish](#6-end-to-end-flow-a-test-running-from-start-to-finish)
7. [Authentication Flow in Detail](#7-authentication-flow-in-detail)
8. [Observability — How Metrics Flow Across Processes](#8-observability--how-metrics-flow-across-processes)
9. [Test Data Teardown — How Cleanup Works](#9-test-data-teardown--how-cleanup-works)
10. [Playwright Configuration and Projects](#10-playwright-configuration-and-projects)
11. [Environment Configuration](#11-environment-configuration)
12. [How to Add a New Domain (Step-by-Step)](#12-how-to-add-a-new-domain-step-by-step)
13. [Design Principles and Decisions](#13-design-principles-and-decisions)
14. [Common Pitfalls and How This Framework Avoids Them](#14-common-pitfalls-and-how-this-framework-avoids-them)

---

## 1. What This Framework Is and Why It Exists

This is an **enterprise-grade API test automation framework** built as a boilerplate reference. The goal is that any team picking this up can extend it to test their own APIs by following the existing patterns, without having to make architectural decisions from scratch.

### What problems does it solve?

Most API test frameworks start as a collection of test files that grow organically. Over time they suffer from:

- **No layer separation** — HTTP calls, assertions, and test logic mixed in the same file
- **No type safety** — tests use `any` everywhere, bugs caught at runtime not compile time
- **No contract validation** — response shapes change silently and tests still pass
- **No test data strategy** — tests share data, collide under parallel execution, and leave junk in the environment
- **No observability** — tests fail but you don't know which endpoint is slow or frequently failing
- **No teardown** — created resources accumulate in the test environment

This framework solves all of these with a clearly defined layered architecture where each layer has exactly one responsibility.

---

## 2. Technology Choices Explained

### Playwright (`@playwright/test`)
Most people know Playwright for browser automation, but it also ships a first-class **API testing client** (`APIRequestContext`). The reason to use Playwright for API testing rather than a dedicated HTTP client like Axios is:

- Built-in test runner with parallel execution, retries, and reporting
- Fixtures system (explained in detail later) — the most powerful dependency injection mechanism available in JS test tooling
- Global setup and teardown hooks with process isolation
- HTML report generation out of the box

### TypeScript
Every file in this project is TypeScript. The benefit is not just IDE autocomplete — it is that **type errors become compile errors**. If a test calls `userService.createUser()` with the wrong payload shape, `tsc` will tell you before you ever run the test.

### Zod
Zod is a schema validation library. The key insight is that TypeScript types exist only at **compile time** — they are erased when the code runs. An API returning `{ name: null }` when TypeScript expects `{ name: string }` will compile fine but break at runtime.

Zod validates the **actual JSON response at runtime** and throws a detailed error listing exactly which field failed and why. This is what makes contract testing possible.

Types are derived from Zod schemas using `z.infer<typeof Schema>`, meaning the compile-time type and the runtime validation are always in sync — they cannot drift because they come from the same source.

### Faker (`@faker-js/faker`)
Generates realistic, unique test data (names, emails, prices) per test invocation. This prevents test data collisions when running in parallel and makes tests independent of the environment.

---

## 3. Project Structure — Every File and Folder

```
api-framework-architect-pw-ts/
│
├── src/                          # All framework source code
│   ├── config/
│   │   └── ConfigManager.ts      # Single source of all env configuration
│   │
│   ├── core/                     # Infrastructure — nothing domain-specific here
│   │   ├── ApiClient.ts          # The only HTTP client in the framework
│   │   ├── AuthManager.ts        # Token lifecycle (login, cache, expiry, refresh)
│   │   └── Logger.ts             # Structured timestamped logging
│   │
│   ├── contracts/                # Zod schemas — runtime shape validation
│   │   ├── AuthContract.ts       # Login request/response schemas
│   │   ├── UserContract.ts       # Full user shape + CRUD schemas
│   │   ├── ProductContract.ts    # Full product shape + CRUD schemas
│   │   └── index.ts              # Barrel export (import from one place)
│   │
│   ├── models/                   # TypeScript types re-exported from contracts
│   │   ├── AuthModels.ts
│   │   ├── UserModels.ts
│   │   └── ProductModels.ts
│   │
│   ├── assertions/               # Response validation helpers
│   │   ├── ResponseValidator.ts  # HTTP status + Zod schema assertions
│   │   └── ContractValidator.ts  # Low-level Zod wrapper
│   │
│   ├── services/                 # Business operations per domain
│   │   ├── AuthService.ts        # login, logout, getAuthenticatedUser
│   │   ├── UserService.ts        # getUsers, getUserById, createUser, etc.
│   │   └── ProductService.ts     # getProducts, getProductById, createProduct, etc.
│   │
│   ├── test-data/                # Factories + teardown infrastructure
│   │   ├── AuthFactory.ts        # Credential payload generators
│   │   ├── UserFactory.ts        # User payload generators
│   │   ├── ProductFactory.ts     # Product payload generators
│   │   ├── TestDataRegistry.ts   # Per-test resource tracker
│   │   └── TestDataCleanup.ts    # Issues API deletes for tracked resources
│   │
│   ├── observability/            # Metrics and failure analysis
│   │   ├── MetricsCollector.ts   # Records every HTTP call + disk persistence
│   │   └── FailureAnalyzer.ts    # Categorises failures with actionable suggestions
│   │
│   ├── fixtures/
│   │   └── ApiFixture.ts         # Playwright fixture wiring (DI container)
│   │
│   ├── global-setup.ts           # Runs once before all tests
│   └── global-teardown.ts        # Runs once after all tests
│
├── tests/                        # Test suites — organised by test type
│   ├── smoke/                    # Is the service alive?
│   │   ├── auth.smoke.spec.ts
│   │   ├── users.smoke.spec.ts
│   │   └── products.smoke.spec.ts
│   │
│   ├── integration/              # Does each workflow behave correctly?
│   │   ├── auth-flow.spec.ts
│   │   ├── user-crud.spec.ts
│   │   └── product-crud.spec.ts
│   │
│   ├── contract/                 # Has the API response shape changed?
│   │   ├── auth.contract.spec.ts
│   │   ├── user.contract.spec.ts
│   │   └── product.contract.spec.ts
│   │
│   └── user/
│       └── getUsers.spec.ts      # Standalone example tests
│
├── architecture/                 # Architecture decision records (ADRs)
│   ├── api-testing-strategy.md
│   ├── framework-architecture.md
│   ├── service-layer-pattern.md
│   ├── contract-validation.md
│   └── test-data-strategy.md
│
├── reports/                      # Generated test output
│   ├── results.json              # Machine-readable results
│   └── .metrics-buffer.ndjson   # Cross-process metrics buffer (auto-generated)
│
├── playwright-report/            # HTML report (open with: npx playwright show-report)
├── playwright.config.ts          # Playwright configuration and project definitions
├── package.json
├── tsconfig.json
└── .env                          # Local environment variables (not committed)
```

---

## 4. Layer-by-Layer Architecture

The framework is built in layers. Each layer only depends on layers below it. Tests sit at the top and know nothing about HTTP. HTTP lives at the bottom and knows nothing about tests.

```
┌─────────────────────────────────────────────┐
│                   TESTS                     │  ← Declare intent, assert outcomes
├─────────────────────────────────────────────┤
│                 FIXTURES                    │  ← Dependency injection wiring
├─────────────────────────────────────────────┤
│      SERVICES        │     TEST DATA        │  ← Business operations
├─────────────────────────────────────────────┤
│   ASSERTIONS         │   OBSERVABILITY      │  ← Cross-cutting concerns
├─────────────────────────────────────────────┤
│   CONTRACTS / MODELS                        │  ← Schema definitions + types
├─────────────────────────────────────────────┤
│     CORE (ApiClient, AuthManager, Logger)   │  ← HTTP, Auth, Logging
├─────────────────────────────────────────────┤
│              CONFIGURATION                  │  ← Environment, credentials, URLs
└─────────────────────────────────────────────┘
```

---

### Layer 1 — Configuration (`src/config/ConfigManager.ts`)

**Responsibility:** Be the single place in the entire codebase that reads `process.env`.

Nothing else in the framework reads environment variables directly. Every piece of configuration — base URL, timeout, credentials, log level, retry count — flows through `ConfigManager`.

```typescript
// Everywhere else in the framework uses this pattern:
configManager.getBaseUrl()     // never: process.env.API_URL
configManager.getUsername()    // never: process.env.TEST_USERNAME
configManager.getTimeout()     // never: Number(process.env.API_TIMEOUT)
```

**Why this matters:** If you need to change how a config value is resolved (say, fetching from a secrets manager instead of `.env`), you change one file. Nothing else in the codebase needs to change.

**Environment support:** The framework recognises four environments — `dev`, `qa`, `stage`, `prod` — selected via `TEST_ENV`. In production systems each would have a different `baseUrl`. DummyJSON is a single public API so all four point to the same host, but the pattern is preserved so teams can swap in real URLs.

**Available `.env` variables:**

| Variable | Default | Purpose |
|---|---|---|
| `TEST_ENV` | `dev` | Which environment to target |
| `TEST_USERNAME` | `kminchelle` | Login username |
| `TEST_PASSWORD` | `0lelplR` | Login password |
| `API_TIMEOUT` | `30000` | Request timeout in ms |
| `LOG_LEVEL` | `info` | Logging verbosity (debug/info/warn/error) |
| `DEBUG` | `false` | Log full response bodies |
| `CI` | `false` | Enables higher retry count |

---

### Layer 2 — Core Infrastructure (`src/core/`)

This layer contains three classes that form the backbone of the framework. None of them are domain-specific — they know nothing about users, products, or auth. They are pure infrastructure.

#### `ApiClient.ts`

The **only** class in the framework that makes HTTP calls. All services call `ApiClient`. Tests never call it directly (except in contract tests where raw response access is needed for schema assertion).

**What it does on every request:**
1. Reads the current access token from `AuthManager` and injects it as `Authorization: Bearer <token>` header
2. Sets the `Content-Type: application/json` header
3. Applies the configured timeout from `ConfigManager`
4. Executes the request
5. Records a metric to `MetricsCollector` (method, endpoint, status, duration, retries)
6. Logs the result via `Logger`
7. If the response is a 5xx error and retries remain, waits and retries
8. If it is a network error, records `statusCode: 0` with the error message and retries

```typescript
// Services call ApiClient like this:
const response = await this.api.get(`/users/${userId}`);
const response = await this.api.post('/users/add', payload);
const response = await this.api.put(`/users/${userId}`, payload);
const response = await this.api.patch(`/users/${userId}`, payload);
const response = await this.api.delete(`/users/${userId}`);
```

**Retry logic:** `getRetryCount()` returns `0` locally and `2` in CI (when `CI=true`). Only 5xx responses and network errors are retried. 4xx responses are not retried because they indicate a client-side problem (wrong data, missing auth) that won't be fixed by retrying.

**Key design decision:** `ApiClient` returns a raw `APIResponse` — it never parses or validates the body. That is the job of `ResponseValidator` in the assertions layer. This separation means `ApiClient` remains dumb and reusable.

#### `AuthManager.ts`

Manages the complete token lifecycle. It is a **singleton** — one instance is shared across the entire test run.

**Token caching:** After a successful login, the access token is stored in memory. Subsequent calls to `login()` return the cached token without making another HTTP request. This avoids the pattern where every fixture setup re-authenticates unnecessarily.

**Token expiry:** DummyJSON returns `expiresInMins` in the login response. `AuthManager` calculates the expiry timestamp and subtracts a 60-second safety buffer. Before returning a cached token it checks if it is expired. If expired, it re-authenticates automatically.

```typescript
// The singleton is exported and used by ApiClient:
const token = authManager.getAccessToken();
// And by AuthService for login/logout:
await authManager.login(apiClient, expiresInMins);
authManager.clearTokens();
```

**Why a singleton?** Because in a parallel test run with 2 workers, both workers need to share the cached token. If each worker had its own `AuthManager` instance, every test would login independently, hammering the auth endpoint and potentially hitting rate limits. The singleton means the first worker to login caches the token, and the second worker reuses it.

#### `Logger.ts`

Structured, timestamped logging with level filtering.

```
[2026-03-12 06:07:22.253] [INFO ] POST /auth/login {"status":200,"durationMs":630}
[2026-03-12 06:07:22.253] [WARN ] FailureAnalyzer: 3 failure pattern(s) detected
```

Log levels follow the standard severity order: `debug < info < warn < error`. The `LOG_LEVEL` environment variable controls which levels are printed. In CI you would typically set this to `warn` to keep output clean. Locally you might set `DEBUG=true` to also see full response bodies.

---

### Layer 3 — Contracts and Models (`src/contracts/` + `src/models/`)

#### Contracts

This is where Zod schemas live. A schema is the authoritative description of what an API response **must** look like. If the API returns something different, the test fails with a precise description of exactly what is wrong.

**Example from `UserContract.ts`:**

```typescript
export const UserSchema = z.object({
  id:        z.number(),
  firstName: z.string(),
  lastName:  z.string(),
  email:     z.string(),
  gender:    z.string(),
  // ... 25+ more fields
  role:      z.enum(['admin', 'moderator', 'user']).nullable().optional(),
});
```

If the API changes `role` to `userRole`, every test that parses a user will immediately fail with:

```
Schema validation failed:
  • role: Required
```

Without Zod, the test might continue, access `user.role`, get `undefined`, and fail with a cryptic `TypeError: Cannot read properties of undefined` somewhere deep in the assertion. With Zod, the failure is immediate and described at the exact field level.

**TypeScript types are derived from schemas, never written manually:**

```typescript
// The type and the runtime schema are always in sync
export type User = z.infer<typeof UserSchema>;
```

This is the core principle of this layer — **write the schema once, get both runtime validation and compile-time types for free**.

**`nullable()` vs `optional()`:**
- `nullable()` — the field is present but can be `null` (e.g., `"image": null`)
- `optional()` — the field may be absent from the response entirely
- Fields on DummyJSON created resources often need both because POST responses omit fields not sent in the request

**Contracts `index.ts` barrel:**

```typescript
// Everything exported from one place — tests import from here
export * from './UserContract';
export * from './AuthContract';
export * from './ProductContract';
```

#### Models

The `models/` folder re-exports the types from `contracts/`. This is a deliberate architectural boundary:

```typescript
// src/models/UserModels.ts
export type { User, UsersList, CreateUserRequest } from '../contracts/UserContract';
```

Services and tests import types from `models`, not from `contracts`. This means if you ever replace Zod with a different validation library (say, Valibot), you update `contracts/` and `models/` — nothing else in the codebase needs to change because the types at the `models/` boundary remain the same.

---

### Layer 4 — Assertions (`src/assertions/`)

#### `ResponseValidator.ts`

The bridge between raw `APIResponse` objects from Playwright and typed, validated domain objects. Every method here is `static` — it is a stateless utility class.

**Three categories of methods:**

**1. Status assertions** — verify HTTP status code, fail with the response body included for easy debugging:

```typescript
// Used when you need to assert a specific status
await ResponseValidator.expectStatus(response, 201);

// Used to assert any 2xx
await ResponseValidator.expectSuccess(response);
```

**2. `validateSchema<T>()` — for service layer use:**

```typescript
// Returns typed, validated data — callers get a fully typed object back
const user: User = await ResponseValidator.validateSchema(
  response, UserSchema, 'getUserById'
);
// user.id, user.email, user.firstName — all typed, all validated
```

Throws a plain `Error` (not a Playwright assertion) if validation fails. Used inside services where the caller needs the typed data back.

**3. `expectSchemaMatch()` — for contract test use:**

```typescript
// Assertion only — no return value
// Fails via Playwright expect() so it appears in the HTML report
await ResponseValidator.expectSchemaMatch(response, UserSchema, 'contract:GET /users/:id');
```

Used in contract tests where you only need to verify the shape matches and do not need to do anything with the parsed data.

**Schema violations are recorded as metrics:**

Both schema methods call `metricsCollector.record({ ..., schemaViolation: true })` before throwing/failing. This makes `SCHEMA_VIOLATION` errors visible in the post-run `FailureAnalyzer` report. Because `APIResponse` does not expose the originating request, the HTTP method is extracted from the `label` parameter using a regex — this is why labels like `'contract:POST /auth/login'` include the method.

---

### Layer 5 — Services (`src/services/`)

Services are the **public API of the framework**. Tests interact with services. Services interact with `ApiClient` and `ResponseValidator`. Tests never reach past services.

Each service maps to a domain in the target API. Every method:
1. Accepts typed input (enforced by TypeScript)
2. Calls `ApiClient` to execute the HTTP request
3. Asserts the expected status code via `ResponseValidator.expectStatus()`
4. Validates and parses the response body via `ResponseValidator.validateSchema()`
5. Returns a fully typed domain object

**Example — `UserService.createUser()`:**

```typescript
async createUser(payload: CreateUserRequest): Promise<User> {
  // Validate input before sending — catch bad test data early
  CreateUserSchema.parse(payload);

  const response = await this.api.post('/users/add', payload);

  // Assert expected status
  ResponseValidator.expectStatus(response, 201);

  // Parse, validate, and return typed object
  return ResponseValidator.validateSchema(response, UserSchema, 'createUser');
}
```

**What a test sees:**

```typescript
const user: User = await userService.createUser({
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@example.com',
});
// user is fully typed — user.id, user.firstName, user.email all known at compile time
```

The test never sees an HTTP response. It never sees `await response.json()`. It receives a clean typed object. This is the entire point of the service layer.

**`ProductService` has one extra method — `getProductsByCategory()`:**

DummyJSON exposes `/products/category/:name` as a distinct endpoint. This is a domain-specific capability so it lives in `ProductService` rather than being expressed as a query parameter on `getProducts()`.

---

### Layer 6 — Test Data (`src/test-data/`)

#### Factories

Factories generate realistic, unique test data per invocation. They use Faker to produce random-but-valid values.

**`UserFactory`:**

```typescript
// Generate a random valid user
const user = UserFactory.create();
// { firstName: 'Brenda', lastName: 'Okonkwo', email: 'brenda.ok@gmail.com', age: 34 }

// Override specific fields, let factory fill the rest
const admin = UserFactory.create({ email: 'admin@mycompany.com' });

// Generate multiple unique users at once
const [user1, user2] = UserFactory.createBulk(2);
// user1.email !== user2.email — guaranteed unique

// Invalid data for negative testing
const bad = UserFactory.createInvalid();
// { firstName: '', lastName: null, email: 'not-an-email', age: -5 }
```

**`ProductFactory`** includes a typed `CATEGORIES` constant listing all 24 valid DummyJSON product categories, enabling category-specific product generation:

```typescript
const phone = ProductFactory.createInCategory('smartphones');
const expensive = ProductFactory.createWithPrice(999.99);
```

**`AuthFactory`** reads credentials from `ConfigManager` — credentials are never hard-coded in factories or tests:

```typescript
// Reads TEST_USERNAME and TEST_PASSWORD from .env
const creds = AuthFactory.validCredentials();

// For negative tests
const wrong = AuthFactory.wrongPassword();
const invalid = AuthFactory.invalidCredentials();
```

#### `TestDataRegistry.ts`

A per-test resource tracker. When a test creates a resource (user, product), it registers the returned ID with the registry. After the test completes — whether it passes or fails — the fixture layer reads the registry and deletes every registered resource.

```typescript
// Inside a test
const user = await userService.createUser(payload);
registry.track('user', user.id);  // ← register for cleanup

// After test completes, the fixture calls:
await cleanup.cleanup(registry);
// → DELETE /users/{id}  is called automatically
```

**Key design decisions:**
- Registry is a plain data structure — no HTTP, no dependencies
- One instance per test — no sharing between parallel tests
- `track()` is called immediately after creation, before any assertion that could throw
- The registry is passed in via fixture, so tests do not instantiate it

#### `TestDataCleanup.ts`

Knows how to delete each domain's resources. Completely separate from the registry so the registry stays a pure data structure.

**LIFO order:** Resources are deleted in reverse registration order — last created, first deleted. This handles dependencies automatically. If a test creates a user then an order belonging to that user, reversing means the order is deleted before the user.

**Error isolation:** Each delete is individually try/caught. A delete failure logs a warning but never throws. This ensures a cleanup problem does not cause the test to fail with a teardown error — the original test result is preserved.

```typescript
private async deleteResource(domain: string, id: number): Promise<void> {
  switch (domain) {
    case 'user':    await this.api.delete(`/users/${id}`);    break;
    case 'product': await this.api.delete(`/products/${id}`); break;
    // Add new domains here
  }
}
```

---

### Layer 7 — Observability (`src/observability/`)

#### `MetricsCollector.ts`

Records a `RequestMetric` for every HTTP call made through `ApiClient`. Metrics include method, endpoint, status code, duration in milliseconds, retry count, and timestamp.

**Cross-process persistence challenge:**

Playwright runs `globalTeardown` in a **separate Node.js process** from the worker processes that run tests. This means the in-memory singleton in teardown is always empty — it never saw the requests workers made.

The solution is a file-based buffer:

```
Worker process                  Teardown process
─────────────────               ─────────────────
Tests run                       
↓                               
metricsCollector.record()       
↓ (in-memory)                   
flushMetrics fixture runs       
↓                               
metricsCollector.flush()        
↓                               
reports/.metrics-buffer.ndjson  ←── MetricsCollector.loadFromDisk()
                                         ↓
                                    collector.printSummary()
                                    FailureAnalyzer.printReport()
```

**NDJSON format** (newline-delimited JSON) is used for the buffer because multiple workers can append to it concurrently. Each line is a self-contained JSON object, so partial writes from concurrent workers do not corrupt the file.

**`flush()` is called by the `flushMetrics` auto fixture** in `ApiFixture.ts` — the `auto: true` option means it runs after every test without needing to be declared in the test. This is invisible to test authors.

**Summary output example:**
```
POST /auth/login  calls:24  successRate:83.3%  avgMs:502  p95Ms:903  failures:4
GET /users/1      calls:6   successRate:100.0% avgMs:323  p95Ms:474  failures:0
GET /products/1   calls:6   successRate:100.0% avgMs:114  p95Ms:194  failures:0
```

#### `FailureAnalyzer.ts`

Reads all failed metrics and categorises them into actionable failure types.

| Category | Condition | Suggestion |
|---|---|---|
| `AUTH_FAILURE` | 401 or 403 | Check token expiry, verify login was called |
| `NOT_FOUND` | 404 | Verify resource ID/path is valid |
| `SERVER_ERROR` | 5xx | Server-side fault, may be transient |
| `CLIENT_ERROR` | 4xx (not 401/403/404) | Inspect request payload |
| `SCHEMA_VIOLATION` | `schemaViolation: true` flag | Response shape changed, check Zod contract |
| `TIMEOUT` | statusCode 0 + error message contains "timeout" | Increase `API_TIMEOUT` |
| `NETWORK_ERROR` | statusCode 0 (other) | Check baseURL and connectivity |

**Important note:** `CLIENT_ERROR` on `POST /auth/login` is expected and intentional — it comes from the negative auth tests that deliberately submit wrong credentials. This is not a framework bug; it is the framework correctly recording intentional failure scenarios.

---

### Layer 8 — Fixtures (`src/fixtures/ApiFixture.ts`)

This is the **dependency injection container** of the framework. It uses Playwright's `test.extend()` API to declare named fixtures — objects that are automatically created before a test and cleaned up after it.

A fixture works like this: the test declares what it needs in its parameter list. Playwright creates the fixture, passes it to the test, runs the test, then runs the code after `await use()` for teardown.

```typescript
// The fixture definition
apiClient: async ({ apiContext }, use) => {
  await use(new ApiClient(apiContext));  // ← everything before use() is setup
                                         // test runs here
                                         // everything after use() is teardown
},
```

**Complete fixture list:**

| Fixture | What it provides | Auth state |
|---|---|---|
| `apiContext` | Raw Playwright `APIRequestContext` | None |
| `apiClient` | `ApiClient` instance wrapping the context | None (but injects token if available) |
| `authService` | `AuthService` for auth workflows | None |
| `userService` | `UserService` for user operations | None |
| `authenticatedUserService` | `UserService` with login pre-called | Logged in |
| `productService` | `ProductService` for product operations | None |
| `authenticatedProductService` | `ProductService` with login pre-called | Logged in |
| `registry` | `TestDataRegistry` + auto cleanup after test | N/A |
| `flushMetrics` | Auto fixture — flushes metrics to disk | N/A (auto) |

**Fixture dependency chain:**

```
apiContext
    └── apiClient
            ├── userService
            ├── authService
            ├── authenticatedUserService  (creates authService internally, calls login())
            ├── productService
            ├── authenticatedProductService (creates authService internally, calls login())
            └── registry  (creates TestDataCleanup on teardown)
```

**The `auto: true` fixture:**

The `flushMetrics` fixture uses `auto: true`, which means Playwright runs it for every test without the test declaring it. This is how metrics are flushed to disk transparently — test authors do not need to know it exists.

**Using fixtures in tests:**

```typescript
// Playwright reads the parameter names and injects matching fixtures
test('creates a user', async ({ authenticatedUserService, registry }) => {
  const user = await authenticatedUserService.createUser(UserFactory.create());
  registry.track('user', user.id);
  expect(user.id).toBeGreaterThan(0);
  // After the test: registry teardown deletes user, flushMetrics saves metrics to disk
});
```

---

### Layer 9 — Tests (`tests/`)

Tests are the only consumer-facing layer. They declare intent, call services, and make assertions. They do not know about HTTP, Zod schemas, tokens, or metrics.

Tests are organized into three types, each in its own folder:

#### Smoke Tests (`tests/smoke/`)

**Purpose:** Verify the service is alive and responding. Answer: "Is anything working at all?"

Characteristics:
- Fast — one or two requests per test
- No mutation — read-only
- Run on every deployment (used as deployment health checks)
- Tagged `@smoke`

```typescript
test('GET /users returns 200', async ({ authenticatedUserService }) => {
  const users = await authenticatedUserService.getUsers({ limit: 1 });
  expect(users.total).toBeGreaterThan(0);
});
```

#### Integration Tests (`tests/integration/`)

**Purpose:** Verify each workflow behaves correctly end-to-end. Answer: "Does the CRUD cycle work?"

Characteristics:
- Test the full create → read → update → delete cycle
- Use factories for test data
- Mutation tests use `registry.track()` for cleanup
- Tagged `@integration`

```typescript
test('POST /users/add creates a user with an assigned ID', async ({ authenticatedUserService, registry }) => {
  const payload = UserFactory.create();
  const created = await authenticatedUserService.createUser(payload);
  registry.track('user', created.id);  // ← register for cleanup

  expect(created.id).toBeGreaterThan(0);
  expect(created.firstName).toBe(payload.firstName);
  expect(created.email).toBe(payload.email);
});
```

#### Contract Tests (`tests/contract/`)

**Purpose:** Verify the API response shape has not changed. Answer: "Is the schema still what we expect?"

Characteristics:
- Do not care about values — only structure
- Use `ResponseValidator.expectSchemaMatch()` or `validateSchema()` directly on raw responses
- A schema violation fails the test with a precise field-level description
- Tagged `@contract`

```typescript
test('GET /users/:id matches UserSchema', async ({ apiClient, authService }) => {
  await authService.login();
  const response = await apiClient.get('/users/1');
  await ResponseValidator.expectSchemaMatch(response, UserSchema, 'contract:GET /users/:id');
});
```

---

### Layer 10 — Global Lifecycle

#### `global-setup.ts`

Runs **once** before any test in the entire run, in its own process.

```typescript
export default async function globalSetup(): Promise<void> {
  MetricsCollector.clearBuffer();  // Delete stale .metrics-buffer.ndjson from previous run
  metricsCollector.reset();        // Reset in-memory singleton (safety net)
  logger.info('Global Setup — test run started');
}
```

#### `global-teardown.ts`

Runs **once** after all tests complete, in its own process. Playwright guarantees this runs even if tests fail.

```typescript
export default async function globalTeardown(): Promise<void> {
  const collector = MetricsCollector.loadFromDisk();  // Read all worker metrics from disk
  collector.printSummary();                            // Print per-endpoint metrics table
  FailureAnalyzer.printReport(collector);             // Print categorised failure report
}
```

These files are registered in `playwright.config.ts`:

```typescript
globalSetup:    './src/global-setup',
globalTeardown: './src/global-teardown',
```

---

## 5. How Everything Connects — The Dependency Graph

Reading direction: each item depends on items below it.

```
tests/smoke/*.spec.ts
tests/integration/*.spec.ts
tests/contract/*.spec.ts
        │
        │ imports
        ▼
src/fixtures/ApiFixture.ts          ← imports all services, test-data, observability
        │
        ├── src/services/AuthService.ts
        ├── src/services/UserService.ts       ─┐
        ├── src/services/ProductService.ts     │ all import:
        │       │                              │
        │       └── src/assertions/ResponseValidator.ts
        │       └── src/contracts/*.ts
        │       └── src/core/ApiClient.ts
        │                  │
        │                  ├── src/core/AuthManager.ts
        │                  ├── src/core/Logger.ts
        │                  ├── src/config/ConfigManager.ts
        │                  └── src/observability/MetricsCollector.ts
        │
        ├── src/test-data/TestDataRegistry.ts
        └── src/test-data/TestDataCleanup.ts
                  └── src/core/ApiClient.ts

src/global-teardown.ts
        ├── src/observability/MetricsCollector.ts  (loadFromDisk)
        └── src/observability/FailureAnalyzer.ts   (printReport)
```

---

## 6. End-to-End Flow: A Test Running From Start to Finish

Let's trace exactly what happens when you run this test:

```typescript
test('POST /users/add creates a user with an assigned ID',
  async ({ authenticatedUserService, registry }) => {
    const payload = UserFactory.create();
    const created = await authenticatedUserService.createUser(payload);
    registry.track('user', created.id);
    expect(created.id).toBeGreaterThan(0);
    expect(created.firstName).toBe(payload.firstName);
});
```

**Step 1 — Global Setup (separate process, runs once)**
- `global-setup.ts` executes
- `MetricsCollector.clearBuffer()` deletes any leftover `.metrics-buffer.ndjson`
- `metricsCollector.reset()` clears in-memory metrics

**Step 2 — Playwright prepares the worker**
- A worker process starts
- `dotenv` loads `.env` into `process.env`
- `ConfigManager` singleton initialises, reading `TEST_ENV`, `TEST_USERNAME`, etc.

**Step 3 — Fixture resolution**
Playwright reads the test's parameter list: `{ authenticatedUserService, registry }`.

It resolves the dependency chain bottom-up:

1. `apiContext` — creates a new `APIRequestContext` with `baseURL: https://dummyjson.com`
2. `apiClient` — creates `new ApiClient(apiContext)`, which reads `maxRetries` from `ConfigManager`
3. `authenticatedUserService` — creates a temporary `AuthService(apiClient)`, calls `authService.login()`

**Step 4 — Login (inside `authenticatedUserService` fixture)**
- `AuthService.login()` calls `authManager.login(apiClient)`
- `AuthManager` checks if there is a cached, non-expired token — there is not (first test)
- `AuthManager` reads credentials from `ConfigManager` (`kminchelle` / `0lelplR`)
- `ApiClient.post('/auth/login', credentials)` executes:
  - `buildHeaders()` — no token yet, so just `Content-Type: application/json`
  - Playwright sends `POST https://dummyjson.com/auth/login`
  - Response arrives (status 200)
  - `metricsCollector.record({ method: 'POST', endpoint: '/auth/login', statusCode: 200, ... })`
  - Logger prints: `POST /auth/login {"status":200,"durationMs":634}`
- `AuthManager` stores `accessToken` in memory, calculates `tokenExpiresAt`
- Logger prints: `Authentication successful. {"username":"emilys"}`
- `new UserService(apiClient)` is created and passed to the test as `authenticatedUserService`

**Step 5 — `registry` fixture**
- `new TestDataRegistry()` is created
- `await use(reg)` yields control to the test — everything after this is the teardown phase that will run after the test

**Step 6 — Test body executes**

```typescript
const payload = UserFactory.create();
```
- Faker generates: `{ firstName: 'Melissa', lastName: 'Torres', email: 'melissa.torres@gmail.com', age: 29 }`

```typescript
const created = await authenticatedUserService.createUser(payload);
```
- `UserService.createUser(payload)`:
  - `CreateUserSchema.parse(payload)` — validates input against the Zod schema (passes)
  - `ApiClient.post('/users/add', payload)`:
    - `buildHeaders()` — reads `accessToken` from `authManager`, adds `Authorization: Bearer eyJ...`
    - Playwright sends `POST https://dummyjson.com/users/add` with the JSON body
    - Response arrives (status 201)
    - `metricsCollector.record({ method: 'POST', endpoint: '/users/add', statusCode: 201, ... })`
    - Logger prints: `POST /users/add {"status":201,"durationMs":287}`
  - `ResponseValidator.expectStatus(response, 201)` — passes
  - `ResponseValidator.validateSchema(response, UserSchema, 'createUser')`:
    - `response.json()` parses the body
    - `UserSchema.safeParse(body)` validates every field
    - Returns typed `User` object
- `created` is now `{ id: 217, firstName: 'Melissa', lastName: 'Torres', email: 'melissa.torres@gmail.com', ... }`

```typescript
registry.track('user', created.id);
```
- `TestDataRegistry` records `{ domain: 'user', id: 217 }`

```typescript
expect(created.id).toBeGreaterThan(0);    // passes — 217 > 0
expect(created.firstName).toBe(payload.firstName);  // passes — 'Melissa' === 'Melissa'
```

**Step 7 — Teardown (fixtures unwind in reverse order)**

`registry` fixture teardown:
- `new TestDataCleanup(apiClient)` is created
- `cleanup.cleanup(registry)` is called:
  - Registry has `[{ domain: 'user', id: 217 }]`
  - `ApiClient.delete('/users/217')` executes
  - DummyJSON responds (success — though it does not actually delete)
  - `registry.clear()` is called

`apiContext` fixture teardown:
- `context.dispose()` closes the Playwright request context

`flushMetrics` auto fixture teardown:
- `metricsCollector.flush()` appends all in-memory metrics as NDJSON lines to `reports/.metrics-buffer.ndjson`
- In-memory metrics are cleared

**Step 8 — Global Teardown (separate process, runs after all tests)**
- `global-teardown.ts` executes
- `MetricsCollector.loadFromDisk()` reads `.metrics-buffer.ndjson`, reconstructs the full metrics dataset
- `collector.printSummary()` prints the per-endpoint table
- `FailureAnalyzer.printReport(collector)` categorises and prints failure patterns

---

## 7. Authentication Flow in Detail

Understanding exactly how auth is shared across tests is important for debugging auth-related failures.

```
Test Worker                    AuthManager (singleton)          DummyJSON API
─────────────                  ───────────────────────          ─────────────

Test A starts
  fixture: authenticatedUserService
    AuthService.login()
      authManager.login()
        isTokenExpired()? → true (no token yet)
        POST /auth/login  ─────────────────────────────────→  200 OK + token
        store accessToken
        store tokenExpiresAt = now + 30min - 60sec

Test B starts (parallel)
  fixture: authenticatedUserService
    AuthService.login()
      authManager.login()
        isTokenExpired()? → false (token still valid from Test A)
        return cached token  ← no HTTP call made

Test C (negative auth test)
  authService.logout()
    authManager.clearTokens()  ← explicit clear
  expect(authService.isAuthenticated()).toBe(false)
  await authService.login()
    POST /auth/login  ──────────────────────────────────────→  200 OK + token
    store new token
```

**Important:** `AuthManager` is a singleton shared across all fixtures in the same worker process. This is why `authenticatedUserService` and `authenticatedProductService` both use the same token — the second login call finds the cached token and returns it without hitting the API.

For tests that explicitly test the unauthenticated state (like `auth-flow.spec.ts`), the test calls `authService.logout()` first to clear the singleton's token, then proceeds with its assertions.

---

## 8. Observability — How Metrics Flow Across Processes

This is the most architecturally complex part of the framework because of Playwright's process isolation.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Playwright Master Process                                          │
│                                                                     │
│  1. Spawns global-setup process                                     │
│     └── MetricsCollector.clearBuffer()  (deletes buffer file)       │
│                                                                     │
│  2. Spawns Worker 1 and Worker 2                                    │
│                                                                     │
│  ┌──────────────────────┐    ┌──────────────────────┐              │
│  │  Worker 1            │    │  Worker 2            │              │
│  │  ─────────────       │    │  ─────────────       │              │
│  │  Test A runs         │    │  Test D runs         │              │
│  │  ApiClient records   │    │  ApiClient records   │              │
│  │  metrics in memory   │    │  metrics in memory   │              │
│  │  ↓                   │    │  ↓                   │              │
│  │  flushMetrics runs   │    │  flushMetrics runs   │              │
│  │  flush() appends     │    │  flush() appends     │              │
│  │  to ndjson file ─────┼────┼──→ .metrics-buffer   │              │
│  │                      │    │  .ndjson             │              │
│  │  Test B runs ...     │    │  Test E runs ...     │              │
│  └──────────────────────┘    └──────────────────────┘              │
│                                                                     │
│  3. Spawns global-teardown process                                  │
│     └── MetricsCollector.loadFromDisk()  (reads entire buffer)      │
│         collector.printSummary()                                    │
│         FailureAnalyzer.printReport(collector)                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Why NDJSON?** Each line in the buffer file is a complete, self-contained JSON object like:

```json
{"method":"POST","endpoint":"/auth/login","statusCode":200,"durationMs":634,"success":true,"timestamp":"2026-03-12T06:07:22.000Z","retries":0}
{"method":"GET","endpoint":"/users/1","statusCode":200,"durationMs":312,"success":true,"timestamp":"2026-03-12T06:07:23.000Z","retries":0}
```

Worker 1 and Worker 2 can both append lines concurrently. Because each line is independent, there is no corruption if two workers write at the same moment (the OS guarantees line-level atomicity with `appendFileSync`).

---

## 9. Test Data Teardown — How Cleanup Works

The teardown system has three parts that work together:

**`TestDataRegistry`** — pure data, no behaviour:

```typescript
registry.track('user', 217);    // Records { domain: 'user', id: 217 }
registry.track('user', 218);    // Records { domain: 'user', id: 218 }
registry.getAll()               // [{ domain: 'user', id: 217 }, { domain: 'user', id: 218 }]
```

**`TestDataCleanup`** — owns the delete logic, no state:

```typescript
await cleanup.cleanup(registry);
// Iterates registry.getAll().reverse() for LIFO order
// → DELETE /users/218
// → DELETE /users/217
// registry.clear()
```

**`ApiFixture.registry`** — wires them together with guaranteed teardown:

```typescript
registry: async ({ apiClient }, use) => {
  const reg = new TestDataRegistry();
  await use(reg);                              // test runs here
  // This code runs AFTER the test, even if the test threw an exception:
  const cleanup = new TestDataCleanup(apiClient);
  await cleanup.cleanup(reg);
},
```

Playwright implements fixtures with `try/finally` internally. The code after `await use()` is always executed, regardless of whether the test passed, failed, or threw an uncaught exception. This guarantees teardown never silently skips.

**Which tests need `registry.track()`?**

Only tests that call mutation endpoints and receive a new resource ID:
- `createUser()` / `createProduct()` → always track
- `updateUser()` / `updateProduct()` → track the returned ID (it is an existing resource, but the framework uses the returned ID for consistency)
- `patchUser()` / `patchProduct()` → track
- `deleteUser()` / `deleteProduct()` → no tracking needed (resource is already being deleted)
- All GET operations → no tracking needed (no resources created)

**Why DummyJSON deletes are no-ops:**

DummyJSON simulates deletes — it returns `{ isDeleted: true, deletedOn: "..." }` but does not actually remove data from its database. Every call to `/users/1` continues to return data after a delete call. This is fine for a boilerplate framework — the pattern is correct for production systems where deletes are real. When you use this framework against a real API, the teardown will actually clean up the data.

---

## 10. Playwright Configuration and Projects

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  globalSetup:    './src/global-setup',
  globalTeardown: './src/global-teardown',

  fullyParallel: true,  // tests within a file can run in parallel
  workers: 2,           // 2 concurrent workers (limited to avoid DummyJSON rate limits)
  retries: process.env.CI ? 2 : 1,

  projects: [
    { name: 'smoke',       grep: /@smoke/       },
    { name: 'integration', grep: /@integration/ },
    { name: 'contract',    grep: /@contract/    },
    { name: 'all'                               },  // runs everything
  ],
});
```

**Running specific projects:**

```bash
# Run only smoke tests (fastest — good for deployment health checks)
npx playwright test --project=smoke

# Run only integration tests
npx playwright test --project=integration

# Run only contract tests
npx playwright test --project=contract

# Run everything
npx playwright test --project=all

# Or equivalently
npx playwright test

# Run with verbose output
npx playwright test --reporter=list

# Open the HTML report
npx playwright show-report
```

**Why `workers: 2`?** DummyJSON is a free public API. Sending 10 parallel logins triggers a `429 Too Many Requests` rate limit. Two workers provides a balance between speed and rate limit safety. In a real project with a dedicated test environment, you would raise this.

**Why `retries: 1` locally?** Network flakiness is real even in local development. One retry catches transient failures without masking genuine bugs. In CI, two retries handle slower, less reliable network conditions.

---

## 11. Environment Configuration

Create a `.env` file in the project root (never commit it):

```bash
# Target environment
TEST_ENV=dev

# Credentials
TEST_USERNAME=kminchelle
TEST_PASSWORD=0lelplR

# Request timeout in milliseconds
API_TIMEOUT=30000

# Logging (debug | info | warn | error)
LOG_LEVEL=info

# Set to true to log full response bodies (very verbose)
DEBUG=false

# Automatically set to true by CI systems (enables higher retry count)
CI=false
```

**For CI (GitHub Actions example):**

```yaml
env:
  CI: true
  TEST_ENV: qa
  TEST_USERNAME: ${{ secrets.QA_TEST_USERNAME }}
  TEST_PASSWORD: ${{ secrets.QA_TEST_PASSWORD }}
  LOG_LEVEL: warn
```

---

## 12. How to Add a New Domain (Step-by-Step)

Let's say you want to add `CartService` for DummyJSON's `/carts` endpoints. Here is exactly what to create and where.

### Step 1 — Define the Contract

Create `src/contracts/CartContract.ts`:

```typescript
import { z } from 'zod';

const CartProductSchema = z.object({
  id:                z.number(),
  title:             z.string(),
  price:             z.number(),
  quantity:          z.number(),
  total:             z.number(),
  discountPercentage: z.number(),
  discountedTotal:   z.number(),
  thumbnail:         z.string().optional(),
});

export const CartSchema = z.object({
  id:         z.number(),
  products:   z.array(CartProductSchema),
  total:      z.number(),
  discountedTotal: z.number(),
  userId:     z.number(),
  totalProducts: z.number(),
  totalQuantity: z.number(),
});

export const CartsListSchema = z.object({
  carts: z.array(CartSchema),
  total: z.number().min(0),
  skip:  z.number().min(0),
  limit: z.number().min(0),
});

export const CreateCartSchema = z.object({
  userId:   z.number().positive(),
  products: z.array(z.object({
    id:       z.number().positive(),
    quantity: z.number().int().min(1),
  })).min(1),
});

export type Cart              = z.infer<typeof CartSchema>;
export type CartsList         = z.infer<typeof CartsListSchema>;
export type CreateCartRequest = z.infer<typeof CreateCartSchema>;
```

### Step 2 — Add to the Barrel Export

In `src/contracts/index.ts`, add:

```typescript
export * from './CartContract';
```

### Step 3 — Create the Models File

Create `src/models/CartModels.ts`:

```typescript
export type { Cart, CartsList, CreateCartRequest } from '../contracts/CartContract';
```

### Step 4 — Create the Service

Create `src/services/CartService.ts`:

```typescript
import { ApiClient } from '../core/ApiClient';
import { ResponseValidator } from '../assertions/ResponseValidator';
import { CartSchema, CartsListSchema, CreateCartSchema, Cart, CartsList, CreateCartRequest } from '../contracts/CartContract';

export class CartService {
  constructor(private readonly api: ApiClient) {}

  async getCarts(params?: { limit?: number; skip?: number }): Promise<CartsList> {
    const query = params ? `?limit=${params.limit ?? 10}&skip=${params.skip ?? 0}` : '';
    const response = await this.api.get(`/carts${query}`);
    ResponseValidator.expectStatus(response, 200);
    return ResponseValidator.validateSchema(response, CartsListSchema, 'getCarts');
  }

  async getCartById(cartId: number): Promise<Cart> {
    const response = await this.api.get(`/carts/${cartId}`);
    ResponseValidator.expectStatus(response, 200);
    return ResponseValidator.validateSchema(response, CartSchema, 'getCartById');
  }

  async createCart(payload: CreateCartRequest): Promise<Cart> {
    CreateCartSchema.parse(payload);
    const response = await this.api.post('/carts/add', payload);
    ResponseValidator.expectStatus(response, 201);
    return ResponseValidator.validateSchema(response, CartSchema, 'createCart');
  }
}
```

### Step 5 — Create a Factory

Create `src/test-data/CartFactory.ts`:

```typescript
import { CreateCartRequest } from '../contracts/CartContract';

export class CartFactory {
  static create(overrides?: Partial<CreateCartRequest>): CreateCartRequest {
    return {
      userId: 1,
      products: [{ id: 1, quantity: 1 }],
      ...overrides,
    };
  }
}
```

### Step 6 — Wire into the Fixture

In `src/fixtures/ApiFixture.ts`, add to the imports:

```typescript
import { CartService } from '../services/CartService';
```

Add to the `ApiFixtures` type:

```typescript
cartService:               CartService;
authenticatedCartService:  CartService;
```

Add the fixture implementations:

```typescript
cartService: async ({ apiClient }, use) => {
  await use(new CartService(apiClient));
},

authenticatedCartService: async ({ apiClient }, use) => {
  const authSvc = new AuthService(apiClient);
  await authSvc.login();
  await use(new CartService(apiClient));
},
```

### Step 7 — Register Domain in TestDataCleanup

In `src/test-data/TestDataCleanup.ts`, add to the switch:

```typescript
case 'cart':
  await this.api.delete(`/carts/${id}`);
  break;
```

And add `'cart'` to the `ResourceDomain` union in `TestDataRegistry.ts`:

```typescript
export type ResourceDomain = 'user' | 'product' | 'cart';
```

### Step 8 — Write Tests

Create three test files following the exact patterns of the existing ones:

- `tests/smoke/carts.smoke.spec.ts` — is the endpoint alive?
- `tests/integration/cart-crud.spec.ts` — does the CRUD cycle work?
- `tests/contract/cart.contract.spec.ts` — does the response shape match?

That is the complete process. Eight steps, all of them mechanical. No architectural decisions required.

---

## 13. Design Principles and Decisions

### 1. Tests know nothing about HTTP

A test should read like a business requirement. It should say "create a user and verify the ID is assigned" — not "POST to /users/add with Content-Type header and parse the JSON response". HTTP is an implementation detail hidden behind services.

### 2. Types come from schemas, never written manually

Every TypeScript type in this framework is derived with `z.infer<>`. This is non-negotiable. If you write an interface manually and also write a Zod schema, they will eventually drift. The schema is the single source of truth.

### 3. Configuration in one place

`ConfigManager` is the only file that reads `process.env`. This makes the framework testable (you can mock `ConfigManager`) and makes configuration changes a single-file concern.

### 4. Teardown always runs

Playwright's `await use()` pattern guarantees that code after `use()` runs even if the test throws. Combined with per-delete error isolation in `TestDataCleanup`, this means cleanup failures never cascade into test failures.

### 5. The singleton pattern for shared state

`configManager`, `authManager`, `metricsCollector`, and `logger` are all singletons exported as module-level constants. This is deliberate — they represent shared state that must be consistent across the entire framework within a process.

### 6. Fail fast, fail precisely

`ResponseValidator.validateSchema()` throws immediately when the response shape is wrong, with a field-level description of what failed. This is much more useful than receiving `undefined` three function calls later.

### 7. Observability is infrastructure, not tests

Metrics collection happens inside `ApiClient`. Every request is automatically recorded without any action required from test authors. Tests should not know or care that metrics are being collected.

---

## 14. Common Pitfalls and How This Framework Avoids Them

### Pitfall: Tests share auth state and interfere with each other

**The problem:** If tests share a global `token` variable and some tests clear it for negative test scenarios, they affect other tests running in parallel.

**How this framework handles it:** `AuthManager` is a singleton but is designed around caching. Tests that need to test the unauthenticated state call `authService.logout()` explicitly at the start of the test, which clears the singleton. This is an intentional, local operation. The `authenticatedUserService` fixture re-authenticates independently.

### Pitfall: Schema changes break tests with unhelpful errors

**The problem:** API adds a required field. Tests start failing with `TypeError: Cannot read properties of undefined (reading 'newField')` — no indication of which response caused it.

**How this framework handles it:** Zod validates immediately after `response.json()`. The error is:
```
[getUserById] Schema validation failed:
  • newField: Required
```
The label tells you which service method failed. The path tells you exactly which field is missing.

### Pitfall: Parallel tests collide on shared test data

**The problem:** Two tests both try to update `/users/1` simultaneously. They overwrite each other's changes and both fail non-deterministically.

**How this framework handles it:** Tests that need to modify resources use `createUser()` to create their own isolated resource via Faker-generated unique data. No two tests operate on the same resource ID.

### Pitfall: Created resources pollute the environment

**The problem:** After 100 test runs, the test environment has thousands of stale users, products, and orders.

**How this framework handles it:** `TestDataRegistry` + `TestDataCleanup` ensure every created resource is deleted after the test, regardless of whether the test passed.

### Pitfall: Metrics are always empty in teardown

**The problem:** Global teardown runs in a different process from workers. In-memory singletons are not shared.

**How this framework handles it:** Workers flush metrics to an NDJSON file. Teardown reads the file. This cross-process communication via disk is simple, reliable, and requires no external infrastructure.

### Pitfall: Retries mask flaky tests

**The problem:** Setting `retries: 3` everywhere causes genuinely flaky tests to always eventually pass, hiding the problem.

**How this framework handles it:** Retries are set conservatively — `0` locally, `2` in CI. More importantly, retries at the HTTP level in `ApiClient` only retry `5xx` and network errors (transient faults), not `4xx` (client errors that will not resolve). Test-level retries are separate and configured in `playwright.config.ts`.

---

*This document covers the complete architecture as built. For questions about extending the framework or adapting it to a specific API, the patterns in Section 12 are the recommended starting point.*

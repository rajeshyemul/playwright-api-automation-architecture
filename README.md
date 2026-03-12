# Playwright API Automation Architecture

A reference implementation of a scalable API automation framework using Playwright and TypeScript, designed with architecture patterns commonly used in enterprise Quality Engineering teams.

This repository demonstrates how to design API automation that is maintainable, extensible, and capable of scaling to hundreds of tests without increasing maintenance overhead.

The framework emphasizes clear separation of responsibilities, strong validation, and reusable automation components.

# Design Principles

The framework follows several architectural principles used in mature automation systems.

## Service Abstraction

Tests interact with business operations instead of raw HTTP endpoints.
```ts
userService.getUsers()
authService.login()
```
This keeps tests readable and aligned with business workflows.

## Centralized API Client

All HTTP communication flows through a single client layer.
- Responsibilities include:
- request execution
- authentication header management
- request logging
- timeout configuration
- consistent request behavior

This prevents duplication and simplifies debugging.

## Contract Validation

API responses are validated using Zod schemas.
Instead of validating only status codes, the framework verifies the entire response structure.
This prevents silent API regressions when backend contracts change.

## Test Data Factories

Factories generate deterministic test data.
```ts
UserFactory.createUser()
AuthFactory.createLoginRequest()
```
This ensures:

- unique data for each test
- safe parallel execution
- reduced environment pollution

## Fixture-Based Dependency Injection

Playwright fixtures provide dependencies such as services and API clients automatically.
Tests remain clean and focused on behavior.

## Configuration Driven Execution

Environment-specific configuration is managed through a centralized configuration manager.
This allows the same tests to run against:
- dev
- qa
- stage
- prod
without code changes.

## Parallel Execution Safety

The framework is designed for Playwright's parallel workers.
Each worker receives isolated dependencies, preventing shared state issues.

---

# Repository Structure

playwright-api-automation-architecture
│
├── architecture
│ ├── api-testing-strategy.md
│ ├── framework-architecture.md
│ ├── service-layer-pattern.md
│ ├── test-data-strategy.md
│ └── contract-validation.md
│
├── src
│
│ ├── core
│ │ ├── ApiClient.ts
│ │ ├── AuthManager.ts
│ │ └── Logger.ts
│
│ ├── config
│ │ └── ConfigManager.ts
│
│ ├── fixtures
│ │ └── ApiFixture.ts
│
│ ├── models
│ │ ├── AuthModels.ts
│ │ └── UserModels.ts
│
│ ├── services
│ │ ├── AuthService.ts
│ │ └── UserService.ts
│
│ ├── validators
│ │ └── ResponseValidator.ts
│
│ ├── test-data
│ │ ├── UserFactory.ts
│ │ └── AuthFactory.ts
│
│ ├── contracts
│ │ ├── UserContract.ts
│ │ └── AuthContract.ts
│
│ └── observability
│ ├── MetricsCollector.ts
│ └── FailureAnalyzer.ts
│
├── tests
│ ├── smoke
│ ├── integration
│ └── contract
│
└── examples
├── user-service
└── auth-service

---

# Architecture Overview

The framework follows a layered design.
```ts
Tests
   ↓
Services
   ↓
ApiClient
   ↓
AuthManager
   ↓
Contracts
```
Each layer has a single responsibility.

## Tests

Tests describe business scenarios, not technical implementation.
Example:
```ts
Login and fetch users
Get user by ID
```
Tests interact only with services.

---

## Service Layer

Services represent business operations.

Example:
``` ts
UserService.getUsers()
AuthService.login()
```

Tests call services rather than HTTP endpoints directly.
This keeps test code clean and aligned with business workflows.

---

## API Client

The API client is responsible for performing HTTP requests and handling low-level communication with the system under test.

It centralizes:

- request configuration
- headers management
- authentication handling (token injection)
- retries
- request logginh
- timeout configuration

This ensures consistent behavior across all services.

---

## AuthManager

AuthManager handles authentication state.
Responsibilities include:
- storing access tokens
- providing tokens to requests
- preventing repeated logins

ApiClient automatically attaches tokens to authenticated requests.

---

## Contracts

API responses are validated using Zod schemas.
Example:
``` ts
LoginResponseSchema
UsersResponseSchema
```

Schema validation ensures API responses match expected structures.
If a backend change breaks the contract, the test fails immediately.

## Models

Models represent API request and response structures using TypeScript interfaces.

Example:
``` ts
interface UserResponse {
id: string
email: string
role: string
}
```

This ensures type safety and improves validation clarity.

---

## Validators

Validation logic is extracted into reusable validators.

Example:
```ts
UserValidator.validateUserResponse(response)
```
This prevents duplication of assertions across tests.

---

## Test Data

Test data factories generate deterministic input data.

Example:
```ts
UserFactory.createUser()
```
This allows tests to run in parallel environments without conflicts.

---

## Observability

Automation frameworks benefit from visibility into their own health.

The observability layer collects:

- failure patterns
- execution metrics
- stability indicators

This helps teams understand automation reliability over time.

---

# Example Test Flow

A typical test interacts with the framework like this:
```ts
test('Get users', async ({ userService }) => {
const users = await userService.getUsers()
UserValidator.validateUserList(users)
})
```

The test focuses only on behavior.
Infrastructure complexity remains inside the framework.

---

# Who This Repository Is For

This repository is useful for:

- automation engineers designing API frameworks
- teams adopting Playwright for API validation
- engineers preparing for senior SDET or automation architect roles
- organizations modernizing automation architecture

---

# Future Extensions

This architecture can be expanded to include:

- UI automation integration
- contract testing frameworks
- AI-assisted test generation
- visual validation systems
- API Mocking

---

# Detail Framework Architecture

You can find in detail explanation of the framework architecture [here](./FRAMEWORK_ARCHITECTURE)

# Author

Rajesh Yemul  
Technical Director – Quality Engineering

I work on large-scale Quality Engineering modernization initiatives focusing on automation architecture, scalable test systems, and AI-enabled testing workflows.

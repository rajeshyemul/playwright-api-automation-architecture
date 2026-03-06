# Service Layer Pattern

The service layer is a core architectural pattern used in scalable automation frameworks.

Instead of calling API endpoints directly from tests, tests interact with service classes that represent business operations.

---

## Problem Without Service Layer

Tests often look like this:

```ts
await request.get("/users")
```

This approach causes several problems:

- endpoint logic is duplicated
- tests become tightly coupled to API structure
- changes to endpoints require updates across many tests

---

## Service Layer Solution

The service layer encapsulates endpoint logic inside reusable classes.

Example:

```ts
class UserService {
async getUsers() {
return this.apiClient.get("/users")
}
}
```

Tests now interact with services instead of raw endpoints.

Example:
```ts
const users = await userService.getUsers()
```

---

## Benefits

Using a service layer provides several advantages:

- improved readability
- reusable workflows
- easier maintenance
- clearer separation of responsibilities

Tests describe **business behavior**, while services manage **API communication**.

---

## Service Design Principles

When implementing services:

- keep services focused on a single domain
- avoid embedding test assertions
- reuse API client infrastructure
- represent business actions rather than endpoints

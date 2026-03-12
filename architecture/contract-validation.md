# Contract Validation

API contract validation ensures that services return responses consistent with expected schemas.

In distributed systems and microservice environments, this validation becomes critical to prevent breaking changes between services.

---

## Why Contract Validation Matters

Without contract validation:

- services may change response structures unexpectedly
- client applications may break
- integration issues may go unnoticed until later stages

Automated contract validation helps detect these issues early.

---

## Response Schema Validation

Responses can be validated against defined schemas or TypeScript models.

Example:

```ts
interface UserResponse {
id: string
email: string
role: string
}
```

Validators can verify that responses match the expected structure.

---

## Benefits

Contract validation provides:

- early detection of breaking API changes
- improved integration reliability
- stronger guarantees for client systems

This becomes especially important when multiple teams maintain different services.

---

## When to Use Contract Testing

Contract validation should be used when:

- APIs are consumed by multiple systems
- microservices communicate frequently
- backward compatibility must be preserved

Integrating contract validation into automation frameworks helps maintain stable service ecosystems.
import { ApiClient } from '../core/ApiClient';
import { ResponseValidator } from '../assertions/ResponseValidator';
import {
  UserSchema, UsersListSchema, CreateUserSchema, DeleteUserResponseSchema,
  User, UsersList, CreateUserRequest, DeleteUserResponse,
} from '../contracts/UserContract';

/**
 * UserService represents all business operations on the User domain.
 *
 * Architectural pattern:
 *   - Methods accept typed input and return typed, schema-validated output
 *   - No raw APIResponse leaks out — callers receive domain objects, not HTTP
 *   - All validation happens via Zod schemas in ResponseValidator
 *   - Tests interact with this service, never with ApiClient directly
 */
export class UserService {
  constructor(private readonly api: ApiClient) {}

  /**
   * Retrieve paginated list of users.
   * GET /users?limit={limit}&skip={skip}
   */
  async getUsers(params?: { limit?: number; skip?: number }): Promise<UsersList> {
    const query = params
      ? `?limit=${params.limit ?? 10}&skip=${params.skip ?? 0}`
      : '';
    const response = await this.api.get(`/users${query}`);
    ResponseValidator.expectStatus(response, 200);
    return ResponseValidator.validateSchema(response, UsersListSchema, 'getUsers');
  }

  /**
   * Retrieve a single user by ID.
   * GET /users/:id
   */
  async getUserById(userId: number): Promise<User> {
    const response = await this.api.get(`/users/${userId}`);
    ResponseValidator.expectStatus(response, 200);
    return ResponseValidator.validateSchema(response, UserSchema, 'getUserById');
  }

  /**
   * Search users by a query string.
   * GET /users/search?q={query}
   */
  async searchUsers(query: string): Promise<UsersList> {
    const response = await this.api.get(`/users/search?q=${encodeURIComponent(query)}`);
    ResponseValidator.expectStatus(response, 200);
    return ResponseValidator.validateSchema(response, UsersListSchema, 'searchUsers');
  }

  /**
   * Create a new user.
   * POST /users/add
   * Note: DummyJSON does not persist created users — this validates the
   * request/response contract for the create workflow.
   */
  async createUser(payload: CreateUserRequest): Promise<User> {
    // Validate input before sending — catch bad test data early
    CreateUserSchema.parse(payload);
    const response = await this.api.post('/users/add', payload);
    ResponseValidator.expectStatus(response, 201);
    return ResponseValidator.validateSchema(response, UserSchema, 'createUser');
  }

  /**
   * Replace a user (full update).
   * PUT /users/:id
   */
  async updateUser(userId: number, payload: Partial<CreateUserRequest>): Promise<User> {
    const response = await this.api.put(`/users/${userId}`, payload);
    ResponseValidator.expectStatus(response, 200);
    return ResponseValidator.validateSchema(response, UserSchema, 'updateUser');
  }

  /**
   * Partially update a user.
   * PATCH /users/:id
   */
  async patchUser(userId: number, payload: Partial<CreateUserRequest>): Promise<User> {
    const response = await this.api.patch(`/users/${userId}`, payload);
    ResponseValidator.expectStatus(response, 200);
    return ResponseValidator.validateSchema(response, UserSchema, 'patchUser');
  }

  /**
   * Delete a user by ID.
   * DELETE /users/:id
   */
  async deleteUser(userId: number): Promise<DeleteUserResponse> {
    const response = await this.api.delete(`/users/${userId}`);
    ResponseValidator.expectStatus(response, 200);
    return ResponseValidator.validateSchema(response, DeleteUserResponseSchema, 'deleteUser');
  }
}

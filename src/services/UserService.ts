import { ApiClient } from '../core/ApiClient';
import { APIResponse } from '@playwright/test';

export class UserService {
  constructor(private api: ApiClient) {}

  async getUsers(): Promise<APIResponse> {
    return this.api.get('/users');
  }

  async getUserById(userId: number): Promise<APIResponse> {
    return this.api.get(`/users/${userId}`);
  }
}
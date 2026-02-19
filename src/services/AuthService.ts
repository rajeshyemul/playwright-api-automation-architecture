import { ApiClient } from '../core/ApiClient';
import { authManager } from '../core/AuthManager';

export class AuthService {
  constructor(private api: ApiClient) {}

  async login() {
    return authManager.login(this.api);
  }
}

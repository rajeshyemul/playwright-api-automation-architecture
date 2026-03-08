import { configManager } from '../config/ConfigManager';
import { LoginRequest } from '../contracts/AuthContract';

/**
 * AuthFactory generates credential payloads for authentication test scenarios.
 *
 * Credentials come from ConfigManager which reads .env — they are never
 * hard-coded in the factory or in tests. This ensures that rotating
 * credentials in CI requires only a secrets update, not a code change.
 */
export class AuthFactory {
  /**
   * Valid credentials from environment configuration.
   * This is what most test flows use to authenticate before their assertions.
   */
  static validCredentials(expiresInMins = 30): LoginRequest {
    return {
      username:      configManager.getUsername(),
      password:      configManager.getPassword(),
      expiresInMins,
    };
  }

  /**
   * Known-wrong credentials for negative authentication tests.
   * Use these to assert that the API rejects invalid logins correctly.
   */
  static invalidCredentials(): LoginRequest {
    return {
      username: 'invalid_user_that_does_not_exist',
      password: 'definitelyWrongPassword!',
    };
  }

  /**
   * Credentials with a valid username but wrong password.
   * Tests the "correct user, wrong password" 401 scenario.
   */
  static wrongPassword(): LoginRequest {
    return {
      username: configManager.getUsername(),
      password: 'wrong_password_for_valid_user',
    };
  }

  /**
   * Short-lived token credentials — useful for testing token expiry behaviour.
   */
  static shortLivedCredentials(): LoginRequest {
    return {
      ...this.validCredentials(),
      expiresInMins: 1,
    };
  }
}

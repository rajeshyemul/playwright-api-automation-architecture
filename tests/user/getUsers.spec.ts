import { test } from '../../src/fixtures/ApiFixture';
import { ResponseValidator } from '../../src/assertions/ResponseValidator';

test('Login and fetch users successfully', async ({ authService, userService }) => {
  await authService.login();
  const response = await userService.getUsers();
  await ResponseValidator.expectStatus(response, 200);
});
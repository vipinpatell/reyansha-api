import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';

describe('AuthGuard', () => {
  it('rejects protected requests without a session cookie', async () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) };
    const authService = { validateSession: vi.fn() };
    const guard = new AuthGuard(reflector as never, authService as never);
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    };

    await expect(guard.canActivate(context as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(authService.validateSession).not.toHaveBeenCalled();
  });
});

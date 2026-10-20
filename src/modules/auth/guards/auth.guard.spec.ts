import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';

describe('AuthGuard', () => {
  function createContext(user: { mustChangePassword: boolean }) {
    const handler = vi.fn();
    const routeMetadata = new Map<unknown, unknown>();
    return {
      handler,
      reflector: {
        getAllAndOverride: vi.fn((_key: string, targets: unknown[]) => {
          if (targets[0] === handler) {
            return routeMetadata.get(handler);
          }
          return false;
        }),
      },
      context: {
        getHandler: () => handler,
        getClass: vi.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { cookie: 'reyansha_session=valid-token' },
            user,
          }),
        }),
      },
      routeMetadata,
    };
  }

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

  it('forces users with an admin-set password to change it before proceeding', async () => {
    const requestContext = createContext({ mustChangePassword: false });
    const authService = {
      validateSession: vi.fn().mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
        permissions: [],
        roles: [],
        mustChangePassword: true,
      }),
    };
    const guard = new AuthGuard(
      requestContext.reflector as never,
      authService as never,
    );

    await expect(
      guard.canActivate(requestContext.context as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a forced password change when the password-change route is marked', async () => {
    const requestContext = createContext({ mustChangePassword: false });
    requestContext.routeMetadata.set(requestContext.handler, true);
    requestContext.reflector.getAllAndOverride.mockImplementation(
      (key: string, targets: unknown[]) =>
        key === 'allow_must_change_password' &&
        targets[0] === requestContext.handler,
    );
    const authService = {
      validateSession: vi.fn().mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
        permissions: [],
        roles: [],
        mustChangePassword: true,
      }),
    };
    const guard = new AuthGuard(
      requestContext.reflector as never,
      authService as never,
    );

    await expect(
      guard.canActivate(requestContext.context as never),
    ).resolves.toBe(true);
  });
});

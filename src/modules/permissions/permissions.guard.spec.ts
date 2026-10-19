import { PermissionsGuard } from './permissions.guard.js';
import { REQUIRED_PERMISSIONS } from './permissions.decorator.js';

describe('PermissionsGuard', () => {
  it('denies an authenticated user missing the required permission', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(['users.create']),
    };
    const guard = new PermissionsGuard(reflector as never);
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { permissions: ['users.read'] },
        }),
      }),
    };

    expect(guard.canActivate(context as never)).toBe(false);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      REQUIRED_PERMISSIONS,
      expect.any(Array),
    );
  });
});

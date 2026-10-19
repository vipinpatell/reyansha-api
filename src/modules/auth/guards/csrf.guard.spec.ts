import { ForbiddenException } from '@nestjs/common';
import { CsrfGuard } from './csrf.guard.js';

describe('CsrfGuard', () => {
  const createContext = (origin?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          headers: origin ? { origin } : {},
        }),
      }),
    }) as never;

  it.each(['http://localhost:3000', 'http://localhost:3001'])(
    'allows local origin %s by default',
    (origin) => {
      const guard = new CsrfGuard({ get: vi.fn() } as never);
      expect(guard.canActivate(createContext(origin))).toBe(true);
    },
  );

  it('rejects unconfigured origins', () => {
    const guard = new CsrfGuard({ get: vi.fn() } as never);
    expect(() =>
      guard.canActivate(createContext('https://untrusted.example')),
    ).toThrow(ForbiddenException);
  });

  it('respects an explicitly configured origin list', () => {
    const guard = new CsrfGuard({
      get: vi.fn().mockReturnValue('https://dashboard.example.com'),
    } as never);
    expect(() =>
      guard.canActivate(createContext('http://localhost:3000')),
    ).toThrow(ForbiddenException);
  });
});

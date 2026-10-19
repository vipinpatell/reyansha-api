import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import {
  AuthBootstrapClaim,
  AuthSession,
  PasswordReset,
} from './auth.schema.js';
import { Role } from '../roles/role.schema.js';
import { User } from '../users/schemas/user.schema.js';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: {
    findOne: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
  };
  let roleModel: { find: ReturnType<typeof vi.fn> };
  let sessionModel: {
    create: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    userModel = {
      findOne: vi.fn(),
      findById: vi.fn(),
    };
    roleModel = { find: vi.fn() };
    sessionModel = {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findOne: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Role.name), useValue: roleModel },
        { provide: getModelToken(AuthSession.name), useValue: sessionModel },
        { provide: getModelToken(PasswordReset.name), useValue: {} },
        { provide: getModelToken(AuthBootstrapClaim.name), useValue: {} },
        {
          provide: ConfigService,
          useValue: { get: vi.fn().mockReturnValue('development') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('rejects inactive accounts without issuing a cookie or session', async () => {
    userModel.findOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          accountStatus: 'suspended',
          passwordHash: 'stored-hash',
        }),
      }),
    });
    const response = { cookie: vi.fn() };

    await expect(
      service.login(
        { identifier: 'user@example.com', password: 'not-the-password' },
        response as never,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessionModel.create).not.toHaveBeenCalled();
    expect(response.cookie).not.toHaveBeenCalled();
  });

  it('never includes a password hash in the current-user response', async () => {
    userModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        id: 'user-id',
        roles: [],
        mustChangePassword: false,
        toObject: () => ({
          email: 'user@example.com',
          passwordHash: 'secret-hash',
        }),
      }),
    });
    roleModel.find.mockReturnValue({ exec: vi.fn().mockResolvedValue([]) });

    const profile = await service.currentUser('user-id');

    expect(profile).not.toHaveProperty('passwordHash');
    expect(profile).toMatchObject({
      email: 'user@example.com',
      roles: [],
      permissions: [],
    });
  });

  it('revokes sessions when their account has been suspended', async () => {
    sessionModel.findOne.mockReturnValue({
      exec: vi.fn().mockResolvedValue({ userId: 'user-id' }),
    });
    userModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        accountStatus: 'suspended',
      }),
    });
    sessionModel.deleteMany.mockReturnValue({ exec: vi.fn() });

    await expect(service.validateSession('raw-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(sessionModel.deleteMany).toHaveBeenCalledWith({ userId: 'user-id' });
  });
});

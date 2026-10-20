import {
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { compare } from 'bcryptjs';
import { createTransport } from 'nodemailer';
import { AuthService } from './auth.service.js';
import {
  AuthBootstrapClaim,
  AuthSession,
  PasswordReset,
} from './auth.schema.js';
import { Role } from '../roles/role.schema.js';
import { User } from '../users/schemas/user.schema.js';

vi.mock('nodemailer', () => ({
  createTransport: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userModel: {
    findOne: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findByIdAndUpdate: ReturnType<typeof vi.fn>;
  };
  let roleModel: { find: ReturnType<typeof vi.fn> };
  let sessionModel: {
    create: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
  };
  let resetModel: {
    create: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    deleteOne: ReturnType<typeof vi.fn>;
  };
  let configValues: Record<string, string | undefined>;

  beforeEach(async () => {
    userModel = {
      findOne: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
    };
    roleModel = { find: vi.fn() };
    sessionModel = {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findOne: vi.fn(),
    };
    resetModel = {
      create: vi.fn(),
      deleteMany: vi.fn(),
      deleteOne: vi.fn(),
    };
    configValues = { NODE_ENV: 'development' };
    vi.mocked(createTransport).mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Role.name), useValue: roleModel },
        { provide: getModelToken(AuthSession.name), useValue: sessionModel },
        { provide: getModelToken(PasswordReset.name), useValue: resetModel },
        { provide: getModelToken(AuthBootstrapClaim.name), useValue: {} },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => configValues[key]),
            getOrThrow: vi.fn((key: string) => {
              const value = configValues[key];
              if (!value) throw new Error(`Missing config: ${key}`);
              return value;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('logs a one-time reset token when console OTP mode is enabled', async () => {
    configValues.PASSWORD_RESET_CONSOLE_OTP = 'true';
    userModel.findOne.mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: 'user-id',
        email: 'user@example.com',
      }),
    });
    resetModel.deleteMany.mockReturnValue({
      exec: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    });
    resetModel.create.mockResolvedValue({});
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});

    await expect(service.forgotPassword('user@example.com')).resolves.toEqual({
      message:
        'If an active account matches that email, password reset instructions will be sent.',
    });

    expect(consoleInfo).toHaveBeenCalledWith(
      expect.stringMatching(
        /^Password reset OTP for user@example\.com: [A-Za-z0-9_-]{43}$/,
      ),
    );
    expect(resetModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-id', purpose: 'reset' }),
    );
    expect(createTransport).not.toHaveBeenCalled();
    consoleInfo.mockRestore();
  });

  it('sends reset email when console OTP mode is disabled', async () => {
    configValues = {
      NODE_ENV: 'development',
      PASSWORD_RESET_CONSOLE_OTP: 'false',
      PASSWORD_RESET_URL: 'http://localhost:3001/reset-password',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      SMTP_USER: 'mailer@example.com',
      SMTP_PASSWORD: 'smtp-password',
      SMTP_FROM: 'mailer@example.com',
    };
    userModel.findOne.mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: 'user-id',
        email: 'user@example.com',
      }),
    });
    resetModel.deleteMany.mockReturnValue({
      exec: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    });
    resetModel.create.mockResolvedValue({});
    const sendMail = vi.fn().mockResolvedValue({});
    vi.mocked(createTransport).mockReturnValue({ sendMail } as never);

    await service.forgotPassword('user@example.com');

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: 'mailer@example.com', pass: 'smtp-password' },
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'mailer@example.com',
        to: 'user@example.com',
        subject: 'Reset your Reyansha account password',
      }),
    );
  });

  it('prevents console OTP mode outside development', async () => {
    configValues = {
      NODE_ENV: 'staging',
      PASSWORD_RESET_CONSOLE_OTP: 'true',
    };

    await expect(
      service.forgotPassword('user@example.com'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(userModel.findOne).not.toHaveBeenCalled();
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

  it('only lets a Super Admin reset another user password', async () => {
    await expect(
      service.setUserPasswordBySuperAdmin(
        {
          id: 'actor-id',
          email: 'manager@example.com',
          permissions: ['roles.manage'],
          roles: [{ key: 'admin', name: 'Admin' }],
          mustChangePassword: false,
        },
        '507f1f77bcf86cd799439011',
        'a-strong-password',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('hashes the password, requires a change at next login, and revokes sessions', async () => {
    const targetId = '507f1f77bcf86cd799439011';
    const password = 'a-new-strong-password';
    const update = {
      _id: targetId,
    };
    const sessionsDeleted = { deletedCount: 2 };
    userModel.findByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(update),
      }),
    });
    sessionModel.deleteMany.mockReturnValue({
      exec: vi.fn().mockResolvedValue(sessionsDeleted),
    });
    resetModel.deleteMany.mockReturnValue({
      exec: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    const result = await service.setUserPasswordBySuperAdmin(
      {
        id: 'admin-id',
        email: 'admin@example.com',
        permissions: ['roles.manage'],
        roles: [{ key: 'super_admin', name: 'Super Admin' }],
        mustChangePassword: false,
      },
      targetId,
      password,
    );

    const updateDocument = userModel.findByIdAndUpdate.mock.calls[0][1];
    await expect(
      compare(password, updateDocument.$set.passwordHash),
    ).resolves.toBe(true);
    expect(updateDocument.$set.mustChangePassword).toBe(true);
    expect(sessionModel.deleteMany).toHaveBeenCalledWith({ userId: targetId });
    expect(resetModel.deleteMany).toHaveBeenCalledWith({ userId: targetId });
    expect(result).toEqual({
      message: 'Password updated; the user must change it after signing in',
      mustChangePassword: true,
      revokedSessions: 2,
    });
  });
});

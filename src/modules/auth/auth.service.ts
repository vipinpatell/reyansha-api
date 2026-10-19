import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createTransport } from 'nodemailer';
import type { Model } from 'mongoose';
import type { Response } from 'express';
import { User } from '../users/schemas/user.schema.js';
import { Role } from '../roles/role.schema.js';
import {
  AuthBootstrapClaim,
  AuthSession,
  PasswordReset,
} from './auth.schema.js';
import type { AuthenticatedUser } from './auth.types.js';
import type { BootstrapDto } from './dto/bootstrap.dto.js';
import type { ChangePasswordDto } from './dto/change-password.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { ResetPasswordDto } from './dto/reset-password.dto.js';

const SESSION_COOKIE = 'reyansha_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
    @InjectModel(AuthSession.name)
    private readonly sessionModel: Model<AuthSession>,
    @InjectModel(PasswordReset.name)
    private readonly resetModel: Model<PasswordReset>,
    @InjectModel(AuthBootstrapClaim.name)
    private readonly bootstrapClaimModel: Model<AuthBootstrapClaim>,
    private readonly config: ConfigService,
  ) {}

  async login(input: LoginDto, response: Response) {
    const identifier = (input.identifier ?? input.email!).trim().toLowerCase();
    const user = await this.userModel
      .findOne({ $or: [{ email: identifier }, { username: identifier }] })
      .select('+passwordHash')
      .exec();

    if (
      Buffer.byteLength(input.password, 'utf8') > 72 ||
      !user ||
      user.accountStatus !== 'active' ||
      !user.passwordHash ||
      !(await compare(input.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = createSessionToken();
    await this.sessionModel.create({
      userId: user._id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });
    user.lastLoginAt = new Date();
    await user.save();

    response.cookie(SESSION_COOKIE, token, this.cookieOptions());
    return {
      message: 'Login successful',
      user: await this.currentUser(user.id),
    };
  }

  async logout(token: string | undefined, response: Response) {
    if (token) {
      await this.sessionModel.deleteOne({ tokenHash: hashToken(token) }).exec();
    }
    response.clearCookie(SESSION_COOKIE, this.cookieOptions());
    return { message: 'Logout successful' };
  }

  async validateSession(token: string): Promise<AuthenticatedUser> {
    const session = await this.sessionModel
      .findOne({
        tokenHash: hashToken(token),
        expiresAt: { $gt: new Date() },
      })
      .exec();
    if (!session) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    const user = await this.userModel.findById(session.userId).exec();
    if (!user || user.accountStatus !== 'active') {
      await this.sessionModel.deleteMany({ userId: session.userId }).exec();
      throw new UnauthorizedException('Account is not active');
    }

    const roles = await this.roleModel
      .find({ _id: { $in: user.roles } })
      .exec();
    return {
      id: user.id,
      email: user.email,
      permissions: [...new Set(roles.flatMap((role) => role.permissions))],
      roles: roles.map(({ key, name }) => ({ key, name })),
      mustChangePassword: user.mustChangePassword,
    };
  }

  async currentUser(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException('Account is no longer available');
    }
    const roles = await this.roleModel
      .find({ _id: { $in: user.roles } })
      .exec();
    const profile = user.toObject();
    delete profile.passwordHash;
    return Object.assign(profile, {
      roles: roles.map(({ key, name }) => ({ key, name })),
      permissions: [...new Set(roles.flatMap((role) => role.permissions))],
      mustChangePassword: user.mustChangePassword,
    });
  }

  async refresh(token: string, response: Response) {
    const currentUser = await this.validateSession(token);
    const nextToken = createSessionToken();
    const updated = await this.sessionModel
      .findOneAndUpdate(
        {
          tokenHash: hashToken(token),
          expiresAt: { $gt: new Date() },
        },
        {
          $set: {
            tokenHash: hashToken(nextToken),
            expiresAt: new Date(Date.now() + SESSION_TTL_MS),
          },
        },
        { new: true },
      )
      .exec();
    if (!updated) {
      throw new UnauthorizedException('Session has expired');
    }
    response.cookie(SESSION_COOKIE, nextToken, this.cookieOptions());
    return { message: 'Session refreshed', user: currentUser };
  }

  async changePassword(
    userId: string,
    input: ChangePasswordDto,
    response: Response,
  ) {
    validatePasswordBytes(input.newPassword);
    const user = await this.userModel
      .findById(userId)
      .select('+passwordHash')
      .exec();
    if (
      !user ||
      !user.passwordHash ||
      !(await compare(input.currentPassword, user.passwordHash))
    ) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (input.currentPassword === input.newPassword) {
      throw new ConflictException('New password must be different');
    }

    user.passwordHash = await hash(input.newPassword, BCRYPT_ROUNDS);
    user.mustChangePassword = false;
    await user.save();
    await this.sessionModel.deleteMany({ userId: user._id }).exec();
    response.clearCookie(SESSION_COOKIE, this.cookieOptions());
    return { message: 'Password changed; please sign in again' };
  }

  async forgotPassword(email: string) {
    const smtp = this.smtpConfiguration();
    const resetUrl = this.config.get<string>('PASSWORD_RESET_URL');
    if (!resetUrl) {
      throw new ServiceUnavailableException(
        'Password reset delivery is not configured',
      );
    }

    const user = await this.userModel
      .findOne({ email: email.trim().toLowerCase(), accountStatus: 'active' })
      .exec();
    if (user) {
      const token = randomBytes(32).toString('base64url');
      await this.resetModel.deleteMany({ userId: user._id }).exec();
      await this.resetModel.create({
        userId: user._id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
        purpose: 'reset',
      });
      const link = new URL(resetUrl);
      link.searchParams.set('token', token);
      const transport = createTransport(smtp);
      try {
        await transport.sendMail({
          from: this.config.getOrThrow<string>('SMTP_FROM'),
          to: user.email,
          subject: 'Reset your Reyansha account password',
          text: `Use this link within one hour to reset your password: ${link.toString()}`,
        });
      } catch (error) {
        await this.resetModel.deleteOne({ tokenHash: hashToken(token) }).exec();
        throw error;
      }
    }
    return {
      message:
        'If an active account matches that email, password reset instructions will be sent.',
    };
  }

  async inviteUser(email: string) {
    const smtp = this.smtpConfiguration();
    const resetUrl = this.config.get<string>('PASSWORD_RESET_URL');
    if (!resetUrl) {
      throw new ServiceUnavailableException(
        'Password reset delivery is not configured',
      );
    }
    const user = await this.userModel
      .findOne({
        email: email.trim().toLowerCase(),
        accountStatus: 'invited',
        passwordHash: { $exists: false },
      })
      .exec();
    if (!user) {
      throw new NotFoundException('No invited profile exists for that email');
    }

    const token = randomBytes(32).toString('base64url');
    await this.resetModel.deleteMany({ userId: user._id }).exec();
    await this.resetModel.create({
      userId: user._id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
      purpose: 'invite',
    });
    const link = new URL(resetUrl);
    link.searchParams.set('token', token);
    const transport = createTransport(smtp);
    try {
      await transport.sendMail({
        from: this.config.getOrThrow<string>('SMTP_FROM'),
        to: user.email,
        subject: 'Activate your Reyansha account',
        text: `Use this link within one hour to set your password and activate your account: ${link.toString()}`,
      });
    } catch (error) {
      await this.resetModel.deleteOne({ tokenHash: hashToken(token) }).exec();
      throw error;
    }
    return { message: 'Invitation sent' };
  }

  async resetPassword(input: ResetPasswordDto) {
    validatePasswordBytes(input.newPassword);
    const tokenHash = hashToken(input.token);
    const reset = await this.resetModel
      .findOneAndDelete({
        tokenHash,
        expiresAt: { $gt: new Date() },
        purpose: { $in: ['reset', 'invite'] },
      })
      .exec();
    if (!reset) {
      throw new UnauthorizedException(
        'Password reset token is invalid or expired',
      );
    }

    const updated = await this.userModel
      .findOneAndUpdate(
        {
          _id: reset.userId,
          accountStatus: reset.purpose === 'invite' ? 'invited' : 'active',
        },
        {
          $set: {
            passwordHash: await hash(input.newPassword, BCRYPT_ROUNDS),
            ...(reset.purpose === 'invite' ? { accountStatus: 'active' } : {}),
            mustChangePassword: false,
          },
        },
      )
      .exec();
    if (!updated) {
      throw new UnauthorizedException(
        'Account is no longer eligible for reset',
      );
    }
    await Promise.all([
      this.resetModel.deleteMany({ userId: reset.userId }).exec(),
      this.sessionModel.deleteMany({ userId: reset.userId }).exec(),
    ]);
    return { message: 'Password reset successfully; please sign in' };
  }

  async bootstrap(input: BootstrapDto, token: string | undefined) {
    this.validateBootstrapToken(token);
    validatePasswordBytes(input.password);
    const email = input.email.trim().toLowerCase();
    const existingUser = await this.userModel
      .findOne({
        email,
        passwordHash: { $exists: false },
        $or: [
          { accountStatus: 'invited' },
          { accountStatus: { $exists: false } },
        ],
      })
      .exec();
    if (!existingUser) {
      throw new NotFoundException(
        'No unactivated profile exists for that email address',
      );
    }

    try {
      await this.bootstrapClaimModel.create({ _id: 'initial-admin' });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(
          'Initial administrator setup is already complete',
        );
      }
      throw error;
    }

    try {
      const role = await this.roleModel
        .findOne({ key: 'super_admin' })
        .select('_id')
        .exec();
      if (!role) {
        throw new ServiceUnavailableException(
          'Super Admin role is not configured',
        );
      }
      const updated = await this.userModel.findOneAndUpdate(
        {
          _id: existingUser._id,
          passwordHash: { $exists: false },
          $or: [
            { accountStatus: 'invited' },
            { accountStatus: { $exists: false } },
          ],
        },
        {
          $set: {
            passwordHash: await hash(input.password, BCRYPT_ROUNDS),
            accountStatus: 'active',
            roles: [role._id],
            mustChangePassword: false,
          },
        },
        { new: true },
      );
      if (!updated) {
        throw new ConflictException('The profile has already been activated');
      }
    } catch (error) {
      await this.bootstrapClaimModel.deleteOne({ _id: 'initial-admin' }).exec();
      throw error;
    }

    return { message: 'Initial Super Admin account created; please sign in' };
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      path: '/api/v1',
      maxAge: SESSION_TTL_MS,
    };
  }

  private smtpConfiguration() {
    const host = this.config.get<string>('SMTP_HOST');
    const portValue = this.config.get<string>('SMTP_PORT');
    const from = this.config.get<string>('SMTP_FROM');
    const port = Number(portValue);
    if (
      !host ||
      !portValue ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535 ||
      !from
    ) {
      throw new ServiceUnavailableException(
        'Account email delivery is not configured',
      );
    }
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASSWORD');
    if (Boolean(user) !== Boolean(pass)) {
      throw new ServiceUnavailableException(
        'SMTP_USER and SMTP_PASSWORD must be configured together',
      );
    }
    return {
      host,
      port,
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      requireTLS: this.config.get<string>('SMTP_SECURE') !== 'true',
      ...(user && pass ? { auth: { user, pass } } : {}),
    };
  }

  private validateBootstrapToken(token: string | undefined) {
    const configured = this.config.get<string>('AUTH_BOOTSTRAP_TOKEN');
    if (!configured || configured.length < 32 || !token) {
      throw new UnauthorizedException('Bootstrap authorization is required');
    }
    const expected = Buffer.from(configured);
    const provided = Buffer.from(token);
    if (
      expected.length !== provided.length ||
      !timingSafeEqual(expected, provided)
    ) {
      throw new UnauthorizedException('Bootstrap authorization is invalid');
    }
  }
}

function createSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function validatePasswordBytes(password: string) {
  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new BadRequestException('Password must not exceed 72 UTF-8 bytes');
  }
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

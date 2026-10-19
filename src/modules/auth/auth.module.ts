import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from '../roles/role.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import {
  AuthBootstrapClaim,
  AuthBootstrapClaimSchema,
  AuthSession,
  AuthSessionSchema,
  PasswordReset,
  PasswordResetSchema,
} from './auth.schema.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './guards/auth.guard.js';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: AuthSession.name, schema: AuthSessionSchema },
      { name: PasswordReset.name, schema: PasswordResetSchema },
      { name: AuthBootstrapClaim.name, schema: AuthBootstrapClaimSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard, MongooseModule],
})
export class AuthModule {}

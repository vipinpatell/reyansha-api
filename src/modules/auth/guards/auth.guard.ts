import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC } from '../auth.decorator.js';
import type { AuthenticatedRequest } from '../auth.types.js';
import { AuthService } from '../auth.service.js';
import { readCookie } from '../cookie.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readCookie(request.headers.cookie, 'reyansha_session');
    if (!token) {
      throw new UnauthorizedException('Authentication is required');
    }

    const user = await this.authService.validateSession(token);
    request.user = user;
    request.sessionToken = token;
    return true;
  }
}

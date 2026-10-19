import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthenticatedRequest } from './auth.types.js';
import { Public } from './auth.decorator.js';
import { AuthService } from './auth.service.js';
import { BootstrapDto } from './dto/bootstrap.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { InviteUserDto } from './dto/invite-user.dto.js';
import { RequirePermissions } from '../permissions/permissions.decorator.js';
import { PermissionsGuard } from '../permissions/permissions.guard.js';
import { readCookie } from './cookie.js';

@Controller('auth')
@ApiTags('Authentication')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign in and create a secure session cookie' })
  login(
    @Body() input: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(input, response);
  }

  @Post('logout')
  @Public()
  @HttpCode(200)
  logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(
      readCookie(request.headers.cookie, 'reyansha_session'),
      response,
    );
  }

  @Get('me')
  @ApiCookieAuth('reyansha_session')
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.currentUser(request.user!.id);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiCookieAuth('reyansha_session')
  refresh(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refresh(request.sessionToken!, response);
  }

  @Post('change-password')
  @HttpCode(200)
  @ApiCookieAuth('reyansha_session')
  changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() input: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.changePassword(request.user!.id, input, response);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(200)
  forgotPassword(@Body() input: ForgotPasswordDto) {
    return this.authService.forgotPassword(input.email);
  }

  @Post('invite')
  @UseGuards(PermissionsGuard)
  @HttpCode(200)
  @ApiCookieAuth('reyansha_session')
  @RequirePermissions('users.create')
  inviteUser(@Body() input: InviteUserDto) {
    return this.authService.inviteUser(input.email);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(200)
  resetPassword(@Body() input: ResetPasswordDto) {
    return this.authService.resetPassword(input);
  }

  @Post('bootstrap')
  @Public()
  @HttpCode(200)
  @ApiOperation({
    summary:
      'One-time activation of an existing profile as the initial Super Admin',
  })
  bootstrap(@Body() input: BootstrapDto, @Req() request: AuthenticatedRequest) {
    const token = request.headers['x-bootstrap-token'];
    return this.authService.bootstrap(
      input,
      Array.isArray(token) ? token[0] : token,
    );
  }
}

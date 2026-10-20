import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiCookieAuth,
} from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { AuthService } from '../auth/auth.service.js';
import { RequirePermissions } from '../permissions/permissions.decorator.js';
import { PermissionsGuard } from '../permissions/permissions.guard.js';
import { AssignRolesDto } from './dto/assign-roles.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { SetUserPasswordDto } from './dto/set-user-password.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
@ApiTags('Users')
@ApiCookieAuth('reyansha_session')
@UseGuards(PermissionsGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiOkResponse({ description: 'Users returned successfully' })
  @RequirePermissions('users.read', 'users.read_limited')
  findAll(@Req() request: AuthenticatedRequest) {
    return this.usersService.findAll(request.user!);
  }

  @Post()
  @ApiOperation({ summary: 'Create a user' })
  @ApiCreatedResponse({ description: 'User created successfully' })
  @ApiBadRequestResponse({ description: 'The request body is invalid' })
  @ApiConflictResponse({
    description:
      'Username, email, primary mobile, or employee ID is already in use',
  })
  @RequirePermissions('users.create')
  create(@Body() user: CreateUserDto) {
    return this.usersService.create(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB user ID' })
  @ApiOkResponse({ description: 'User returned successfully' })
  @ApiBadRequestResponse({ description: 'The user ID is invalid' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @RequirePermissions('users.read', 'users.read_limited', 'users.update_own')
  findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.usersService.findOne(id, request.user!);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace a user' })
  @ApiParam({ name: 'id', description: 'MongoDB user ID' })
  @ApiOkResponse({ description: 'User replaced successfully' })
  @ApiBadRequestResponse({ description: 'The ID or request body is invalid' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiConflictResponse({
    description:
      'Username, email, primary mobile, or employee ID is already in use',
  })
  @RequirePermissions('users.update')
  replace(
    @Param('id') id: string,
    @Body() user: CreateUserDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.usersService.replace(id, user, request.user!);
  }

  @Patch(':id/roles')
  @RequirePermissions('roles.manage')
  assignRoles(
    @Param('id') id: string,
    @Body() input: AssignRolesDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.usersService.assignRoles(id, input.roleIds, request.user!);
  }

  @Patch(':id/password')
  @ApiOperation({
    summary:
      'Set a user password as Super Admin and require a change at next login',
  })
  @ApiParam({ name: 'id', description: 'MongoDB user ID' })
  @ApiOkResponse({
    description:
      'Password updated, the target is required to change it at next login, and existing sessions are revoked',
  })
  @ApiBadRequestResponse({
    description: 'Invalid user ID or password does not meet the requirements',
  })
  @ApiForbiddenResponse({
    description: 'The caller is not a Super Admin',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @RequirePermissions('roles.manage')
  setPassword(
    @Param('id') id: string,
    @Body() input: SetUserPasswordDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.authService.setUserPasswordBySuperAdmin(
      request.user!,
      id,
      input.password,
    );
  }

  @Patch(':id/deactivate')
  @RequirePermissions('users.deactivate')
  deactivate(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.usersService.deactivate(id, request.user!);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update selected user fields' })
  @ApiParam({ name: 'id', description: 'MongoDB user ID' })
  @ApiOkResponse({ description: 'User updated successfully' })
  @ApiBadRequestResponse({
    description: 'The ID, request body, or update is invalid',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiConflictResponse({
    description:
      'Username, email, primary mobile, or employee ID is already in use',
  })
  @RequirePermissions('users.update', 'users.update_own')
  update(
    @Param('id') id: string,
    @Body() user: UpdateUserDto,
    @Req() request: AuthenticatedRequest,
  ) {
    if (
      !request.user!.permissions.includes('users.update') ||
      (id === request.user!.id &&
        !request.user!.permissions.includes('roles.manage'))
    ) {
      return this.usersService.updateOwn(id, user, request.user!);
    }
    return this.usersService.update(id, user, request.user!);
  }
}

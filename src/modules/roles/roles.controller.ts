import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../permissions/permissions.decorator.js';
import { PermissionsGuard } from '../permissions/permissions.guard.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { RolesService } from './roles.service.js';

@Controller('roles')
@ApiTags('Roles')
@ApiCookieAuth('reyansha_session')
@UseGuards(PermissionsGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('roles.read', 'roles.manage')
  findAll() {
    return this.rolesService.findAll();
  }

  @Post()
  @RequirePermissions('roles.manage')
  create(@Body() input: CreateRoleDto) {
    return this.rolesService.create(input);
  }

  @Patch(':key')
  @RequirePermissions('roles.manage')
  update(@Param('key') key: string, @Body() input: UpdateRoleDto) {
    return this.rolesService.update(key, input);
  }

  @Delete(':key')
  @RequirePermissions('roles.manage')
  remove(@Param('key') key: string) {
    return this.rolesService.remove(key);
  }
}

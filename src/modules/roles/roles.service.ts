import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import {
  DEFAULT_ROLE_NAMES,
  DEFAULT_ROLE_PERMISSIONS,
} from '../permissions/permissions.constants.js';
import { Role } from './role.schema.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { User } from '../users/schemas/user.schema.js';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async onModuleInit(): Promise<void> {
    await Promise.all(
      Object.entries(DEFAULT_ROLE_NAMES).map(([key, name]) =>
        this.roleModel.updateOne(
          { key },
          {
            $setOnInsert: {
              key,
              name,
              permissions: DEFAULT_ROLE_PERMISSIONS[key],
              isSystem: true,
            },
          },
          { upsert: true },
        ),
      ),
    );
  }

  findAll() {
    return this.roleModel.find().sort({ name: 1 }).exec();
  }

  async findByIds(ids: string[]) {
    const roles = await this.roleModel.find({ _id: { $in: ids } }).exec();
    if (roles.length !== ids.length) {
      throw new NotFoundException('One or more roles were not found');
    }
    return roles;
  }

  async findSuperAdmin() {
    const role = await this.roleModel.findOne({ key: 'super_admin' }).exec();
    if (!role) {
      throw new NotFoundException('The Super Admin role is not configured');
    }
    return role;
  }

  async findByKey(key: string) {
    const role = await this.roleModel.findOne({ key }).exec();
    if (!role) {
      throw new NotFoundException(`Role "${key}" is not configured`);
    }
    return role;
  }

  async create(input: CreateRoleDto) {
    if (input.key === 'super_admin') {
      throw new ConflictException('The Super Admin role is reserved');
    }
    try {
      return await this.roleModel.create(input);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(`Role "${input.key}" already exists`);
      }
      throw error;
    }
  }

  async update(key: string, input: UpdateRoleDto) {
    if (key === 'super_admin' && (input.key || input.permissions)) {
      throw new ConflictException(
        'The Super Admin role key and permissions cannot be changed',
      );
    }
    let role: Role | null;
    try {
      role = await this.roleModel
        .findOneAndUpdate(
          { key },
          { $set: input },
          { new: true, runValidators: true },
        )
        .exec();
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(`Role "${input.key}" already exists`);
      }
      throw error;
    }
    if (!role) {
      throw new NotFoundException(`Role "${key}" was not found`);
    }
    return role;
  }

  async remove(key: string) {
    if (key === 'super_admin') {
      throw new ConflictException('The Super Admin role cannot be deleted');
    }
    const role = await this.roleModel.findOne({ key }).exec();
    if (!role) {
      throw new NotFoundException(`Role "${key}" was not found`);
    }
    const assigned = await this.userModel.exists({ roles: role._id }).exec();
    if (assigned) {
      throw new ConflictException(
        'Remove this role from its users before deleting it',
      );
    }
    await role.deleteOne();
    return { message: 'Role deleted successfully' };
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

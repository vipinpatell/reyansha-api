import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './schemas/user.schema.js';
import { RolesService } from '../roles/roles.service.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly rolesService: RolesService,
  ) {}

  async create(user: CreateUserDto) {
    await this.ensureReportingManagerExists(user.reportingManager);
    const employeeRole = await this.rolesService.findByKey('employee');

    try {
      return await this.userModel.create(
        Object.assign({}, user, { roles: [employeeRole._id] }),
      );
    } catch (error) {
      this.throwIfDuplicateUserField(error);
      throw error;
    }
  }

  findAll(actor: AuthenticatedUser) {
    const canReadAll = actor.permissions.includes('users.read');
    const isLimitedReader = actor.permissions.includes('users.read_limited');
    const query = canReadAll
      ? {}
      : isLimitedReader
        ? { reportingManager: actor.id }
        : undefined;
    if (!query) {
      throw new ForbiddenException('You do not have permission to view users');
    }
    const users = this.userModel.find(query);
    if (!canReadAll) {
      users.select(
        'name username email designation userType department employeeId reportingManager profileImage',
      );
    }
    return users.sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    this.validateId(id);
    const canReadAll = actor.permissions.includes('users.read');
    const query = this.userModel.findById(id);
    if (!canReadAll && actor.permissions.includes('users.read_limited')) {
      query.select(
        'name username email designation userType department employeeId reportingManager profileImage',
      );
    }
    const user = await query.exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" was not found`);
    }

    if (
      !actor.permissions.includes('users.read') &&
      !(
        actor.permissions.includes('users.read_limited') &&
        user.reportingManager?.toString() === actor.id
      ) &&
      !(actor.permissions.includes('users.update_own') && user.id === actor.id)
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this user',
      );
    }
    return user;
  }

  async replace(id: string, user: CreateUserDto, actor: AuthenticatedUser) {
    this.validateId(id);
    if (id === actor.id && !actor.permissions.includes('roles.manage')) {
      throw new ForbiddenException(
        'Use profile update to edit your own account',
      );
    }
    await this.ensureCanManageTarget(id, actor);
    await this.ensureReportingManagerExists(user.reportingManager, id);

    const replacement = {
      prefix: user.prefix,
      name: user.name,
      username: user.username,
      dob: user.dob,
      gender: user.gender,
      mobile: user.mobile,
      email: user.email,
      address: user.address,
      profileImage: user.profileImage ?? null,
      designation: user.designation,
      userType: user.userType,
      department: user.department,
      employeeId: user.employeeId,
      reportingManager: user.reportingManager,
      joiningDate: user.joiningDate,
      employmentType: user.employmentType,
      workLocation: user.workLocation,
      tags: user.tags ?? [],
      notes: user.notes,
      emergencyContact: user.emergencyContact,
      alternateContactEmail: user.alternateContactEmail,
      skills: user.skills ?? [],
    };
    const unsetFields = [
      'prefix',
      'designation',
      'userType',
      'department',
      'employeeId',
      'reportingManager',
      'joiningDate',
      'employmentType',
      'workLocation',
      'notes',
      'emergencyContact',
      'alternateContactEmail',
    ];
    const unset = Object.fromEntries(
      Object.entries(replacement)
        .filter(
          ([field, value]) =>
            unsetFields.includes(field) && value === undefined,
        )
        .map(([field]) => [field, 1]),
    );

    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          id,
          {
            $set: Object.fromEntries(
              Object.entries(replacement).filter(
                ([, value]) => value !== undefined,
              ),
            ),
            ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
          },
          { new: true, runValidators: true },
        )
        .exec();
      if (!updatedUser) {
        throw new NotFoundException(`User with ID "${id}" was not found`);
      }

      return updatedUser;
    } catch (error) {
      this.throwIfDuplicateUserField(error);
      throw error;
    }
  }

  async update(id: string, user: UpdateUserDto, actor: AuthenticatedUser) {
    this.validateId(id);
    await this.ensureCanManageTarget(id, actor);
    await this.ensureReportingManagerExists(user.reportingManager, id);

    const updates = flattenUpdate(user);
    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('Provide at least one field to update');
    }

    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          id,
          { $set: updates },
          { new: true, runValidators: true },
        )
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User with ID "${id}" was not found`);
      }

      return updatedUser;
    } catch (error) {
      this.throwIfDuplicateUserField(error);
      throw error;
    }
  }

  async updateOwn(id: string, user: UpdateUserDto, actor: AuthenticatedUser) {
    if (id !== actor.id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    const allowed = new Set([
      'name',
      'email',
      'mobile',
      'address',
      'profileImage',
      'emergencyContact',
      'alternateContactEmail',
    ]);
    if (Object.keys(user).some((key) => !allowed.has(key))) {
      throw new BadRequestException(
        'You can only update your contact and profile information',
      );
    }
    return this.update(id, user, actor);
  }

  async assignRoles(id: string, roleIds: string[], actor: AuthenticatedUser) {
    this.validateId(id);
    await this.ensureCanManageTarget(id, actor);
    const roles = await this.rolesService.findByIds(roleIds);
    const updated = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { roles: roles.map((role) => role._id) } },
        { new: true },
      )
      .exec();
    if (!updated) {
      throw new NotFoundException(`User with ID "${id}" was not found`);
    }
    return updated;
  }

  async deactivate(id: string, actor: AuthenticatedUser) {
    this.validateId(id);
    await this.ensureCanManageTarget(id, actor);
    if (id === actor.id) {
      throw new BadRequestException('You cannot deactivate your own account');
    }
    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { accountStatus: 'deactivated' } },
        { new: true },
      )
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" was not found`);
    }
    return user;
  }

  private validateId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`"${id}" is not a valid user ID`);
    }
  }

  private async ensureReportingManagerExists(
    reportingManagerId?: string,
    userId?: string,
  ) {
    if (!reportingManagerId) {
      return;
    }

    if (reportingManagerId === userId) {
      throw new BadRequestException(
        'A user cannot be their own reporting manager',
      );
    }

    const managerExists = await this.userModel
      .exists({ _id: reportingManagerId })
      .exec();

    if (!managerExists) {
      throw new NotFoundException(
        `Reporting manager with ID "${reportingManagerId}" was not found`,
      );
    }
  }

  private async ensureCanManageTarget(id: string, actor: AuthenticatedUser) {
    const target = await this.userModel.findById(id).select('roles').exec();
    if (!target) {
      throw new NotFoundException(`User with ID "${id}" was not found`);
    }
    const roles =
      target.roles.length > 0
        ? await this.rolesService.findByIds(
            target.roles.map((roleId) => roleId.toString()),
          )
        : [];
    const isPrivilegedTarget = roles.some(
      (role) =>
        ['super_admin', 'admin', 'hr'].includes(role.key) ||
        role.permissions.includes('roles.manage'),
    );
    if (
      isPrivilegedTarget &&
      id !== actor.id &&
      !actor.permissions.includes('roles.manage')
    ) {
      throw new ForbiddenException(
        'Only a role manager can manage privileged accounts',
      );
    }
  }

  private throwIfDuplicateUserField(error: unknown): void {
    if (!isDuplicateKeyError(error)) {
      return;
    }

    const duplicatedField = Object.keys(
      error.keyPattern ?? error.keyValue ?? {},
    )[0];
    const fields: Record<string, string> = {
      username: 'username',
      email: 'email',
      'mobile.primary': 'primary mobile number',
      employeeId: 'employee ID',
    };
    const fieldName = fields[duplicatedField] ?? 'user field';

    throw new ConflictException(`A user with this ${fieldName} already exists`);
  }
}

function flattenUpdate(value: object, prefix = ''): Record<string, unknown> {
  const updates: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (
      child !== null &&
      typeof child === 'object' &&
      !Array.isArray(child) &&
      !(child instanceof Date)
    ) {
      Object.assign(updates, flattenUpdate(child, path));
    } else {
      updates[path] = child;
    }
  }

  return updates;
}

function isDuplicateKeyError(error: unknown): error is {
  code: number;
  keyPattern?: Record<string, unknown>;
  keyValue?: Record<string, unknown>;
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

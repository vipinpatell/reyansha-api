import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './schemas/user.schema.js';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async create(user: CreateUserDto) {
    await this.ensureReportingManagerExists(user.reportingManager);

    try {
      return await this.userModel.create(user);
    } catch (error) {
      this.throwIfDuplicateUserField(error);
      throw error;
    }
  }

  findAll() {
    return this.userModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    this.validateId(id);
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" was not found`);
    }

    return user;
  }

  async replace(id: string, user: CreateUserDto) {
    this.validateId(id);
    await this.ensureReportingManagerExists(user.reportingManager, id);

    try {
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
      const updatedUser = await this.userModel
        .findOneAndReplace(
          { _id: id },
          replacement,
          { returnDocument: 'after', runValidators: true },
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

  async update(id: string, user: UpdateUserDto) {
    this.validateId(id);
    await this.ensureReportingManagerExists(user.reportingManager, id);

    const updates = flattenUpdate(user);
    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('Provide at least one field to update');
    }

    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true })
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
      throw new BadRequestException('A user cannot be their own reporting manager');
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

  private throwIfDuplicateUserField(error: unknown): void {
    if (!isDuplicateKeyError(error)) {
      return;
    }

    const duplicatedField = Object.keys(error.keyPattern ?? error.keyValue ?? {})[0];
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

function isDuplicateKeyError(
  error: unknown,
): error is {
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

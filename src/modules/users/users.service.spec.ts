import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from './schemas/user.schema.js';
import { UsersService } from './users.service.js';
import { RolesService } from '../roles/roles.service.js';

const validUser = {
  name: { firstName: 'Default', lastName: 'User' },
  username: 'defaultuser19',
  dob: '1990-01-01T00:00:00.000Z',
  gender: 'prefer_not_to_say' as const,
  mobile: { primary: '+919000000019' },
  email: 'default.user@reyansha.local',
  address: {
    building: '31 Parkar House',
    streetAddress: 'S Devji Street, Mandvi',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400003',
    country: 'India',
  },
};

describe('UsersService', () => {
  let service: UsersService;
  let userModel: {
    create: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    exists: ReturnType<typeof vi.fn>;
    findOneAndReplace: ReturnType<typeof vi.fn>;
    findByIdAndUpdate: ReturnType<typeof vi.fn>;
  };
  const reader = {
    id: 'user-id',
    email: 'user@example.com',
    permissions: ['users.read'],
    roles: [],
    mustChangePassword: false,
  };
  const updater = {
    ...reader,
    id: 'admin-id',
    permissions: ['users.update'],
  };

  beforeEach(async () => {
    userModel = {
      create: vi.fn(),
      find: vi.fn(),
      findById: vi.fn(),
      exists: vi.fn(),
      findOneAndReplace: vi.fn(),
      findByIdAndUpdate: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: userModel },
        {
          provide: RolesService,
          useValue: {
            findByIds: vi.fn(),
            findByKey: vi.fn().mockResolvedValue({ _id: 'employee-role' }),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('creates a user', async () => {
    const user = { _id: 'user-id' };
    userModel.create.mockResolvedValue(user);

    await expect(service.create(validUser)).resolves.toBe(user);
    expect(userModel.create).toHaveBeenCalledOnce();
  });

  it('lists users sorted by creation time', async () => {
    const users = [{ _id: 'user-id' }];
    const exec = vi.fn().mockResolvedValue(users);
    const sort = vi.fn().mockReturnValue({ exec });
    userModel.find.mockReturnValue({ sort });

    await expect(service.findAll(reader)).resolves.toBe(users);
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('returns a user by ID', async () => {
    const user = { _id: '507f1f77bcf86cd799439011' };
    const exec = vi.fn().mockResolvedValue(user);
    userModel.findById.mockReturnValue({ exec });

    await expect(service.findOne(user._id, reader)).resolves.toBe(user);
  });

  it('validates reporting manager references and prevents self-reporting', async () => {
    const managerId = '507f1f77bcf86cd799439012';
    userModel.findById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({ roles: [] }),
      }),
    });
    userModel.exists.mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: managerId }),
    });
    userModel.create.mockResolvedValue({ _id: 'user-id' });

    await expect(
      service.create({ ...validUser, reportingManager: managerId }),
    ).resolves.toEqual({ _id: 'user-id' });

    await expect(
      service.update(managerId, { reportingManager: managerId }, updater),
    ).rejects.toThrow('A user cannot be their own reporting manager');

    userModel.exists.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });
    await expect(
      service.create({ ...validUser, reportingManager: managerId }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects invalid IDs and reports missing users', async () => {
    await expect(service.findOne('invalid-id')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    userModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(
      service.findOne('507f1f77bcf86cd799439011', reader),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('replaces an existing user and clears omitted optional image fields', async () => {
    const id = '507f1f77bcf86cd799439011';
    const updatedUser = { _id: id };
    userModel.findById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({ roles: [] }),
      }),
    });
    const exec = vi.fn().mockResolvedValue(updatedUser);
    userModel.findByIdAndUpdate.mockReturnValue({ exec });
    await expect(
      service.replace(id, validUser, {
        id: 'admin-id',
        email: 'admin@example.com',
        permissions: ['users.update'],
        roles: [{ key: 'super_admin', name: 'Super Admin' }],
        mustChangePassword: false,
      }),
    ).resolves.toBe(updatedUser);
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      id,
      {
        $set: expect.objectContaining({
          ...validUser,
          profileImage: null,
          tags: [],
          skills: [],
        }),
        $unset: {
          prefix: 1,
          designation: 1,
          userType: 1,
          department: 1,
          employeeId: 1,
          reportingManager: 1,
          joiningDate: 1,
          employmentType: 1,
          workLocation: 1,
          notes: 1,
          emergencyContact: 1,
          alternateContactEmail: 1,
        },
      },
      { new: true, runValidators: true },
    );
    const replacementUpdate = userModel.findByIdAndUpdate.mock.calls[0][1];
    expect(replacementUpdate.$set).not.toHaveProperty('passwordHash');
    expect(replacementUpdate.$set).not.toHaveProperty('roles');
  });

  it('patches nested properties without replacing their sibling fields', async () => {
    const id = '507f1f77bcf86cd799439011';
    const updatedUser = { _id: id };
    const exec = vi.fn().mockResolvedValue(updatedUser);
    userModel.findByIdAndUpdate.mockReturnValue({ exec });
    userModel.findById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({ roles: [] }),
      }),
    });

    await expect(
      service.update(
        id,
        {
          name: { firstName: 'Updated' },
          address: { city: 'Pune' },
          department: 'engineering',
          tags: ['Onshore'],
          emergencyContact: {
            name: 'Priya Patel',
            phone: '+919000000021',
          },
        },
        updater,
      ),
    ).resolves.toBe(updatedUser);
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      id,
      {
        $set: {
          'name.firstName': 'Updated',
          'address.city': 'Pune',
          department: 'engineering',
          tags: ['Onshore'],
          'emergencyContact.name': 'Priya Patel',
          'emergencyContact.phone': '+919000000021',
        },
      },
      { new: true, runValidators: true },
    );
  });

  it('rejects empty patches and translates duplicate-key errors', async () => {
    const id = '507f1f77bcf86cd799439011';
    userModel.findById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({ roles: [] }),
      }),
    });
    await expect(service.update(id, {}, updater)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    userModel.create.mockRejectedValue({
      code: 11000,
      keyPattern: { employeeId: 1 },
    });

    await expect(service.create(validUser)).rejects.toThrow(
      'A user with this employee ID already exists',
    );
  });
});

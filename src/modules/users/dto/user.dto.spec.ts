import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto.js';
import { UpdateUserDto } from './update-user.dto.js';

const validUser = {
  name: { firstName: 'Default', lastName: 'User' },
  username: 'defaultuser19',
  dob: '1990-01-01T00:00:00.000Z',
  gender: 'prefer_not_to_say',
  mobile: {
    primary: '+919000000019',
    alternate: '+919000000020',
  },
  email: 'default.user@reyansha.local',
  address: {
    building: '31 Parkar House',
    streetAddress: 'S Devji Street, Mandvi',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400003',
    country: 'India',
  },
  profileImage: null,
};

describe('CreateUserDto', () => {
  it('accepts the requested user data shape', async () => {
    const dto = plainToInstance(CreateUserDto, validUser);

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('accepts an email address as a username on create and update', async () => {
    const userWithEmailUsername = {
      ...validUser,
      username: 'amitpateldev@gmail.com',
      email: 'amitpateldev@gmail.com',
    };
    const createDto = plainToInstance(CreateUserDto, userWithEmailUsername);
    const updateDto = plainToInstance(UpdateUserDto, {
      username: 'amitpateldev@gmail.com',
    });

    await expect(validate(createDto)).resolves.toHaveLength(0);
    await expect(validate(updateDto)).resolves.toHaveLength(0);
  });

  it.each(['', '   ', undefined])(
    'accepts a blank or omitted alternate mobile (%s)',
    async (alternate) => {
      const dto = plainToInstance(CreateUserDto, {
        ...validUser,
        mobile: { primary: '+919000000019', alternate },
      });

      await expect(validate(dto)).resolves.toHaveLength(0);
    },
  );

  it('accepts a blank alternate mobile in a patch request', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      mobile: { alternate: '   ' },
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('requires nested user objects and rejects unknown properties', async () => {
    const dto = plainToInstance(CreateUserDto, {
      ...validUser,
      address: undefined,
      unexpected: true,
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['address', 'unexpected']),
    );
  });
});

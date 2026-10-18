import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto.js';

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

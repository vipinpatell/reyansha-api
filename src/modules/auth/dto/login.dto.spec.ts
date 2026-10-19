import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto.js';

describe('LoginDto', () => {
  it.each([
    { email: 'person@example.com', password: 'a-password' },
    { identifier: 'person@example.com', password: 'a-password' },
    { identifier: 'personname', password: 'a-password' },
  ])('accepts supported login body %o', async (input) => {
    const dto = plainToInstance(LoginDto, input);
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects a missing identifier/email or password', async () => {
    const dto = plainToInstance(LoginDto, {});
    const errors = await validate(dto);
    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['identifier', 'email', 'password']),
    );
  });

  it('rejects an invalid email when using the email property', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'not-an-email',
      password: 'a-password',
    });
    await expect(validate(dto)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'email' })]),
    );
  });
});

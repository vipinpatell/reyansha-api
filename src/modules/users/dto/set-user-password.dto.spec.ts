import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SetUserPasswordDto } from './set-user-password.dto.js';

describe('SetUserPasswordDto', () => {
  it('accepts a password with at least 12 characters', async () => {
    const dto = plainToInstance(SetUserPasswordDto, {
      password: 'a-strong-password',
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it.each(['short', '', undefined, 123456789012])(
    'rejects an invalid password value (%s)',
    async (password) => {
      const dto = plainToInstance(SetUserPasswordDto, { password });
      await expect(validate(dto)).resolves.not.toHaveLength(0);
    },
  );

  it('rejects extra request properties', async () => {
    const dto = plainToInstance(SetUserPasswordDto, {
      password: 'a-strong-password',
      passwordHash: 'must-not-be-provided',
    });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors.map(({ property }) => property)).toContain('passwordHash');
  });
});

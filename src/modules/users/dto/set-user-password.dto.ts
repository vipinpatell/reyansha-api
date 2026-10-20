import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SetUserPasswordDto {
  @ApiProperty({
    format: 'password',
    minLength: 12,
    maxLength: 72,
    description:
      'New password. Passwords over 72 UTF-8 bytes are rejected because bcrypt truncates longer inputs.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @MaxLength(72)
  password!: string;
}

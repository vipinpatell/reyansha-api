import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({
    example: 'person@example.com',
    description: 'Email address or username. Use this or identifier.',
  })
  @ValidateIf((input: LoginDto) => !input.identifier)
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({
    example: 'person@example.com',
    description: 'Email address or username. Use this or email.',
  })
  @ValidateIf((input: LoginDto) => !input.email)
  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  identifier?: string;

  @ApiProperty({ format: 'password' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class InviteUserDto {
  @ApiProperty({ example: 'person@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

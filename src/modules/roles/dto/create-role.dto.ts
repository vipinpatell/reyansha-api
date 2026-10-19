import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PERMISSIONS } from '../../permissions/permissions.constants.js';

export class CreateRoleDto {
  @ApiProperty({ example: 'hr_manager' })
  @IsString()
  @Matches(/^[a-z][a-z0-9_]{1,49}$/)
  key!: string;

  @ApiProperty({ example: 'HR Manager' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: PERMISSIONS, isArray: true })
  @IsArray()
  @ArrayMaxSize(PERMISSIONS.length)
  @ArrayUnique()
  @IsIn(PERMISSIONS, { each: true })
  permissions!: (typeof PERMISSIONS)[number][];
}

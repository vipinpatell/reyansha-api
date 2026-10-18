import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { USER_GENDERS } from '../user.constants.js';

class UpdateUserNameDto {
  @ApiPropertyOptional({ example: 'Default' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'User' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName?: string;
}

class UpdateUserMobileDto {
  @ApiPropertyOptional({ example: '+919000000019' })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/)
  primary?: string;

  @ApiPropertyOptional({ example: '+919000000020' })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/)
  alternate?: string;
}

class UpdateUserAddressDto {
  @ApiPropertyOptional({ example: '31 Parkar House' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  building?: string;

  @ApiPropertyOptional({ example: 'S Devji Street, Mandvi' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  streetAddress?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ example: '400003' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ type: UpdateUserNameDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateUserNameDto)
  name?: UpdateUserNameDto;

  @ApiPropertyOptional({
    example: 'amitpateldev@gmail.com',
    minLength: 3,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9._-]+(?:@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})?$/)
  username?: string;

  @ApiPropertyOptional({ example: '1990-01-01T00:00:00.000Z', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({ enum: USER_GENDERS, example: 'prefer_not_to_say' })
  @IsOptional()
  @IsIn(USER_GENDERS)
  gender?: (typeof USER_GENDERS)[number];

  @ApiPropertyOptional({ type: UpdateUserMobileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateUserMobileDto)
  mobile?: UpdateUserMobileDto;

  @ApiPropertyOptional({ example: 'default.user@reyansha.local' })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ type: UpdateUserAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateUserAddressDto)
  address?: UpdateUserAddressDto;

  @ApiPropertyOptional({ example: null, nullable: true, type: String })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  profileImage?: string | null;
}

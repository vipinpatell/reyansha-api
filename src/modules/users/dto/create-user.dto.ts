import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsDefined,
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

export class UserNameDto {
  @ApiProperty({ example: 'Default' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'User' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;
}

export class UserMobileDto {
  @ApiProperty({ example: '+919000000019' })
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/)
  primary!: string;

  @ApiPropertyOptional({ example: '+919000000020' })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/)
  alternate?: string;
}

export class UserAddressDto {
  @ApiProperty({ example: '31 Parkar House' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  building!: string;

  @ApiProperty({ example: 'S Devji Street, Mandvi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  streetAddress!: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state!: string;

  @ApiProperty({ example: '400003' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postalCode!: string;

  @ApiProperty({ example: 'India' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country!: string;
}

export class CreateUserDto {
  @ApiProperty({ type: UserNameDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => UserNameDto)
  name!: UserNameDto;

  @ApiProperty({ example: 'defaultuser19', minLength: 3, maxLength: 30 })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  username!: string;

  @ApiProperty({ example: '1990-01-01T00:00:00.000Z', format: 'date-time' })
  @IsDateString()
  dob!: string;

  @ApiProperty({ enum: USER_GENDERS, example: 'prefer_not_to_say' })
  @IsIn(USER_GENDERS)
  gender!: (typeof USER_GENDERS)[number];

  @ApiProperty({ type: UserMobileDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => UserMobileDto)
  mobile!: UserMobileDto;

  @ApiProperty({ example: 'default.user@reyansha.local' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ type: UserAddressDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => UserAddressDto)
  address!: UserAddressDto;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  profileImage?: string | null;
}

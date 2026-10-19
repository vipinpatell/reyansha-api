import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsDefined,
  IsEmail,
  IsIn,
  IsArray,
  ArrayMaxSize,
  ArrayUnique,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  EMPLOYMENT_TYPES,
  USER_DEPARTMENTS,
  USER_GENDERS,
  USER_PREFIXES,
  USER_TYPES,
  WORK_LOCATIONS,
} from '../user.constants.js';

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
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
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

export class UserEmergencyContactDto {
  @ApiProperty({ example: 'Priya Patel' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: '+919000000021' })
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/)
  phone!: string;
}

export class CreateUserDto {
  @ApiPropertyOptional({ enum: USER_PREFIXES, example: 'mr' })
  @IsOptional()
  @IsIn(USER_PREFIXES)
  prefix?: (typeof USER_PREFIXES)[number];

  @ApiProperty({ type: UserNameDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => UserNameDto)
  name!: UserNameDto;

  @ApiProperty({ example: 'amitpateldev@gmail.com', minLength: 3, maxLength: 30 })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9._-]+(?:@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})?$/)
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

  @ApiPropertyOptional({ example: 'Frontend Developer' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  designation?: string;

  @ApiPropertyOptional({ enum: USER_TYPES, example: 'employee' })
  @IsOptional()
  @IsIn(USER_TYPES)
  userType?: (typeof USER_TYPES)[number];

  @ApiPropertyOptional({ enum: USER_DEPARTMENTS, example: 'engineering' })
  @IsOptional()
  @IsIn(USER_DEPARTMENTS)
  department?: (typeof USER_DEPARTMENTS)[number];

  @ApiPropertyOptional({ example: 'EMP-1001', maxLength: 50 })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/)
  @MaxLength(50)
  employeeId?: string;

  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439011',
    description: 'MongoDB ID of the reporting manager',
  })
  @IsOptional()
  @IsMongoId()
  reportingManager?: string;

  @ApiPropertyOptional({
    example: '2024-01-15T00:00:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @ApiPropertyOptional({ enum: EMPLOYMENT_TYPES, example: 'full_time' })
  @IsOptional()
  @IsIn(EMPLOYMENT_TYPES)
  employmentType?: (typeof EMPLOYMENT_TYPES)[number];

  @ApiPropertyOptional({ enum: WORK_LOCATIONS, example: 'hybrid' })
  @IsOptional()
  @IsIn(WORK_LOCATIONS)
  workLocation?: (typeof WORK_LOCATIONS)[number];

  @ApiPropertyOptional({ type: [String], example: ['Onshore', 'Project-A'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(25)
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'Additional internal notes.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ type: UserEmergencyContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserEmergencyContactDto)
  emergencyContact?: UserEmergencyContactDto;

  @ApiPropertyOptional({ example: 'contact@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  alternateContactEmail?: string;

  @ApiPropertyOptional({ type: [String], example: ['TypeScript', 'NestJS'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(100, { each: true })
  skills?: string[];
}

import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsArray, IsMongoId } from 'class-validator';

export class AssignRolesDto {
  @ApiProperty({
    example: ['507f1f77bcf86cd799439011'],
    type: [String],
  })
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsMongoId({ each: true })
  roleIds!: string[];
}

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class LoginDto {
  @ApiProperty({ example: 'admin@institution.edu' })
  @Transform(trimString)
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'your-password', minLength: 1 })
  @IsString()
  @MinLength(1)
  password!: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'IAM OAuth access JWT (Bearer)' })
  access_token!: string;

  @ApiProperty()
  user_id!: string;

  @ApiProperty({
    description: 'Always DEFAULT_TENANT_ID for this portal',
  })
  tenant_id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ type: [String], example: ['ADMISSIONS_ADMIN'] })
  roles!: string[];
}

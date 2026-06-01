import {
  IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateArDto {
  @ApiProperty({ example: '2026-04-20' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Electricity Company of Ghana' })
  @IsString()
  @IsNotEmpty()
  client: string;

  @ApiPropertyOptional({ example: 'Enterprise Insurance' })
  @IsOptional()
  @IsString()
  insurer?: string;

  @ApiProperty({ example: 'Motor', enum: ['Motor','Fire & Property','Life','Engineering','Bonds','Marine','Other'] })
  @IsString()
  @IsNotEmpty()
  product: string;

  @ApiProperty({ example: 'GH¢', enum: ['GH¢', 'USD', 'EUR', 'GBP'] })
  @IsEnum(['GH¢', 'USD', 'EUR', 'GBP'])
  currency: 'GH¢' | 'USD' | 'EUR' | 'GBP' = 'GH¢';

  @ApiProperty({ example: 1.0 })
  @IsNumber()
  @Min(0)
  fxRate: number = 1;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sumInsured?: number;

  @ApiProperty({ example: 45000, description: 'Premium amount in GH¢' })
  @IsNumber()
  @Min(0)
  premium: number;

  @ApiPropertyOptional({ example: 4500, description: 'Commission earned in GH¢' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  commission?: number;

  @ApiProperty({ example: 7820, description: 'Outstanding balance in GH¢' })
  @IsNumber()
  @Min(0)
  outstandingBalance: number;

  @ApiProperty({ example: 'Pending', enum: ['Pending', 'Partial', 'Collected', 'Disputed'] })
  @IsEnum(['Pending', 'Partial', 'Collected', 'Disputed'])
  status: 'Pending' | 'Partial' | 'Collected' | 'Disputed' = 'Pending';
}

export class UpdateArDto extends PartialType(CreateArDto) {}

export class ArQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() client?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() insurer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() product?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(['Pending','Partial','Collected','Disputed']) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
}

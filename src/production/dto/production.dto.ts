import {
  IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateProductionDto {
  @ApiProperty({ example: '2026-04-20' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'POL-2026-0001' })
  @IsOptional()
  @IsString()
  ref?: string;

  @ApiProperty({ example: 'Enterprise Insurance Company' })
  @IsString()
  @IsNotEmpty()
  insurer: string;

  @ApiPropertyOptional({ example: 'Horizon Re Ltd', description: 'Required when insurer is "Other (specify below)"' })
  @IsOptional()
  @IsString()
  insurerOther?: string;

  @ApiProperty({
    example: 'Motor',
    enum: ['Motor','Fire, Theft & Property','Life Insurance','Financial Guarantees & Bonds',
           'Engineering','Marine & Aviation','Liability','Personal Accident & Health','Other Short Term'],
  })
  @IsString()
  @IsNotEmpty()
  product: string;

  @ApiProperty({ example: 'Q1 2026 (Jan–Mar)' })
  @IsString()
  @IsNotEmpty()
  period: string;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  premium?: number;

  @ApiProperty({ example: 850.00, description: 'Commission earned (GH¢)' })
  @IsNumber()
  @Min(0.01)
  commission: number;

  @ApiPropertyOptional({ example: 'Kofi Mensah / ABC Ltd' })
  @IsOptional()
  @IsString()
  client?: string;
}

export class UpdateProductionDto extends PartialType(CreateProductionDto) {}

export class ProductionQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() period?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() insurer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() product?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
}

import {
  IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateImprestDto {
  @ApiProperty({ example: '2026-04-20' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'CHQ-001' })
  @IsOptional()
  @IsString()
  chq?: string;

  @ApiPropertyOptional({ example: 'INV-2026-001' })
  @IsOptional()
  @IsString()
  invoice?: string;

  @ApiProperty({ example: 'Kumasi Fuel Station' })
  @IsString()
  @IsNotEmpty()
  payee: string;

  @ApiProperty({ example: 'Fuel for office vehicle' })
  @IsString()
  @IsNotEmpty()
  details: string;

  @ApiProperty({
    example: 'Fuel & Lubricants',
    enum: [
      'Printing & Stationery','Communication','Utilities','Levies & Licensing',
      'Fuel & Lubricants','Travelling & Transport','Repairs & Maintenance',
      'Rent & Occupancy','Refreshment & Entertainment','Office Supplies',
      'MOMO Charge','Commission Allowance',
    ],
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 250.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: ['payment', 'receipt'], default: 'payment' })
  @IsEnum(['payment', 'receipt'])
  txType: 'payment' | 'receipt' = 'payment';

  @ApiProperty({ example: 'Q1 2026' })
  @IsString()
  @IsNotEmpty()
  period: string;
}

export class UpdateImprestDto extends PartialType(CreateImprestDto) {}

export class ImprestQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() period?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(['payment', 'receipt']) txType?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
}

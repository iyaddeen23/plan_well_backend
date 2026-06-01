import {
  IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateJournalDto {
  @ApiProperty({ example: '2026-04-20' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'JNL-2026-001' })
  @IsString()
  @IsNotEmpty()
  ref: string;

  @ApiProperty({ example: 'Depreciation charge — Motor Vehicles' })
  @IsString()
  @IsNotEmpty()
  particulars: string;

  @ApiProperty({ example: 'Depreciation Expense' })
  @IsString()
  @IsNotEmpty()
  drAccount: string;

  @ApiProperty({ example: 'Accumulated Depreciation — Motor Vehicles' })
  @IsString()
  @IsNotEmpty()
  crAccount: string;

  @ApiProperty({ example: 14256 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: ['journal', 'adjustment', 'correction'], default: 'journal' })
  @IsEnum(['journal', 'adjustment', 'correction'])
  entryType: 'journal' | 'adjustment' | 'correction' = 'journal';

  @ApiPropertyOptional({ example: 'Annual depreciation — motor vehicles' })
  @IsOptional()
  @IsString()
  narration?: string;

  @ApiProperty({ example: 'Q1 2026', description: 'Accounting period' })
  @IsString()
  @IsNotEmpty()
  period: string;
}

export class UpdateJournalDto extends PartialType(CreateJournalDto) {}

export class JournalQueryDto {
  @ApiPropertyOptional({ example: 'Q1 2026' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-03-31' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ enum: ['journal', 'adjustment', 'correction'] })
  @IsOptional()
  @IsEnum(['journal', 'adjustment', 'correction'])
  entryType?: string;
}

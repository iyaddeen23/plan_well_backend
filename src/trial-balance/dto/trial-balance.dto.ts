import {
  IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateTbDto {
  @ApiProperty({ example: 'Accrued Audit Fees' })
  @IsString()
  @IsNotEmpty()
  particulars: string;

  @ApiPropertyOptional({ example: 6000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  debit?: number;

  @ApiPropertyOptional({ example: 6000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  credit?: number;

  @ApiProperty({ example: '2026', enum: ['2026', '2025', 'Both'] })
  @IsEnum(['2026', '2025', 'Both'])
  period: '2026' | '2025' | 'Both' = '2026';

  @ApiProperty({
    example: 'Audit Adjustment',
    enum: ['Audit Adjustment', 'Journal Entry', 'Reclassification', 'Accrual'],
  })
  @IsEnum(['Audit Adjustment', 'Journal Entry', 'Reclassification', 'Accrual'])
  adjType: 'Audit Adjustment' | 'Journal Entry' | 'Reclassification' | 'Accrual';

  @ApiPropertyOptional({ example: 'Accrual of outstanding audit fees for 2025 FY' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTbDto extends PartialType(CreateTbDto) {}

export class TbQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsEnum(['2026','2025','Both']) period?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(['Audit Adjustment','Journal Entry','Reclassification','Accrual']) adjType?: string;
}

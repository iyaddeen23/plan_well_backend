import {
  IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateBankDto {
  @ApiProperty({ example: '2026-04-20' })
  @IsDateString()
  date: string;

  @ApiProperty({
    example: 'Fidelity Bank USD — Acct 11',
    enum: ['Fidelity Bank USD — Acct 11','Fidelity Bank USD — FBL 19','Ecobank GH¢','Ecobank EUR'],
  })
  @IsString()
  @IsNotEmpty()
  account: string;

  @ApiProperty({ example: 'USD', enum: ['GH¢', 'USD', 'EUR'] })
  @IsEnum(['GH¢', 'USD', 'EUR'])
  currency: 'GH¢' | 'USD' | 'EUR' = 'GH¢';

  @ApiProperty({ example: 10.45 })
  @IsNumber()
  @Min(0)
  fxRate: number = 1;

  @ApiProperty({ example: 500, description: 'Amount in foreign currency' })
  @IsNumber()
  @Min(0.01)
  amountForeign: number;

  @ApiProperty({ example: 5225, description: 'GH¢ equivalent (auto-calculated)' })
  @IsNumber()
  @Min(0)
  amountGhc: number;

  @ApiProperty({
    example: 'Credit (Deposit)',
    enum: ['Credit (Deposit)','Debit (Withdrawal)','Bank Charge','Interest Charged'],
  })
  @IsEnum(['Credit (Deposit)','Debit (Withdrawal)','Bank Charge','Interest Charged'])
  txType: 'Credit (Deposit)' | 'Debit (Withdrawal)' | 'Bank Charge' | 'Interest Charged';

  @ApiPropertyOptional({ example: 'CHQ-2026-001' })
  @IsOptional()
  @IsString()
  ref?: string;

  @ApiPropertyOptional({ example: 'Commission receipt from Enterprise' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'Q1 2026' })
  @IsString()
  @IsNotEmpty()
  period: string;
}

export class UpdateBankDto extends PartialType(CreateBankDto) {}

export class BankQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() period?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() account?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(['GH¢','USD','EUR']) currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(['Credit (Deposit)','Debit (Withdrawal)','Bank Charge','Interest Charged']) txType?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
}

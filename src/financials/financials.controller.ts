import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FinancialsService } from './financials.service';
import { JwtGuard } from '../auth/guards/jwt.guard';

@ApiTags('Financials (Read-only computed data)')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('financials')
export class FinancialsController {
  constructor(private readonly financialsService: FinancialsService) {}

  @Get('periods')
  @ApiOperation({ summary: 'List all available period keys' })
  getPeriods() {
    return this.financialsService.getPeriods();
  }

  @Get('period/:period')
  @ApiOperation({ summary: 'Compute full financial data for a period (q1/q2/q3/q4/fy/6y/6ytd)' })
  computePeriod(@Param('period') period: string) {
    return this.financialsService.computePeriod(period);
  }

  @Get('insurers')
  @ApiOperation({ summary: 'Return insurer names and commission values (2025 vs 2026)' })
  getInsurers() {
    return this.financialsService.getInsurers();
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Expense breakdown for a period' })
  @ApiQuery({ name: 'period', required: false, example: 'fy' })
  getExpenses(@Query('period') period?: string) {
    return this.financialsService.getExpenseBreakdown(period ?? 'fy');
  }
}

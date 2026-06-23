import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Compute full financial data for a period (jan–dec / q1–q4 / fy / 6y / 6ytd)' })
  computePeriod(@Req() req: any, @Param('period') period: string) {
    return this.financialsService.computePeriod(req.user.id, period);
  }

  @Get('insurers')
  @ApiOperation({ summary: 'Commission by insurer — current year vs prior year' })
  getInsurers(@Req() req: any) {
    return this.financialsService.getInsurers(req.user.id);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Expense breakdown for a period' })
  @ApiQuery({ name: 'period', required: false, example: 'fy' })
  getExpenses(@Req() req: any, @Query('period') period?: string) {
    return this.financialsService.getExpenseBreakdown(req.user.id, period ?? 'fy');
  }
}

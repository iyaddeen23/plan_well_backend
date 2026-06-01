import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BankService } from './bank.service';
import { CreateBankDto, UpdateBankDto, BankQueryDto } from './dto/bank.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@ApiTags('Bank Transactions')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('bank')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Post()
  @ApiOperation({ summary: 'Record a bank transaction' })
  create(@Req() req: any, @Body() dto: CreateBankDto) {
    return this.bankService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List bank transactions' })
  findAll(@Req() req: any, @Query() query: BankQueryDto) {
    return this.bankService.findAll(req.user.id, query);
  }

  @Get('reconciliation')
  @ApiOperation({ summary: 'Bank reconciliation summary (credits vs debits by account)' })
  reconciliation(@Req() req: any, @Query('period') period?: string) {
    return this.bankService.reconciliation(req.user.id, period);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one bank transaction' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.bankService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a bank transaction' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateBankDto) {
    return this.bankService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bank transaction' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.bankService.remove(req.user.id, id);
  }
}

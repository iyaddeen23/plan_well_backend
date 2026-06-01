import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TrialBalanceService } from './trial-balance.service';
import { CreateTbDto, UpdateTbDto, TbQueryDto } from './dto/trial-balance.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@ApiTags('Trial Balance')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('trial-balance')
export class TrialBalanceController {
  constructor(private readonly tbService: TrialBalanceService) {}

  @Post()
  @ApiOperation({ summary: 'Post a trial balance adjustment' })
  create(@Req() req: any, @Body() dto: CreateTbDto) {
    return this.tbService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all TB adjustments' })
  findAll(@Req() req: any, @Query() query: TbQueryDto) {
    return this.tbService.findAll(req.user.id, query);
  }

  @Get('balance-check')
  @ApiOperation({ summary: 'Check if debits equal credits across all adjustments' })
  balanceCheck(@Req() req: any) {
    return this.tbService.balanceCheck(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single TB adjustment' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.tbService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a TB adjustment' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateTbDto) {
    return this.tbService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a TB adjustment' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.tbService.remove(req.user.id, id);
  }
}

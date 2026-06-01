import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ImprestService } from './imprest.service';
import { CreateImprestDto, UpdateImprestDto, ImprestQueryDto } from './dto/imprest.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@ApiTags('Imprest Cash Book')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('imprest')
export class ImprestController {
  constructor(private readonly imprestService: ImprestService) {}

  @Post()
  @ApiOperation({ summary: 'Record an imprest transaction' })
  create(@Req() req: any, @Body() dto: CreateImprestDto) {
    return this.imprestService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List imprest transactions' })
  findAll(@Req() req: any, @Query() query: ImprestQueryDto) {
    return this.imprestService.findAll(req.user.id, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Cash flow summary by category' })
  summary(@Req() req: any, @Query('period') period?: string) {
    return this.imprestService.summary(req.user.id, period);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one imprest transaction' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.imprestService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an imprest transaction' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateImprestDto) {
    return this.imprestService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an imprest transaction' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.imprestService.remove(req.user.id, id);
  }
}

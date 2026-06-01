import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ArService } from './ar.service';
import { CreateArDto, UpdateArDto, ArQueryDto } from './dto/ar.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@ApiTags('Accounts Receivable')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('ar')
export class ArController {
  constructor(private readonly arService: ArService) {}

  @Post()
  @ApiOperation({ summary: 'Add an accounts receivable entry' })
  create(@Req() req: any, @Body() dto: CreateArDto) {
    return this.arService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List receivables (filterable)' })
  findAll(@Req() req: any, @Query() query: ArQueryDto) {
    return this.arService.findAll(req.user.id, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Outstanding balance summary by status and product' })
  summary(@Req() req: any) {
    return this.arService.summary(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one AR entry' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.arService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an AR entry (e.g. change status to Collected)' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateArDto) {
    return this.arService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an AR entry' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.arService.remove(req.user.id, id);
  }
}

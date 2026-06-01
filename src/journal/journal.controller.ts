import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JournalService } from './journal.service';
import { CreateJournalDto, UpdateJournalDto, JournalQueryDto } from './dto/journal.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@ApiTags('Journal Entries')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('journal')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post()
  @ApiOperation({ summary: 'Create a journal entry' })
  @ApiResponse({ status: 201, description: 'Entry created' })
  create(@Req() req: any, @Body() dto: CreateJournalDto) {
    return this.journalService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List journal entries (filterable by period/date/type)' })
  findAll(@Req() req: any, @Query() query: JournalQueryDto) {
    return this.journalService.findAll(req.user.id, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Summary stats for journal entries' })
  summary(@Req() req: any, @Query('period') period?: string) {
    return this.journalService.summary(req.user.id, period);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single journal entry by ID' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.journalService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a journal entry' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateJournalDto) {
    return this.journalService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a journal entry' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.journalService.remove(req.user.id, id);
  }
}

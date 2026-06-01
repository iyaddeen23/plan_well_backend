import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductionService } from './production.service';
import { CreateProductionDto, UpdateProductionDto, ProductionQueryDto } from './dto/production.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@ApiTags('Production (Commission by Insurer)')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post()
  @ApiOperation({ summary: 'Record a production / commission entry' })
  create(@Req() req: any, @Body() dto: CreateProductionDto) {
    return this.productionService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List production entries' })
  findAll(@Req() req: any, @Query() query: ProductionQueryDto) {
    return this.productionService.findAll(req.user.id, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Commission totals by insurer and product line' })
  summary(@Req() req: any, @Query('period') period?: string) {
    return this.productionService.summary(req.user.id, period);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one production entry' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.productionService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a production entry' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProductionDto) {
    return this.productionService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a production entry' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.productionService.remove(req.user.id, id);
  }
}

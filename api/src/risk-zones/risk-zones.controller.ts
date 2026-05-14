import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateRiskZoneDto } from './dto/create-risk-zone.dto';
import { UpdateRiskZoneDto } from './dto/update-risk-zone.dto';
import { RiskZonesService } from './risk-zones.service';

@Controller('risk-zones')
export class RiskZonesController {
  constructor(private readonly zones: RiskZonesService) {}

  @Get()
  list() {
    return this.zones.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.zones.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateRiskZoneDto) {
    return this.zones.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRiskZoneDto) {
    return this.zones.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.zones.remove(id);
  }
}

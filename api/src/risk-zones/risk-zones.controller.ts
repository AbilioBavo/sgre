import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RiskZonesService } from './risk-zones.service';
import { CreateRiskZoneDto } from './dto/create-risk-zone.dto';
import { UpdateRiskZoneDto } from './dto/update-risk-zone.dto';

@Controller('risk-zones')
export class RiskZonesController {
  constructor(private readonly riskZonesService: RiskZonesService) {}

  @Post()
  create(@Body() createRiskZoneDto: CreateRiskZoneDto) {
    return this.riskZonesService.create(createRiskZoneDto);
  }

  @Get()
  findAll() {
    return this.riskZonesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.riskZonesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRiskZoneDto: UpdateRiskZoneDto) {
    return this.riskZonesService.update(+id, updateRiskZoneDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.riskZonesService.remove(+id);
  }
}

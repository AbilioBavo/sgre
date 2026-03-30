import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident.dto';
import { IncidentStatus } from './incidents.types';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  create(@Body() createIncidentDto: CreateIncidentDto) {
    return this.incidentsService.create(createIncidentDto);
  }

  @Get()
  findAll(@Query('status') status?: IncidentStatus) {
    return this.incidentsService.findAll(status);
  }

  @Get('map')
  findVerifiedForMap() {
    return this.incidentsService.findVerifiedForMap();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() updateIncidentDto: UpdateIncidentStatusDto) {
    return this.incidentsService.updateStatus(id, updateIncidentDto);
  }
}

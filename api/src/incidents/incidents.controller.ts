import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { IncidentsService } from './incidents.service';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidents: IncidentsService) {}

  @Post()
  create(@Body() dto: CreateIncidentDto) {
    return this.incidents.create(dto);
  }

  @Get()
  list(
    @Query('status') status?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'RESOLVED',
    @Query('type') type?: 'FLOOD' | 'BLOCKED_ROAD' | 'ACCIDENT' | 'FIRE' | 'OTHER',
  ) {
    return this.incidents.findAll({ status, type });
  }

  @Get('verified-active')
  verifiedActive() {
    return this.incidents.findVerifiedActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidents.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateIncidentDto) {
    return this.incidents.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/verify')
  verify(@Param('id') id: string) {
    return this.incidents.setStatus(id, 'VERIFIED');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.incidents.setStatus(id, 'REJECTED');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/resolve')
  resolve(@Param('id') id: string) {
    return this.incidents.setStatus(id, 'RESOLVED');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incidents.remove(id);
  }
}

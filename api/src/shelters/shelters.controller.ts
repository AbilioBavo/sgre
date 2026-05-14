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
import { CreateShelterDto } from './dto/create-shelter.dto';
import { UpdateShelterDto } from './dto/update-shelter.dto';
import { SheltersService } from './shelters.service';

@Controller('shelters')
export class SheltersController {
  constructor(private readonly shelters: SheltersService) {}

  @Get()
  list(
    @Query('nearLat') nearLat?: string,
    @Query('nearLng') nearLng?: string,
    @Query('radius') radius?: string,
    @Query('status') status?: 'OPEN' | 'FULL' | 'CLOSED',
  ) {
    return this.shelters.findAll({
      nearLat: nearLat ? Number(nearLat) : undefined,
      nearLng: nearLng ? Number(nearLng) : undefined,
      radiusKm: radius ? Number(radius) : undefined,
      status,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shelters.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateShelterDto) {
    return this.shelters.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShelterDto) {
    return this.shelters.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shelters.remove(id);
  }
}

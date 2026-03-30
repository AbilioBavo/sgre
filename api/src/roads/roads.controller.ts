import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RoadsService } from './roads.service';
import { CreateRoadDto } from './dto/create-road.dto';
import { UpdateRoadDto } from './dto/update-road.dto';

@Controller('roads')
export class RoadsController {
  constructor(private readonly roadsService: RoadsService) {}

  @Post()
  create(@Body() createRoadDto: CreateRoadDto) {
    return this.roadsService.create(createRoadDto);
  }

  @Get()
  findAll() {
    return this.roadsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roadsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoadDto: UpdateRoadDto) {
    return this.roadsService.update(+id, updateRoadDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roadsService.remove(+id);
  }
}

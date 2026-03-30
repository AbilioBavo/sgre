import { Injectable } from '@nestjs/common';
import { CreateRoadDto } from './dto/create-road.dto';
import { UpdateRoadDto } from './dto/update-road.dto';

@Injectable()
export class RoadsService {
  create(createRoadDto: CreateRoadDto) {
    return 'This action adds a new road';
  }

  findAll() {
    return `This action returns all roads`;
  }

  findOne(id: number) {
    return `This action returns a #${id} road`;
  }

  update(id: number, updateRoadDto: UpdateRoadDto) {
    return `This action updates a #${id} road`;
  }

  remove(id: number) {
    return `This action removes a #${id} road`;
  }
}

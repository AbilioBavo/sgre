import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWeatherDto } from './dto/create-weather.dto';
import { UpdateWeatherDto } from './dto/update-weather.dto';

@Injectable()
export class WeatherService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateWeatherDto) {
    return this.prisma.weatherData.create({ data: dto });
  }

  findAll() {
    return this.prisma.weatherData.findMany({ orderBy: { recordedAt: 'desc' } });
  }

  async findOne(id: string) {
    const w = await this.prisma.weatherData.findUnique({ where: { id } });
    if (!w) throw new NotFoundException();
    return w;
  }

  update(id: string, dto: UpdateWeatherDto) {
    return this.prisma.weatherData.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.prisma.weatherData.delete({ where: { id } });
    return { id };
  }
}

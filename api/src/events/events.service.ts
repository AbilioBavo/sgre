import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  log(type: string, payload: Record<string, unknown> = {}) {
    return this.prisma.eventLog.create({
      data: { type, payload: payload as unknown as object },
    });
  }

  create(dto: CreateEventDto) {
    return this.prisma.eventLog.create({
      data: { type: dto.type, payload: (dto.payload ?? {}) as unknown as object },
    });
  }

  findAll(limit = 50) {
    return this.prisma.eventLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

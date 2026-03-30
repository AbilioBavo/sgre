import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShelterDto } from './dto/create-shelter.dto';

type ShelterMapItem = {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  status: 'OPEN' | 'FULL' | 'CLOSED';
  lat: number;
  lng: number;
  createdAt: Date;
};

@Injectable()
export class SheltersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createShelterDto: CreateShelterDto): Promise<ShelterMapItem> {
    const [shelter] = await this.prisma.$queryRaw<ShelterMapItem[]>(Prisma.sql`
      INSERT INTO "Shelter" ("id", "name", "capacity", "occupied", "status", "location", "createdAt")
      VALUES (
        gen_random_uuid()::text,
        ${createShelterDto.name},
        ${createShelterDto.capacity},
        0,
        'OPEN'::"ShelterStatus",
        ST_SetSRID(ST_MakePoint(${createShelterDto.lng}, ${createShelterDto.lat}), 4326),
        now()
      )
      RETURNING
        "id",
        "name",
        "capacity",
        "occupied",
        "status",
        ST_Y("location")::double precision AS "lat",
        ST_X("location")::double precision AS "lng",
        "createdAt"
    `);

    return shelter;
  }

  async findAll(): Promise<ShelterMapItem[]> {
    return this.prisma.$queryRaw<ShelterMapItem[]>(Prisma.sql`
      SELECT
        "id",
        "name",
        "capacity",
        "occupied",
        "status",
        ST_Y("location")::double precision AS "lat",
        ST_X("location")::double precision AS "lng",
        "createdAt"
      FROM "Shelter"
      ORDER BY "createdAt" DESC
    `);
  }
}

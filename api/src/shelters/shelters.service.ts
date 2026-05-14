import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShelterDto } from './dto/create-shelter.dto';
import { UpdateShelterDto } from './dto/update-shelter.dto';

export interface ShelterDto {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  status: 'OPEN' | 'FULL' | 'CLOSED';
  lat: number;
  lng: number;
  createdAt: Date;
}

@Injectable()
export class SheltersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateShelterDto): Promise<ShelterDto> {
    const rows = await this.prisma.$queryRaw<ShelterDto[]>`
      INSERT INTO "Shelter" (id, name, capacity, occupied, status, location, "createdAt")
      VALUES (
        gen_random_uuid(),
        ${dto.name},
        ${dto.capacity},
        ${dto.occupied ?? 0},
        ${dto.status ?? 'OPEN'}::"ShelterStatus",
        ST_SetSRID(ST_MakePoint(${dto.lng}, ${dto.lat}), 4326),
        NOW()
      )
      RETURNING id, name, capacity, occupied, status::text AS status,
                ST_Y(location) AS lat, ST_X(location) AS lng, "createdAt"
    `;
    return rows[0];
  }

  async findAll(filters?: {
    nearLat?: number;
    nearLng?: number;
    radiusKm?: number;
    status?: 'OPEN' | 'FULL' | 'CLOSED';
  }): Promise<ShelterDto[]> {
    const status = filters?.status;
    const near = filters?.nearLat != null && filters?.nearLng != null;
    const radiusM = (filters?.radiusKm ?? 50) * 1000;

    if (near) {
      return this.prisma.$queryRaw<ShelterDto[]>`
        SELECT id, name, capacity, occupied, status::text AS status,
               ST_Y(location) AS lat, ST_X(location) AS lng, "createdAt"
          FROM "Shelter"
         WHERE (${status ?? null}::text IS NULL OR status::text = ${status ?? null})
           AND ST_DWithin(
                 location::geography,
                 ST_SetSRID(ST_MakePoint(${filters.nearLng!}, ${filters.nearLat!}), 4326)::geography,
                 ${radiusM}
               )
         ORDER BY ST_Distance(
                    location::geography,
                    ST_SetSRID(ST_MakePoint(${filters.nearLng!}, ${filters.nearLat!}), 4326)::geography
                  ) ASC
      `;
    }

    return this.prisma.$queryRaw<ShelterDto[]>`
      SELECT id, name, capacity, occupied, status::text AS status,
             ST_Y(location) AS lat, ST_X(location) AS lng, "createdAt"
        FROM "Shelter"
       WHERE (${status ?? null}::text IS NULL OR status::text = ${status ?? null})
       ORDER BY "createdAt" DESC
    `;
  }

  async findOne(id: string): Promise<ShelterDto> {
    const rows = await this.prisma.$queryRaw<ShelterDto[]>`
      SELECT id, name, capacity, occupied, status::text AS status,
             ST_Y(location) AS lat, ST_X(location) AS lng, "createdAt"
        FROM "Shelter" WHERE id = ${id}::uuid
    `;
    if (!rows[0]) throw new NotFoundException('Abrigo não encontrado');
    return rows[0];
  }

  async update(id: string, dto: UpdateShelterDto): Promise<ShelterDto> {
    await this.findOne(id);
    const rows = await this.prisma.$queryRaw<ShelterDto[]>`
      UPDATE "Shelter"
         SET name      = COALESCE(${dto.name ?? null}, name),
             capacity  = COALESCE(${dto.capacity ?? null}::int, capacity),
             occupied  = COALESCE(${dto.occupied ?? null}::int, occupied),
             status    = COALESCE(${dto.status ?? null}::"ShelterStatus", status),
             location  = CASE
                           WHEN ${dto.lat ?? null}::float IS NOT NULL
                            AND ${dto.lng ?? null}::float IS NOT NULL
                           THEN ST_SetSRID(ST_MakePoint(${dto.lng ?? null}::float, ${dto.lat ?? null}::float), 4326)
                           ELSE location
                         END
       WHERE id = ${id}::uuid
       RETURNING id, name, capacity, occupied, status::text AS status,
                 ST_Y(location) AS lat, ST_X(location) AS lng, "createdAt"
    `;
    return rows[0];
  }

  async remove(id: string): Promise<{ id: string }> {
    await this.findOne(id);
    await this.prisma.$executeRaw`DELETE FROM "Shelter" WHERE id = ${id}::uuid`;
    return { id };
  }
}

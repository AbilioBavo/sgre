import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoadDto } from './dto/create-road.dto';
import { UpdateRoadDto } from './dto/update-road.dto';

export interface RoadDto {
  id: string;
  name: string | null;
  type: 'PRIMARY' | 'SECONDARY' | 'TERTIARY' | 'DIRT';
  isBlocked: boolean;
  condition: 'NORMAL' | 'FLOODED' | 'DAMAGED' | 'BLOCKED';
  path: unknown;
  updatedAt: Date;
}

@Injectable()
export class RoadsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRoadDto): Promise<RoadDto> {
    const json = JSON.stringify(dto.path);
    const rows = await this.prisma.$queryRaw<RoadDto[]>`
      INSERT INTO "Road" (id, name, type, "isBlocked", condition, path, "updatedAt")
      VALUES (
        gen_random_uuid(),
        ${dto.name ?? null},
        ${dto.type}::"RoadType",
        ${dto.isBlocked ?? false},
        ${dto.condition ?? 'NORMAL'}::"RoadCondition",
        ST_SetSRID(ST_GeomFromGeoJSON(${json}), 4326),
        NOW()
      )
      RETURNING id, name, type::text AS type, "isBlocked", condition::text AS condition,
                ST_AsGeoJSON(path)::jsonb AS path, "updatedAt"
    `;
    return rows[0];
  }

  async findAll(): Promise<RoadDto[]> {
    return this.prisma.$queryRaw<RoadDto[]>`
      SELECT id, name, type::text AS type, "isBlocked", condition::text AS condition,
             ST_AsGeoJSON(path)::jsonb AS path, "updatedAt"
        FROM "Road" ORDER BY "updatedAt" DESC
    `;
  }

  async findOne(id: string): Promise<RoadDto> {
    const rows = await this.prisma.$queryRaw<RoadDto[]>`
      SELECT id, name, type::text AS type, "isBlocked", condition::text AS condition,
             ST_AsGeoJSON(path)::jsonb AS path, "updatedAt"
        FROM "Road" WHERE id = ${id}::uuid
    `;
    if (!rows[0]) throw new NotFoundException('Estrada não encontrada');
    return rows[0];
  }

  async update(id: string, dto: UpdateRoadDto): Promise<RoadDto> {
    await this.findOne(id);
    const json = dto.path ? JSON.stringify(dto.path) : null;
    const rows = await this.prisma.$queryRaw<RoadDto[]>`
      UPDATE "Road"
         SET name      = COALESCE(${dto.name ?? null}, name),
             type      = COALESCE(${dto.type ?? null}::"RoadType", type),
             "isBlocked" = COALESCE(${dto.isBlocked ?? null}::boolean, "isBlocked"),
             condition = COALESCE(${dto.condition ?? null}::"RoadCondition", condition),
             path      = CASE WHEN ${json}::text IS NULL THEN path
                              ELSE ST_SetSRID(ST_GeomFromGeoJSON(${json}), 4326) END,
             "updatedAt" = NOW()
       WHERE id = ${id}::uuid
       RETURNING id, name, type::text AS type, "isBlocked", condition::text AS condition,
                 ST_AsGeoJSON(path)::jsonb AS path, "updatedAt"
    `;
    return rows[0];
  }

  async remove(id: string): Promise<{ id: string }> {
    await this.findOne(id);
    await this.prisma.$executeRaw`DELETE FROM "Road" WHERE id = ${id}::uuid`;
    return { id };
  }
}

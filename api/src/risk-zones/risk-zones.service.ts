import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRiskZoneDto } from './dto/create-risk-zone.dto';
import { UpdateRiskZoneDto } from './dto/update-risk-zone.dto';

export interface RiskZoneDto {
  id: string;
  name: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  area: unknown;
  updatedAt: Date;
}

@Injectable()
export class RiskZonesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRiskZoneDto): Promise<RiskZoneDto> {
    const json = JSON.stringify(dto.area);
    const rows = await this.prisma.$queryRaw<RiskZoneDto[]>`
      INSERT INTO "RiskZone" (id, name, "riskLevel", area, "updatedAt")
      VALUES (
        gen_random_uuid(),
        ${dto.name},
        ${dto.riskLevel}::"RiskLevel",
        ST_SetSRID(ST_GeomFromGeoJSON(${json}), 4326),
        NOW()
      )
      RETURNING id, name, "riskLevel"::text AS "riskLevel",
                ST_AsGeoJSON(area)::jsonb AS area, "updatedAt"
    `;
    return rows[0];
  }

  async findAll(): Promise<RiskZoneDto[]> {
    return this.prisma.$queryRaw<RiskZoneDto[]>`
      SELECT id, name, "riskLevel"::text AS "riskLevel",
             ST_AsGeoJSON(area)::jsonb AS area, "updatedAt"
        FROM "RiskZone"
       ORDER BY
         CASE "riskLevel" WHEN 'HIGH' THEN 0 WHEN 'MEDIUM' THEN 1 ELSE 2 END,
         "updatedAt" DESC
    `;
  }

  async findOne(id: string): Promise<RiskZoneDto> {
    const rows = await this.prisma.$queryRaw<RiskZoneDto[]>`
      SELECT id, name, "riskLevel"::text AS "riskLevel",
             ST_AsGeoJSON(area)::jsonb AS area, "updatedAt"
        FROM "RiskZone" WHERE id = ${id}::uuid
    `;
    if (!rows[0]) throw new NotFoundException('Zona não encontrada');
    return rows[0];
  }

  async update(id: string, dto: UpdateRiskZoneDto): Promise<RiskZoneDto> {
    await this.findOne(id);
    const json = dto.area ? JSON.stringify(dto.area) : null;
    const rows = await this.prisma.$queryRaw<RiskZoneDto[]>`
      UPDATE "RiskZone"
         SET name = COALESCE(${dto.name ?? null}, name),
             "riskLevel" = COALESCE(${dto.riskLevel ?? null}::"RiskLevel", "riskLevel"),
             area = CASE WHEN ${json}::text IS NULL THEN area
                         ELSE ST_SetSRID(ST_GeomFromGeoJSON(${json}), 4326) END,
             "updatedAt" = NOW()
       WHERE id = ${id}::uuid
       RETURNING id, name, "riskLevel"::text AS "riskLevel",
                 ST_AsGeoJSON(area)::jsonb AS area, "updatedAt"
    `;
    return rows[0];
  }

  async remove(id: string): Promise<{ id: string }> {
    await this.findOne(id);
    await this.prisma.$executeRaw`DELETE FROM "RiskZone" WHERE id = ${id}::uuid`;
    return { id };
  }
}

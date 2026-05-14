import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';

export interface AlertDto {
  id: string;
  title: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  area: Record<string, unknown> | null;
  createdAt: Date;
}

@Injectable()
export class AlertsService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
  ) {}

  async create(dto: CreateAlertDto): Promise<AlertDto> {
    const areaJson = dto.area ? JSON.stringify(dto.area) : null;
    const rows = await this.prisma.$queryRaw<AlertDto[]>`
      INSERT INTO "Alert" (id, title, message, severity, area, "createdAt")
      VALUES (
        gen_random_uuid(),
        ${dto.title},
        ${dto.message},
        ${dto.severity}::"RiskLevel",
        CASE WHEN ${areaJson}::text IS NULL THEN NULL
             ELSE ST_SetSRID(ST_GeomFromGeoJSON(${areaJson}), 4326) END,
        NOW()
      )
      RETURNING id, title, message, severity::text AS severity,
                CASE WHEN area IS NULL THEN NULL
                     ELSE ST_AsGeoJSON(area)::jsonb END AS area,
                "createdAt"
    `;
    const alert = rows[0];
    this.realtime.emitAlertCreated(alert);
    return alert;
  }

  async findAll(): Promise<AlertDto[]> {
    return this.prisma.$queryRaw<AlertDto[]>`
      SELECT id, title, message, severity::text AS severity,
             CASE WHEN area IS NULL THEN NULL
                  ELSE ST_AsGeoJSON(area)::jsonb END AS area,
             "createdAt"
        FROM "Alert"
       ORDER BY "createdAt" DESC
    `;
  }

  async findActive(): Promise<AlertDto[]> {
    // Activos = últimas 24h
    return this.prisma.$queryRaw<AlertDto[]>`
      SELECT id, title, message, severity::text AS severity,
             CASE WHEN area IS NULL THEN NULL
                  ELSE ST_AsGeoJSON(area)::jsonb END AS area,
             "createdAt"
        FROM "Alert"
       WHERE "createdAt" > NOW() - INTERVAL '24 hours'
       ORDER BY
         CASE severity WHEN 'HIGH' THEN 0 WHEN 'MEDIUM' THEN 1 ELSE 2 END,
         "createdAt" DESC
    `;
  }

  async findOne(id: string): Promise<AlertDto> {
    const rows = await this.prisma.$queryRaw<AlertDto[]>`
      SELECT id, title, message, severity::text AS severity,
             CASE WHEN area IS NULL THEN NULL
                  ELSE ST_AsGeoJSON(area)::jsonb END AS area,
             "createdAt"
        FROM "Alert" WHERE id = ${id}::uuid
    `;
    if (!rows[0]) throw new NotFoundException('Alerta não encontrado');
    return rows[0];
  }

  async update(id: string, dto: UpdateAlertDto): Promise<AlertDto> {
    await this.findOne(id);
    const areaJson = dto.area ? JSON.stringify(dto.area) : null;
    const rows = await this.prisma.$queryRaw<AlertDto[]>`
      UPDATE "Alert"
         SET title    = COALESCE(${dto.title ?? null}, title),
             message  = COALESCE(${dto.message ?? null}, message),
             severity = COALESCE(${dto.severity ?? null}::"RiskLevel", severity),
             area     = CASE WHEN ${areaJson}::text IS NULL THEN area
                             ELSE ST_SetSRID(ST_GeomFromGeoJSON(${areaJson}), 4326) END
       WHERE id = ${id}::uuid
       RETURNING id, title, message, severity::text AS severity,
                 CASE WHEN area IS NULL THEN NULL
                      ELSE ST_AsGeoJSON(area)::jsonb END AS area,
                 "createdAt"
    `;
    return rows[0];
  }

  async remove(id: string): Promise<{ id: string }> {
    await this.findOne(id);
    await this.prisma.$executeRaw`DELETE FROM "Alert" WHERE id = ${id}::uuid`;
    return { id };
  }
}

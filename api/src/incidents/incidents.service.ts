import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident.dto';
import { IncidentsGateway } from './incidents.gateway';
import { IncidentMapItem, IncidentStatus } from './incidents.types';

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly incidentsGateway: IncidentsGateway,
  ) {}

  async create(createIncidentDto: CreateIncidentDto): Promise<IncidentMapItem> {
    const incident = await this.prisma.$queryRaw<IncidentMapItem[]>(Prisma.sql`
      INSERT INTO "Incident" ("id", "type", "description", "severity", "location", "status", "verified", "userId", "createdAt")
      VALUES (
        gen_random_uuid()::text,
        ${createIncidentDto.type}::"IncidentType",
        ${createIncidentDto.description ?? null},
        ${createIncidentDto.severity ?? 3},
        ST_SetSRID(ST_MakePoint(${createIncidentDto.lng}, ${createIncidentDto.lat}), 4326),
        'PENDING'::"IncidentStatus",
        false,
        ${createIncidentDto.userId ?? null},
        now()
      )
      RETURNING
        "id",
        "type",
        "description",
        "severity",
        "status",
        ST_Y("location")::double precision AS "lat",
        ST_X("location")::double precision AS "lng",
        "createdAt"
    `);

    return incident[0];
  }

  async findAll(status?: IncidentStatus): Promise<IncidentMapItem[]> {
    return this.listIncidents(status);
  }

  async findVerifiedForMap(): Promise<IncidentMapItem[]> {
    return this.listIncidents(IncidentStatus.VERIFIED);
  }

  async findOne(id: string): Promise<IncidentMapItem> {
    const incident = await this.prisma.$queryRaw<IncidentMapItem[]>(Prisma.sql`
      SELECT
        "id",
        "type",
        "description",
        "severity",
        "status",
        ST_Y("location")::double precision AS "lat",
        ST_X("location")::double precision AS "lng",
        "createdAt"
      FROM "Incident"
      WHERE "id" = ${id}
      LIMIT 1
    `);

    if (!incident[0]) {
      throw new NotFoundException('Incidente não encontrado');
    }

    return incident[0];
  }

  async updateStatus(id: string, updateDto: UpdateIncidentStatusDto): Promise<IncidentMapItem> {
    const [current] = await this.prisma.$queryRaw<{ id: string; status: IncidentStatus }[]>(Prisma.sql`
      SELECT "id", "status"
      FROM "Incident"
      WHERE "id" = ${id}
      LIMIT 1
    `);

    if (!current) {
      throw new NotFoundException('Incidente não encontrado');
    }

    if (current.status === IncidentStatus.RESOLVED && updateDto.status === IncidentStatus.PENDING) {
      throw new BadRequestException('Incidente resolvido não pode voltar para pendente');
    }

    const [incident] = await this.prisma.$queryRaw<IncidentMapItem[]>(Prisma.sql`
      UPDATE "Incident"
      SET
        "status" = ${updateDto.status}::"IncidentStatus",
        "verified" = ${updateDto.status === IncidentStatus.VERIFIED}
      WHERE "id" = ${id}
      RETURNING
        "id",
        "type",
        "description",
        "severity",
        "status",
        ST_Y("location")::double precision AS "lat",
        ST_X("location")::double precision AS "lng",
        "createdAt"
    `);

    if (updateDto.status === IncidentStatus.VERIFIED) {
      this.incidentsGateway.emitVerifiedIncident(incident);
    }

    if (updateDto.status === IncidentStatus.RESOLVED) {
      this.incidentsGateway.emitResolvedIncident(incident.id);
    }

    return incident;
  }

  private async listIncidents(status?: IncidentStatus): Promise<IncidentMapItem[]> {
    const whereClause = status
      ? Prisma.sql`WHERE "status" = ${status}::"IncidentStatus"`
      : Prisma.empty;

    return this.prisma.$queryRaw<IncidentMapItem[]>(Prisma.sql`
      SELECT
        "id",
        "type",
        "description",
        "severity",
        "status",
        ST_Y("location")::double precision AS "lat",
        ST_X("location")::double precision AS "lng",
        "createdAt"
      FROM "Incident"
      ${whereClause}
      ORDER BY "createdAt" DESC
    `);
  }
}

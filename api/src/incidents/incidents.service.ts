import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';

export interface IncidentDto {
  id: string;
  type: 'FLOOD' | 'BLOCKED_ROAD' | 'ACCIDENT' | 'FIRE' | 'OTHER';
  description: string | null;
  severity: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'RESOLVED';
  verified: boolean;
  userId: string | null;
  lat: number;
  lng: number;
  createdAt: Date;
}

@Injectable()
export class IncidentsService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
  ) {}

  private select() {
    return `id, type::text AS type, description, severity, status::text AS status, verified, "userId",
            ST_Y(location) AS lat, ST_X(location) AS lng, "createdAt"`;
  }

  async create(dto: CreateIncidentDto): Promise<IncidentDto> {
    let userId: string | null = null;
    if (dto.deviceId) {
      let u = await this.prisma.user.findUnique({ where: { deviceId: dto.deviceId } });
      if (!u) {
        try {
          u = await this.prisma.user.create({
            data: {
              name: 'Utilizador',
              phone: `device:${dto.deviceId}`,
              deviceId: dto.deviceId,
              role: 'USER',
            },
          });
        } catch {
          u = await this.prisma.user.findUnique({ where: { deviceId: dto.deviceId } });
        }
      }
      userId = u?.id ?? null;
    }

    const rows = await this.prisma.$queryRawUnsafe<IncidentDto[]>(
      `INSERT INTO "Incident" (id, type, description, severity, location, status, verified, "userId", "createdAt")
       VALUES (gen_random_uuid(), $1::"IncidentType", $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), 'PENDING', false, $6::uuid, NOW())
       RETURNING ${this.select()}`,
      dto.type,
      dto.description ?? null,
      dto.severity,
      dto.lng,
      dto.lat,
      userId,
    );
    const incident = rows[0];
    this.realtime.emitIncidentCreated(incident);
    return incident;
  }

  async findAll(filters?: {
    status?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'RESOLVED';
    type?: 'FLOOD' | 'BLOCKED_ROAD' | 'ACCIDENT' | 'FIRE' | 'OTHER';
  }): Promise<IncidentDto[]> {
    const status = filters?.status ?? null;
    const type = filters?.type ?? null;
    return this.prisma.$queryRawUnsafe<IncidentDto[]>(
      `SELECT ${this.select()}
         FROM "Incident"
        WHERE ($1::text IS NULL OR status::text = $1)
          AND ($2::text IS NULL OR type::text   = $2)
        ORDER BY "createdAt" DESC`,
      status,
      type,
    );
  }

  async findVerifiedActive(): Promise<IncidentDto[]> {
    return this.prisma.$queryRawUnsafe<IncidentDto[]>(
      `SELECT ${this.select()}
         FROM "Incident"
        WHERE status = 'VERIFIED'
        ORDER BY "createdAt" DESC`,
    );
  }

  async findOne(id: string): Promise<IncidentDto> {
    const rows = await this.prisma.$queryRawUnsafe<IncidentDto[]>(
      `SELECT ${this.select()} FROM "Incident" WHERE id = $1::uuid`,
      id,
    );
    if (!rows[0]) throw new NotFoundException('Incidente não encontrado');
    return rows[0];
  }

  async update(id: string, dto: UpdateIncidentDto): Promise<IncidentDto> {
    await this.findOne(id);
    const rows = await this.prisma.$queryRawUnsafe<IncidentDto[]>(
      `UPDATE "Incident"
          SET type        = COALESCE($2::"IncidentType", type),
              description = COALESCE($3, description),
              severity    = COALESCE($4::int, severity),
              status      = COALESCE($5::"IncidentStatus", status),
              verified    = CASE WHEN $5::"IncidentStatus" = 'VERIFIED' THEN true
                                 WHEN $5::"IncidentStatus" IS NOT NULL THEN false
                                 ELSE verified END,
              location    = CASE WHEN $6::float IS NOT NULL AND $7::float IS NOT NULL
                                 THEN ST_SetSRID(ST_MakePoint($6::float, $7::float), 4326)
                                 ELSE location END
        WHERE id = $1::uuid
        RETURNING ${this.select()}`,
      id,
      dto.type ?? null,
      dto.description ?? null,
      dto.severity ?? null,
      dto.status ?? null,
      dto.lng ?? null,
      dto.lat ?? null,
    );
    const updated = rows[0];
    this.realtime.emitIncidentUpdated(updated);
    return updated;
  }

  async setStatus(
    id: string,
    status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'RESOLVED',
  ): Promise<IncidentDto> {
    await this.findOne(id);
    const rows = await this.prisma.$queryRawUnsafe<IncidentDto[]>(
      `UPDATE "Incident"
          SET status   = $2::"IncidentStatus",
              verified = CASE WHEN $2::"IncidentStatus" = 'VERIFIED' THEN true ELSE false END
        WHERE id = $1::uuid
        RETURNING ${this.select()}`,
      id,
      status,
    );
    const updated = rows[0];
    this.realtime.emitIncidentUpdated(updated);

    if (status === 'VERIFIED') {
      // Notificar utilizadores cuja rota activa intersecta este incidente
      void this.realtime.notifyIncidentImpactsRoutes(id);
    }

    return updated;
  }

  async remove(id: string): Promise<{ id: string }> {
    await this.findOne(id);
    await this.prisma.$executeRaw`DELETE FROM "Incident" WHERE id = ${id}::uuid`;
    return { id };
  }
}

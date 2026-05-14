import { Injectable, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

interface LocationUpdate {
  deviceId: string;
  lat: number;
  lng: number;
}

@Injectable()
@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    this.logger.debug(`WS connect: ${client.id}`);
    const deviceId = client.handshake.query.deviceId as string | undefined;
    const role = client.handshake.query.role as string | undefined;
    if (deviceId) void client.join(`user:${deviceId}`);
    if (role === 'ADMIN') void client.join('admin');
    void client.join('users');
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`WS disconnect: ${client.id}`);
  }

  @SubscribeMessage('user.location.update')
  async onLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LocationUpdate,
  ) {
    if (!data?.deviceId || typeof data.lat !== 'number' || typeof data.lng !== 'number') return;

    // Upsert anonymous user pelo deviceId
    let user = await this.prisma.user.findUnique({ where: { deviceId: data.deviceId } });
    if (!user) {
      try {
        user = await this.prisma.user.create({
          data: {
            name: 'Utilizador',
            phone: `device:${data.deviceId}`,
            deviceId: data.deviceId,
            role: 'USER',
          },
        });
      } catch {
        // race
        user = await this.prisma.user.findUnique({ where: { deviceId: data.deviceId } });
      }
    }

    if (!user) return;

    await this.prisma.$executeRaw`
      UPDATE "User"
         SET "currentLocation" = ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326),
             "lastSeenAt"      = NOW()
       WHERE id = ${user.id}::uuid
    `;

    // Detectar off-route: tem rota activa?
    const active = await this.prisma.$queryRaw<Array<{ id: string; deviceId: string; distMeters: number }>>`
      SELECT id, "deviceId",
             ST_Distance(
               geometry::geography,
               ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326)::geography
             ) AS "distMeters"
        FROM "RouteCache"
       WHERE "deviceId" = ${data.deviceId}
         AND "createdAt" > NOW() - INTERVAL '1 hour'
       ORDER BY "createdAt" DESC
       LIMIT 1
    `;
    if (active[0] && Number(active[0].distMeters) > 40) {
      this.emitRouteRecalc(data.deviceId, 'off-route');
    }

    client.emit('location.ack', { ok: true });
  }

  // Helpers chamados por outros services

  emitIncidentCreated(payload: unknown) {
    this.server.emit('incident.created', payload);
  }

  emitIncidentUpdated(payload: unknown) {
    this.server.emit('incident.updated', payload);
  }

  emitAlertCreated(payload: unknown) {
    this.server.emit('alert.created', payload);
  }

  emitRouteRecalc(deviceId: string, reason: string) {
    this.server.to(`user:${deviceId}`).emit('route.recalc', { reason });
  }

  emitRiskUpdate(payload: unknown) {
    this.server.emit('risk.update', payload);
  }

  /**
   * Quando um incidente é VERIFIED, encontra utilizadores cuja rota activa intersecta
   * o incidente e envia route.recalc.
   */
  async notifyIncidentImpactsRoutes(incidentId: string) {
    const affected = await this.prisma.$queryRaw<Array<{ deviceId: string }>>`
      SELECT DISTINCT rc."deviceId" AS "deviceId"
        FROM "RouteCache" rc
        JOIN "Incident" i ON i.id = ${incidentId}::uuid
       WHERE rc."deviceId" IS NOT NULL
         AND rc."createdAt" > NOW() - INTERVAL '1 hour'
         AND ST_DWithin(rc.geometry::geography, i.location::geography, 60)
    `;
    for (const row of affected) {
      this.emitRouteRecalc(row.deviceId, 'incident.verified');
    }
  }
}

import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { IncidentMapItem } from './incidents.types';

@WebSocketGateway({
  namespace: '/incidents',
  cors: { origin: true, credentials: true },
})
export class IncidentsGateway {
  @WebSocketServer()
  server: Server;

  emitVerifiedIncident(incident: IncidentMapItem): void {
    this.server.emit('incident.verified', incident);
  }

  emitResolvedIncident(incidentId: string): void {
    this.server.emit('incident.resolved', { incidentId });
  }
}

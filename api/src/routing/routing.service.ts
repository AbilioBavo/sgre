import { Injectable } from '@nestjs/common';
import { IncidentsService } from '../incidents/incidents.service';
import { IncidentStatus } from '../incidents/incidents.types';
import { CreateRoutingDto } from './dto/create-routing.dto';

@Injectable()
export class RoutingService {
  constructor(private readonly incidentsService: IncidentsService) {}

  async getEvacuationRoutes(dto: CreateRoutingDto) {
    const verifiedIncidents = await this.incidentsService.findAll(IncidentStatus.VERIFIED);

    const riskPenalty = verifiedIncidents.length * 3;

    return {
      safest: {
        id: 'safest',
        label: 'Rota mais segura',
        etaMinutes: 24 + riskPenalty,
        distanceKm: 7.2,
        riskScore: Math.max(1, 20 - riskPenalty),
      },
      fastest: {
        id: 'fastest',
        label: 'Rota mais rápida',
        etaMinutes: 13 + Math.ceil(riskPenalty / 2),
        distanceKm: 5.1,
        riskScore: 32 + riskPenalty,
      },
      alternative: {
        id: 'alternative',
        label: 'Rota alternativa',
        etaMinutes: 17 + Math.ceil(riskPenalty / 3),
        distanceKm: 6.3,
        riskScore: 26 + riskPenalty,
      },
      context: {
        start: { lat: dto.startLat, lng: dto.startLng },
        destination: { lat: dto.endLat, lng: dto.endLng },
        verifiedIncidentsConsidered: verifiedIncidents.length,
      },
    };
  }
}

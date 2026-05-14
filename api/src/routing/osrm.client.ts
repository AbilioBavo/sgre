import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface OsrmStep {
  distance: number;
  duration: number;
  name?: string;
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number];
    bearing_after?: number;
    bearing_before?: number;
  };
}

export interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  legs: Array<{
    steps: OsrmStep[];
    distance: number;
    duration: number;
  }>;
}

export interface OsrmResponse {
  code: string;
  routes: OsrmRoute[];
}

@Injectable()
export class OsrmClient {
  private readonly logger = new Logger(OsrmClient.name);
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>('OSRM_URL') ?? 'http://localhost:5000';
  }

  /**
   * Calcula rotas (driving) entre origem e destino, com alternativas.
   * Coordenadas em formato [lng, lat].
   */
  async route(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    opts: { alternatives?: boolean | number } = {},
  ): Promise<OsrmRoute[]> {
    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const url = `${this.baseUrl}/route/v1/driving/${coords}`;
    const params: Record<string, string | number | boolean> = {
      alternatives: opts.alternatives ?? true,
      overview: 'full',
      geometries: 'geojson',
      steps: true,
      annotations: false,
    };

    try {
      const res = await axios.get<OsrmResponse>(url, {
        params,
        timeout: 8000,
      });
      if (res.data.code !== 'Ok') {
        this.logger.warn(`OSRM non-ok: ${res.data.code}`);
        return [];
      }
      return res.data.routes ?? [];
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`OSRM error: ${message}`);
      // Fallback: linha recta como única "rota" para o sistema continuar a funcionar
      return [this.fallbackStraight(from, to)];
    }
  }

  /**
   * Fallback quando OSRM não está disponível: rota = linha recta.
   * Útil em desenvolvimento sem o serviço OSRM activo.
   */
  private fallbackStraight(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
  ): OsrmRoute {
    const dist = haversine(from, to);
    const duration = (dist / 1000) * 60; // 60s por km (estimativa muito grosseira)
    return {
      distance: dist,
      duration,
      geometry: {
        type: 'LineString',
        coordinates: [
          [from.lng, from.lat],
          [to.lng, to.lat],
        ],
      },
      legs: [
        {
          distance: dist,
          duration,
          steps: [
            {
              distance: dist,
              duration,
              name: 'Linha directa',
              maneuver: {
                type: 'depart',
                location: [from.lng, from.lat],
              },
            },
            {
              distance: 0,
              duration: 0,
              name: 'Chegada',
              maneuver: {
                type: 'arrive',
                location: [to.lng, to.lat],
              },
            },
          ],
        },
      ],
    };
  }
}

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

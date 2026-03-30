import { env } from './env';
import { Alert, Incident, IncidentType, Shelter } from './types';

async function parse<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  if (!response.ok) throw new Error('Não foi possível concluir a operação.');
  return response.json() as Promise<T>;
}

export const apiClient = {
  listVerifiedIncidents: () => parse<Incident[]>(`${env.apiBaseUrl}/incidents/map`),
  listShelters: () => parse<Shelter[]>(`${env.apiBaseUrl}/shelters`),
  listAlerts: () => parse<Alert[]>(`${env.apiBaseUrl}/alerts`),
  createIncident: (payload: { type: IncidentType; description?: string; lat: number; lng: number }) =>
    parse<Incident>(`${env.apiBaseUrl}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  getEvacuationRoutes: (payload: { startLat: number; startLng: number; endLat: number; endLng: number }) =>
    parse<any>(`${env.apiBaseUrl}/routing/evacuate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
};

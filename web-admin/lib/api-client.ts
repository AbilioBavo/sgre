import { env } from './env';

async function parse<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  if (!response.ok) throw new Error('Falha de comunicação com o servidor');
  return response.json() as Promise<T>;
}

export const apiClient = {
  listIncidents: (status?: string, type?: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (type) params.set('type', type);
    return parse<any[]>(`${env.apiBaseUrl}/incidents?${params.toString()}`);
  },
  updateIncidentStatus: (id: string, status: string) =>
    parse<any>(`${env.apiBaseUrl}/incidents/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }),
  listShelters: () => parse<any[]>(`${env.apiBaseUrl}/shelters`),
  listAlerts: () => parse<any[]>(`${env.apiBaseUrl}/alerts`),
};

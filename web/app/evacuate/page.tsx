'use client';

import { useState } from 'react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { apiClient } from '../../lib/api-client';

export default function EvacuatePage() {
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<any>(null);
  const geo = useGeolocation();

  async function handleLoadRoutes() {
    if (!geo.coords) return;
    setLoading(true);
    try {
      const result = await apiClient.getEvacuationRoutes({
        startLat: geo.coords.lat,
        startLng: geo.coords.lng,
        endLat: -25.9154,
        endLng: 32.5898,
      });
      setRoutes(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <h1>Rotas de evacuação</h1>
      <p className="helper">Compare rota mais segura, rápida e alternativa.</p>
      <button className="cta" onClick={handleLoadRoutes} disabled={!geo.coords || loading}>{loading ? 'Calculando...' : 'Calcular rotas'}</button>
      {routes && (
        <div className="grid grid-2" style={{ marginTop: 12 }}>
          {[routes.safest, routes.fastest, routes.alternative].map((route: any) => (
            <article key={route.id} className="routeCard">
              <h3>{route.label}</h3>
              <p>Tempo: {route.etaMinutes} min</p>
              <p>Distância: {route.distanceKm} km</p>
              <p>Risco: {route.riskScore}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

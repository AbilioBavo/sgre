'use client';

import { useEffect, useMemo, useState } from 'react';
import { EvacuationRoutesMap } from '../../components/EvacuationRoutesMap';
import { useGeolocation } from '../../hooks/useGeolocation';
import { apiClient } from '../../lib/api-client';
import { Shelter } from '../../lib/types';

type RouteItem = {
  id: 'safest' | 'fastest' | 'alternative';
  label: string;
  etaMinutes: number;
  distanceKm: number;
  riskScore: number;
};

type EvacuationRoutes = {
  safest: RouteItem;
  fastest: RouteItem;
  alternative: RouteItem;
  context: {
    start: { lat: number; lng: number };
    destination: { lat: number; lng: number };
  };
};

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export default function EvacuatePage() {
  const [loading, setLoading] = useState(false);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [selectedShelterId, setSelectedShelterId] = useState<string>('');
  const [routes, setRoutes] = useState<EvacuationRoutes | null>(null);
  const geo = useGeolocation();

  useEffect(() => {
    apiClient.listShelters().then((items) => {
      setShelters(items);
      if (items.length > 0) setSelectedShelterId(items[0].id);
    });
  }, []);

  const selectedShelter = useMemo(() => {
    if (selectedShelterId) return shelters.find((item) => item.id === selectedShelterId) ?? null;
    if (!geo.coords) return shelters[0] ?? null;

    return [...shelters]
      .sort(
        (a, b) =>
          haversineDistance(geo.coords.lat, geo.coords.lng, a.lat, a.lng) -
          haversineDistance(geo.coords.lat, geo.coords.lng, b.lat, b.lng),
      )[0] ?? null;
  }, [geo.coords, selectedShelterId, shelters]);

  async function handleLoadRoutes() {
    if (!geo.coords || !selectedShelter) return;
    setLoading(true);
    try {
      const result = await apiClient.getEvacuationRoutes({
        startLat: geo.coords.lat,
        startLng: geo.coords.lng,
        endLat: selectedShelter.lat,
        endLng: selectedShelter.lng,
      });
      setRoutes(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel premiumPanel">
      <h1>Rotas de evacuação</h1>
      <p className="helper">Mapa com rotas: verde (mais segura), amarelo (normal) e vermelho (pior).</p>

      <div className="form" style={{ marginBottom: 12 }}>
        <label htmlFor="shelter-select">Selecionar abrigo de destino</label>
        <select
          id="shelter-select"
          value={selectedShelterId}
          onChange={(event) => setSelectedShelterId(event.target.value)}
        >
          {shelters.map((shelter) => (
            <option key={shelter.id} value={shelter.id}>
              {shelter.name} ({shelter.status})
            </option>
          ))}
        </select>
      </div>

      <button className="cta" onClick={handleLoadRoutes} disabled={!geo.coords || !selectedShelter || loading}>
        {loading ? 'Calculando...' : 'Calcular rotas'}
      </button>

      {routes && selectedShelter && (
        <>
          <div className="grid grid-2" style={{ marginTop: 12 }}>
            {[routes.safest, routes.alternative, routes.fastest].map((route) => (
              <article key={route.id} className="routeCard">
                <h3>{route.label}</h3>
                <p>Tempo: {route.etaMinutes} min</p>
                <p>Distância: {route.distanceKm} km</p>
                <p>Risco: {route.riskScore}</p>
              </article>
            ))}
          </div>

          <EvacuationRoutesMap routes={routes} shelterName={selectedShelter.name} />
        </>
      )}
    </section>
  );
}

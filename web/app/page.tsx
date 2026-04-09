'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../lib/api-client';
import { useGeolocation } from '../hooks/useGeolocation';
import { useReverseGeocode } from '../hooks/useReverseGeocode';
import { Alert } from '../lib/types';

export default function HomePage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const geo = useGeolocation();
  const reverse = useReverseGeocode(geo.coords);

  useEffect(() => {
    apiClient.listAlerts().then(setAlerts).finally(() => setLoading(false));
  }, []);

  const risk = useMemo(() => {
    if (alerts.some((item) => item.severity === 'HIGH')) return 'ALTO';
    if (alerts.some((item) => item.severity === 'MEDIUM')) return 'MÉDIO';
    return 'BAIXO';
  }, [alerts]);

  const locationLabel = useMemo(() => {
    if (geo.loading) return 'Detectando...';
    if (!geo.coords) return 'Indisponível';
    if (reverse.loading) return 'A obter endereço completo...';
    if (reverse.fullAddress) return reverse.fullAddress;
    if (reverse.error) return `${reverse.error} (${geo.coords.lat.toFixed(5)}, ${geo.coords.lng.toFixed(5)})`;
    return `${geo.coords.lat.toFixed(5)}, ${geo.coords.lng.toFixed(5)}`;
  }, [geo.coords, geo.loading, reverse.error, reverse.fullAddress, reverse.loading]);

  return (
    <section className="grid grid-2">
      <article className="panel premiumPanel">
        <h1>Proteção rápida</h1>
        <p className="helper">Localização atual: {locationLabel}</p>
        <p><strong>Nível de risco:</strong> {risk}</p>
        <Link href="/evacuate"><button className="cta">EVACUAR AGORA</button></Link>
      </article>
      <article className="panel premiumPanel">
        <h2>Alertas ativos</h2>
        {loading && <p>Carregando alertas...</p>}
        {!loading && alerts.map((alert) => (
          <p key={alert.id}><span className={`badge ${alert.severity}`}>{alert.severity}</span> {alert.title}</p>
        ))}
      </article>
    </section>
  );
}

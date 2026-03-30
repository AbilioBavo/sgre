'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../lib/api-client';
import { Alert } from '../lib/types';
import { useGeolocation } from '../hooks/useGeolocation';

export default function HomePage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const geo = useGeolocation();

  useEffect(() => {
    apiClient.listAlerts().then(setAlerts).finally(() => setLoading(false));
  }, []);

  const risk = useMemo(() => {
    if (alerts.some((item) => item.severity === 'HIGH')) return 'ALTO';
    if (alerts.some((item) => item.severity === 'MEDIUM')) return 'MÉDIO';
    return 'BAIXO';
  }, [alerts]);

  return (
    <section className="grid grid-2">
      <article className="panel">
        <h1>Proteção rápida</h1>
        <p className="helper">Localização atual: {geo.coords ? `Maputo (${geo.coords.lat.toFixed(3)}, ${geo.coords.lng.toFixed(3)})` : geo.loading ? 'Detectando...' : 'Indisponível'}</p>
        <p><strong>Nível de risco:</strong> {risk}</p>
        <Link href="/evacuate"><button className="cta">EVACUAR AGORA</button></Link>
      </article>
      <article className="panel">
        <h2>Alertas ativos</h2>
        {loading && <p>Carregando alertas...</p>}
        {!loading && alerts.map((alert) => (
          <p key={alert.id}><span className={`badge ${alert.severity}`}>{alert.severity}</span> {alert.title}</p>
        ))}
      </article>
    </section>
  );
}

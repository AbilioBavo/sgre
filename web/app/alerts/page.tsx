'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api-client';
import { Alert } from '../../lib/types';

const weight = { HIGH: 3, MEDIUM: 2, LOW: 1 };

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.listAlerts()
      .then((items) => setAlerts([...items].sort((a, b) => weight[b.severity] - weight[a.severity])))
      .catch(() => setError('Não foi possível carregar os alertas no momento.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="panel">
      <h1>Alertas ativos</h1>
      {loading && <p>Carregando...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && alerts.map((alert) => (
        <article key={alert.id} style={{ borderTop: '1px solid #e2e8f0', padding: '12px 0' }}>
          <span className={`badge ${alert.severity}`}>{alert.severity}</span>
          <h3>{alert.title}</h3>
          <p>{alert.message}</p>
        </article>
      ))}
    </section>
  );
}

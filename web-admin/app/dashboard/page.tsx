import { apiClient } from '../../lib/api-client';

export default async function DashboardPage() {
  const incidents = await apiClient.listIncidents();
  const total = incidents.length;
  const pending = incidents.filter((i) => i.status === 'PENDING').length;
  const verified = incidents.filter((i) => i.status === 'VERIFIED').length;
  const resolved = incidents.filter((i) => i.status === 'RESOLVED').length;

  return (
    <section>
      <h1>Dashboard</h1>
      <div className="stats">
        <div className="card"><strong>Total</strong><p>{total}</p></div>
        <div className="card"><strong>Pendentes</strong><p>{pending}</p></div>
        <div className="card"><strong>Verificados</strong><p>{verified}</p></div>
        <div className="card"><strong>Resolvidos</strong><p>{resolved}</p></div>
      </div>
    </section>
  );
}

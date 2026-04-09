import { SheltersMap } from '../../components/SheltersMap';
import { apiClient } from '../../lib/api-client';

export default async function DashboardPage() {
  const incidents = await apiClient.listIncidents();
  const shelters = await apiClient.listShelters();

  const total = incidents.length;
  const pending = incidents.filter((i) => i.status === 'PENDING').length;
  const verified = incidents.filter((i) => i.status === 'VERIFIED').length;
  const resolved = incidents.filter((i) => i.status === 'RESOLVED').length;

  return (
    <section>
      <h1>Dashboard operacional</h1>
      <div className="stats">
        <div className="card premiumCard"><strong>Total</strong><p>{total}</p></div>
        <div className="card premiumCard"><strong>Pendentes</strong><p>{pending}</p></div>
        <div className="card premiumCard"><strong>Verificados</strong><p>{verified}</p></div>
        <div className="card premiumCard"><strong>Resolvidos</strong><p>{resolved}</p></div>
      </div>

      <article className="card premiumCard">
        <h2>Mapa da cidade de Maputo</h2>
        <p className="muted">Abrigos ativos marcados no mapa para apoiar decisão rápida da equipa.</p>
        <SheltersMap shelters={shelters} height={420} />
      </article>
    </section>
  );
}

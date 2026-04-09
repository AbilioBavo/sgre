import { SheltersMap } from '../../components/SheltersMap';
import { apiClient } from '../../lib/api-client';

export default async function MapPage() {
  const shelters = await apiClient.listShelters();
  const openCount = shelters.filter((item) => item.status === 'OPEN').length;

  return (
    <section>
      <article className="card heroCard">
        <h1>Mapa de abrigos de Maputo</h1>
        <p>Visão completa da cidade de Maputo com marcações dos locais de abrigo para operação rápida.</p>
        <div className="pillRow">
          <span className="pill">Total de abrigos: {shelters.length}</span>
          <span className="pill success">Abertos: {openCount}</span>
        </div>
      </article>

      <article className="card premiumCard">
        <SheltersMap shelters={shelters} height={560} />
      </article>
    </section>
  );
}

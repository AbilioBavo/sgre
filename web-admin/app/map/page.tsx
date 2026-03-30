import { apiClient } from '../../lib/api-client';

export default async function MapPage() {
  const shelters = await apiClient.listShelters();
  return (
    <section className="card">
      <h1>Mapa de abrigos - Maputo</h1>
      <p>Panorama geral da cidade com pontos de abrigos cadastrados.</p>
      {shelters.map((item) => <p key={item.id}>📍 {item.name} - {item.lat.toFixed(3)}, {item.lng.toFixed(3)}</p>)}
    </section>
  );
}

import { apiClient } from '../../lib/api-client';

export default async function SheltersPage() {
  const shelters = await apiClient.listShelters();
  return <section className="card"><h1>Abrigos</h1>{shelters.map((s) => <p key={s.id}>{s.name} - {s.status} ({s.occupied}/{s.capacity})</p>)}</section>;
}

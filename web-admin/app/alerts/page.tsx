import { apiClient } from '../../lib/api-client';

export default async function AlertsPage() {
  const alerts = await apiClient.listAlerts();
  return <section className="card"><h1>Alertas</h1>{alerts.map((a) => <p key={a.id}>{a.title}</p>)}</section>;
}

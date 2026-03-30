'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../../lib/api-client';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const data = await apiClient.listIncidents(status || undefined, type || undefined);
    setIncidents(data);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [status, type]);

  async function act(id: string, nextStatus: 'VERIFIED' | 'REJECTED' | 'RESOLVED') {
    const previous = incidents;
    setIncidents((curr) => curr.map((item) => item.id === id ? { ...item, status: nextStatus } : item));
    try {
      await apiClient.updateIncidentStatus(id, nextStatus);
    } catch {
      setIncidents(previous);
    }
  }

  const rows = useMemo(() => incidents, [incidents]);

  return (
    <section className="card">
      <h1>Incidentes</h1>
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Status: Todos</option>
          <option value="PENDING">PENDING</option>
          <option value="VERIFIED">VERIFIED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Tipo: Todos</option>
          <option value="FLOOD">FLOOD</option>
          <option value="BLOCKED_ROAD">BLOCKED_ROAD</option>
          <option value="ACCIDENT">ACCIDENT</option>
          <option value="FIRE">FIRE</option>
          <option value="OTHER">OTHER</option>
        </select>
      </div>
      {loading ? <p>Carregando...</p> : (
        <table className="table">
          <thead><tr><th>Tipo</th><th>Descrição</th><th>Localização</th><th>Data</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.type}</td>
                <td>{row.description || '-'}</td>
                <td>{row.lat.toFixed(3)}, {row.lng.toFixed(3)}</td>
                <td>{new Date(row.createdAt).toLocaleString()}</td>
                <td><span className={`badge ${row.status}`}>{row.status}</span></td>
                <td>
                  <button className="btn" onClick={() => act(row.id, 'VERIFIED')}>Aprovar</button>
                  <button className="btn" onClick={() => act(row.id, 'REJECTED')}>Rejeitar</button>
                  <button className="btn" onClick={() => act(row.id, 'RESOLVED')}>Resolver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

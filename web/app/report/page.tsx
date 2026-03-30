'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { apiClient } from '../../lib/api-client';
import { IncidentType } from '../../lib/types';

export default function ReportPage() {
  const geo = useGeolocation();
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const canSubmit = useMemo(() => !!geo.coords && !submitting, [geo.coords, submitting]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!geo.coords) return;

    const fd = new FormData(event.currentTarget);
    const type = fd.get('type') as IncidentType;
    const description = String(fd.get('description') || '').trim();

    setSubmitting(true);
    setFeedback(null);

    const timeout = setTimeout(() => setFeedback('Conexão lenta, estamos tentando enviar...'), 10000);

    try {
      await apiClient.createIncident({ type, description: description || undefined, lat: geo.coords.lat, lng: geo.coords.lng });
      setFeedback('Incidente enviado para análise');
      event.currentTarget.reset();
    } catch {
      setFeedback('Erro ao enviar incidente. Verifique sua conexão e tente novamente.');
    } finally {
      clearTimeout(timeout);
      setSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <h1>Reportar incidente</h1>
      <p className="helper">Seu incidente será analisado pela equipa antes de entrar no mapa.</p>
      <form className="form" onSubmit={handleSubmit}>
        <label>Tipo</label>
        <select name="type" required defaultValue="FLOOD">
          <option value="FLOOD">Inundação</option>
          <option value="BLOCKED_ROAD">Bloqueio</option>
          <option value="ACCIDENT">Acidente</option>
          <option value="FIRE">Incêndio</option>
          <option value="OTHER">Outro</option>
        </select>
        <label>Descrição (opcional)</label>
        <textarea name="description" rows={4} placeholder="Ex.: estrada intransitável perto do mercado." maxLength={280} />
        <small className="helper">GPS: {geo.coords ? `${geo.coords.lat.toFixed(4)}, ${geo.coords.lng.toFixed(4)}` : geo.loading ? 'obtendo localização...' : geo.error}</small>
        <button className="cta" disabled={!canSubmit}>{submitting ? 'Enviando...' : 'Enviar incidente'}</button>
      </form>
      {feedback && <p>{feedback}</p>}
    </section>
  );
}

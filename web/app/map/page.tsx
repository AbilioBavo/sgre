import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('../../components/IncidentsMap').then((mod) => mod.IncidentsMap), { ssr: false });

export default function MapPage() {
  return (
    <section>
      <h1>Mapa em tempo real</h1>
      <p className="helper">Mostra apenas incidentes VERIFICADOS e abrigos disponíveis.</p>
      <DynamicMap />
    </section>
  );
}

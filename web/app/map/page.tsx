import { IncidentsMap } from '../../components/IncidentsMap';

export default function MapPage() {
  return (
    <section>
      <header className="panel premiumPanel mapHeader">
        <h1>Mapa operacional de Maputo</h1>
        <p className="helper">
          Visualize sua localização atual, incidentes verificados e os abrigos mais próximos em tempo real.
        </p>
      </header>
      <IncidentsMap />
    </section>
  );
}

type Shelter = {
  id: string;
  name: string;
  status: 'OPEN' | 'FULL' | 'CLOSED';
  capacity: number;
  occupied: number;
  lat: number;
  lng: number;
};

const mapBounds = {
  north: -25.84,
  south: -26.03,
  west: 32.48,
  east: 32.69,
};

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function toMapPoint(lat: number, lng: number) {
  const x = clamp((lng - mapBounds.west) / (mapBounds.east - mapBounds.west));
  const y = clamp((mapBounds.north - lat) / (mapBounds.north - mapBounds.south));
  return { x: `${(x * 100).toFixed(2)}%`, y: `${(y * 100).toFixed(2)}%` };
}

function statusLabel(status: Shelter['status']) {
  if (status === 'OPEN') return 'Aberto';
  if (status === 'FULL') return 'Lotado';
  return 'Fechado';
}

export function SheltersMap({ shelters, height = 420 }: { shelters: Shelter[]; height?: number }) {
  return (
    <div className="adminMapWrap" style={{ height }}>
      <div className="cityMapCanvas" aria-label="Mapa da cidade de Maputo com locais de abrigo">
        <div className="cityMapHeader">
          <strong>Maputo, Moçambique</strong>
          <span>{shelters.length} abrigos mapeados</span>
        </div>

        {shelters.map((shelter) => {
          const point = toMapPoint(shelter.lat, shelter.lng);
          return (
            <div key={shelter.id} className="cityMarker" style={{ left: point.x, top: point.y }}>
              <span className={`cityDot cityDot-${shelter.status.toLowerCase()}`} />
              <div className="cityTooltip">
                <strong>{shelter.name}</strong>
                <span>{statusLabel(shelter.status)}</span>
                <span>Ocupação: {shelter.occupied}/{shelter.capacity}</span>
                <span>{shelter.lat.toFixed(3)}, {shelter.lng.toFixed(3)}</span>
              </div>
            </div>
          );
        })}

        <div className="cityLegend">
          <span><i className="cityDot cityDot-open" /> Aberto</span>
          <span><i className="cityDot cityDot-full" /> Lotado</span>
          <span><i className="cityDot cityDot-closed" /> Fechado</span>
        </div>
      </div>
    </div>
  );
}

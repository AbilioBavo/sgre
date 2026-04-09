'use client';

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

type Shelter = {
  id: string;
  name: string;
  status: 'OPEN' | 'FULL' | 'CLOSED';
  capacity: number;
  occupied: number;
  lat: number;
  lng: number;
};

const maputoCenter: [number, number] = [-25.9653, 32.5892];

const shelterIcon = L.divIcon({
  html: '<div style="font-size:20px;line-height:20px;filter:drop-shadow(0 3px 8px rgba(15,23,42,.35))">🛟</div>',
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 18],
});

function statusLabel(status: Shelter['status']) {
  if (status === 'OPEN') return 'Aberto';
  if (status === 'FULL') return 'Lotado';
  return 'Fechado';
}

export function SheltersMap({ shelters, height = 420 }: { shelters: Shelter[]; height?: number }) {
  return (
    <div className="adminMapWrap" style={{ height }}>
      <MapContainer center={maputoCenter} zoom={12} style={{ width: '100%', height: '100%' }} className="adminLeafletMap">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {shelters.map((shelter) => (
          <Marker key={shelter.id} position={[shelter.lat, shelter.lng]} icon={shelterIcon}>
            <Popup>
              <strong>{shelter.name}</strong>
              <br />
              Estado: {statusLabel(shelter.status)}
              <br />
              Ocupação: {shelter.occupied}/{shelter.capacity}
              <br />
              Coordenadas: {shelter.lat.toFixed(5)}, {shelter.lng.toFixed(5)}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

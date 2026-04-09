'use client';

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip } from 'react-leaflet';

type LatLng = { lat: number; lng: number };

type Route = {
  id: 'safest' | 'fastest' | 'alternative';
  label: string;
  etaMinutes: number;
  distanceKm: number;
  riskScore: number;
};

type EvacuationRoutes = {
  safest: Route;
  fastest: Route;
  alternative: Route;
  context: {
    start: LatLng;
    destination: LatLng;
  };
};

const userIcon = L.divIcon({
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#0ea5e9;border:3px solid #fff;box-shadow:0 0 0 8px rgba(14,165,233,.24)"></div>',
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const shelterIcon = L.divIcon({
  html: '<div style="font-size:22px;line-height:22px">🛟</div>',
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 20],
});

function curvePoints(start: LatLng, end: LatLng, bend = 0): [number, number][] {
  const dx = end.lng - start.lng;
  const dy = end.lat - start.lat;
  const normalLat = -dx;
  const normalLng = dy;

  const points: [number, number][] = [];
  for (let i = 0; i <= 16; i += 1) {
    const t = i / 16;
    const baseLat = start.lat + dy * t;
    const baseLng = start.lng + dx * t;
    const arc = Math.sin(Math.PI * t) * bend;

    points.push([
      baseLat + normalLat * arc,
      baseLng + normalLng * arc,
    ]);
  }

  return points;
}

const routeColorById: Record<Route['id'], string> = {
  safest: '#16a34a',
  alternative: '#eab308',
  fastest: '#dc2626',
};

export function EvacuationRoutesMap({
  routes,
  shelterName,
}: {
  routes: EvacuationRoutes;
  shelterName: string;
}) {
  const start = routes.context.start;
  const end = routes.context.destination;

  const routeItems: Array<{ route: Route; points: [number, number][] }> = [
    { route: routes.safest, points: curvePoints(start, end, -0.06) },
    { route: routes.alternative, points: curvePoints(start, end, 0) },
    { route: routes.fastest, points: curvePoints(start, end, 0.06) },
  ];

  return (
    <div className="mapWrap panel premiumPanel" style={{ height: 520 }}>
      <MapContainer center={[start.lat, start.lng]} zoom={12} style={{ width: '100%', height: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Marker position={[start.lat, start.lng]} icon={userIcon}>
          <Popup>Sua localização exata</Popup>
        </Marker>

        <Marker position={[end.lat, end.lng]} icon={shelterIcon}>
          <Popup>{shelterName}</Popup>
        </Marker>

        {routeItems.map(({ route, points }) => (
          <Polyline
            key={route.id}
            positions={points}
            pathOptions={{ color: routeColorById[route.id], weight: 6, opacity: 0.85 }}
          >
            <Tooltip sticky>
              <strong>{route.label}</strong>
              <br />
              Distância: {route.distanceKm} km
              <br />
              Tempo estimado: {route.etaMinutes} min
            </Tooltip>
          </Polyline>
        ))}
      </MapContainer>
    </div>
  );
}

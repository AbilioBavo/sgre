'use client';

import 'leaflet/dist/leaflet.css';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { io } from 'socket.io-client';
import L from 'leaflet';
import { apiClient } from '../lib/api-client';
import { env } from '../lib/env';
import { Incident, Shelter } from '../lib/types';
import { useGeolocation } from '../hooks/useGeolocation';
import { useReverseGeocode } from '../hooks/useReverseGeocode';

const maputoCenter: [number, number] = [-25.9653, 32.5892];
const colors = {
  FLOOD: '#2563eb',
  BLOCKED_ROAD: '#dc2626',
  ACCIDENT: '#f59e0b',
  FIRE: '#ea580c',
  OTHER: '#64748b',
};

function dotIcon(color: string, size = 14) {
  return L.divIcon({
    html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:2px solid #fff;box-shadow:0 4px 12px rgba(15,23,42,.25)"></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const userIcon = L.divIcon({
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#14b8a6;border:3px solid #fff;box-shadow:0 0 0 7px rgba(20,184,166,.22),0 6px 15px rgba(15,23,42,.25)"></div>',
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const shelterIcon = L.divIcon({
  html: '<div style="font-size:20px;line-height:20px;filter:drop-shadow(0 3px 8px rgba(15,23,42,.35))">🛟</div>',
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 18],
});

function CenterUser({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 13);
  }, [lat, lng, map]);
  return null;
}

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function IncidentsMap() {
  const geo = useGeolocation();
  const reverse = useReverseGeocode(geo.coords);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);

  useEffect(() => {
    apiClient.listVerifiedIncidents().then(setIncidents);
    apiClient.listShelters().then(setShelters);
    const socket = io(`${env.wsBaseUrl}/incidents`);
    socket.on('incident.verified', (incident: Incident) => setIncidents((prev) => [incident, ...prev]));
    socket.on('incident.resolved', ({ incidentId }: { incidentId: string }) => {
      setIncidents((prev) => prev.filter((item) => item.id !== incidentId));
    });
    return () => socket.disconnect();
  }, []);

  const center = useMemo<[number, number]>(
    () => (geo.coords ? [geo.coords.lat, geo.coords.lng] : maputoCenter),
    [geo.coords],
  );

  const nearestShelters = useMemo(() => {
    if (!geo.coords) return [];

    return shelters
      .map((shelter) => ({
        shelter,
        distanceKm: haversineDistance(geo.coords.lat, geo.coords.lng, shelter.lat, shelter.lng),
        availability: Math.max(0, shelter.capacity - shelter.occupied),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3);
  }, [geo.coords, shelters]);

  const openShelters = shelters.filter((shelter) => shelter.status === 'OPEN').length;


  const currentAddress = useMemo(() => {
    if (geo.loading) return 'A obter GPS...';
    if (!geo.coords) return 'Localização indisponível.';
    if (reverse.loading) return 'A converter coordenadas em endereço completo...';
    if (reverse.fullAddress) return reverse.fullAddress;
    return reverse.error ?? `${geo.coords.lat.toFixed(5)}, ${geo.coords.lng.toFixed(5)}`;
  }, [geo.coords, geo.loading, reverse.error, reverse.fullAddress, reverse.loading]);

  return (
    <div className="mapLayout">
      <aside className="mapSidebar panel premiumPanel">
        <h2>Resposta inteligente</h2>
        <p className="helper">Sua posição é marcada em verde. Os 3 abrigos mais próximos são listados abaixo.</p>
        <p className="helper"><strong>Endereço atual:</strong> {currentAddress}</p>

        <div className="legendList">
          <p><span className="legendDot userDot" /> Você</p>
          <p><span className="legendDot shelterDot" /> Abrigo</p>
          <p><span className="legendDot incidentDot" /> Incidente verificado</p>
        </div>

        <div className="quickStats">
          <div><strong>{incidents.length}</strong><span>incidentes ativos</span></div>
          <div><strong>{openShelters}</strong><span>abrigos abertos</span></div>
          <div><strong>{geo.coords ? 'Localizado' : geo.loading ? 'Buscando' : 'Indisponível'}</strong><span>status de GPS</span></div>
        </div>

        <h3>Abrigos mais próximos</h3>
        {!geo.coords && <p className="helper">Ative a localização para calcular distâncias até os abrigos.</p>}
        {geo.error && <p className="helper">{geo.error}</p>}
        {nearestShelters.map(({ shelter, distanceKm, availability }) => (
          <article key={shelter.id} className="shelterCard">
            <div>
              <strong>{shelter.name}</strong>
              <p>{formatDistance(distanceKm)} de distância</p>
            </div>
            <span className={`status status-${shelter.status.toLowerCase()}`}>
              {shelter.status === 'OPEN' ? `${availability} vagas` : shelter.status}
            </span>
          </article>
        ))}
      </aside>

      <div className="mapWrap panel premiumPanel">
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {geo.coords && (
            <>
              <CenterUser lat={geo.coords.lat} lng={geo.coords.lng} />
              <Marker position={[geo.coords.lat, geo.coords.lng]} icon={userIcon}>
                <Popup>Você está aqui.</Popup>
              </Marker>
            </>
          )}
          <MarkerClusterGroup>
            {incidents.map((incident) => (
              <Marker key={incident.id} position={[incident.lat, incident.lng]} icon={dotIcon(colors[incident.type])}>
                <Popup>
                  <strong>{incident.type}</strong>
                  <br />
                  {incident.description ?? 'Sem descrição'}
                </Popup>
              </Marker>
            ))}
            {shelters.map((shelter) => (
              <Marker key={shelter.id} position={[shelter.lat, shelter.lng]} icon={shelterIcon}>
                <Popup>
                  <strong>{shelter.name}</strong>
                  <br />
                  Estado: {shelter.status}
                  <br />
                  Ocupação: {shelter.occupied}/{shelter.capacity}
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  );
}

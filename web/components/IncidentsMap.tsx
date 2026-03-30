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

const colors = { FLOOD: '#2563eb', BLOCKED_ROAD: '#dc2626', ACCIDENT: '#eab308', FIRE: '#f97316', OTHER: '#64748b' };

function markerIcon(color: string) {
  return L.divIcon({ html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid #fff"></div>`, className: '' });
}

function CenterUser({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 13); }, [lat, lng, map]);
  return null;
}

export function IncidentsMap() {
  const geo = useGeolocation();
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

  const center = useMemo<[number, number]>(() => geo.coords ? [geo.coords.lat, geo.coords.lng] : [-25.95, 32.58], [geo.coords]);

  return (
    <div className="mapWrap panel">
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {geo.coords && <CenterUser lat={geo.coords.lat} lng={geo.coords.lng} />}
        <MarkerClusterGroup>
          {incidents.map((incident) => (
            <Marker key={incident.id} position={[incident.lat, incident.lng]} icon={markerIcon(colors[incident.type])}>
              <Popup><strong>{incident.type}</strong><br />{incident.description ?? 'Sem descrição'}</Popup>
            </Marker>
          ))}
          {shelters.map((shelter) => (
            <Marker key={shelter.id} position={[shelter.lat, shelter.lng]}>
              <Popup>🛟 {shelter.name}</Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}

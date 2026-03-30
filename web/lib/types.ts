export type IncidentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'RESOLVED';
export type IncidentType = 'FLOOD' | 'BLOCKED_ROAD' | 'ACCIDENT' | 'FIRE' | 'OTHER';

export type Incident = {
  id: string;
  type: IncidentType;
  description: string | null;
  severity: number;
  status: IncidentStatus;
  lat: number;
  lng: number;
  createdAt: string;
};

export type Shelter = {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  status: 'OPEN' | 'FULL' | 'CLOSED';
  lat: number;
  lng: number;
};

export type Alert = {
  id: string;
  title: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
};

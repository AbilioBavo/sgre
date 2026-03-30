export enum IncidentType {
  FLOOD = 'FLOOD',
  BLOCKED_ROAD = 'BLOCKED_ROAD',
  ACCIDENT = 'ACCIDENT',
  FIRE = 'FIRE',
  OTHER = 'OTHER',
}

export enum IncidentStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  RESOLVED = 'RESOLVED',
}

export type IncidentMapItem = {
  id: string;
  type: IncidentType;
  description: string | null;
  severity: number;
  status: IncidentStatus;
  lat: number;
  lng: number;
  createdAt: Date;
};

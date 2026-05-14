-- PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ShelterStatus" AS ENUM ('OPEN', 'FULL', 'CLOSED');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('FLOOD', 'BLOCKED_ROAD', 'ACCIDENT', 'FIRE', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RoadType" AS ENUM ('PRIMARY', 'SECONDARY', 'TERTIARY', 'DIRT');

-- CreateEnum
CREATE TYPE "RoadCondition" AS ENUM ('NORMAL', 'FLOODED', 'DAMAGED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "RouteKind" AS ENUM ('SAFEST', 'FASTEST', 'ALTERNATIVE');

-- CreateTable
CREATE TABLE "User" (
    "id"               TEXT PRIMARY KEY,
    "name"             TEXT NOT NULL,
    "phone"            TEXT NOT NULL,
    "email"            TEXT,
    "passwordHash"     TEXT,
    "deviceId"         TEXT,
    "role"             "Role" NOT NULL DEFAULT 'USER',
    "currentLocation"  geometry(Point, 4326),
    "lastSeenAt"       TIMESTAMP(3),
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_deviceId_key" ON "User"("deviceId");

-- CreateTable
CREATE TABLE "Device" (
    "id"        TEXT PRIMARY KEY,
    "userId"    TEXT NOT NULL,
    "token"     TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Shelter" (
    "id"        TEXT PRIMARY KEY,
    "name"      TEXT NOT NULL,
    "capacity"  INTEGER NOT NULL,
    "occupied"  INTEGER NOT NULL DEFAULT 0,
    "status"    "ShelterStatus" NOT NULL DEFAULT 'OPEN',
    "location"  geometry(Point, 4326) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Shelter_location_idx" ON "Shelter" USING GIST ("location");

-- CreateTable
CREATE TABLE "Incident" (
    "id"          TEXT PRIMARY KEY,
    "type"        "IncidentType" NOT NULL,
    "description" TEXT,
    "severity"    INTEGER NOT NULL,
    "location"    geometry(Point, 4326) NOT NULL,
    "status"      "IncidentStatus" NOT NULL DEFAULT 'PENDING',
    "verified"    BOOLEAN NOT NULL DEFAULT false,
    "userId"      TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Incident_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Incident_location_idx" ON "Incident" USING GIST ("location");
CREATE INDEX "Incident_status_idx" ON "Incident" ("status");
CREATE INDEX "Incident_type_idx" ON "Incident" ("type");

-- CreateTable
CREATE TABLE "WeatherData" (
    "id"         TEXT PRIMARY KEY,
    "zone"       TEXT NOT NULL,
    "rainfall"   DOUBLE PRECISION NOT NULL,
    "windSpeed"  DOUBLE PRECISION NOT NULL,
    "riskLevel"  "RiskLevel" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RiskZone" (
    "id"        TEXT PRIMARY KEY,
    "name"      TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "area"      geometry(Polygon, 4326) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "RiskZone_area_idx" ON "RiskZone" USING GIST ("area");

-- CreateTable
CREATE TABLE "Road" (
    "id"        TEXT PRIMARY KEY,
    "name"      TEXT,
    "type"      "RoadType" NOT NULL,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "condition" "RoadCondition" NOT NULL DEFAULT 'NORMAL',
    "path"      geometry(LineString, 4326) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Road_path_idx" ON "Road" USING GIST ("path");

-- CreateTable
CREATE TABLE "Route" (
    "id"        TEXT PRIMARY KEY,
    "geometry"  geometry(LineString, 4326) NOT NULL,
    "distance"  DOUBLE PRECISION NOT NULL,
    "duration"  DOUBLE PRECISION NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Route_geometry_idx" ON "Route" USING GIST ("geometry");

-- CreateTable
CREATE TABLE "RouteCache" (
    "id"        TEXT PRIMARY KEY,
    "deviceId"  TEXT,
    "shelterId" TEXT,
    "kind"      "RouteKind" NOT NULL DEFAULT 'SAFEST',
    "startLat"  DOUBLE PRECISION NOT NULL,
    "startLng"  DOUBLE PRECISION NOT NULL,
    "endLat"    DOUBLE PRECISION NOT NULL,
    "endLng"    DOUBLE PRECISION NOT NULL,
    "distance"  DOUBLE PRECISION NOT NULL,
    "duration"  DOUBLE PRECISION NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "geometry"  geometry(LineString, 4326) NOT NULL,
    "steps"     JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "RouteCache_deviceId_idx" ON "RouteCache" ("deviceId");
CREATE INDEX "RouteCache_geometry_idx" ON "RouteCache" USING GIST ("geometry");

-- CreateTable
CREATE TABLE "Alert" (
    "id"        TEXT PRIMARY KEY,
    "title"     TEXT NOT NULL,
    "message"   TEXT NOT NULL,
    "severity"  "RiskLevel" NOT NULL,
    "area"      geometry(Polygon, 4326),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Alert_area_idx" ON "Alert" USING GIST ("area");

-- CreateTable
CREATE TABLE "EventLog" (
    "id"        TEXT PRIMARY KEY,
    "type"      TEXT NOT NULL,
    "payload"   JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "EventLog_type_idx" ON "EventLog" ("type");
CREATE INDEX "EventLog_createdAt_idx" ON "EventLog" ("createdAt");

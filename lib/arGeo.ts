/**
 * Geospatial utility functions for AR building detection.
 *
 * Includes:
 *  - GPS → local 3D coordinate conversion (user as origin)
 *  - Bearing & distance calculations
 *  - Building visibility check (±FOV from heading)
 *  - Score-based colour system
 */

import { UVA_BUILDINGS, type UVABuilding } from "./uvaBuildings";

const DEG = Math.PI / 180;
const R_EARTH = 6_371_000; // metres

/* ═══════════════════════════════════════════════════════════════
   GPS ↔ LOCAL 3D COORDINATE CONVERSION
   ═══════════════════════════════════════════════════════════════ */

/**
 * Convert a GPS position to local 3D coordinates relative to a reference point.
 *
 * Uses flat-Earth approximation (accurate within ~1 km):
 *   x = Δlongitude × cos(latitude) × 111320   (east-west, metres)
 *   z = -Δlatitude × 110540                     (north-south, metres; negated for Three.js -Z = north)
 *   y = elevation (defaults to 0)
 *
 * Three.js convention:
 *   +X = east, -X = west
 *   +Y = up
 *   -Z = north, +Z = south
 */
export function gpsToLocal(
  targetLat: number,
  targetLon: number,
  refLat: number,
  refLon: number,
  elevation = 0
): { x: number; y: number; z: number } {
  const dLon = targetLon - refLon;
  const dLat = targetLat - refLat;

  const x = dLon * Math.cos(refLat * DEG) * 111320;
  const z = -(dLat * 110540); // Negate: north is -Z in Three.js
  const y = elevation;

  return { x, y, z };
}

/* ═══════════════════════════════════════════════════════════════
   BEARING & DISTANCE
   ═══════════════════════════════════════════════════════════════ */

/** Haversine distance in metres. */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = (lat2 - lat1) * DEG;
  const dLon = (lon2 - lon1) * DEG;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG) * Math.cos(lat2 * DEG) * Math.sin(dLon / 2) ** 2;
  return R_EARTH * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Bearing from A → B in degrees (0 = north, clockwise). */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = lat1 * DEG;
  const φ2 = lat2 * DEG;
  const Δλ = (lon2 - lon1) * DEG;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  return ((Math.atan2(y, x) / DEG) + 360) % 360;
}

/** Smallest signed angle difference (−180 … +180). */
export function angleDifference(heading: number, bearing: number): number {
  let diff = bearing - heading;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return diff;
}

/* ═══════════════════════════════════════════════════════════════
   VISIBLE BUILDINGS
   ═══════════════════════════════════════════════════════════════ */

export interface VisibleBuilding {
  building: UVABuilding;
  distance: number;
  bearing: number;
  angleDiff: number;
  /** Local 3D position relative to user */
  position: { x: number; y: number; z: number };
}

/**
 * Returns buildings visible from the user's position and heading.
 * "Visible" = within maxDistance AND within ±halfFov of heading.
 */
export function getVisibleBuildings(
  userLat: number,
  userLon: number,
  heading: number,
  maxDistance = 500,
  maxResults = 6,
  fov = 70
): VisibleBuilding[] {
  const halfFov = fov / 2;
  const candidates: VisibleBuilding[] = [];

  for (const building of UVA_BUILDINGS) {
    const distance = haversineDistance(
      userLat,
      userLon,
      building.latitude,
      building.longitude
    );
    if (distance > maxDistance) continue;

    const bearing = calculateBearing(
      userLat,
      userLon,
      building.latitude,
      building.longitude
    );
    const diff = angleDifference(heading, bearing);
    if (Math.abs(diff) > halfFov) continue;

    const position = gpsToLocal(
      building.latitude,
      building.longitude,
      userLat,
      userLon,
      8 // Elevate labels 8m above ground
    );

    candidates.push({ building, distance, bearing, angleDiff: diff, position });
  }

  candidates.sort((a, b) => Math.abs(a.angleDiff) - Math.abs(b.angleDiff));
  return candidates.slice(0, maxResults);
}

/* ═══════════════════════════════════════════════════════════════
   SCORE COLOURS
   ═══════════════════════════════════════════════════════════════ */

export function getScoreColor(score: number) {
  if (score >= 90)
    return {
      glow: "rgba(74, 222, 128, 0.45)",
      bg: "rgba(74, 222, 128, 0.12)",
      text: "#4ade80",
      border: "rgba(74, 222, 128, 0.35)",
    };
  if (score >= 70)
    return {
      glow: "rgba(250, 204, 21, 0.40)",
      bg: "rgba(250, 204, 21, 0.10)",
      text: "#facc15",
      border: "rgba(250, 204, 21, 0.30)",
    };
  return {
    glow: "rgba(248, 113, 113, 0.40)",
    bg: "rgba(248, 113, 113, 0.10)",
    text: "#f87171",
    border: "rgba(248, 113, 113, 0.30)",
  };
}

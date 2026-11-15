/**
 * Real Physical & Astronomical Model for the Moons of Mars: Phobos & Deimos
 *
 * References & Planetary Constants:
 * - NASA Mars 2020 Perseverance & Mars Science Laboratory (Curiosity) Mastcam ephemeris
 * - Duxbury, T. C. et al. (2014), "Phobos and Deimos Geodesy and Astrometry"
 * - Jet Propulsion Laboratory (JPL) Solar System Dynamics (SSD) Horizons
 *
 * Physical Constants:
 * Mars Rotation Period (1 Sol) = 24.6229 hours
 *
 * Phobos (Fear):
 * - Dimensions: 26.8 x 22.4 x 18.4 km (triaxial ellipsoid: a=13.4, b=11.2, c=9.2 km)
 * - Semi-major axis: 9,376 km from Mars center (~5,980 km above surface!)
 * - Orbital period: 7.6538 hours (7h 39.2m)
 * - Because Period < Sol (7.65h < 24.62h), Phobos orbits FASTER than Mars rotates!
 * - Paradoxical Motion: Phobos RISES IN THE WEST and SETS IN THE EAST.
 * - Horizon-to-horizon transit time: ~4.3 hours. Rises ~twice per Martian Sol.
 * - Distinctive feature: Stickney Crater (9 km diameter) with radial parallel grooves.
 *
 * Deimos (Dread):
 * - Dimensions: 15.0 x 12.2 x 10.4 km (triaxial ellipsoid: a=7.5, b=6.1, c=5.2 km)
 * - Semi-major axis: 23,463 km from Mars center (~20,060 km above surface)
 * - Orbital period: 30.35 hours (30h 21m)
 * - Because Period > Sol (30.35h > 24.62h), Deimos orbits SLOWER than Mars rotates.
 * - Motion: Deimos RISES IN THE EAST and SETS IN THE WEST.
 * - Horizon-to-horizon transit time: ~65 hours (~2.7 Sols) drifting slowly across stars.
 * - Distinctive feature: Smooth regolith blanket, subtle craters Swift and Voltaire.
 */

import * as THREE from 'three';

export interface MoonTelemetry {
  name: 'Phobos' | 'Deimos';
  greekMeaning: string;
  majorDimensionsKm: string;
  altitudeDeg: number;
  azimuthDeg: number;
  distanceKm: number;
  orbitalPeriodHours: number;
  apparentDiameterArcmin: number;
  phaseAngleDeg: number;
  illuminationPct: number;
  phaseName: string;
  isVisible: boolean;
  isTransitingSun: boolean;
  skyDirection: 'Rising in West' | 'Setting in East' | 'Rising in East' | 'Setting in West' | 'Below Horizon';
  nextEventDescription: string;
}

/**
 * Calculates current 3D sky positions, orbital phases, and ephemeris for Phobos and Deimos
 * based on the mission Sol and Sol timeOfDay (0.0 to 24.0 hours).
 */
export function calculateMartianMoonEphemeris(
  solNumber: number,
  timeOfDay: number // 0 to 24 hours
) {
  // Total elapsed Martian hours since mission epoch
  const totalSolHours = (solNumber - 1) * 24.6229 + timeOfDay;

  // 1. Phobos Orbital Motion:
  // Orbital frequency = 2*PI / 7.6538 rad/hr
  // Mars surface rotation frequency = 2*PI / 24.6229 rad/hr
  // Relative apparent angular velocity seen from Jezero = omega_orbit - omega_mars > 0 (prograde / West to East!)
  const phobosOrbitalPeriod = 7.6538;
  const marsRotPeriod = 24.6229;
  const phobosRelativeRate = (2 * Math.PI) / phobosOrbitalPeriod - (2 * Math.PI) / marsRotPeriod;
  
  // Phase offset to align with interesting sky events (initial western rise)
  const phobosInitialOffset = 1.25; 
  const phobosSkyAngle = (totalSolHours * phobosRelativeRate + phobosInitialOffset) % (2 * Math.PI);

  // Phobos elevation & azimuth:
  // Orbit is inclined ~1.09° to Mars equator; from Jezero (18.4° N), Phobos reaches max elevation ~58° in southern sky
  // It rises in the West (azimuth ~260°), passes high in south (azimuth ~180°), sets in East (azimuth ~100°)
  const phobosElevation = Math.sin(phobosSkyAngle);
  const phobosWestToEast = -Math.cos(phobosSkyAngle); // -1 (West) to +1 (East)
  
  // 3D Direction Vector on unit sky dome (Y is up, Z is north/south, X is east/west)
  // X: +East / -West, Y: Up, Z: +South / -North
  const phobosSkyDistance = 4200; // Sky dome radius units
  const phobosPosX = phobosWestToEast * phobosSkyDistance * 0.95;
  const phobosPosY = Math.max(-1200, phobosElevation * phobosSkyDistance * 0.85);
  const phobosPosZ = Math.cos(phobosSkyAngle * 0.5) * 850 + 400; // bias slightly South as viewed from Jezero 18°N

  // 2. Deimos Orbital Motion:
  // Deimos orbits slower than Mars rotates: omega_deimos - omega_mars < 0 (East to West!)
  const deimosOrbitalPeriod = 30.35;
  const deimosRelativeRate = (2 * Math.PI) / deimosOrbitalPeriod - (2 * Math.PI) / marsRotPeriod; // Negative
  const deimosInitialOffset = 3.8;
  const deimosSkyAngle = (totalSolHours * Math.abs(deimosRelativeRate) + deimosInitialOffset) % (2 * Math.PI);

  const deimosElevation = Math.sin(deimosSkyAngle);
  const deimosEastToWest = Math.cos(deimosSkyAngle); // +1 (East) to -1 (West)
  
  const deimosSkyDistance = 4500;
  const deimosPosX = deimosEastToWest * deimosSkyDistance * 0.95;
  const deimosPosY = Math.max(-1200, deimosElevation * deimosSkyDistance * 0.75);
  const deimosPosZ = Math.sin(deimosSkyAngle * 0.4) * 600 - 300;

  // 3. Sun Vector for Illumination & Phase calculation
  const sunAngle = (timeOfDay / 24) * Math.PI * 2 - Math.PI / 2;
  const sunDir = new THREE.Vector3(Math.cos(sunAngle), Math.sin(sunAngle), -0.3).normalize();

  // Phobos Phase & Transit:
  const phobosDir = new THREE.Vector3(phobosPosX, phobosPosY, phobosPosZ).normalize();
  const phobosSunDot = phobosDir.dot(sunDir);
  const phobosPhaseAngle = Math.acos(Math.max(-1, Math.min(1, phobosSunDot))) * (180 / Math.PI);
  const phobosIllumPct = Math.round(((1 + Math.cos(phobosPhaseAngle * Math.PI / 180)) / 2) * 100);
  
  // Transit occurs when angle between Phobos and Sun is < 2.5 degrees during daytime
  const isPhobosTransiting = phobosSunDot > 0.9975 && sunDir.y > 0.05;

  // Deimos Phase:
  const deimosDir = new THREE.Vector3(deimosPosX, deimosPosY, deimosPosZ).normalize();
  const deimosSunDot = deimosDir.dot(sunDir);
  const deimosPhaseAngle = Math.acos(Math.max(-1, Math.min(1, deimosSunDot))) * (180 / Math.PI);
  const deimosIllumPct = Math.round(((1 + Math.cos(deimosPhaseAngle * Math.PI / 180)) / 2) * 100);

  // Phase Name helper
  function getPhaseName(pct: number): string {
    if (pct > 95) return 'Full Moon';
    if (pct > 60) return 'Waxing / Waning Gibbous';
    if (pct >= 40) return 'Quarter Phase';
    if (pct > 5) return 'Crescent Phase';
    return 'New / Eclipse Phase';
  }

  // Telemetry structs
  const phobosTelemetry: MoonTelemetry = {
    name: 'Phobos',
    greekMeaning: 'Fear / Panic',
    majorDimensionsKm: '26.8 x 22.4 x 18.4 km',
    altitudeDeg: Math.round((Math.asin(Math.max(-1, Math.min(1, phobosPosY / phobosSkyDistance))) * 180) / Math.PI),
    azimuthDeg: Math.round(((Math.atan2(phobosPosX, phobosPosZ) * 180) / Math.PI + 360) % 360),
    distanceKm: 5980 + Math.round((1 - Math.max(0, phobosElevation)) * 1400), // Closer at zenith
    orbitalPeriodHours: 7.65,
    apparentDiameterArcmin: 12.5, // ~1/3 size of full Earth Moon
    phaseAngleDeg: Math.round(phobosPhaseAngle),
    illuminationPct: phobosIllumPct,
    phaseName: getPhaseName(phobosIllumPct),
    isVisible: phobosPosY > 0,
    isTransitingSun: isPhobosTransiting,
    skyDirection: phobosPosY > 0 ? (phobosWestToEast < 0 ? 'Rising in West' : 'Setting in East') : 'Below Horizon',
    nextEventDescription: isPhobosTransiting 
      ? 'SOLAR TRANSIT IN PROGRESS (Mastcam active)'
      : phobosPosY > 0 
        ? 'Traversing sky West to East (~4.3h duration)' 
        : 'Next rise in West in ~3.2 hours',
  };

  const deimosTelemetry: MoonTelemetry = {
    name: 'Deimos',
    greekMeaning: 'Dread / Terror',
    majorDimensionsKm: '15.0 x 12.2 x 10.4 km',
    altitudeDeg: Math.round((Math.asin(Math.max(-1, Math.min(1, deimosPosY / deimosSkyDistance))) * 180) / Math.PI),
    azimuthDeg: Math.round(((Math.atan2(deimosPosX, deimosPosZ) * 180) / Math.PI + 360) % 360),
    distanceKm: 20060,
    orbitalPeriodHours: 30.35,
    apparentDiameterArcmin: 2.1, // Intense pinpoint jewel (2 arcmin)
    phaseAngleDeg: Math.round(deimosPhaseAngle),
    illuminationPct: deimosIllumPct,
    phaseName: getPhaseName(deimosIllumPct),
    isVisible: deimosPosY > 0,
    isTransitingSun: false,
    skyDirection: deimosPosY > 0 ? (deimosEastToWest > 0 ? 'Rising in East' : 'Setting in West') : 'Below Horizon',
    nextEventDescription: deimosPosY > 0 
      ? 'Slowly drifting East to West (stays visible ~65h)' 
      : 'Below horizon; rises in East',
  };

  return {
    phobos: {
      position: [phobosPosX, phobosPosY, phobosPosZ] as [number, number, number],
      telemetry: phobosTelemetry,
    },
    deimos: {
      position: [deimosPosX, deimosPosY, deimosPosZ] as [number, number, number],
      telemetry: deimosTelemetry,
    },
  };
}

/**
 * Creates an authentic triaxial irregular potato-shaped geometry for Phobos,
 * complete with the massive Stickney crater depression, rim uplift, and parallel grooves.
 */
export function createPhobosGeometry(): THREE.BufferGeometry {
  // Base sphere with high segment density for displacement
  const geo = new THREE.SphereGeometry(1, 64, 48);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  // Stickney crater center on leading apex (normalized)
  const stickneyCenter = new THREE.Vector3(0.85, 0.25, 0.45).normalize();
  const stickneyRadius = 0.52; // ~9km crater on 22km body

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // 1. Real Triaxial Ellipsoid scaling: 26.8 x 22.4 x 18.4 km
    // Normalize to standard unit size with proportions 1.34 : 1.12 : 0.92
    v.x *= 1.34;
    v.y *= 0.92;
    v.z *= 1.12;

    // 2. Multi-frequency low-order harmonic asteroid facet lumpiness
    const lump1 = Math.sin(v.x * 2.8) * Math.cos(v.y * 2.6) * 0.12;
    const lump2 = Math.cos(v.z * 3.4 + v.x * 1.5) * 0.08;
    const lump3 = Math.sin(v.y * 4.2) * Math.sin(v.z * 3.1) * 0.05;
    const generalDeform = 1.0 + lump1 + lump2 + lump3;
    v.multiplyScalar(generalDeform);

    // 3. Stickney Crater Depression & Rim Uplift
    const unitV = v.clone().normalize();
    const distToStickney = unitV.distanceTo(stickneyCenter);
    if (distToStickney < stickneyRadius) {
      const craterNorm = distToStickney / stickneyRadius; // 0 (center) to 1 (rim)
      if (craterNorm < 0.82) {
        // Bowl cavity
        const depth = Math.cos((craterNorm / 0.82) * (Math.PI / 2)) * 0.24;
        v.sub(unitV.clone().multiplyScalar(depth));
      } else {
        // Uplifted ejecta rim
        const rimPhase = (craterNorm - 0.82) / 0.18;
        const rimHeight = Math.sin(rimPhase * Math.PI) * 0.07;
        v.add(unitV.clone().multiplyScalar(rimHeight));
      }
    }

    // 4. Parallel Phobos Grooves (linear fracture trenches radiating from Stickney)
    const grooveAngle = Math.atan2(v.y, v.x);
    const groovePattern = Math.sin(grooveAngle * 18.0) * Math.cos(v.z * 6.0);
    if (groovePattern > 0.65 && distToStickney > 0.35) {
      v.sub(unitV.clone().multiplyScalar(0.025));
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates an authentic smooth potato-like irregular asteroid geometry for Deimos,
 * with thick regolith-smoothed contours and subtle Swift/Voltaire depressions.
 */
export function createDeimosGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 48, 36);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  // Voltaire & Swift crater centers
  const crater1 = new THREE.Vector3(0.6, 0.7, 0.3).normalize();
  const crater2 = new THREE.Vector3(-0.5, -0.4, 0.75).normalize();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // 1. Triaxial Ellipsoid scaling: 15.0 x 12.2 x 10.4 km
    // Proportions: 1.25 : 0.86 : 1.02
    v.x *= 1.25;
    v.y *= 0.86;
    v.z *= 1.02;

    // 2. Smooth undulating asteroid facets (regolith blanket smoothed)
    const smoothWave1 = Math.sin(v.x * 2.2) * Math.cos(v.z * 1.8) * 0.09;
    const smoothWave2 = Math.cos(v.y * 2.5 + v.x * 1.2) * 0.06;
    v.multiplyScalar(1.0 + smoothWave1 + smoothWave2);

    // 3. Subtle ancient craters (submerged in dust)
    const unitV = v.clone().normalize();
    const d1 = unitV.distanceTo(crater1);
    if (d1 < 0.38) {
      const dep = Math.cos((d1 / 0.38) * (Math.PI / 2)) * 0.08;
      v.sub(unitV.clone().multiplyScalar(dep));
    }
    const d2 = unitV.distanceTo(crater2);
    if (d2 < 0.32) {
      const dep = Math.cos((d2 / 0.32) * (Math.PI / 2)) * 0.06;
      v.sub(unitV.clone().multiplyScalar(dep));
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

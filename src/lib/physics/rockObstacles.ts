import * as THREE from 'three';
import { getTerrainHeight } from './terrainHeight';
import { INITIAL_POIS } from '../science/poiData';

export interface PhysicalObstacle {
  id: string;
  x: number;
  y: number;
  z: number;
  radius: number; // collision circle radius
  height: number; // obstacle height
  isSolid: boolean; // true = impenetrable barrier; false = climbable small rock/slab
}

export interface CollisionResult {
  x: number;
  z: number;
  vx: number;
  vz: number;
  collided: boolean;
  impactSpeed: number;
}

// Spatial grid cell size in meters
const GRID_CELL_SIZE = 16.0;

function cellKey(cx: number, cz: number): string {
  return `${cx}_${cz}`;
}

// Global cached obstacles and spatial hash
let cachedObstacles: PhysicalObstacle[] | null = null;
let cachedSpatialGrid: Map<string, PhysicalObstacle[]> | null = null;
let cachedBoulderData: { matrices: THREE.Matrix4[]; colors: THREE.Color[] } | null = null;
let cachedSlabData: { matrices: THREE.Matrix4[]; colors: THREE.Color[] } | null = null;

function initObstacles() {
  if (cachedObstacles && cachedSpatialGrid) return;

  const obstacles: PhysicalObstacle[] = [];
  const grid = new Map<string, PhysicalObstacle[]>();

  const addToGrid = (obs: PhysicalObstacle) => {
    obstacles.push(obs);
    const minCX = Math.floor((obs.x - obs.radius) / GRID_CELL_SIZE);
    const maxCX = Math.floor((obs.x + obs.radius) / GRID_CELL_SIZE);
    const minCZ = Math.floor((obs.z - obs.radius) / GRID_CELL_SIZE);
    const maxCZ = Math.floor((obs.z + obs.radius) / GRID_CELL_SIZE);

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cz = minCZ; cz <= maxCZ; cz++) {
        const k = cellKey(cx, cz);
        let list = grid.get(k);
        if (!list) {
          list = [];
          grid.set(k, list);
        }
        list.push(obs);
      }
    }
  };

  // Exact physical bounding radii matching the full 3D outcrop meshes in GeologicalOutcrops.tsx
  const POI_COLLISION_SPECS: Record<string, { radius: number; height: number }> = {
    'poi-kodiak-delta': { radius: 6.8, height: 4.5 },
    'poi-castell-henllys': { radius: 5.4, height: 3.5 },
    'poi-seitah-olivine': { radius: 8.2, height: 6.0 },
    'poi-syrtis-basalt': { radius: 7.0, height: 3.8 },
    'poi-belva-crater-breccia': { radius: 8.5, height: 5.5 },
    'poi-methane-vent': { radius: 5.8, height: 4.0 },
    'poi-escarpment-stratified': { radius: 14.8, height: 8.0 }, // Massive 18m stratified delta bench
    'poi-ochre-subsurface-radar': { radius: 6.5, height: 4.2 },
  };

  // 1. Add all 8 major geological science POIs as solid barriers with accurate physical bounds
  INITIAL_POIS.forEach((poi) => {
    const px = poi.position[0];
    const pz = poi.position[2];
    const py = getTerrainHeight(px, pz);
    const spec = POI_COLLISION_SPECS[poi.id] || { radius: 6.0, height: 4.0 };

    if (poi.id === 'poi-escarpment-stratified') {
      // Delta Front Carbonate Bench spans 18m wide along the escarpment face
      // Tri-point bounding barrier to fully block rover from penetrating any part of the mesa
      addToGrid({ id: `${poi.id}_center`, x: px, y: py, z: pz, radius: 10.5, height: spec.height, isSolid: true });
      addToGrid({ id: `${poi.id}_east`, x: px + 6.0, y: py, z: pz + 4.5, radius: 9.0, height: spec.height, isSolid: true });
      addToGrid({ id: `${poi.id}_west`, x: px - 6.0, y: py, z: pz - 4.5, radius: 9.0, height: spec.height, isSolid: true });
    } else {
      addToGrid({
        id: poi.id,
        x: px,
        y: py,
        z: pz,
        radius: spec.radius,
        height: spec.height,
        isSolid: true,
      });
    }
  });

  // 2. MARS BASE HABITAT COMPLEX SOLID BARRIER COLLIDERS (Real physical collision)
  // Central Hub 08 dome perimeter wall (solid barrier ring, leaving South portal open for rover docking)
  const DOME_CENTER_X = 0;
  const DOME_CENTER_Z = -56;
  const DOME_RADIUS = 25.0;
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const bx = DOME_CENTER_X + Math.sin(angle) * DOME_RADIUS;
    const bz = DOME_CENTER_Z + Math.cos(angle) * DOME_RADIUS;
    // Leave South airlock corridor opening clear for rover docking access
    if (bz > -34 && Math.abs(bx) < 5.0) continue;
    const by = getTerrainHeight(bx, bz);
    addToGrid({
      id: `base_hub08_wall_${i}`,
      x: bx,
      y: by,
      z: bz,
      radius: 4.5,
      height: 12.0,
      isSolid: true,
    });
  }

  // Radial Habitation Pods & Outposts
  const POD_COLLIDERS = [
    { id: 'pod_l01_west', x: -28, z: -52, radius: 5.5, height: 7.5 },
    { id: 'pod_l02_southwest', x: -22, z: -32, radius: 5.5, height: 7.5 },
    { id: 'pod_l03_southeast', x: 22, z: -32, radius: 5.5, height: 7.5 },
    { id: 'pod_l04_east', x: 28, z: -52, radius: 5.5, height: 7.5 },
    { id: 'dome_x1_east', x: 38, z: -18, radius: 13.5, height: 8.5 },
    { id: 'dsn_tower_cliff', x: 44, z: -60, radius: 9.5, height: 18.0 },
  ];

  POD_COLLIDERS.forEach((pod) => {
    addToGrid({
      id: pod.id,
      x: pod.x,
      y: getTerrainHeight(pod.x, pod.z),
      z: pod.z,
      radius: pod.radius,
      height: pod.height,
      isSolid: true,
    });
  });

  // Docking platform side barrier guard rails
  [-3.8, 3.8].forEach((gx, idx) => {
    [-29, -25, -21].forEach((gz, zIdx) => {
      addToGrid({
        id: `dock_guardrail_${idx}_${zIdx}`,
        x: gx,
        y: getTerrainHeight(gx, gz),
        z: gz,
        radius: 1.2,
        height: 3.5,
        isSolid: true,
      });
    });
  });

  // Solar farm perimeter colliders (so rover cannot phase through panels)
  [-40, -32, -24, -16].forEach((sx, idx) => {
    [-14, 0, 14].forEach((sz, zIdx) => {
      addToGrid({
        id: `solar_rack_barrier_${idx}_${zIdx}`,
        x: sx,
        y: getTerrainHeight(sx, sz),
        z: sz,
        radius: 2.2,
        height: 2.5,
        isSolid: true,
      });
    });
  });

  // 3. Deterministic pseudo-random generation of boulders and slabs matching MartianTerrain
  let seed = 42;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const dummy = new THREE.Object3D();
  const bMatrices: THREE.Matrix4[] = [];
  const bColors: THREE.Color[] = [];

  const boulderCount = 260;
  for (let i = 0; i < boulderCount; i++) {
    const angle = rnd() * Math.PI * 2;
    const dist = 8 + Math.sqrt(rnd()) * 255;
    const rx = Math.cos(angle) * dist;
    const rz = Math.sin(angle) * dist;
    const ry = getTerrainHeight(rx, rz);

    const isGiant = rnd() < 0.12;
    const s = isGiant ? 2.2 + rnd() * 2.0 : 0.45 + rnd() * 1.2;

    const rotY = rnd() * Math.PI * 2;
    const rotX = (rnd() - 0.5) * 0.4;
    const rotZ = (rnd() - 0.5) * 0.4;

    dummy.position.set(rx, ry + s * 0.25, rz);
    dummy.rotation.set(rotX, rotY, rotZ);
    dummy.scale.set(s * (0.85 + rnd() * 0.3), s * (0.7 + rnd() * 0.3), s * (0.85 + rnd() * 0.3));
    dummy.updateMatrix();
    bMatrices.push(dummy.matrix.clone());

    const rCol = new THREE.Color('#9c452b').offsetHSL(
      0,
      (rnd() - 0.5) * 0.08,
      (rnd() - 0.5) * 0.12
    );
    bColors.push(rCol);

    // Physical collision definition:
    // Boulders with scale >= 0.72m are solid impassable rocks.
    // Smaller boulders (< 0.72m) are climbable bumps.
    const isSolid = s >= 0.72;
    addToGrid({
      id: `boulder_${i}`,
      x: rx,
      y: ry,
      z: rz,
      radius: s * 0.92,
      height: s * 0.85,
      isSolid,
    });
  }

  // 3. Slabs / Bedrock flagstones
  const sMatrices: THREE.Matrix4[] = [];
  const sColors: THREE.Color[] = [];
  const slabCount = 280;

  for (let i = 0; i < slabCount; i++) {
    const angle = rnd() * Math.PI * 2;
    const dist = 6 + Math.sqrt(rnd()) * 250;
    const rx = Math.cos(angle) * dist;
    const rz = Math.sin(angle) * dist;
    const ry = getTerrainHeight(rx, rz);
    const s = 0.8 + rnd() * 1.6;

    dummy.position.set(rx, ry + 0.08, rz);
    dummy.rotation.set((rnd() - 0.5) * 0.15, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.15);
    dummy.scale.set(s * (1.0 + rnd() * 0.3), s * 0.35, s * (0.8 + rnd() * 0.4));
    dummy.updateMatrix();
    sMatrices.push(dummy.matrix.clone());

    const slabCol = new THREE.Color('#b8623d').offsetHSL(
      0,
      (rnd() - 0.5) * 0.08,
      (rnd() - 0.5) * 0.12
    );
    sColors.push(slabCol);

    // Slabs are flat climbable flagstones that wheels ride over
    addToGrid({
      id: `slab_${i}`,
      x: rx,
      y: ry,
      z: rz,
      radius: s * 1.1,
      height: 0.22 * s,
      isSolid: false,
    });
  }

  cachedObstacles = obstacles;
  cachedSpatialGrid = grid;
  cachedBoulderData = { matrices: bMatrices, colors: bColors };
  cachedSlabData = { matrices: sMatrices, colors: sColors };
}

export function getRockInstanceData() {
  initObstacles();
  return {
    boulders: cachedBoulderData!,
    slabs: cachedSlabData!,
  };
}

/**
 * Resolves rover collisions against all solid rocks and POI outcrops in the world.
 * Pushes the rover out along the collision normal, decomposes velocity, applies
 * restitution and friction, and returns the resolved state.
 */
export function resolveRoverCollisions(
  posX: number,
  posZ: number,
  vx: number,
  vz: number,
  roverRadius = 1.35
): CollisionResult {
  initObstacles();
  const grid = cachedSpatialGrid!;

  const minCX = Math.floor((posX - roverRadius) / GRID_CELL_SIZE);
  const maxCX = Math.floor((posX + roverRadius) / GRID_CELL_SIZE);
  const minCZ = Math.floor((posZ - roverRadius) / GRID_CELL_SIZE);
  const maxCZ = Math.floor((posZ + roverRadius) / GRID_CELL_SIZE);

  let collided = false;
  let maxImpact = 0;
  let resX = posX;
  let resZ = posZ;
  let resVx = vx;
  let resVz = vz;

  // Up to 4 relaxation iterations to resolve multi-obstacle pinch corners
  for (let iter = 0; iter < 4; iter++) {
    const checked = new Set<string>();
    const curMinCX = Math.floor((resX - roverRadius) / GRID_CELL_SIZE);
    const curMaxCX = Math.floor((resX + roverRadius) / GRID_CELL_SIZE);
    const curMinCZ = Math.floor((resZ - roverRadius) / GRID_CELL_SIZE);
    const curMaxCZ = Math.floor((resZ + roverRadius) / GRID_CELL_SIZE);

    for (let cx = curMinCX; cx <= curMaxCX; cx++) {
      for (let cz = curMinCZ; cz <= curMaxCZ; cz++) {
        const list = grid.get(cellKey(cx, cz));
        if (!list) continue;

        for (const obs of list) {
          if (!obs.isSolid) continue;
          if (checked.has(obs.id)) continue;
          checked.add(obs.id);

          const dx = resX - obs.x;
          const dz = resZ - obs.z;
          const distSq = dx * dx + dz * dz;
          const minDist = roverRadius + obs.radius;

          if (distSq < minDist * minDist) {
            const dist = Math.max(0.0001, Math.sqrt(distSq));
            const pen = minDist - dist;
            const nx = dx / dist;
            const nz = dz / dist;

            // Push rover out of rock
            resX += nx * pen;
            resZ += nz * pen;
            collided = true;

            // Normal relative velocity
            const vDotN = resVx * nx + resVz * nz;
            if (vDotN < 0) {
              const impact = Math.abs(vDotN);
              if (impact > maxImpact) maxImpact = impact;

              // Inelastic collision: cancel velocity into rock, apply slight rebound and tangential sliding friction
              const restitution = 0.05;
              const friction = 0.5;
              const vNormX = nx * vDotN;
              const vNormZ = nz * vDotN;
              const vTangX = resVx - vNormX;
              const vTangZ = resVz - vNormZ;

              resVx = vTangX * friction - vNormX * restitution;
              resVz = vTangZ * friction - vNormZ * restitution;
            }
          }
        }
      }
    }
  }

  return {
    x: resX,
    z: resZ,
    vx: resVx,
    vz: resVz,
    collided,
    impactSpeed: maxImpact,
  };
}

/**
 * Returns the physical surface height offset at (x, z) from climbable rocks,
 * slabs, and flagstones. Wheels roll on top of these with realistic suspension articulation.
 */
export function getRockElevationAt(x: number, z: number): number {
  initObstacles();
  const grid = cachedSpatialGrid!;

  const cx = Math.floor(x / GRID_CELL_SIZE);
  const cz = Math.floor(z / GRID_CELL_SIZE);
  let maxOffset = 0;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const list = grid.get(cellKey(cx + dx, cz + dz));
      if (!list) continue;

      for (const obs of list) {
        if (obs.isSolid) continue; // Solid rocks are handled by horizontal barrier collision

        const ox = x - obs.x;
        const oz = z - obs.z;
        const dSq = ox * ox + oz * oz;
        const rSq = obs.radius * obs.radius;

        if (dSq < rSq) {
          // Smooth parabolic rock dome/slab profile
          const profile = 1.0 - dSq / rSq;
          const h = obs.height * (profile * profile);
          if (h > maxOffset) maxOffset = h;
        }
      }
    }
  }

  return maxOffset;
}

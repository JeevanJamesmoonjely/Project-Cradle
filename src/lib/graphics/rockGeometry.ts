import * as THREE from 'three';

/**
 * Generates an organic, weathered, multi-faceted Martian rock geometry with zero rectangular box faces.
 * Uses icosahedron base with 3D noise displacement for authentic geological fractures.
 */
export function createSculptedRockGeometry(
  detail = 2,
  flattenY = 1.0,
  noiseScale = 0.22
): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1.0, detail);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);

    // Multi-harmonic geological noise
    const n1 = Math.sin(vx * 3.8 + vy * 2.4) * Math.cos(vz * 3.2);
    const n2 = Math.sin(vy * 6.2 + vz * 4.1) * 0.45;
    const n3 = Math.cos(vx * 9.5 + vz * 8.2) * 0.25;

    // Rock cleavage fractures (stratified horizontal layers)
    const cleavage = Math.sin(vy * 8.0) * 0.12;
    const displacement = 1.0 + (n1 + n2 + n3 + cleavage) * noiseScale;

    // Apply displacement and vertical flattening (for slabs)
    pos.setXYZ(i, vx * displacement, vy * displacement * flattenY, vz * displacement);
  }

  // Planar / triplanar UV assignment to eliminate stretching & seams
  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uvs[i * 2] = pos.getX(i) * 0.65 + pos.getZ(i) * 0.35;
    uvs[i * 2 + 1] = pos.getY(i) * 0.75 + pos.getZ(i) * 0.45;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates an organic sedimentary mudstone slab with chipped, weathered edges (zero sharp box edges).
 */
export function createSculptedSlabGeometry(
  radiusX = 1.5,
  thickness = 0.35,
  radiusZ = 1.2
): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(1.0, 1.15, 1.0, 24, 6);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Weathering noise on edges and top
    const angle = Math.atan2(z, x);
    const rNoise =
      Math.sin(angle * 5) * 0.15 +
      Math.cos(angle * 9) * 0.08 +
      Math.sin(y * 12) * 0.06;

    // Scale to elliptical slab dimensions
    x *= radiusX * (1.0 + rNoise);
    z *= radiusZ * (1.0 + rNoise * 0.8);
    y *= thickness;

    // Chipped top / bottom edge bevel
    if (Math.abs(pos.getY(i)) > 0.4) {
      y += (Math.sin(x * 6 + z * 5) * 0.04);
    }

    pos.setXYZ(i, x, y, z);
  }

  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uvs[i * 2] = pos.getX(i) * 0.8;
    uvs[i * 2 + 1] = pos.getZ(i) * 0.8;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates an eroded Martian butte / monolith pillar with fluted vertical wind carving.
 */
export function createErodedPillarGeometry(
  bottomR = 1.4,
  topR = 0.7,
  height = 3.2
): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(topR, bottomR, height, 32, 16);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const angle = Math.atan2(z, x);

    // Aeolian fluting (yardang vertical grooves) & horizontal sedimentary terraces
    const fluting = Math.sin(angle * 7) * 0.12 + Math.cos(angle * 13) * 0.05;
    const terrace = Math.sin((y / height) * Math.PI * 6) * 0.08;
    const factor = 1.0 + fluting + terrace;

    pos.setXYZ(i, x * factor, y, z * factor);
  }

  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uvs[i * 2] = (Math.atan2(pos.getZ(i), pos.getX(i)) / (Math.PI * 2) + 0.5) * 3;
    uvs[i * 2 + 1] = (pos.getY(i) / height + 0.5) * 2;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a stepped Martian mesa outcrop with natural geological benches.
 */
export function createStratifiedMesaGeometry(
  radius = 2.2,
  height = 1.4
): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(radius * 0.75, radius, height, 28, 12);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const angle = Math.atan2(z, x);

    // Sedimentary bench steps & fracture clefts
    const step = Math.sign(Math.sin((y / height) * Math.PI * 4)) * 0.06;
    const fracture = Math.sin(angle * 4 + 1.2) * 0.14 + Math.cos(angle * 9) * 0.07;
    const factor = 1.0 + step + fracture;

    pos.setXYZ(i, x * factor, y, z * factor);
  }

  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uvs[i * 2] = pos.getX(i) * 0.6;
    uvs[i * 2 + 1] = pos.getZ(i) * 0.6;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  geo.computeVertexNormals();
  return geo;
}

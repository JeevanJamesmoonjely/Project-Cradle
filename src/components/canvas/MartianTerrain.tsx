'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight } from '@/lib/physics/terrainHeight';
import {
  createSculptedRockGeometry,
  createSculptedSlabGeometry,
} from '@/lib/graphics/rockGeometry';
import { getRockInstanceData } from '@/lib/physics/rockObstacles';

export const MartianTerrain: React.FC = () => {
  // Load High-Res NASA Jezero Crater Regolith & Volcanic Rock Textures
  const { regolithTexture, rockTexture } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { regolithTexture: null, rockTexture: null };
    }
    const loader = new THREE.TextureLoader();

    // High-resolution seamless texture (100% seamless wrap)
    const regolith = loader.load('/textures/mars_regolith.jpg');
    regolith.wrapS = THREE.RepeatWrapping;
    regolith.wrapT = THREE.RepeatWrapping;
    regolith.repeat.set(1, 1);
    regolith.anisotropy = 16;
    regolith.minFilter = THREE.LinearMipmapLinearFilter;
    regolith.magFilter = THREE.LinearFilter;
    regolith.generateMipmaps = true;

    const rock = loader.load('/textures/mars_rock.jpg');
    rock.wrapS = THREE.RepeatWrapping;
    rock.wrapT = THREE.RepeatWrapping;
    rock.repeat.set(2, 2);
    rock.anisotropy = 16;
    rock.minFilter = THREE.LinearMipmapLinearFilter;
    rock.magFilter = THREE.LinearFilter;

    return { regolithTexture: regolith, rockTexture: rock };
  }, []);

  // Pre-generate organic sculpted rock geometries (zero box geometries!)
  const boulderGeo = useMemo(() => createSculptedRockGeometry(2, 0.85, 0.22), []);
  const slabGeo = useMemo(() => createSculptedSlabGeometry(1.5, 0.3, 1.2), []);

  // 1. Single Continuous Martian Terrain Geometry (Center 0m to Horizon 4200m - ZERO GAPS)
  const { unifiedGeometry, boulderInstances, slabInstances } = useMemo(() => {
    const numSegments = 160;
    const radii: number[] = [];

    // A. Dense inner crater basin (0m to 280m) - 75 concentric rings (~3.7m per ring)
    for (let i = 1; i <= 75; i++) radii.push((i / 75) * 280);
    // B. Crater rim mountain walls (280m to 750m) - 30 concentric rings (~15.6m per ring)
    for (let i = 1; i <= 30; i++) radii.push(280 + (i / 30) * (750 - 280));
    // C. Continental Martian plateaus (750m to 4200m) - 25 concentric rings (~138m per ring)
    for (let i = 1; i <= 25; i++) radii.push(750 + (i / 25) * (4200 - 750));

    const numRings = radii.length; // 130 rings
    const totalVerts = 1 + numRings * numSegments; // 20,801 vertices
    const positions = new Float32Array(totalVerts * 3);
    const uvs = new Float32Array(totalVerts * 2);
    const colors = new Float32Array(totalVerts * 3);
    const indices: number[] = [];

    // Center vertex at (0, 0)
    const centerY = getTerrainHeight(0, 0);
    positions[0] = 0;
    positions[1] = centerY;
    positions[2] = 0;
    uvs[0] = 0;
    uvs[1] = 0;

    const baseColor = new THREE.Color('#c86c47');
    const deltaColor = new THREE.Color('#d4724e');
    const duneColor = new THREE.Color('#786259');
    const craterColor = new THREE.Color('#9c7b66');
    const escarpColor = new THREE.Color('#df9b6d');
    const rimBaseColor = new THREE.Color('#964228');
    const peakColor = new THREE.Color('#c25c34');
    const distantHazeColor = new THREE.Color('#c26b42');
    const shadowColor = new THREE.Color('#4a2014');

    colors[0] = baseColor.r;
    colors[1] = baseColor.g;
    colors[2] = baseColor.b;

    // Generate concentric rings of vertices
    for (let rIdx = 0; rIdx < numRings; rIdx++) {
      const r = radii[rIdx];
      // World-space planar UV scale transition (16m in inner basin, transitioning to 64m on mountains)
      const uvScale = r <= 280 ? 16.0 : THREE.MathUtils.lerp(16.0, 64.0, Math.min(1.0, (r - 280) / 1000));

      for (let s = 0; s < numSegments; s++) {
        const theta = (s / numSegments) * Math.PI * 2;
        const vIdx = 1 + rIdx * numSegments + s;
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        const y = getTerrainHeight(x, z);

        positions[vIdx * 3] = x;
        positions[vIdx * 3 + 1] = y;
        positions[vIdx * 3 + 2] = z;

        uvs[vIdx * 2] = x / uvScale;
        uvs[vIdx * 2 + 1] = z / uvScale;

        // Biome and elevation color blending
        let vColor = baseColor.clone();
        if (r > 200) {
          const normHeight = Math.max(0, Math.min(1, y / 85));
          const horizonFactor = Math.min(1.0, (r - 200) / 4000);
          vColor = rimBaseColor.clone();
          if (normHeight > 0.35) {
            vColor.lerp(peakColor, (normHeight - 0.35) * 1.5);
          } else {
            vColor.lerp(shadowColor, (0.35 - normHeight) * 1.4);
          }
          const band = Math.sin(y * 0.5) * 0.08;
          vColor.offsetHSL(0, 0, band);
          vColor.lerp(distantHazeColor, Math.pow(horizonFactor, 1.2) * 0.85);
        } else {
          const isDelta = x > 5 && z > 0;
          const isDunes = x < -10 && z > -15;
          const isCrater = z < -20 && x < 25;
          const isEscarpment = x > 28;

          if (isDunes) {
            const factor = Math.min(1.0, Math.abs(x + 10) * 0.04);
            vColor.lerp(duneColor, factor * 0.75);
          } else if (isDelta) {
            const factor = Math.min(1.0, (x - 5) * 0.035);
            vColor.lerp(deltaColor, factor * 0.85);
          } else if (isCrater) {
            vColor.lerp(craterColor, 0.7);
          } else if (isEscarpment) {
            const factor = Math.min(1.0, (x - 28) * 0.05);
            const band = Math.sin(y * 1.8) * 0.12;
            vColor.lerp(escarpColor.clone().offsetHSL(0, 0, band), factor);
          }
          const noise = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.03;
          vColor.offsetHSL(0, 0, noise);
        }

        colors[vIdx * 3] = vColor.r;
        colors[vIdx * 3 + 1] = vColor.g;
        colors[vIdx * 3 + 2] = vColor.b;
      }
    }

    // Connect center vertex to first ring with fan of triangles
    for (let s = 0; s < numSegments; s++) {
      const nextS = (s + 1) % numSegments;
      indices.push(0, 1 + nextS, 1 + s);
    }

    // Connect concentric rings with quads (two triangles per quad)
    for (let rIdx = 0; rIdx < numRings - 1; rIdx++) {
      const ringStart = 1 + rIdx * numSegments;
      const nextRingStart = 1 + (rIdx + 1) * numSegments;
      for (let s = 0; s < numSegments; s++) {
        const nextS = (s + 1) % numSegments;
        const a = ringStart + s;
        const b = ringStart + nextS;
        const c = nextRingStart + nextS;
        const d = nextRingStart + s;
        indices.push(a, b, c);
        indices.push(a, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const { boulders: boulderInstances, slabs: slabInstances } = getRockInstanceData();

    return {
      unifiedGeometry: geo,
      boulderInstances,
      slabInstances,
    };
  }, []);

  return (
    <group>
      {/* Single Continuous Seamless Martian Surface (0m to 4200m - ZERO GAPS) */}
      <mesh geometry={unifiedGeometry} receiveShadow castShadow>
        {regolithTexture ? (
          <meshStandardMaterial
            vertexColors
            map={regolithTexture}
            bumpMap={regolithTexture}
            bumpScale={0.06}
            roughness={0.88}
            metalness={0.04}
            flatShading={false}
          />
        ) : (
          <meshStandardMaterial vertexColors roughness={0.9} />
        )}
      </mesh>

      {/* Organic Sculpted Boulders */}
      <InstancedMeshCluster
        matrices={boulderInstances.matrices}
        colors={boulderInstances.colors}
        geometry={boulderGeo}
        rockTexture={rockTexture}
      />

      {/* Organic Fractured Mudstone Slabs */}
      <InstancedMeshCluster
        matrices={slabInstances.matrices}
        colors={slabInstances.colors}
        geometry={slabGeo}
        rockTexture={rockTexture}
      />
    </group>
  );
};

interface InstancedMeshClusterProps {
  matrices: THREE.Matrix4[];
  colors: THREE.Color[];
  geometry: THREE.BufferGeometry;
  rockTexture: THREE.Texture | null;
}

const InstancedMeshCluster: React.FC<InstancedMeshClusterProps> = ({
  matrices,
  colors,
  geometry,
  rockTexture,
}) => {
  const meshRef = React.useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!meshRef.current) return;
    matrices.forEach((mat, idx) => {
      meshRef.current?.setMatrixAt(idx, mat);
      meshRef.current?.setColorAt(idx, colors[idx]);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [matrices, colors]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, matrices.length]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        map={rockTexture || undefined}
        bumpMap={rockTexture || undefined}
        bumpScale={0.12}
        roughness={0.88}
        metalness={0.12}
      />
    </instancedMesh>
  );
};

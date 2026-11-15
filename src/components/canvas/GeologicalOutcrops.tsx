'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMissionStore } from '@/lib/store/useMissionStore';
import { GeologicalPOI } from '@/lib/science/types';
import { getTerrainHeight } from '@/lib/physics/terrainHeight';
import {
  createSculptedRockGeometry,
  createSculptedSlabGeometry,
  createErodedPillarGeometry,
  createStratifiedMesaGeometry,
} from '@/lib/graphics/rockGeometry';

export const GeologicalOutcrops: React.FC = () => {
  const pois = useMissionStore((s) => s.pois);
  const roverPos = useMissionStore((s) => s.rover.position);
  const activeScanPOI = useMissionStore((s) => s.activeScanPOI);
  const isScanning = useMissionStore((s) => s.isScanning);
  const startDeepScan = useMissionStore((s) => s.startDeepScan);

  // Shared organic rock geometries (zero box geometries anywhere!)
  const geometries = useMemo(() => {
    return {
      slabMain: createSculptedSlabGeometry(1.6, 0.38, 1.3),
      slabUpper: createSculptedSlabGeometry(1.2, 0.28, 0.95),
      noduleBedrock: createSculptedSlabGeometry(1.5, 0.32, 1.4),
      monolithPillar: createErodedPillarGeometry(1.4, 0.85, 3.2),
      monolithCapstone: createSculptedSlabGeometry(1.3, 0.4, 1.2),
      boulderMain: createSculptedRockGeometry(2, 0.9, 0.22),
      boulderSecondary: createSculptedRockGeometry(2, 0.82, 0.24),
      craterRock: createSculptedRockGeometry(2, 0.78, 0.26),
      ventMound: createErodedPillarGeometry(1.7, 1.1, 1.4),
      ventCollar: createSculptedSlabGeometry(1.15, 0.3, 1.15),
      mesaBase: createStratifiedMesaGeometry(2.4, 1.05),
      mesaUpper: createStratifiedMesaGeometry(1.65, 0.8),
    };
  }, []);

  return (
    <group>
      {pois.map((poi) => {
        const groundY = getTerrainHeight(poi.position[0], poi.position[2]);
        const adjustedPos: [number, number, number] = [
          poi.position[0],
          groundY,
          poi.position[2],
        ];

        const dx = roverPos[0] - poi.position[0];
        const dz = roverPos[2] - poi.position[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        const inProximity = dist < 16.0;
        const isTargeted = activeScanPOI?.id === poi.id;

        return (
          <OutcropMesh
            key={poi.id}
            poi={poi}
            position={adjustedPos}
            inProximity={inProximity}
            distance={dist}
            isTargeted={isTargeted}
            isScanning={isScanning}
            onScan={() => startDeepScan(poi)}
            geometries={geometries}
          />
        );
      })}
    </group>
  );
};

interface OutcropMeshProps {
  poi: GeologicalPOI;
  position: [number, number, number];
  inProximity: boolean;
  distance: number;
  isTargeted: boolean;
  isScanning: boolean;
  onScan: () => void;
  geometries: {
    slabMain: THREE.BufferGeometry;
    slabUpper: THREE.BufferGeometry;
    noduleBedrock: THREE.BufferGeometry;
    monolithPillar: THREE.BufferGeometry;
    monolithCapstone: THREE.BufferGeometry;
    boulderMain: THREE.BufferGeometry;
    boulderSecondary: THREE.BufferGeometry;
    craterRock: THREE.BufferGeometry;
    ventMound: THREE.BufferGeometry;
    ventCollar: THREE.BufferGeometry;
    mesaBase: THREE.BufferGeometry;
    mesaUpper: THREE.BufferGeometry;
  };
}

const OutcropMesh: React.FC<OutcropMeshProps> = ({
  poi,
  position,
  inProximity,
  isTargeted,
  geometries,
}) => {
  const beaconRingRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (beaconRingRef.current) {
      beaconRingRef.current.rotation.z = t * 0.6;
      const s = 1.0 + Math.sin(t * 2.5) * 0.08;
      beaconRingRef.current.scale.set(s, s, s);
    }
  });

  const scale = poi.scale || [2.5, 2.0, 2.5];

  const rockTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const loader = new THREE.TextureLoader();
    const tex = loader.load('/textures/mars_rock.jpg');
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2.0, 2.0);
    tex.anisotropy = 16;
    return tex;
  }, []);

  // Natural geological rock colors (blended with photorealistic rock texture)
  const rockDark = '#3d1d16';
  const rockWarm = '#8f462c';
  const rockClay = '#b86b45';
  const mineralSulfate = '#d4ad89';

  return (
    <group position={position}>
      {/* 100% Organic Photorealistic Natural Rock Formations (ZERO BOX GEOMETRIES) */}
      <group scale={scale}>
        {poi.shape === 'slab' && (
          // Layered lacustrine sedimentary mudstone shelf (Image 4)
          <group position={[0, 0.25, 0]}>
            <mesh geometry={geometries.slabMain} castShadow receiveShadow>
              <meshStandardMaterial
                map={rockTexture || undefined}
                bumpMap={rockTexture || undefined}
                bumpScale={0.08}
                color={rockClay}
                roughness={0.88}
                metalness={0.08}
              />
            </mesh>
            {/* Upper fractured layer */}
            <mesh
              geometry={geometries.slabUpper}
              position={[0.2, 0.32, 0.1]}
              castShadow
              receiveShadow
              rotation={[0, 0.4, 0]}
            >
              <meshStandardMaterial
                map={rockTexture || undefined}
                bumpMap={rockTexture || undefined}
                bumpScale={0.08}
                color={rockWarm}
                roughness={0.9}
                metalness={0.06}
              />
            </mesh>
            {/* White silica / gypsum vein cutting through rock */}
            <mesh position={[-0.1, 0.33, 0.2]} rotation={[0, 0.5, 0.05]} scale={[1.1, 0.15, 0.25]}>
              <mesh
                geometry={geometries.slabUpper}
                scale={[0.7, 0.2, 0.2]}
              >
                <meshStandardMaterial color={mineralSulfate} roughness={0.65} metalness={0.15} />
              </mesh>
            </mesh>
          </group>
        )}

        {poi.shape === 'monolith' && (
          // Weathered sedimentary butte pillar (Kodiak Butte in Jezero)
          <group position={[0, 1.6, 0]}>
            <mesh
              geometry={geometries.monolithPillar}
              castShadow
              receiveShadow
              rotation={[0.04, 0.4, -0.03]}
            >
              <meshStandardMaterial
                map={rockTexture || undefined}
                bumpMap={rockTexture || undefined}
                bumpScale={0.09}
                color={rockWarm}
                roughness={0.92}
                metalness={0.08}
              />
            </mesh>
            {/* Stratified capstone */}
            <mesh
              geometry={geometries.monolithCapstone}
              position={[0, 1.68, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                map={rockTexture || undefined}
                bumpMap={rockTexture || undefined}
                bumpScale={0.08}
                color={rockDark}
                roughness={0.85}
                metalness={0.1}
              />
            </mesh>
          </group>
        )}

        {poi.shape === 'nodules' && (
          // Hematite blueberries / nodular concretion field in bedrock slab
          <group position={[0, 0.2, 0]}>
            <mesh geometry={geometries.noduleBedrock} castShadow receiveShadow>
              <meshStandardMaterial
                map={rockTexture || undefined}
                bumpMap={rockTexture || undefined}
                bumpScale={0.08}
                color={rockWarm}
                roughness={0.9}
              />
            </mesh>
            {/* Dark hematite spherules */}
            {[-0.6, -0.2, 0.3, 0.7].map((nx, i) => (
              <mesh
                key={i}
                position={[nx, 0.22, i % 2 === 0 ? 0.35 : -0.3]}
                castShadow
              >
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial color="#2b2326" roughness={0.65} metalness={0.4} />
              </mesh>
            ))}
          </group>
        )}

        {poi.shape === 'boulder_cluster' && (
          // Weathered multi-faceted impact boulders
          <group position={[0, 0.6, 0]}>
            <mesh
              geometry={geometries.boulderMain}
              castShadow
              receiveShadow
              rotation={[0.2, 0.5, 0.3]}
              scale={[1.15, 1.15, 1.15]}
            >
              <meshStandardMaterial
                map={rockTexture || undefined}
                bumpMap={rockTexture || undefined}
                bumpScale={0.1}
                color={rockDark}
                roughness={0.9}
                metalness={0.12}
              />
            </mesh>
            <mesh
              geometry={geometries.boulderSecondary}
              position={[0.9, -0.2, 0.4]}
              castShadow
              receiveShadow
              rotation={[-0.3, 0.2, 0.1]}
              scale={[0.8, 0.8, 0.8]}
            >
              <meshStandardMaterial
                map={rockTexture || undefined}
                bumpMap={rockTexture || undefined}
                bumpScale={0.1}
                color={rockWarm}
                roughness={0.88}
                metalness={0.1}
              />
            </mesh>
            <mesh
              geometry={geometries.boulderSecondary}
              position={[-0.7, -0.3, -0.5]}
              castShadow
              receiveShadow
              scale={[0.6, 0.6, 0.6]}
            >
              <meshStandardMaterial
                map={rockTexture || undefined}
                bumpMap={rockTexture || undefined}
                bumpScale={0.1}
                color={rockClay}
                roughness={0.92}
              />
            </mesh>
          </group>
        )}

        {poi.shape === 'crater_rock' && (
          // Jagged iron-rich impact breccia boulder
          <mesh
            geometry={geometries.craterRock}
            position={[0, 0.8, 0]}
            castShadow
            receiveShadow
            rotation={[-0.2, 0.4, 0.3]}
            scale={[1.35, 1.35, 1.35]}
          >
            <meshStandardMaterial
              map={rockTexture || undefined}
              bumpMap={rockTexture || undefined}
              bumpScale={0.12}
              color={rockDark}
              roughness={0.88}
              metalness={0.2}
            />
          </mesh>
        )}

        {poi.shape === 'vent' && (
          // Volcanic hydrothermal mound with fractured fissures
          <group position={[0, 0.6, 0]}>
            {/* Basalt chimney mound */}
            <mesh
              geometry={geometries.ventMound}
              castShadow
              receiveShadow
              rotation={[0.05, 0.3, -0.05]}
            >
              <meshStandardMaterial
                map={rockTexture || undefined}
                bumpMap={rockTexture || undefined}
                bumpScale={0.1}
                color={rockDark}
                roughness={0.92}
                metalness={0.15}
              />
            </mesh>
            {/* Fractured rim collar */}
            <mesh
              geometry={geometries.ventCollar}
              position={[0, 0.58, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                map={rockTexture || undefined}
                bumpMap={rockTexture || undefined}
                bumpScale={0.08}
                color={rockWarm}
                roughness={0.88}
                metalness={0.12}
              />
            </mesh>
            {/* Mineralized sulfur crust inside vent fissure */}
            <mesh position={[0, 0.62, 0]}>
              <cylinderGeometry args={[0.55, 0.55, 0.15, 24]} />
              <meshStandardMaterial color="#c29a58" roughness={0.75} metalness={0.2} />
            </mesh>
          </group>
        )}

        {poi.shape === 'mesa' && (
          // Stratified desert mesa outcrop with stepped benches
          <group position={[0, 0.6, 0]}>
            <mesh geometry={geometries.mesaBase} castShadow receiveShadow>
              <meshStandardMaterial
                map={rockTexture || undefined}
                bumpMap={rockTexture || undefined}
                bumpScale={0.08}
                color={rockWarm}
                roughness={0.92}
              />
            </mesh>
            <mesh
              geometry={geometries.mesaUpper}
              position={[0.2, 0.72, 0]}
              castShadow
              receiveShadow
              rotation={[0, 0.3, 0]}
            >
              <meshStandardMaterial
                map={rockTexture || undefined}
                bumpMap={rockTexture || undefined}
                bumpScale={0.08}
                color={rockClay}
                roughness={0.88}
              />
            </mesh>
          </group>
        )}
      </group>

      {/* Subtle Holographic Scientific Target Ring on Ground (NASA AR style) */}
      <mesh
        ref={beaconRingRef}
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[1.8, 2.05, 36]} />
        <meshBasicMaterial
          color={poi.sampleCollected ? '#22c55e' : isTargeted ? '#38bdf8' : '#f97316'}
          transparent
          opacity={inProximity ? 0.75 : 0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

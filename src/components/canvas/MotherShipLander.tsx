'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight } from '@/lib/physics/terrainHeight';
import { useMissionStore } from '@/lib/store/useMissionStore';
import {
  getHabitatDomeTexture,
  getOrangePodTexture,
  getTransitCorridorTexture,
  getDSNDishTexture,
  getCargoContainerTexture,
  getSolarCellTexture,
  getAntennaMeshTexture,
} from '@/lib/graphics/spaceflightTextures';

// Mother Base / Rover Docking Bay Anchor in world coords
export const LANDER_X = 0;
export const LANDER_Z = -25;
export const RAMP_START_Z = -22.8;
export const RAMP_END_Z = -16.8;

// Physically exact ramp and deck surface elevation calculation
export const getMotherShipRampSurfaceY = (worldX: number, worldZ: number): number | null => {
  const relX = worldX - LANDER_X;
  const relZ = worldZ - LANDER_Z;
  const groundLanderY = getTerrainHeight(LANDER_X, LANDER_Z);
  const deckY = groundLanderY + 1.14;

  // Lander deck cradle area (|relX| <= 2.2, relZ from -2.8 to 1.5)
  if (relZ >= -2.8 && relZ < 1.5 && Math.abs(relX) <= 2.2) {
    return deckY;
  }

  // Ramp zone: relZ from 1.5 to 8.2, width spanning both wheels (|relX| <= 1.6)
  if (relZ >= 1.5 && relZ <= 8.2 && Math.abs(relX) <= 1.6) {
    const groundFootY = getTerrainHeight(LANDER_X, LANDER_Z + 8.2) + 0.04;
    const t = (relZ - 1.5) / (8.2 - 1.5);
    return deckY * (1 - t) + groundFootY * t;
  }
  return null;
};

export const MotherShipLander: React.FC = () => {
  const beaconRingRef = useRef<THREE.Mesh>(null);
  const strobeRef = useRef<THREE.PointLight>(null);
  const dsnDishRef = useRef<THREE.Group>(null);
  const dsnStrobeRef = useRef<THREE.PointLight>(null);
  const mavStrobeRef = useRef<THREE.PointLight>(null);

  const podDish1Ref = useRef<THREE.Group>(null);
  const podDish2Ref = useRef<THREE.Group>(null);
  const podDish3Ref = useRef<THREE.Group>(null);
  const podDish4Ref = useRef<THREE.Group>(null);

  const isDocked = useMissionStore((s) => s.motherShip.isDocked);

  // Surface ground height at base coordinates
  const groundY = useMemo(() => getTerrainHeight(LANDER_X, LANDER_Z), []);

  // Textures generated from procedural PBR canvas shaders
  const dome08Texture = useMemo(() => getHabitatDomeTexture('08'), []);
  const domeX1Texture = useMemo(() => getHabitatDomeTexture('X-1'), []);
  const podL01Texture = useMemo(() => getOrangePodTexture('L-01'), []);
  const podL02Texture = useMemo(() => getOrangePodTexture('L-02'), []);
  const podL03Texture = useMemo(() => getOrangePodTexture('L-03'), []);
  const podL04Texture = useMemo(() => getOrangePodTexture('L-04'), []);
  const corridorTexture = useMemo(() => getTransitCorridorTexture(), []);
  const dsnDishTexture = useMemo(() => getDSNDishTexture(), []);
  const solarCellTexture = useMemo(() => getSolarCellTexture(), []);
  const antennaMeshTexture = useMemo(() => getAntennaMeshTexture(), []);
  const cargoOrangeTexture = useMemo(() => getCargoContainerTexture('orange'), []);
  const cargoWhiteTexture = useMemo(() => getCargoContainerTexture('white'), []);

  // Shared high-quality PBR materials
  const dome08Material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: dome08Texture,
        roughness: 0.65,
        metalness: 0.12,
      }),
    [dome08Texture]
  );

  const domeX1Material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: domeX1Texture,
        roughness: 0.65,
        metalness: 0.12,
      }),
    [domeX1Texture]
  );

  const corridorMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: corridorTexture,
        roughness: 0.5,
        metalness: 0.15,
      }),
    [corridorTexture]
  );

  const darkTitaniumMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1e293b',
        metalness: 0.85,
        roughness: 0.25,
      }),
    []
  );

  const whiteAeroMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        metalness: 0.2,
        roughness: 0.35,
      }),
    []
  );

  const goldMliMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        emissive: '#78350f',
        emissiveIntensity: 0.18,
        metalness: 0.88,
        roughness: 0.22,
      }),
    []
  );

  const dsnDishMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: dsnDishTexture,
        metalness: 0.35,
        roughness: 0.3,
      }),
    [dsnDishTexture]
  );

  const solarPanelMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: solarCellTexture,
        metalness: 0.75,
        roughness: 0.15,
      }),
    [solarCellTexture]
  );

  const cargoOrangeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: cargoOrangeTexture,
        roughness: 0.6,
        metalness: 0.25,
      }),
    [cargoOrangeTexture]
  );

  const cargoWhiteMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: cargoWhiteTexture,
        roughness: 0.6,
        metalness: 0.25,
      }),
    [cargoWhiteTexture]
  );

  const meshAntennaMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: antennaMeshTexture,
        color: '#334155',
        metalness: 0.9,
        roughness: 0.35,
      }),
    [antennaMeshTexture]
  );

  // Pulse animation for docking beacon ring, strobes, and antenna tracking
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (beaconRingRef.current) {
      const scale = 1 + Math.sin(time * 2.5) * 0.05;
      beaconRingRef.current.scale.set(scale, 1, scale);
      const mat = beaconRingRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = 0.45 + Math.sin(time * 3.0) * 0.25;
      }
    }

    if (strobeRef.current) {
      strobeRef.current.intensity = Math.sin(time * 6.0) > 0.8 ? 5.0 : 0.4;
    }

    if (dsnStrobeRef.current) {
      dsnStrobeRef.current.intensity = Math.sin(time * 4.0) > 0.8 ? 4.0 : 0.2;
    }

    if (mavStrobeRef.current) {
      mavStrobeRef.current.intensity = Math.sin(time * 5.0 + 1.0) > 0.8 ? 3.5 : 0.3;
    }

    // Gentle slow tracking rotation for DSN giant dish (tracking Earth in deep space)
    if (dsnDishRef.current) {
      dsnDishRef.current.rotation.y = -0.55 + Math.sin(time * 0.04) * 0.12;
      dsnDishRef.current.rotation.x = -0.32 + Math.cos(time * 0.03) * 0.06;
    }

    // Pod communications dishes fine-tracking orbiters
    if (podDish1Ref.current) podDish1Ref.current.rotation.y = 0.3 + Math.sin(time * 0.1 + 0.5) * 0.25;
    if (podDish2Ref.current) podDish2Ref.current.rotation.y = -0.4 + Math.sin(time * 0.12 + 1.2) * 0.25;
    if (podDish3Ref.current) podDish3Ref.current.rotation.y = 0.4 + Math.sin(time * 0.11 + 2.0) * 0.25;
    if (podDish4Ref.current) podDish4Ref.current.rotation.y = -0.2 + Math.sin(time * 0.09 + 3.1) * 0.25;
  });

  return (
    <group position={[LANDER_X, groundY, LANDER_Z]}>
      {/* =========================================================================
          1. CENTRAL HABITAT HUB DOME "08" (PRIMARY INFLATABLE BIOSPHERE)
          Matches reference image: massive white canopy with radial seams,
          heavy stenciled "08", circular cupola skylights, perimeter anchor ring
          ========================================================================= */}
      <group position={[0, 0, -14.5]}>
        {/* Main Pressurized Fabric Dome Canopy (Flattened Spherical Profile) */}
        <mesh
          position={[0, 0, 0]}
          scale={[13.5, 5.2, 13.5]}
          material={dome08Material}
          castShadow
          receiveShadow
        >
          {/* Half sphere sliced at equator for dome */}
          <sphereGeometry args={[1, 48, 28, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        </mesh>

        {/* Circular Perimeter Inflatable Foundation Collar */}
        <mesh position={[0, 0.45, 0]} material={whiteAeroMaterial} castShadow receiveShadow>
          <torusGeometry args={[13.5, 0.65, 16, 64]} />
        </mesh>

        {/* Outer Ground Tie-Down Bedrock Anchors (24 radial tie points) */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * Math.PI * 2;
          const ax = Math.sin(angle) * 14.1;
          const az = Math.cos(angle) * 14.1;
          return (
            <group key={i} position={[ax, 0.25, az]}>
              {/* Ground Anchor Pin */}
              <mesh material={darkTitaniumMaterial}>
                <boxGeometry args={[0.45, 0.5, 0.45]} />
              </mesh>
              {/* Tension Turnbuckle Cable angled towards dome */}
              <mesh
                position={[-Math.sin(angle) * 0.4, 0.4, -Math.cos(angle) * 0.4]}
                material={darkTitaniumMaterial}
              >
                <cylinderGeometry args={[0.03, 0.03, 0.9, 8]} />
              </mesh>
            </group>
          );
        })}

        {/* Central Observation Cupola & Atmospheric Sensor Mast on Dome Peak */}
        <group position={[0, 5.2, 0]}>
          {/* Primary Apex Collar Ring */}
          <mesh material={darkTitaniumMaterial}>
            <cylinderGeometry args={[1.6, 1.8, 0.25, 24]} />
          </mesh>
          {/* Tinted Quartz Observation Sky Dome */}
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[1.45, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
            <meshStandardMaterial
              color="#0f172a"
              emissive="#0284c7"
              emissiveIntensity={0.25}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
          {/* Interior Biosphere Warm Glow emitting through cupola */}
          <pointLight color="#fef08a" intensity={1.8} distance={14} position={[0, 0.2, 0]} />

          {/* Meteorological Anemometer & Warning Light Mast */}
          <mesh position={[0, 0.9, 0]} material={darkTitaniumMaterial}>
            <cylinderGeometry args={[0.04, 0.06, 1.2, 8]} />
          </mesh>
          <mesh position={[0, 1.55, 0]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <pointLight position={[0, 1.6, 0]} color="#ef4444" intensity={2.0} distance={20} />
        </group>
      </group>

      {/* =========================================================================
          2. RADIAL HABITATION & LABORATORY PODS (L-01, L-02, L-03, L-04)
          Exact match to reference image: Quilted orange safety exterior,
          bold black stencil IDs on end caps, rooftop comms dishes, structural
          skid platforms with leveling footpads, adjacent life-support utility crates
          ========================================================================= */}

      {/* --- POD L-01 (West Research Lab & Astrobiology) --- */}
      <group position={[-16.0, 0.6, -15.5]} rotation={[0, 0.25, 0]}>
        {/* Support Foundation Skid Pallet */}
        <mesh position={[0, -0.3, 0]} material={darkTitaniumMaterial} castShadow receiveShadow>
          <boxGeometry args={[4.2, 0.35, 7.8]} />
        </mesh>
        {/* Foundation Leveling Jacks */}
        {[-1.8, 1.8].map((jx) =>
          [-3.4, 3.4].map((jz) => (
            <mesh key={`${jx}-${jz}`} position={[jx, -0.6, jz]} material={goldMliMaterial}>
              <cylinderGeometry args={[0.22, 0.28, 0.35, 12]} />
            </mesh>
          ))
        )}
        {/* Cylindrical Quilted Orange Hab Capsule */}
        <mesh
          position={[0, 1.45, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={
            useMemo(
              () =>
                new THREE.MeshStandardMaterial({
                  map: podL01Texture,
                  roughness: 0.55,
                  metalness: 0.2,
                }),
              [podL01Texture]
            )
          }
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[1.75, 1.75, 6.8, 32]} />
        </mesh>
        {/* Rounded Hemisphere End Caps */}
        <mesh position={[0, 1.45, 3.4]} rotation={[0, 0, 0]} material={whiteAeroMaterial} castShadow>
          <sphereGeometry args={[1.74, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.3]} />
        </mesh>
        <mesh position={[0, 1.45, -3.4]} rotation={[Math.PI, 0, 0]} material={whiteAeroMaterial} castShadow>
          <sphereGeometry args={[1.74, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.3]} />
        </mesh>
        {/* Rooftop Communications Antenna Dish */}
        <group ref={podDish1Ref} position={[0, 3.3, 0]}>
          <mesh material={darkTitaniumMaterial}>
            <cylinderGeometry args={[0.06, 0.08, 0.6, 12]} />
          </mesh>
          <group position={[0, 0.35, 0]} rotation={[0.55, 0, 0]}>
            <mesh material={meshAntennaMaterial} castShadow>
              <cylinderGeometry args={[0.7, 0.1, 0.22, 24]} />
            </mesh>
            <mesh position={[0, 0.25, 0]} material={darkTitaniumMaterial}>
              <cylinderGeometry args={[0.02, 0.02, 0.45, 8]} />
            </mesh>
          </group>
        </group>
        {/* Adjacent Utility / Cryo Life-Support Module */}
        <group position={[2.6, 0.3, 0]}>
          <mesh material={whiteAeroMaterial} castShadow>
            <boxGeometry args={[1.1, 1.4, 2.2]} />
          </mesh>
          {/* Dual Cryogenic Liquid Gas Tanks */}
          <mesh position={[0, 0.2, 1.4]} material={whiteAeroMaterial}>
            <cylinderGeometry args={[0.3, 0.3, 1.2, 16]} />
          </mesh>
          <mesh position={[0, 0.2, 2.1]} material={darkTitaniumMaterial}>
            <cylinderGeometry args={[0.3, 0.3, 1.2, 16]} />
          </mesh>
        </group>
      </group>

      {/* --- POD L-02 (South-West Crew Quarters & Medical Bay) --- */}
      <group position={[-11.2, 0.6, -4.5]} rotation={[0, 0.12, 0]}>
        {/* Support Foundation Skid Pallet */}
        <mesh position={[0, -0.3, 0]} material={darkTitaniumMaterial} castShadow receiveShadow>
          <boxGeometry args={[4.2, 0.35, 7.8]} />
        </mesh>
        {/* Foundation Leveling Jacks */}
        {[-1.8, 1.8].map((jx) =>
          [-3.4, 3.4].map((jz) => (
            <mesh key={`${jx}-${jz}`} position={[jx, -0.6, jz]} material={goldMliMaterial}>
              <cylinderGeometry args={[0.22, 0.28, 0.35, 12]} />
            </mesh>
          ))
        )}
        {/* Cylindrical Quilted Orange Hab Capsule */}
        <mesh
          position={[0, 1.45, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={
            useMemo(
              () =>
                new THREE.MeshStandardMaterial({
                  map: podL02Texture,
                  roughness: 0.55,
                  metalness: 0.2,
                }),
              [podL02Texture]
            )
          }
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[1.75, 1.75, 6.8, 32]} />
        </mesh>
        {/* End caps */}
        <mesh position={[0, 1.45, 3.4]} material={whiteAeroMaterial} castShadow>
          <sphereGeometry args={[1.74, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.3]} />
        </mesh>
        <mesh position={[0, 1.45, -3.4]} rotation={[Math.PI, 0, 0]} material={whiteAeroMaterial} castShadow>
          <sphereGeometry args={[1.74, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.3]} />
        </mesh>
        {/* Rooftop Communications Antenna Dish */}
        <group ref={podDish2Ref} position={[0, 3.3, 0]}>
          <mesh material={darkTitaniumMaterial}>
            <cylinderGeometry args={[0.06, 0.08, 0.6, 12]} />
          </mesh>
          <group position={[0, 0.35, 0]} rotation={[0.5, 0.3, 0]}>
            <mesh material={meshAntennaMaterial} castShadow>
              <cylinderGeometry args={[0.7, 0.1, 0.22, 24]} />
            </mesh>
            <mesh position={[0, 0.25, 0]} material={darkTitaniumMaterial}>
              <cylinderGeometry args={[0.02, 0.02, 0.45, 8]} />
            </mesh>
          </group>
        </group>
        {/* Utility boxes and Heat Radiator Panel */}
        <group position={[2.5, 0.2, -1.2]}>
          <mesh material={whiteAeroMaterial} castShadow>
            <boxGeometry args={[0.9, 1.2, 1.8]} />
          </mesh>
          <mesh position={[0.55, 0, 0]} material={darkTitaniumMaterial}>
            <boxGeometry args={[0.1, 0.9, 1.6]} />
          </mesh>
        </group>
      </group>

      {/* --- POD L-03 (South-East Geology & Core Processing) --- */}
      <group position={[11.2, 0.6, -4.5]} rotation={[0, -0.12, 0]}>
        {/* Support Foundation Skid Pallet */}
        <mesh position={[0, -0.3, 0]} material={darkTitaniumMaterial} castShadow receiveShadow>
          <boxGeometry args={[4.2, 0.35, 7.8]} />
        </mesh>
        {/* Leveling Jacks */}
        {[-1.8, 1.8].map((jx) =>
          [-3.4, 3.4].map((jz) => (
            <mesh key={`${jx}-${jz}`} position={[jx, -0.6, jz]} material={goldMliMaterial}>
              <cylinderGeometry args={[0.22, 0.28, 0.35, 12]} />
            </mesh>
          ))
        )}
        {/* Cylindrical Quilted Orange Hab Capsule */}
        <mesh
          position={[0, 1.45, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={
            useMemo(
              () =>
                new THREE.MeshStandardMaterial({
                  map: podL03Texture,
                  roughness: 0.55,
                  metalness: 0.2,
                }),
              [podL03Texture]
            )
          }
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[1.75, 1.75, 6.8, 32]} />
        </mesh>
        <mesh position={[0, 1.45, 3.4]} material={whiteAeroMaterial} castShadow>
          <sphereGeometry args={[1.74, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.3]} />
        </mesh>
        <mesh position={[0, 1.45, -3.4]} rotation={[Math.PI, 0, 0]} material={whiteAeroMaterial} castShadow>
          <sphereGeometry args={[1.74, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.3]} />
        </mesh>
        {/* Rooftop Communications Antenna Dish */}
        <group ref={podDish3Ref} position={[0, 3.3, 0]}>
          <mesh material={darkTitaniumMaterial}>
            <cylinderGeometry args={[0.06, 0.08, 0.6, 12]} />
          </mesh>
          <group position={[0, 0.35, 0]} rotation={[0.48, -0.4, 0]}>
            <mesh material={meshAntennaMaterial} castShadow>
              <cylinderGeometry args={[0.7, 0.1, 0.22, 24]} />
            </mesh>
            <mesh position={[0, 0.25, 0]} material={darkTitaniumMaterial}>
              <cylinderGeometry args={[0.02, 0.02, 0.45, 8]} />
            </mesh>
          </group>
        </group>
        {/* Equipment Crates */}
        <group position={[-2.5, 0.2, -1.0]}>
          <mesh material={whiteAeroMaterial} castShadow>
            <boxGeometry args={[0.9, 1.2, 1.8]} />
          </mesh>
        </group>
      </group>

      {/* --- POD L-04 (East Command & Telecom Array) --- */}
      <group position={[16.2, 0.6, -14.8]} rotation={[0, -0.22, 0]}>
        {/* Support Foundation Skid Pallet */}
        <mesh position={[0, -0.3, 0]} material={darkTitaniumMaterial} castShadow receiveShadow>
          <boxGeometry args={[4.2, 0.35, 7.8]} />
        </mesh>
        {/* Leveling Jacks */}
        {[-1.8, 1.8].map((jx) =>
          [-3.4, 3.4].map((jz) => (
            <mesh key={`${jx}-${jz}`} position={[jx, -0.6, jz]} material={goldMliMaterial}>
              <cylinderGeometry args={[0.22, 0.28, 0.35, 12]} />
            </mesh>
          ))
        )}
        {/* Cylindrical Quilted Orange Hab Capsule */}
        <mesh
          position={[0, 1.45, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={
            useMemo(
              () =>
                new THREE.MeshStandardMaterial({
                  map: podL04Texture,
                  roughness: 0.55,
                  metalness: 0.2,
                }),
              [podL04Texture]
            )
          }
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[1.75, 1.75, 6.8, 32]} />
        </mesh>
        <mesh position={[0, 1.45, 3.4]} material={whiteAeroMaterial} castShadow>
          <sphereGeometry args={[1.74, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.3]} />
        </mesh>
        <mesh position={[0, 1.45, -3.4]} rotation={[Math.PI, 0, 0]} material={whiteAeroMaterial} castShadow>
          <sphereGeometry args={[1.74, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.3]} />
        </mesh>
        {/* Rooftop Communications Antenna Dish */}
        <group ref={podDish4Ref} position={[0, 3.3, 0]}>
          <mesh material={darkTitaniumMaterial}>
            <cylinderGeometry args={[0.06, 0.08, 0.6, 12]} />
          </mesh>
          <group position={[0, 0.35, 0]} rotation={[0.52, -0.2, 0]}>
            <mesh material={meshAntennaMaterial} castShadow>
              <cylinderGeometry args={[0.7, 0.1, 0.22, 24]} />
            </mesh>
            <mesh position={[0, 0.25, 0]} material={darkTitaniumMaterial}>
              <cylinderGeometry args={[0.02, 0.02, 0.45, 8]} />
            </mesh>
          </group>
        </group>
        {/* Auxiliary Cryo Chillers */}
        <group position={[-2.5, 0.3, 0.5]}>
          <mesh material={whiteAeroMaterial} castShadow>
            <boxGeometry args={[1.0, 1.3, 2.0]} />
          </mesh>
        </group>
      </group>

      {/* =========================================================================
          3. SECONDARY HABITAT DOME ("X-1")
          Matches reference image: Situated to the right (foreground/midground),
          inflatable white fabric dome, radial tension straps, bold "X-1" stencil
          ========================================================================= */}
      <group position={[21.8, 0, -4.5]}>
        {/* Main Pressurized Fabric Dome Canopy */}
        <mesh
          position={[0, 0, 0]}
          scale={[6.8, 3.4, 6.8]}
          material={domeX1Material}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[1, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        </mesh>
        {/* Perimeter Foundation Collar */}
        <mesh position={[0, 0.35, 0]} material={whiteAeroMaterial} castShadow receiveShadow>
          <torusGeometry args={[6.8, 0.45, 16, 48]} />
        </mesh>
        {/* Central Observation Skylight on Dome Peak */}
        <mesh position={[0, 3.42, 0]} material={darkTitaniumMaterial}>
          <cylinderGeometry args={[1.1, 1.25, 0.18, 20]} />
        </mesh>
        <mesh position={[0, 3.52, 0]}>
          <sphereGeometry args={[1.0, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
        </mesh>
      </group>

      {/* =========================================================================
          4. PRESSURIZED TRANSIT CORRIDOR NETWORK
          Matches reference image: White fabric tubes with ribbed accordion rings,
          dark expansion joint collars, connecting Hub 08 to pods, secondary domes,
          and outposts
          ========================================================================= */}
      <group position={[0, 1.2, 0]}>
        {/* Transit Corridor: Hub 08 to Pod L-01 (West) */}
        <mesh
          position={[-8.5, 0, -15.2]}
          rotation={[0, 0, Math.PI / 2]}
          material={corridorMaterial}
          castShadow
        >
          <cylinderGeometry args={[0.95, 0.95, 6.2, 20]} />
        </mesh>

        {/* Transit Corridor: Hub 08 to Pod L-02 (South-West) */}
        <mesh
          position={[-6.2, 0, -7.8]}
          rotation={[0, 0.8, Math.PI / 2]}
          material={corridorMaterial}
          castShadow
        >
          <cylinderGeometry args={[0.95, 0.95, 5.5, 20]} />
        </mesh>

        {/* Transit Corridor: Hub 08 to Pod L-03 (South-East) */}
        <mesh
          position={[6.2, 0, -7.8]}
          rotation={[0, -0.8, Math.PI / 2]}
          material={corridorMaterial}
          castShadow
        >
          <cylinderGeometry args={[0.95, 0.95, 5.5, 20]} />
        </mesh>

        {/* Transit Corridor: Hub 08 to Pod L-04 (East) */}
        <mesh
          position={[8.8, 0, -14.8]}
          rotation={[0, 0, Math.PI / 2]}
          material={corridorMaterial}
          castShadow
        >
          <cylinderGeometry args={[0.95, 0.95, 6.5, 20]} />
        </mesh>

        {/* Major East Trunk Corridor: Hub 08 to Dome X-1 */}
        <group position={[12.5, 0, -11.0]}>
          {/* Main corridor section running East */}
          <mesh
            position={[4.0, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={corridorMaterial}
            castShadow
          >
            <cylinderGeometry args={[1.05, 1.05, 7.8, 20]} />
          </mesh>
          {/* T-Junction Airlock Hub Node */}
          <mesh position={[8.2, 0, 0]} material={whiteAeroMaterial} castShadow>
            <boxGeometry args={[2.4, 2.3, 2.4]} />
          </mesh>
          {/* Airlock Hatch Frame */}
          <mesh position={[8.2, 0, 1.25]} material={darkTitaniumMaterial}>
            <boxGeometry args={[1.4, 1.9, 0.2]} />
          </mesh>
          {/* Branch Corridor continuing South to Dome X-1 */}
          <mesh
            position={[8.2, 0, 3.5]}
            rotation={[Math.PI / 2, 0, 0]}
            material={corridorMaterial}
            castShadow
          >
            <cylinderGeometry args={[0.95, 0.95, 4.6, 20]} />
          </mesh>
          {/* Branch Corridor continuing further East */}
          <mesh
            position={[12.4, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={corridorMaterial}
            castShadow
          >
            <cylinderGeometry args={[0.95, 0.95, 6.0, 20]} />
          </mesh>
        </group>

        {/* Mountain / Escarpment Transit Corridor running North-West towards Cliff */}
        <group position={[-11.5, 0, -21.0]} rotation={[0, -0.45, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={corridorMaterial} castShadow>
            <cylinderGeometry args={[1.0, 1.0, 9.5, 20]} />
          </mesh>
          {/* Cliffside Sealed Airlock Bulkhead Portal */}
          <mesh position={[-5.0, 0.1, 0]} material={darkTitaniumMaterial}>
            <boxGeometry args={[0.6, 2.6, 2.6]} />
          </mesh>
        </group>

        {/* Expansion Joint Reinforcement Rings at key portals */}
        {[-8.5, 8.8].map((px, idx) => (
          <mesh key={idx} position={[px, 0, -15.0]} material={darkTitaniumMaterial}>
            <torusGeometry args={[1.05, 0.08, 12, 24]} />
          </mesh>
        ))}
      </group>

      {/* =========================================================================
          5. ELEVATED DEEP SPACE NETWORK (DSN) GIANT PARABOLIC TRACKING DISH
          Matches reference image: Elevated on the rocky ridge to the right/north-east,
          massive 9.5m parabolic dish pointing skyward, 4-leg subreflector feedhorn,
          sturdy heavy-duty steel truss tower
          ========================================================================= */}
      <group position={[27.5, 3.6, -26.5]}>
        {/* Quad Steel Truss Tower Base */}
        <group position={[0, 0, 0]}>
          {/* 4 Corner Structural Legs */}
          {[
            [-1.8, -1.8],
            [1.8, -1.8],
            [-1.8, 1.8],
            [1.8, 1.8],
          ].map(([lx, lz], idx) => (
            <mesh key={idx} position={[lx, 1.8, lz]} material={darkTitaniumMaterial} castShadow>
              <cylinderGeometry args={[0.12, 0.16, 4.2, 12]} />
            </mesh>
          ))}
          {/* Horizontal and Diagonal Cross-Bracing Girders */}
          {[0.8, 2.2, 3.6].map((by, idx) => (
            <group key={idx} position={[0, by, 0]}>
              <mesh position={[0, 0, -1.8]} rotation={[0, 0, Math.PI / 2]} material={darkTitaniumMaterial}>
                <cylinderGeometry args={[0.06, 0.06, 3.6, 8]} />
              </mesh>
              <mesh position={[0, 0, 1.8]} rotation={[0, 0, Math.PI / 2]} material={darkTitaniumMaterial}>
                <cylinderGeometry args={[0.06, 0.06, 3.6, 8]} />
              </mesh>
              <mesh position={[-1.8, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={darkTitaniumMaterial}>
                <cylinderGeometry args={[0.06, 0.06, 3.6, 8]} />
              </mesh>
              <mesh position={[1.8, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={darkTitaniumMaterial}>
                <cylinderGeometry args={[0.06, 0.06, 3.6, 8]} />
              </mesh>
            </group>
          ))}
          {/* Maintenance Platform Ring Deck */}
          <mesh position={[0, 3.85, 0]} material={darkTitaniumMaterial} castShadow receiveShadow>
            <cylinderGeometry args={[2.4, 2.4, 0.22, 24]} />
          </mesh>
          {/* Platform Safety Railing */}
          <mesh position={[0, 4.35, 0]} material={whiteAeroMaterial}>
            <torusGeometry args={[2.35, 0.04, 8, 24]} />
          </mesh>
        </group>

        {/* Steerable Azimuth Turret & Elevation Cradle */}
        <group ref={dsnDishRef} position={[0, 4.4, 0]}>
          {/* Heavy Azimuth Bearing Motor Housing */}
          <mesh position={[0, 0.45, 0]} material={darkTitaniumMaterial}>
            <cylinderGeometry args={[1.2, 1.4, 0.9, 20]} />
          </mesh>

          {/* Dual Elevation Yoke Arms */}
          <mesh position={[-1.3, 1.4, 0]} material={darkTitaniumMaterial} castShadow>
            <boxGeometry args={[0.35, 1.6, 0.8]} />
          </mesh>
          <mesh position={[1.3, 1.4, 0]} material={darkTitaniumMaterial} castShadow>
            <boxGeometry args={[0.35, 1.6, 0.8]} />
          </mesh>

          {/* Massive Parabolic Dish Reflector (Diameter 9.2m, Depth 1.8m) */}
          <group position={[0, 2.2, 0]} rotation={[0.42, 0, 0]}>
            {/* White Parabolic Dish Shell */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} material={dsnDishMaterial} castShadow receiveShadow>
              {/* Flattened open cone/curved cylinder simulating paraboloid */}
              <cylinderGeometry args={[4.6, 0.9, 1.6, 36, 1, true]} />
            </mesh>
            {/* Central Primary Feed Hub */}
            <mesh position={[0, 0, -0.8]} material={darkTitaniumMaterial}>
              <cylinderGeometry args={[0.92, 0.92, 0.35, 24]} />
            </mesh>
            {/* Rear Ribbed Structural Support Trusses (Backing Skeleton) */}
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return (
                <mesh
                  key={i}
                  position={[Math.sin(a) * 2.3, Math.cos(a) * 2.3, -0.6]}
                  rotation={[0, 0, a]}
                  material={darkTitaniumMaterial}
                >
                  <boxGeometry args={[0.08, 4.5, 0.25]} />
                </mesh>
              );
            })}
            {/* Sub-Reflector Feedhorn Quadripod Struts */}
            {[Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].map(
              (fa, idx) => {
                const fx = Math.sin(fa) * 3.6;
                const fy = Math.cos(fa) * 3.6;
                return (
                  <mesh
                    key={idx}
                    position={[fx * 0.5, fy * 0.5, 1.1]}
                    rotation={[-fy * 0.12, fx * 0.12, fa]}
                    material={darkTitaniumMaterial}
                  >
                    <cylinderGeometry args={[0.04, 0.04, 3.8, 8]} />
                  </mesh>
                );
              }
            )}
            {/* Sub-Reflector Secondary Convex Mirror at Focal Point */}
            <mesh position={[0, 0, 2.7]} material={whiteAeroMaterial}>
              <cylinderGeometry args={[0.65, 0.2, 0.35, 16]} />
            </mesh>
            {/* DSN Aircraft Obstruction Warning Strobe at Tip */}
            <mesh position={[0, 0, 3.0]}>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <pointLight
              ref={dsnStrobeRef}
              position={[0, 0, 3.1]}
              color="#ffffff"
              intensity={3.0}
              distance={40}
            />
          </group>
        </group>
      </group>

      {/* =========================================================================
          6. EXTENSIVE PHOTOVOLTAIC SOLAR FARM
          Matches reference image: Located in the foreground/left flat plains,
          multiple parallel rows of angled solar arrays, silver framing,
          deep blue monocrystalline cell matrix
          ========================================================================= */}
      <group position={[-17.0, 0, 9.5]}>
        {/* 4 Parallel Rows of Solar Panels facing Mars Equator/Sun */}
        {[-6.5, -2.5, 1.5, 5.5].map((rowZ, rowIdx) => (
          <group key={rowIdx} position={[0, 0, rowZ]}>
            {/* Rack of 10 Dual-Panel Modules along row */}
            {Array.from({ length: 9 }).map((_, colIdx) => {
              const panelX = (colIdx - 4) * 1.55;
              return (
                <group key={colIdx} position={[panelX, 0, 0]}>
                  {/* Foundation Mounting Post */}
                  <mesh position={[0, 0.55, 0]} material={darkTitaniumMaterial}>
                    <cylinderGeometry args={[0.04, 0.04, 1.1, 8]} />
                  </mesh>
                  {/* Diagonal Sun-Tracking Frame (Tilted ~35° towards sun) */}
                  <group position={[0, 1.1, 0]} rotation={[0.58, 0, 0]}>
                    {/* Solar PV Collector Plate */}
                    <mesh material={solarPanelMaterial} castShadow receiveShadow>
                      <boxGeometry args={[1.42, 0.04, 0.95]} />
                    </mesh>
                    {/* Aluminum Mounting Bezel Edge */}
                    <mesh position={[0, 0.022, 0]} material={darkTitaniumMaterial}>
                      <boxGeometry args={[1.45, 0.01, 0.98]} />
                    </mesh>
                  </group>
                </group>
              );
            })}
            {/* Inter-Array Electrical Cable Conduit Tray along the row */}
            <mesh position={[0, 0.06, 0.6]} material={darkTitaniumMaterial}>
              <boxGeometry args={[14.2, 0.08, 0.12]} />
            </mesh>
          </group>
        ))}

        {/* Central Solar Power Inverter & Battery Storage Skid */}
        <group position={[8.2, 0.6, 0]}>
          <mesh material={whiteAeroMaterial} castShadow>
            <boxGeometry args={[1.8, 1.3, 3.2]} />
          </mesh>
          <mesh position={[0, 0.7, 0]} material={darkTitaniumMaterial}>
            <boxGeometry args={[1.6, 0.1, 3.0]} />
          </mesh>
          {/* Inverter Status Display Glow */}
          <pointLight color="#10b981" intensity={1.2} distance={6} position={[0.95, 0.2, 0]} />
        </group>
      </group>

      {/* =========================================================================
          7. MODULAR CARGO & SUPPLY CONTAINERS
          Matches reference image: Stacks of orange and white cargo modules
          placed near the corridors and habitat modules
          ========================================================================= */}
      <group position={[0, 0, 0]}>
        {/* Stack 1: Between Hub 08 and North ridge */}
        <group position={[3.2, 0.7, -19.5]} rotation={[0, 0.05, 0]}>
          <mesh position={[0, 0, 0]} material={cargoOrangeMaterial} castShadow>
            <boxGeometry args={[1.4, 1.4, 3.0]} />
          </mesh>
          <mesh position={[0, 1.42, 0]} material={cargoOrangeMaterial} castShadow>
            <boxGeometry args={[1.4, 1.4, 3.0]} />
          </mesh>
          <mesh position={[0, 2.84, 0]} material={cargoWhiteMaterial} castShadow>
            <boxGeometry args={[1.4, 1.4, 3.0]} />
          </mesh>
        </group>

        {/* Stack 2: Near Corridor East */}
        <group position={[14.2, 0.7, -17.5]} rotation={[0, 0.35, 0]}>
          <mesh position={[0, 0, 0]} material={cargoWhiteMaterial} castShadow>
            <boxGeometry args={[1.4, 1.4, 3.0]} />
          </mesh>
          <mesh position={[0, 1.42, 0]} material={cargoOrangeMaterial} castShadow>
            <boxGeometry args={[1.4, 1.4, 3.0]} />
          </mesh>
        </group>

        {/* Stack 3: Near West Hab */}
        <group position={[-8.5, 0.7, -18.5]} rotation={[0, -0.2, 0]}>
          <mesh position={[0, 0, 0]} material={cargoOrangeMaterial} castShadow>
            <boxGeometry args={[1.4, 1.4, 3.0]} />
          </mesh>
          <mesh position={[0, 1.42, 0]} material={cargoWhiteMaterial} castShadow>
            <boxGeometry args={[1.4, 1.4, 3.0]} />
          </mesh>
        </group>
      </group>

      {/* =========================================================================
          8. MARS ASCENT VEHICLE (MAV) LAUNCH FACILITY & SAMPLE RETURN GANTRY
          Positioned on the rear pad behind Hub 08: Vertical 2-stage rocket,
          service umbilical gantry, cryogenic propellant transfer lines
          ========================================================================= */}
      <group position={[0, 0, -28.5]}>
        {/* Launch Pad Hexagonal Flame Trench & Stand */}
        <mesh position={[0, 0.6, 0]} material={darkTitaniumMaterial} castShadow receiveShadow>
          <cylinderGeometry args={[3.2, 3.6, 1.2, 6]} />
        </mesh>

        {/* Two-Stage Mars Ascent Vehicle (MAV) Rocket */}
        <group position={[0, 1.2, 0]}>
          {/* First Stage Solid Propulsion Core (NASA Aerospace White) */}
          <mesh position={[0, 1.5, 0]} material={whiteAeroMaterial} castShadow>
            <cylinderGeometry args={[0.9, 0.9, 3.0, 24]} />
          </mesh>
          {/* NASA Red & Blue Livery Rings */}
          <mesh position={[0, 2.3, 0]}>
            <cylinderGeometry args={[0.905, 0.905, 0.25, 24]} />
            <meshStandardMaterial color="#0284c7" roughness={0.3} />
          </mesh>
          <mesh position={[0, 2.0, 0]}>
            <cylinderGeometry args={[0.905, 0.905, 0.08, 24]} />
            <meshStandardMaterial color="#dc2626" roughness={0.3} />
          </mesh>
          {/* Interstage Separation Ring */}
          <mesh position={[0, 3.05, 0]} material={darkTitaniumMaterial}>
            <cylinderGeometry args={[0.88, 0.9, 0.15, 24]} />
          </mesh>
          {/* Second Stage Upper Core */}
          <mesh position={[0, 3.85, 0]} material={whiteAeroMaterial} castShadow>
            <cylinderGeometry args={[0.84, 0.88, 1.5, 24]} />
          </mesh>
          {/* Aerodynamic Ogive Nosecone (Mars Sample Return Canister Inside) */}
          <mesh position={[0, 5.0, 0]} material={whiteAeroMaterial} castShadow>
            <coneGeometry args={[0.84, 1.1, 24]} />
          </mesh>
          {/* MAV Strobe Warning Beacon on Rocket Tip */}
          <mesh position={[0, 5.62, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <pointLight
            ref={mavStrobeRef}
            position={[0, 5.65, 0]}
            color="#38bdf8"
            intensity={3.0}
            distance={40}
          />
        </group>

        {/* Structural Service Tower & Retractable Umbilical Arm */}
        <group position={[-1.8, 0, 0]}>
          <mesh position={[0, 3.0, 0]} material={darkTitaniumMaterial} castShadow>
            <boxGeometry args={[0.4, 6.0, 0.4]} />
          </mesh>
          {/* Umbilical Fuel Swing Arm connecting to MAV */}
          <mesh position={[0.8, 4.8, 0]} material={darkTitaniumMaterial}>
            <boxGeometry args={[1.5, 0.15, 0.15]} />
          </mesh>
        </group>
      </group>

      {/* =========================================================================
          9. PRIMARY EVA SURFACE LOGISTICS & ROVER DOCKING BAY
          Connects South Portal of Hub 08 directly to Rover Staging Cradle and Ramps!
          Preserves exact collision kinematics from `getMotherShipRampSurfaceY`:
            Cradle: relZ from -2.8 to 1.5, |relX| <= 2.2, deckY = groundY + 1.14
            Ramp: relZ from 1.5 to 8.2, |relX| <= 1.6
          ========================================================================= */}
      <group position={[0, 0, 0]}>
        {/* South Airlock Portal of Hub 08 (Direct entrance from docking bay) */}
        <group position={[0, 1.4, -2.5]}>
          {/* Heavy Reinforced Pressure Airlock Portal Arch */}
          <mesh material={darkTitaniumMaterial} castShadow>
            <boxGeometry args={[3.8, 2.7, 1.2]} />
          </mesh>
          {/* Pressurized Double Hatch Doors with rubber seals */}
          <mesh position={[0, 0, 0.58]} material={whiteAeroMaterial}>
            <boxGeometry args={[2.2, 2.1, 0.08]} />
          </mesh>
          {/* Center Dividing Pressure Gasket */}
          <mesh position={[0, 0, 0.63]} material={darkTitaniumMaterial}>
            <boxGeometry args={[0.06, 2.1, 0.04]} />
          </mesh>
          {/* Airlock Status Indicator Light (Green = Docked/Ready, Cyan = Standby) */}
          <mesh position={[0, 1.2, 0.62]}>
            <boxGeometry args={[0.6, 0.12, 0.05]} />
            <meshBasicMaterial color={isDocked ? '#10b981' : '#0ea5e9'} />
          </mesh>
          <pointLight
            color={isDocked ? '#10b981' : '#0ea5e9'}
            intensity={2.2}
            distance={8}
            position={[0, 1.3, 1.0]}
          />
        </group>

        {/* Staging Cradle Platform Deck (Exact elevation deckY = groundY + 1.14) */}
        <group position={[0, 1.14, -0.65]}>
          {/* Heavy Titanium Grid Platform */}
          <mesh material={darkTitaniumMaterial} castShadow receiveShadow>
            <boxGeometry args={[4.2, 0.2, 4.3]} />
          </mesh>
          {/* Safety Yellow/Black Perimeter Curbing */}
          <mesh position={[-2.05, 0.15, 0]} material={goldMliMaterial}>
            <boxGeometry args={[0.1, 0.12, 4.3]} />
          </mesh>
          <mesh position={[2.05, 0.15, 0]} material={goldMliMaterial}>
            <boxGeometry args={[0.1, 0.12, 4.3]} />
          </mesh>

          {/* Sample Umbilical Robot Receiver & Deposit Port */}
          <group position={[1.75, 0.25, -0.8]}>
            <mesh material={darkTitaniumMaterial}>
              <boxGeometry args={[0.6, 0.5, 0.6]} />
            </mesh>
            {/* Luminous Sample Tube Transfer Port */}
            <mesh position={[0, 0.3, 0]} material={whiteAeroMaterial}>
              <cylinderGeometry args={[0.18, 0.18, 0.15, 16]} />
            </mesh>
            <pointLight
              color={isDocked ? '#34d399' : '#38bdf8'}
              intensity={2.0}
              distance={5}
              position={[0, 0.5, 0]}
            />
          </group>

          {/* Platform Support Pylons down to Martian Regolith */}
          {[-1.8, 1.8].map((px) =>
            [-1.8, 1.8].map((pz) => (
              <mesh
                key={`${px}-${pz}`}
                position={[px, -0.55, pz]}
                material={darkTitaniumMaterial}
                castShadow
              >
                <cylinderGeometry args={[0.14, 0.18, 0.95, 12]} />
              </mesh>
            ))
          )}
        </group>

        {/* Dual Titanium Egress Ramps (Slope down from z = 1.5 to z = 8.2) */}
        <group position={[0, 0.93, 5.0]} rotation={[0.308, 0, 0]}>
          {/* Left Ramp Rail (x = -1.15m) */}
          <group position={[-1.15, 0, 0]}>
            <mesh material={darkTitaniumMaterial} castShadow receiveShadow>
              <boxGeometry args={[0.38, 0.04, 5.9]} />
            </mesh>
            <mesh position={[-0.18, 0.04, 0]} material={goldMliMaterial}>
              <boxGeometry args={[0.02, 0.06, 5.9]} />
            </mesh>
            <mesh position={[0.18, 0.03, 0]} material={darkTitaniumMaterial}>
              <boxGeometry args={[0.02, 0.04, 5.9]} />
            </mesh>
            {/* Grip Cleats */}
            {[-2.5, -2.0, -1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5, 2.0, 2.5].map((cz, i) => (
              <mesh key={i} position={[0, 0.022, cz]} material={whiteAeroMaterial}>
                <boxGeometry args={[0.34, 0.008, 0.04]} />
              </mesh>
            ))}
          </group>

          {/* Right Ramp Rail (x = +1.15m) */}
          <group position={[1.15, 0, 0]}>
            <mesh material={darkTitaniumMaterial} castShadow receiveShadow>
              <boxGeometry args={[0.38, 0.04, 5.9]} />
            </mesh>
            <mesh position={[0.18, 0.04, 0]} material={goldMliMaterial}>
              <boxGeometry args={[0.02, 0.06, 5.9]} />
            </mesh>
            <mesh position={[-0.18, 0.03, 0]} material={darkTitaniumMaterial}>
              <boxGeometry args={[0.02, 0.04, 5.9]} />
            </mesh>
            {/* Grip Cleats */}
            {[-2.5, -2.0, -1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5, 2.0, 2.5].map((cz, i) => (
              <mesh key={i} position={[0, 0.022, cz]} material={whiteAeroMaterial}>
                <boxGeometry args={[0.34, 0.008, 0.04]} />
              </mesh>
            ))}
          </group>

          {/* Structural Cross-Truss Girders */}
          {[-2.0, -1.0, 0, 1.0, 2.0].map((tz, i) => (
            <mesh
              key={i}
              position={[0, -0.04, tz]}
              rotation={[0, 0, Math.PI / 2]}
              material={darkTitaniumMaterial}
            >
              <cylinderGeometry args={[0.02, 0.02, 2.1, 8]} />
            </mesh>
          ))}
        </group>

        {/* Ramp Ground Foot Rest Plates on Martian Regolith */}
        <mesh position={[-1.15, 0.04, 7.85]} material={goldMliMaterial} receiveShadow>
          <boxGeometry args={[0.5, 0.06, 0.4]} />
        </mesh>
        <mesh position={[1.15, 0.04, 7.85]} material={goldMliMaterial} receiveShadow>
          <boxGeometry args={[0.5, 0.06, 0.4]} />
        </mesh>

        {/* Rover Payload Staging Cradle Clamps on Deck */}
        <group position={[0, 1.83, 1.4]}>
          <mesh position={[-1.15, 0.02, 0]} material={darkTitaniumMaterial}>
            <boxGeometry args={[0.4, 0.03, 1.6]} />
          </mesh>
          <mesh position={[1.15, 0.02, 0]} material={darkTitaniumMaterial}>
            <boxGeometry args={[0.4, 0.03, 1.6]} />
          </mesh>
          <mesh position={[-1.15, 0.08, -0.6]} material={goldMliMaterial}>
            <boxGeometry args={[0.1, 0.12, 0.1]} />
          </mesh>
          <mesh position={[1.15, 0.08, -0.6]} material={goldMliMaterial}>
            <boxGeometry args={[0.1, 0.12, 0.1]} />
          </mesh>
        </group>

        {/* Holographic Ground Docking Beacon Rings projected on Martian sand */}
        <mesh
          ref={beaconRingRef}
          position={[0, 0.06, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <ringGeometry args={[7.2, 8.4, 64]} />
          <meshBasicMaterial
            color={isDocked ? '#10b981' : '#38bdf8'}
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.8, 4.0, 48]} />
          <meshBasicMaterial
            color={isDocked ? '#34d399' : '#0284c7'}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Strobe Warning Beacon atop Airlock Portal Gantry */}
        <mesh position={[0, 3.2, -2.5]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshBasicMaterial color={isDocked ? '#34d399' : '#38bdf8'} />
        </mesh>
        <pointLight
          ref={strobeRef}
          position={[0, 3.25, -2.5]}
          color={isDocked ? '#34d399' : '#38bdf8'}
          intensity={3.0}
          distance={35}
        />

        {/* Area Pathway Floodlight illuminating Docking Bay & Ramps */}
        <pointLight
          position={[0, 3.5, 1.5]}
          color={isDocked ? '#34d399' : '#0ea5e9'}
          intensity={2.8}
          distance={26}
        />
      </group>
    </group>
  );
};

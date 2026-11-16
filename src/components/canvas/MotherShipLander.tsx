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
export const RAMP_START_Z = -23.2;
export const RAMP_END_Z = -15.5;

// Physically exact ramp and deck surface elevation calculation
export const getMotherShipRampSurfaceY = (worldX: number, worldZ: number): number | null => {
  const relX = worldX - LANDER_X;
  const relZ = worldZ - LANDER_Z;
  const groundLanderY = getTerrainHeight(LANDER_X, LANDER_Z);
  const deckY = groundLanderY + 1.25;

  // Expanded industrial deck cradle area (|relX| <= 3.6, relZ from -5.5 to 1.8)
  if (relZ >= -5.5 && relZ < 1.8 && Math.abs(relX) <= 3.6) {
    return deckY;
  }

  // Ramp zone: relZ from 1.8 to 9.5, width spanning both wheels (|relX| <= 2.2)
  if (relZ >= 1.8 && relZ <= 9.5 && Math.abs(relX) <= 2.2) {
    const groundFootY = getTerrainHeight(LANDER_X, LANDER_Z + 9.5) + 0.04;
    const t = (relZ - 1.8) / (9.5 - 1.8);
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

    // Slow tracking rotation for DSN giant dish (tracking Earth deep space signal)
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
          1. COLOSSAL CENTRAL HABITAT HUB DOME "08" (EXPANDED TO FULL COLONY SCALE)
          Radius: 25.0m (Diameter: 50.0m), Height: 11.5m
          ========================================================================= */}
      <group position={[0, 0, -31.0]}>
        {/* Main Pressurized Fabric Dome Canopy (Flattened Spherical Profile) */}
        <mesh
          position={[0, 0, 0]}
          scale={[25.0, 11.5, 25.0]}
          material={dome08Material}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[1, 64, 36, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        </mesh>

        {/* Circular Perimeter Inflatable Foundation Collar */}
        <mesh position={[0, 0.75, 0]} material={whiteAeroMaterial} castShadow receiveShadow>
          <torusGeometry args={[25.0, 1.2, 20, 80]} />
        </mesh>

        {/* Outer Ground Tie-Down Bedrock Anchors (32 radial tie points) */}
        {Array.from({ length: 32 }).map((_, i) => {
          const angle = (i / 32) * Math.PI * 2;
          const ax = Math.sin(angle) * 26.2;
          const az = Math.cos(angle) * 26.2;
          return (
            <group key={i} position={[ax, 0.4, az]}>
              <mesh material={darkTitaniumMaterial}>
                <boxGeometry args={[0.7, 0.8, 0.7]} />
              </mesh>
              <mesh
                position={[-Math.sin(angle) * 0.6, 0.6, -Math.cos(angle) * 0.6]}
                material={darkTitaniumMaterial}
              >
                <cylinderGeometry args={[0.04, 0.04, 1.4, 8]} />
              </mesh>
            </group>
          );
        })}

        {/* Central Observation Cupola & Sensor Mast on Dome Peak */}
        <group position={[0, 11.5, 0]}>
          <mesh material={darkTitaniumMaterial}>
            <cylinderGeometry args={[3.2, 3.6, 0.5, 32]} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[2.9, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
            <meshStandardMaterial
              color="#0f172a"
              emissive="#0284c7"
              emissiveIntensity={0.25}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
          <pointLight color="#fef08a" intensity={2.4} distance={28} position={[0, 0.4, 0]} />

          <mesh position={[0, 1.8, 0]} material={darkTitaniumMaterial}>
            <cylinderGeometry args={[0.08, 0.12, 2.4, 8]} />
          </mesh>
          <mesh position={[0, 3.1, 0]}>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <pointLight position={[0, 3.2, 0]} color="#ef4444" intensity={3.0} distance={35} />
        </group>
      </group>

      {/* =========================================================================
          2. EXPANDED HABITATION & RESEARCH PODS (L-01, L-02, L-03, L-04)
          Real Colony Scale: Radius 3.8m, Length 17m
          ========================================================================= */}

      {/* --- POD L-01 (West Astrobiology & Sample Receiving) --- */}
      <group position={[-28.0, 1.2, -27.0]} rotation={[0, 0.25, 0]}>
        <mesh position={[0, -0.6, 0]} material={darkTitaniumMaterial} castShadow receiveShadow>
          <boxGeometry args={[8.5, 0.6, 17.5]} />
        </mesh>
        {[-3.6, 3.6].map((jx) =>
          [-7.5, 7.5].map((jz) => (
            <mesh key={`${jx}-${jz}`} position={[jx, -1.2, jz]} material={goldMliMaterial}>
              <cylinderGeometry args={[0.4, 0.5, 0.8, 12]} />
            </mesh>
          ))
        )}
        <mesh
          position={[0, 3.2, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={useMemo(() => new THREE.MeshStandardMaterial({ map: podL01Texture, roughness: 0.55, metalness: 0.2 }), [podL01Texture])}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[3.8, 3.8, 15.5, 36]} />
        </mesh>
        <mesh position={[0, 3.2, 7.75]} material={whiteAeroMaterial} castShadow>
          <sphereGeometry args={[3.78, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.32]} />
        </mesh>
        <mesh position={[0, 3.2, -7.75]} rotation={[Math.PI, 0, 0]} material={whiteAeroMaterial} castShadow>
          <sphereGeometry args={[3.78, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.32]} />
        </mesh>
        <group ref={podDish1Ref} position={[0, 7.3, 0]}>
          <mesh material={darkTitaniumMaterial}>
            <cylinderGeometry args={[0.12, 0.16, 1.2, 12]} />
          </mesh>
          <group position={[0, 0.7, 0]} rotation={[0.55, 0, 0]}>
            <mesh material={meshAntennaMaterial} castShadow>
              <cylinderGeometry args={[1.5, 0.2, 0.45, 24]} />
            </mesh>
            <mesh position={[0, 0.5, 0]} material={darkTitaniumMaterial}>
              <cylinderGeometry args={[0.04, 0.04, 0.9, 8]} />
            </mesh>
          </group>
        </group>
        <group position={[5.2, 0.8, 0]}>
          <mesh material={whiteAeroMaterial} castShadow>
            <boxGeometry args={[2.2, 2.8, 4.5]} />
          </mesh>
          <mesh position={[0, 0.4, 2.8]} material={whiteAeroMaterial}>
            <cylinderGeometry args={[0.6, 0.6, 2.4, 16]} />
          </mesh>
          <mesh position={[0, 0.4, 4.2]} material={darkTitaniumMaterial}>
            <cylinderGeometry args={[0.6, 0.6, 2.4, 16]} />
          </mesh>
        </group>
      </group>

      {/* --- POD L-02 (South-West: POWER & MAINTENANCE BAY) --- */}
      {/* "go to power bay to supercharge battery and clean panels" */}
      <group position={[-22.0, 1.2, -7.0]} rotation={[0, 0.12, 0]}>
        <mesh position={[0, -0.6, 0]} material={darkTitaniumMaterial} castShadow receiveShadow>
          <boxGeometry args={[8.5, 0.6, 17.5]} />
        </mesh>
        {[-3.6, 3.6].map((jx) =>
          [-7.5, 7.5].map((jz) => (
            <mesh key={`${jx}-${jz}`} position={[jx, -1.2, jz]} material={goldMliMaterial}>
              <cylinderGeometry args={[0.4, 0.5, 0.8, 12]} />
            </mesh>
          ))
        )}
        <mesh
          position={[0, 3.2, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={useMemo(() => new THREE.MeshStandardMaterial({ map: podL02Texture, roughness: 0.55, metalness: 0.2 }), [podL02Texture])}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[3.8, 3.8, 15.5, 36]} />
        </mesh>
        <mesh position={[0, 3.2, 7.75]} material={whiteAeroMaterial} castShadow>
          <sphereGeometry args={[3.78, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.32]} />
        </mesh>
        <mesh position={[0, 3.2, -7.75]} rotation={[Math.PI, 0, 0]} material={whiteAeroMaterial} castShadow>
          <sphereGeometry args={[3.78, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.32]} />
        </mesh>
        {/* Room Identification Stencil Beacon */}
        <mesh position={[0, 6.2, 7.5]}>
          <boxGeometry args={[3.2, 0.6, 0.2]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        <group ref={podDish2Ref} position={[0, 7.3, 0]}>
          <mesh material={darkTitaniumMaterial}>
            <cylinderGeometry args={[0.12, 0.16, 1.2, 12]} />
          </mesh>
          <group position={[0, 0.7, 0]} rotation={[0.5, 0.3, 0]}>
            <mesh material={meshAntennaMaterial} castShadow>
              <cylinderGeometry args={[1.5, 0.2, 0.45, 24]} />
            </mesh>
            <mesh position={[0, 0.5, 0]} material={darkTitaniumMaterial}>
              <cylinderGeometry args={[0.04, 0.04, 0.9, 8]} />
            </mesh>
          </group>
        </group>
      </group>

      {/* --- POD L-03 (South-East: STORE ROOM & GEOLOGICAL CORE VAULT) --- */}
      {/* "go to store room to put the collected item" */}
      <group position={[22.0, 1.2, -7.0]} rotation={[0, -0.12, 0]}>
        <mesh position={[0, -0.6, 0]} material={darkTitaniumMaterial} castShadow receiveShadow>
          <boxGeometry args={[8.5, 0.6, 17.5]} />
        </mesh>
        {[-3.6, 3.6].map((jx) =>
          [-7.5, 7.5].map((jz) => (
            <mesh key={`${jx}-${jz}`} position={[jx, -1.2, jz]} material={goldMliMaterial}>
              <cylinderGeometry args={[0.4, 0.5, 0.8, 12]} />
            </mesh>
          ))
        )}
        <mesh
          position={[0, 3.2, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={useMemo(() => new THREE.MeshStandardMaterial({ map: podL03Texture, roughness: 0.55, metalness: 0.2 }), [podL03Texture])}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[3.8, 3.8, 15.5, 36]} />
        </mesh>
        <mesh position={[0, 3.2, 7.75]} material={whiteAeroMaterial} castShadow>
          <sphereGeometry args={[3.78, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.32]} />
        </mesh>
        <mesh position={[0, 3.2, -7.75]} rotation={[Math.PI, 0, 0]} material={whiteAeroMaterial} castShadow>
          <sphereGeometry args={[3.78, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.32]} />
        </mesh>
        {/* Room Identification Stencil Beacon */}
        <mesh position={[0, 6.2, 7.5]}>
          <boxGeometry args={[3.2, 0.6, 0.2]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
        <group ref={podDish3Ref} position={[0, 7.3, 0]}>
          <mesh material={darkTitaniumMaterial}>
            <cylinderGeometry args={[0.12, 0.16, 1.2, 12]} />
          </mesh>
          <group position={[0, 0.7, 0]} rotation={[0.48, -0.4, 0]}>
            <mesh material={meshAntennaMaterial} castShadow>
              <cylinderGeometry args={[1.5, 0.2, 0.45, 24]} />
            </mesh>
            <mesh position={[0, 0.5, 0]} material={darkTitaniumMaterial}>
              <cylinderGeometry args={[0.04, 0.04, 0.9, 8]} />
            </mesh>
          </group>
        </group>
      </group>

      {/* --- POD L-04 (East: SERVER ROOM & DSN TELEMETRY UPLINK WING) --- */}
      {/* "go to the server room to upload the data" */}
      <group position={[28.0, 1.2, -27.0]} rotation={[0, -0.22, 0]}>
        <mesh position={[0, -0.6, 0]} material={darkTitaniumMaterial} castShadow receiveShadow>
          <boxGeometry args={[8.5, 0.6, 17.5]} />
        </mesh>
        {[-3.6, 3.6].map((jx) =>
          [-7.5, 7.5].map((jz) => (
            <mesh key={`${jx}-${jz}`} position={[jx, -1.2, jz]} material={goldMliMaterial}>
              <cylinderGeometry args={[0.4, 0.5, 0.8, 12]} />
            </mesh>
          ))
        )}
        <mesh
          position={[0, 3.2, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={useMemo(() => new THREE.MeshStandardMaterial({ map: podL04Texture, roughness: 0.55, metalness: 0.2 }), [podL04Texture])}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[3.8, 3.8, 15.5, 36]} />
        </mesh>
        <mesh position={[0, 3.2, 7.75]} material={whiteAeroMaterial} castShadow>
          <sphereGeometry args={[3.78, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.32]} />
        </mesh>
        <mesh position={[0, 3.2, -7.75]} rotation={[Math.PI, 0, 0]} material={whiteAeroMaterial} castShadow>
          <sphereGeometry args={[3.78, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.32]} />
        </mesh>
        {/* Server Room Status Blue Glow */}
        <mesh position={[0, 6.2, 7.5]}>
          <boxGeometry args={[3.2, 0.6, 0.2]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <group ref={podDish4Ref} position={[0, 7.3, 0]}>
          <mesh material={darkTitaniumMaterial}>
            <cylinderGeometry args={[0.12, 0.16, 1.2, 12]} />
          </mesh>
          <group position={[0, 0.7, 0]} rotation={[0.52, -0.2, 0]}>
            <mesh material={meshAntennaMaterial} castShadow>
              <cylinderGeometry args={[1.5, 0.2, 0.45, 24]} />
            </mesh>
            <mesh position={[0, 0.5, 0]} material={darkTitaniumMaterial}>
              <cylinderGeometry args={[0.04, 0.04, 0.9, 8]} />
            </mesh>
          </group>
        </group>
      </group>

      {/* =========================================================================
          3. SECONDARY HABITAT DOME ("X-1")
          Radius: 13.5m, Height: 7.5m
          ========================================================================= */}
      <group position={[38.0, 0, 7.0]}>
        <mesh position={[0, 0, 0]} scale={[13.5, 7.5, 13.5]} material={domeX1Material} castShadow receiveShadow>
          <sphereGeometry args={[1, 48, 28, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        </mesh>
        <mesh position={[0, 0.6, 0]} material={whiteAeroMaterial} castShadow receiveShadow>
          <torusGeometry args={[13.5, 0.8, 16, 60]} />
        </mesh>
        <mesh position={[0, 7.5, 0]} material={darkTitaniumMaterial}>
          <cylinderGeometry args={[2.2, 2.5, 0.35, 24]} />
        </mesh>
      </group>

      {/* =========================================================================
          4. EXPANDED PRESSURIZED TRANSIT CORRIDOR NETWORK
          Radius: 2.1m (Diameter 4.2m)
          ========================================================================= */}
      <group position={[0, 2.4, 0]}>
        <mesh position={[-16.0, 0, -29.0]} rotation={[0, 0, Math.PI / 2]} material={corridorMaterial} castShadow>
          <cylinderGeometry args={[2.1, 2.1, 14.0, 24]} />
        </mesh>
        <mesh position={[-12.0, 0, -16.0]} rotation={[0, 0.85, Math.PI / 2]} material={corridorMaterial} castShadow>
          <cylinderGeometry args={[2.1, 2.1, 13.0, 24]} />
        </mesh>
        <mesh position={[12.0, 0, -16.0]} rotation={[0, -0.85, Math.PI / 2]} material={corridorMaterial} castShadow>
          <cylinderGeometry args={[2.1, 2.1, 13.0, 24]} />
        </mesh>
        <mesh position={[16.0, 0, -29.0]} rotation={[0, 0, Math.PI / 2]} material={corridorMaterial} castShadow>
          <cylinderGeometry args={[2.1, 2.1, 14.0, 24]} />
        </mesh>
      </group>

      {/* =========================================================================
          5. ELEVATED DEEP SPACE NETWORK (DSN) GIANT DISH (16.0m Reflector)
          ========================================================================= */}
      <group position={[44.0, 4.5, -35.0]}>
        {/* Quad Steel Truss Tower */}
        <group position={[0, 0, 0]}>
          {[[-3.2, -3.2], [3.2, -3.2], [-3.2, 3.2], [3.2, 3.2]].map(([lx, lz], idx) => (
            <mesh key={idx} position={[lx, 3.5, lz]} material={darkTitaniumMaterial} castShadow>
              <cylinderGeometry args={[0.22, 0.32, 8.0, 12]} />
            </mesh>
          ))}
          <mesh position={[0, 7.6, 0]} material={darkTitaniumMaterial} castShadow receiveShadow>
            <cylinderGeometry args={[4.5, 4.5, 0.4, 32]} />
          </mesh>
        </group>

        {/* Azimuth Turret & Elevation Cradle */}
        <group ref={dsnDishRef} position={[0, 8.5, 0]}>
          <mesh position={[0, 0.8, 0]} material={darkTitaniumMaterial}>
            <cylinderGeometry args={[2.2, 2.6, 1.6, 24]} />
          </mesh>

          {/* Massive 16m Parabolic Reflector */}
          <group position={[0, 3.8, 0]} rotation={[0.42, 0, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} material={dsnDishMaterial} castShadow receiveShadow>
              <cylinderGeometry args={[8.0, 1.8, 2.8, 48, 1, true]} />
            </mesh>
            <mesh position={[0, 0, -1.4]} material={darkTitaniumMaterial}>
              <cylinderGeometry args={[1.8, 1.8, 0.6, 32]} />
            </mesh>
            {/* Sub-Reflector Feedhorn Assembly */}
            {[Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].map((fa, idx) => {
              const fx = Math.sin(fa) * 6.2;
              const fy = Math.cos(fa) * 6.2;
              return (
                <mesh key={idx} position={[fx * 0.5, fy * 0.5, 2.0]} rotation={[-fy * 0.08, fx * 0.08, fa]} material={darkTitaniumMaterial}>
                  <cylinderGeometry args={[0.08, 0.08, 6.5, 8]} />
                </mesh>
              );
            })}
            <mesh position={[0, 0, 4.8]} material={whiteAeroMaterial}>
              <cylinderGeometry args={[1.2, 0.4, 0.6, 20]} />
            </mesh>
            <mesh position={[0, 0, 5.2]}>
              <sphereGeometry args={[0.15, 12, 12]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <pointLight ref={dsnStrobeRef} position={[0, 0, 5.3]} color="#ffffff" intensity={4.0} distance={60} />
          </group>
        </group>
      </group>

      {/* =========================================================================
          6. EXPANSIVE PHOTOVOLTAIC SOLAR ARRAY FIELD
          ========================================================================= */}
      <group position={[-28.0, 0, 18.0]}>
        {[-14.0, -7.0, 0.0, 7.0, 14.0].map((rowZ, rowIdx) => (
          <group key={rowIdx} position={[0, 0, rowZ]}>
            {Array.from({ length: 12 }).map((_, colIdx) => {
              const panelX = (colIdx - 5.5) * 2.2;
              return (
                <group key={colIdx} position={[panelX, 0, 0]}>
                  <mesh position={[0, 0.8, 0]} material={darkTitaniumMaterial}>
                    <cylinderGeometry args={[0.06, 0.06, 1.6, 8]} />
                  </mesh>
                  <group position={[0, 1.6, 0]} rotation={[0.58, 0, 0]}>
                    <mesh material={solarPanelMaterial} castShadow receiveShadow>
                      <boxGeometry args={[2.0, 0.05, 1.35]} />
                    </mesh>
                  </group>
                </group>
              );
            })}
          </group>
        ))}
      </group>

      {/* =========================================================================
          7. PRIMARY INDUSTRIAL SURFACE LOGISTICS & ROVER DOCKING BAY
          Connects South Portal of Hub 08 directly to Rover Staging Cradle and Ramps!
          Exact collision kinematics via getMotherShipRampSurfaceY:
            Deck: relZ from -5.5 to 1.8, width 7.2m (|relX| <= 3.6), deckY = groundY + 1.25
            Ramp: relZ from 1.8 to 9.5, width 4.4m (|relX| <= 2.2)
          ========================================================================= */}
      <group position={[0, 0, 0]}>
        {/* South Airlock Portal of Hub 08 */}
        <group position={[0, 2.2, -4.5]}>
          <mesh material={darkTitaniumMaterial} castShadow>
            <boxGeometry args={[6.8, 4.4, 2.2]} />
          </mesh>
          <mesh position={[0, 0, 1.12]} material={whiteAeroMaterial}>
            <boxGeometry args={[4.2, 3.6, 0.15]} />
          </mesh>
          <mesh position={[0, 0, 1.22]} material={darkTitaniumMaterial}>
            <boxGeometry args={[0.1, 3.6, 0.08]} />
          </mesh>
          {/* Station Entry Signage */}
          <mesh position={[0, 2.1, 1.2]}>
            <boxGeometry args={[4.8, 0.5, 0.08]} />
            <meshBasicMaterial color={isDocked ? '#10b981' : '#0284c7'} />
          </mesh>
          <pointLight color={isDocked ? '#10b981' : '#0ea5e9'} intensity={3.5} distance={15} position={[0, 2.2, 2.0]} />
        </group>

        {/* Industrial Staging Platform Deck (y = groundY + 1.25) */}
        <group position={[0, 1.25, -1.2]}>
          <mesh material={darkTitaniumMaterial} castShadow receiveShadow>
            <boxGeometry args={[7.2, 0.35, 7.5]} />
          </mesh>
          {/* Safety Curbing */}
          <mesh position={[-3.5, 0.25, 0]} material={goldMliMaterial}>
            <boxGeometry args={[0.2, 0.25, 7.5]} />
          </mesh>
          <mesh position={[3.5, 0.25, 0]} material={goldMliMaterial}>
            <boxGeometry args={[0.2, 0.25, 7.5]} />
          </mesh>

          {/* Sample Umbilical Receiver Robot Arm & Power Receptacle */}
          <group position={[2.8, 0.45, -1.2]}>
            <mesh material={darkTitaniumMaterial}>
              <boxGeometry args={[1.0, 0.8, 1.0]} />
            </mesh>
            <mesh position={[0, 0.5, 0]} material={whiteAeroMaterial}>
              <cylinderGeometry args={[0.3, 0.3, 0.25, 16]} />
            </mesh>
            <pointLight color={isDocked ? '#34d399' : '#38bdf8'} intensity={2.5} distance={8} position={[0, 0.8, 0]} />
          </group>

          {/* Platform Heavy Pylons */}
          {[-3.0, 3.0].map((px) =>
            [-3.0, 3.0].map((pz) => (
              <mesh key={`${px}-${pz}`} position={[px, -0.7, pz]} material={darkTitaniumMaterial} castShadow>
                <cylinderGeometry args={[0.25, 0.3, 1.1, 12]} />
              </mesh>
            ))
          )}
        </group>

        {/* Dual Titanium Egress Ramps (Slope from z = 1.8 to z = 9.5) */}
        <group position={[0, 0.98, 5.65]} rotation={[0.25, 0, 0]}>
          {/* Left Ramp Rail (x = -1.35m) */}
          <group position={[-1.35, 0, 0]}>
            <mesh material={darkTitaniumMaterial} castShadow receiveShadow>
              <boxGeometry args={[0.55, 0.05, 8.2]} />
            </mesh>
            <mesh position={[-0.26, 0.05, 0]} material={goldMliMaterial}>
              <boxGeometry args={[0.03, 0.08, 8.2]} />
            </mesh>
            <mesh position={[0.26, 0.04, 0]} material={darkTitaniumMaterial}>
              <boxGeometry args={[0.03, 0.06, 8.2]} />
            </mesh>
            {[-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5].map((cz, i) => (
              <mesh key={i} position={[0, 0.03, cz]} material={whiteAeroMaterial}>
                <boxGeometry args={[0.5, 0.01, 0.06]} />
              </mesh>
            ))}
          </group>

          {/* Right Ramp Rail (x = +1.35m) */}
          <group position={[1.35, 0, 0]}>
            <mesh material={darkTitaniumMaterial} castShadow receiveShadow>
              <boxGeometry args={[0.55, 0.05, 8.2]} />
            </mesh>
            <mesh position={[0.26, 0.05, 0]} material={goldMliMaterial}>
              <boxGeometry args={[0.03, 0.08, 8.2]} />
            </mesh>
            <mesh position={[-0.26, 0.04, 0]} material={darkTitaniumMaterial}>
              <boxGeometry args={[0.03, 0.06, 8.2]} />
            </mesh>
            {[-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5].map((cz, i) => (
              <mesh key={i} position={[0, 0.03, cz]} material={whiteAeroMaterial}>
                <boxGeometry args={[0.5, 0.01, 0.06]} />
              </mesh>
            ))}
          </group>
        </group>

        {/* Ramp Ground Plates */}
        <mesh position={[-1.35, 0.04, 9.4]} material={goldMliMaterial} receiveShadow>
          <boxGeometry args={[0.7, 0.08, 0.6]} />
        </mesh>
        <mesh position={[1.35, 0.04, 9.4]} material={goldMliMaterial} receiveShadow>
          <boxGeometry args={[0.7, 0.08, 0.6]} />
        </mesh>

        {/* Holographic Ground Docking Beacon Ring on Martian Regolith */}
        <mesh ref={beaconRingRef} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[10.5, 12.2, 64]} />
          <meshBasicMaterial
            color={isDocked ? '#10b981' : '#38bdf8'}
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[5.5, 5.8, 48]} />
          <meshBasicMaterial
            color={isDocked ? '#34d399' : '#0284c7'}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Strobe Warning Beacon atop Airlock Portal */}
        <mesh position={[0, 4.7, -4.5]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshBasicMaterial color={isDocked ? '#34d399' : '#38bdf8'} />
        </mesh>
        <pointLight ref={strobeRef} position={[0, 4.8, -4.5]} color={isDocked ? '#34d399' : '#38bdf8'} intensity={4.0} distance={45} />
      </group>
    </group>
  );
};

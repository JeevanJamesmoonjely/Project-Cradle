'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight } from '@/lib/physics/terrainHeight';
import { useMissionStore } from '@/lib/store/useMissionStore';

// Mother Ship / Mars Ascent Vehicle (MAV) Lander position in world coords
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
  const antennaRef = useRef<THREE.Group>(null);
  const isDocked = useMissionStore((s) => s.motherShip.isDocked);
  const openModal = useMissionStore((s) => s.openModal);

  // Surface ground height at lander coordinates
  const groundY = useMemo(() => getTerrainHeight(LANDER_X, LANDER_Z), []);

  // Gold MLI Kapton texture simulation
  const goldMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        emissive: '#78350f',
        emissiveIntensity: 0.15,
        metalness: 0.88,
        roughness: 0.22,
      }),
    []
  );

  const whiteAeroMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        metalness: 0.25,
        roughness: 0.35,
      }),
    []
  );

  const darkTitaniumMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#334155',
        metalness: 0.9,
        roughness: 0.2,
      }),
    []
  );

  // Pulse animation for docking beacon ring & beacon strobe
  useFrame((state, delta) => {
    if (beaconRingRef.current) {
      const time = state.clock.getElapsedTime();
      const scale = 1 + Math.sin(time * 2.5) * 0.06;
      beaconRingRef.current.scale.set(scale, 1, scale);
      const mat = beaconRingRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = 0.45 + Math.sin(time * 3.0) * 0.25;
      }
    }

    if (strobeRef.current) {
      const time = state.clock.getElapsedTime();
      strobeRef.current.intensity = Math.sin(time * 6.0) > 0.8 ? 5.0 : 0.4;
    }

    if (antennaRef.current) {
      antennaRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <group position={[LANDER_X, groundY, LANDER_Z]}>
      {/* ================= 1. OCTAGONAL DESCENT STAGE (GOLD KAPTON MLI) ================= */}
      <group position={[0, 1.1, 0]}>
        {/* Main Octagonal Avionics & Propulsion Module */}
        <mesh castShadow receiveShadow material={goldMaterial}>
          <cylinderGeometry args={[2.8, 3.4, 1.4, 8]} />
        </mesh>

        {/* Upper Equipment Deck (Titanium honeycomb panel) */}
        <mesh position={[0, 0.72, 0]} receiveShadow material={darkTitaniumMaterial}>
          <cylinderGeometry args={[2.85, 2.85, 0.08, 16]} />
        </mesh>

        {/* Lower Heatshield Ring */}
        <mesh position={[0, -0.72, 0]} material={darkTitaniumMaterial}>
          <cylinderGeometry args={[3.45, 3.2, 0.12, 16]} />
        </mesh>

        {/* Descent Rocket Thrusters (4 Aerojet Rocketdyne MR-80 style clusters) */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => {
          const tx = Math.sin(angle) * 2.2;
          const tz = Math.cos(angle) * 2.2;
          return (
            <group key={idx} position={[tx, -0.65, tz]} rotation={[0, angle, 0]}>
              <mesh material={darkTitaniumMaterial} castShadow>
                <cylinderGeometry args={[0.22, 0.45, 0.6, 12]} />
              </mesh>
            </group>
          );
        })}

        {/* Sample Transfer Umbilical Arm & Receptacle */}
        <group position={[1.8, 0.35, 0]}>
          <mesh material={darkTitaniumMaterial}>
            <boxGeometry args={[0.8, 0.3, 0.5]} />
          </mesh>
          <mesh position={[0.42, 0, 0]} material={whiteAeroMaterial}>
            <cylinderGeometry args={[0.18, 0.18, 0.15, 12]} />
          </mesh>
          {/* Sample Carousel Status Glow */}
          <pointLight color="#38bdf8" intensity={1.5} distance={4} position={[0.5, 0.2, 0]} />
        </group>
      </group>

      {/* ================= 2. 4 TITANIUM INVERTED-TRIPOD LANDING LEGS & PADS ================= */}
      {[Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].map((angle, idx) => {
        const legLength = 4.2;
        const padX = Math.sin(angle) * 3.8;
        const padZ = Math.cos(angle) * 3.8;
        return (
          <group key={idx}>
            {/* Primary Shock Strut */}
            <mesh
              position={[padX * 0.5, 0.85, padZ * 0.5]}
              rotation={[Math.PI / 4 * Math.cos(angle), -angle, Math.PI / 4 * Math.sin(angle)]}
              material={darkTitaniumMaterial}
              castShadow
            >
              <cylinderGeometry args={[0.08, 0.08, legLength * 0.6, 12]} />
            </mesh>

            {/* Circular Footpad resting securely on Mars sand */}
            <mesh position={[padX, 0.08, padZ]} material={goldMaterial} castShadow receiveShadow>
              <cylinderGeometry args={[0.55, 0.58, 0.12, 16]} />
            </mesh>
          </group>
        );
      })}

      {/* ================= 3. MARS ASCENT VEHICLE (MAV) TWO-STAGE ROCKET ================= */}
      <group position={[0, 1.82, 0]}>
        {/* Stage 1 Solid Rocket Motor Core (NASA White Thermal Coating) */}
        <mesh position={[0, 1.4, 0]} castShadow receiveShadow material={whiteAeroMaterial}>
          <cylinderGeometry args={[0.85, 0.85, 2.8, 24]} />
        </mesh>

        {/* NASA Blue/Red Aerospace Insignia Strip */}
        <mesh position={[0, 2.1, 0]}>
          <cylinderGeometry args={[0.855, 0.855, 0.25, 24]} />
          <meshStandardMaterial color="#0284c7" roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.8, 0]}>
          <cylinderGeometry args={[0.855, 0.855, 0.08, 24]} />
          <meshStandardMaterial color="#dc2626" roughness={0.3} />
        </mesh>

        {/* Interstage Separation Ring */}
        <mesh position={[0, 2.85, 0]} material={darkTitaniumMaterial}>
          <cylinderGeometry args={[0.83, 0.85, 0.15, 24]} />
        </mesh>

        {/* Stage 2 Core & Payload Fairing */}
        <mesh position={[0, 3.65, 0]} castShadow material={whiteAeroMaterial}>
          <cylinderGeometry args={[0.78, 0.83, 1.45, 24]} />
        </mesh>

        {/* Aerodynamic Ogive Nosecone (Holds Sample Return Canister) */}
        <mesh position={[0, 4.8, 0]} castShadow material={whiteAeroMaterial}>
          <coneGeometry args={[0.78, 0.95, 24]} />
        </mesh>

        {/* MAV Strobe Warning Beacon on Top */}
        <mesh position={[0, 5.35, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <pointLight
          ref={strobeRef}
          position={[0, 5.4, 0]}
          color="#38bdf8"
          intensity={3.0}
          distance={45}
        />
      </group>

      {/* ================= 4. HIGH-GAIN ORBIT RELAY ANTENNA (MRO LINK) ================= */}
      <group ref={antennaRef} position={[-1.6, 2.3, -1.2]}>
        {/* Antenna Mast */}
        <mesh material={darkTitaniumMaterial}>
          <cylinderGeometry args={[0.04, 0.04, 1.1, 12]} />
        </mesh>
        {/* Parabolic Dish tilted towards orbit */}
        <group position={[0, 0.55, 0]} rotation={[0.45, 0.8, 0]}>
          <mesh material={whiteAeroMaterial} castShadow>
            <cylinderGeometry args={[0.75, 0.08, 0.25, 24]} />
          </mesh>
          <mesh position={[0, 0.28, 0]} material={darkTitaniumMaterial}>
            <cylinderGeometry args={[0.02, 0.02, 0.45, 8]} />
          </mesh>
        </group>
      </group>

      {/* ================= 5. HOLOGRAPHIC DOCKING BEACON RING ON GROUND ================= */}
      {/* Flat circular projected laser grid on Martian surface */}
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

      {/* Inner Guidance Crosshair Lines */}
      <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.8, 4.0, 48]} />
        <meshBasicMaterial
          color={isDocked ? '#34d399' : '#0284c7'}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ================= 6. DUAL TITANIUM ROVER EGRESS RAMPS ================= */}
      {/* Runs from lander top deck (z = 2.2) down to the Martian regolith (z = 7.8) */}
      <group position={[0, 0.93, 5.0]} rotation={[0.308, 0, 0]}>
        {/* Left Ramp Rail (Spaced at -1.15m to match rover wheel track) */}
        <group position={[-1.15, 0, 0]}>
          {/* Main Tread Plate Track */}
          <mesh material={darkTitaniumMaterial} castShadow receiveShadow>
            <boxGeometry args={[0.38, 0.04, 5.9]} />
          </mesh>
          {/* Outer Raised Guide Curb */}
          <mesh position={[-0.18, 0.04, 0]} material={goldMaterial}>
            <boxGeometry args={[0.02, 0.06, 5.9]} />
          </mesh>
          {/* Inner Lip */}
          <mesh position={[0.18, 0.03, 0]} material={darkTitaniumMaterial}>
            <boxGeometry args={[0.02, 0.04, 5.9]} />
          </mesh>
          {/* Grip Cleats along ramp */}
          {[-2.5, -2.0, -1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5, 2.0, 2.5].map((cz, i) => (
            <mesh key={i} position={[0, 0.022, cz]} material={whiteAeroMaterial}>
              <boxGeometry args={[0.34, 0.008, 0.04]} />
            </mesh>
          ))}
        </group>

        {/* Right Ramp Rail (Spaced at +1.15m to match rover wheel track) */}
        <group position={[1.15, 0, 0]}>
          {/* Main Tread Plate Track */}
          <mesh material={darkTitaniumMaterial} castShadow receiveShadow>
            <boxGeometry args={[0.38, 0.04, 5.9]} />
          </mesh>
          {/* Outer Raised Guide Curb */}
          <mesh position={[0.18, 0.04, 0]} material={goldMaterial}>
            <boxGeometry args={[0.02, 0.06, 5.9]} />
          </mesh>
          {/* Inner Lip */}
          <mesh position={[-0.18, 0.03, 0]} material={darkTitaniumMaterial}>
            <boxGeometry args={[0.02, 0.04, 5.9]} />
          </mesh>
          {/* Grip Cleats along ramp */}
          {[-2.5, -2.0, -1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5, 2.0, 2.5].map((cz, i) => (
            <mesh key={i} position={[0, 0.022, cz]} material={whiteAeroMaterial}>
              <boxGeometry args={[0.34, 0.008, 0.04]} />
            </mesh>
          ))}
        </group>

        {/* Diagonal Cross-Truss Titanium Bracing */}
        {[-2.0, -1.0, 0, 1.0, 2.0].map((tz, i) => (
          <mesh key={i} position={[0, -0.04, tz]} rotation={[0, 0, Math.PI / 2]} material={darkTitaniumMaterial}>
            <cylinderGeometry args={[0.02, 0.02, 2.1, 8]} />
          </mesh>
        ))}
      </group>

      {/* Ramp Ground Foot Rest Plates resting on Martian soil */}
      <mesh position={[-1.15, 0.04, 7.85]} material={goldMaterial} receiveShadow>
        <boxGeometry args={[0.5, 0.06, 0.4]} />
      </mesh>
      <mesh position={[1.15, 0.04, 7.85]} material={goldMaterial} receiveShadow>
        <boxGeometry args={[0.5, 0.06, 0.4]} />
      </mesh>

      {/* ================= 7. ROVER PAYLOAD STAGING CRADLE ON LANDER DECK ================= */}
      <group position={[0, 1.83, 1.4]}>
        {/* Cradle Guide Tracks */}
        <mesh position={[-1.15, 0.02, 0]} material={darkTitaniumMaterial}>
          <boxGeometry args={[0.4, 0.03, 1.6]} />
        </mesh>
        <mesh position={[1.15, 0.02, 0]} material={darkTitaniumMaterial}>
          <boxGeometry args={[0.4, 0.03, 1.6]} />
        </mesh>
        {/* Pyrotechnic Release Hold-Down Clamps */}
        <mesh position={[-1.15, 0.08, -0.6]} material={goldMaterial}>
          <boxGeometry args={[0.1, 0.12, 0.1]} />
        </mesh>
        <mesh position={[1.15, 0.08, -0.6]} material={goldMaterial}>
          <boxGeometry args={[0.1, 0.12, 0.1]} />
        </mesh>
      </group>

      {/* Ground Docking Light Illuminating the Lander Base */}
      <pointLight
        position={[0, 2.5, 0]}
        color={isDocked ? '#34d399' : '#0ea5e9'}
        intensity={2.8}
        distance={24}
      />
    </group>
  );
};

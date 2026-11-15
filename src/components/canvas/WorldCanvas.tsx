'use client';

import React, { Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MartianSky } from './MartianSky';
import { MartianTerrain } from './MartianTerrain';
import { GeologicalOutcrops } from './GeologicalOutcrops';
import { RoverController } from './RoverController';
import { AtmosphericDustParticles } from './AtmosphericDustParticles';
import { MartianDustVortex } from './MartianDustVortex';
import { MotherShipLander } from './MotherShipLander';
import { LaunchSequence } from '@/components/sequence/LaunchSequence';
import { CruiseSequence } from '@/components/sequence/CruiseSequence';
import { EDLSequence } from '@/components/sequence/EDLSequence';
import { useMissionStore } from '@/lib/store/useMissionStore';
import { useFlightTimelineStore } from '@/lib/store/useFlightTimelineStore';

// Flight timeline step progression inside frame loop
const TimelineTicker: React.FC = () => {
  const tickFlight = useFlightTimelineStore((s) => s.tick);
  const updateMarsTime = useMissionStore((s) => s.updateTime);
  const gamePhase = useFlightTimelineStore((s) => s.gamePhase);

  useFrame((_, delta) => {
    tickFlight(delta);
    if (gamePhase === 'SURFACE_EXPLORATION') {
      updateMarsTime(delta);
    }
  });

  return null;
};

// Orbit controls handled dynamically by RoverController with full physics terrain clearance
const OrbitHandler: React.FC = () => {
  return null;
};

// Dynamic Phase Scene Controller
const PhaseScene: React.FC = () => {
  const gamePhase = useFlightTimelineStore((s) => s.gamePhase);

  switch (gamePhase) {
    case 'LAUNCH':
      return <LaunchSequence />;

    case 'CRUISE':
      return <CruiseSequence />;

    case 'EDL':
      return (
        <>
          <MartianSky />
          <MartianTerrain />
          <GeologicalOutcrops />
          <MotherShipLander />
          <EDLSequence />
          <AtmosphericDustParticles />
        </>
      );

    case 'SURFACE_EXPLORATION':
    default:
      return (
        <>
          <MartianSky />
          <MartianTerrain />
          <GeologicalOutcrops />
          <MotherShipLander />
          <RoverController />
          <AtmosphericDustParticles />
          <MartianDustVortex />
          <OrbitHandler />
        </>
      );
  }
};

export const WorldCanvas: React.FC = () => {
  return (
    <div className="absolute inset-0 h-full w-full bg-black select-none overflow-hidden">
      <Canvas
        shadows
        camera={{ position: [0, 8, -12], fov: 58, near: 0.2, far: 5000 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Suspense fallback={null}>
          <TimelineTicker />
          <PhaseScene />
        </Suspense>
      </Canvas>
    </div>
  );
};

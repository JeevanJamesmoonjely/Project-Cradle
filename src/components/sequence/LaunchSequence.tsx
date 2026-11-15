'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useFlightTimelineStore } from '@/lib/store/useFlightTimelineStore';
import {
  getSLSCoreStageTexture,
  getSLSCoreStageBumpTexture,
  getSLSSRBTexture,
  getRS25PlumeTexture,
} from '@/lib/graphics/spaceflightTextures';
import {
  getSteamParticleTexture,
  getFireParticleTexture,
  getStarParticleTexture,
  getExhaustSmokeParticleTexture,
  getSRBFlameCoreTexture,
  getBoiloffVaporTexture,
  applyCircularPointShader,
} from '@/lib/graphics/particleTextures';
import { MarsPlanetModel } from '@/components/canvas/MarsPlanetModel';

export const LaunchSequence: React.FC = () => {
  const { camera, scene } = useThree();
  const flightPhase = useFlightTimelineStore((s) => s.flightPhase);
  const phaseProgress = useFlightTimelineStore((s) => s.phaseProgress);
  const phaseElapsed = useFlightTimelineStore((s) => s.phaseElapsed);
  const cameraAngle = useFlightTimelineStore((s) => s.cameraAngle);

  // Scene references
  const rocketGroupRef = useRef<THREE.Group>(null);
  const coreStageRef = useRef<THREE.Group>(null);
  const leftBoosterRef = useRef<THREE.Group>(null);
  const rightBoosterRef = useRef<THREE.Group>(null);
  const swingArmsRef = useRef<THREE.Group>(null);
  const flameLightRef = useRef<THREE.PointLight>(null);
  const groundGlowLightRef = useRef<THREE.PointLight>(null);
  const padFloodlightRef = useRef<THREE.SpotLight>(null);
  const nightAmbientRef = useRef<THREE.AmbientLight>(null);
  const vaporConeRef = useRef<THREE.Mesh>(null);
  const steamPointsRef = useRef<THREE.Points>(null);
  const flameLeftSRBRef = useRef<THREE.Points>(null);
  const flameRightSRBRef = useRef<THREE.Points>(null);
  const exhaustTrailRef = useRef<THREE.Points>(null);
  const boiloffVaporRef = useRef<THREE.Points>(null);
  const coreEnginePlumesRef = useRef<THREE.Group>(null);
  const beaconLightRef = useRef<THREE.PointLight>(null);
  const lasRef = useRef<THREE.Group>(null);
  const fairingLeftRef = useRef<THREE.Group>(null);
  const fairingRightRef = useRef<THREE.Group>(null);

  // Set up atmospheric night fog
  useEffect(() => {
    const prevFog = scene.fog;
    scene.fog = new THREE.FogExp2('#020617', 0.00075);
    return () => {
      scene.fog = prevFog;
    };
  }, [scene]);

  // Procedural Textures
  const coreStageTexture = useMemo(() => getSLSCoreStageTexture(), []);
  const coreStageBumpTexture = useMemo(() => getSLSCoreStageBumpTexture(), []);
  const srbTexture = useMemo(() => getSLSSRBTexture(), []);
  const rs25PlumeTexture = useMemo(() => getRS25PlumeTexture(), []);
  const steamTexture = useMemo(() => getSteamParticleTexture(), []);
  const fireTexture = useMemo(() => getFireParticleTexture(), []);
  const srbCoreTexture = useMemo(() => getSRBFlameCoreTexture(), []);
  const smokeTexture = useMemo(() => getExhaustSmokeParticleTexture(), []);
  const vaporTexture = useMemo(() => getBoiloffVaporTexture(), []);
  const starTexture = useMemo(() => getStarParticleTexture(), []);

  // Night Sky Starfield (2,500 pinpoint stars over Merritt Island / Cape Canaveral)
  const starfieldPoints = useMemo(() => {
    const count = 2500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.98); // Upper celestial hemisphere
      const r = 900 + Math.random() * 100;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  // 1. Pre-Launch Cryogenic Boil-off Vapor (wispy LOX/LH2 venting before ignition)
  const boiloffCount = 120;
  const [boiloffGeo, boiloffData] = useMemo(() => {
    const positions = new Float32Array(boiloffCount * 3);
    const data: { vx: number; vy: number; vz: number; life: number }[] = [];
    for (let i = 0; i < boiloffCount; i++) {
      positions[i * 3] = 2.8 + (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 1] = 28 + (Math.random() - 0.5) * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      data.push({
        vx: 1.2 + Math.random() * 1.5,
        vy: 0.3 + Math.random() * 0.8,
        vz: (Math.random() - 0.5) * 0.8,
        life: Math.random(),
      });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return [geo, data];
  }, []);

  // 2. Volumetric Launch Deluge Steam System (600 boiling condensation clouds from flame trench)
  const steamCount = 600;
  const [steamGeo, steamData] = useMemo(() => {
    const positions = new Float32Array(steamCount * 3);
    const data: { vx: number; vy: number; vz: number; life: number }[] = [];
    for (let i = 0; i < steamCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 4 + Math.random() * 18;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = 0.5 + Math.random() * 8;
      positions[i * 3 + 2] = Math.sin(angle) * r;
      data.push({
        vx: Math.cos(angle) * (4 + Math.random() * 12),
        vy: 3.5 + Math.random() * 12,
        vz: Math.sin(angle) * (4 + Math.random() * 12),
        life: Math.random(),
      });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return [geo, data];
  }, []);

  // 3. Dual 5-Segment SRB Supersonic Flame Torrents (450 particles per booster)
  const flameCountPerBooster = 450;
  const createFlameGeoData = () => {
    const positions = new Float32Array(flameCountPerBooster * 3);
    const data: { vy: number; spread: number; life: number }[] = [];
    for (let i = 0; i < flameCountPerBooster; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1.8;
      positions[i * 3 + 1] = -(Math.random() * 32);
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
      data.push({
        vy: 55 + Math.random() * 65, // 55-120 m/s high-velocity jet
        spread: 0.14 + Math.random() * 0.32,
        life: Math.random(),
      });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return [geo, data] as const;
  };

  const [leftFlameGeo, leftFlameData] = useMemo(() => createFlameGeoData(), []);
  const [rightFlameGeo, rightFlameData] = useMemo(() => createFlameGeoData(), []);

  // 4. Towering Exhaust Smoke Column / Plume Trail (600 lingering cumulus smoke particles)
  const smokeCount = 600;
  const [smokeGeo, smokeData] = useMemo(() => {
    const positions = new Float32Array(smokeCount * 3);
    const data: { x: number; y: number; z: number; vx: number; vz: number; life: number; active: boolean }[] = [];
    for (let i = 0; i < smokeCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -9999;
      positions[i * 3 + 2] = 0;
      data.push({
        x: 0,
        y: -9999,
        z: 0,
        vx: (Math.random() - 0.5) * 2.5,
        vz: (Math.random() - 0.5) * 2.5,
        life: 0,
        active: false,
      });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return [geo, data];
  }, []);

  // Materials with Circular Shader modifier
  const materials = useMemo(() => {
    const steamMat = new THREE.PointsMaterial({
      size: 7.5,
      map: steamTexture,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.NormalBlending,
      sizeAttenuation: true,
    });
    applyCircularPointShader(steamMat);

    const srbFlameMat = new THREE.PointsMaterial({
      size: 5.5,
      map: srbCoreTexture,
      transparent: true,
      opacity: 0.98,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    applyCircularPointShader(srbFlameMat);

    const smokeMat = new THREE.PointsMaterial({
      size: 16.0,
      map: smokeTexture,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.NormalBlending,
      sizeAttenuation: true,
    });
    applyCircularPointShader(smokeMat);

    const boiloffMat = new THREE.PointsMaterial({
      size: 3.5,
      map: vaporTexture,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.NormalBlending,
      sizeAttenuation: true,
    });
    applyCircularPointShader(boiloffMat);

    const starMat = new THREE.PointsMaterial({
      size: 2.2,
      map: starTexture,
      color: '#ffffff',
      transparent: true,
      opacity: 0.92,
      sizeAttenuation: true,
      depthWrite: false,
    });
    applyCircularPointShader(starMat);

    return {
      steamMat,
      srbFlameMat,
      smokeMat,
      boiloffMat,
      starMat,
      slsCore: new THREE.MeshStandardMaterial({
        map: coreStageTexture,
        bumpMap: coreStageBumpTexture,
        bumpScale: 0.06,
        metalness: 0.2,
        roughness: 0.55,
      }),
      domedBulkhead: new THREE.MeshStandardMaterial({
        color: '#b45309',
        metalness: 0.65,
        roughness: 0.35,
      }),
      lvsaInterstage: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        metalness: 0.85,
        roughness: 0.28,
      }),
      icpsWhite: new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        metalness: 0.25,
        roughness: 0.35,
      }),
      rl10EngineBell: new THREE.MeshStandardMaterial({
        color: '#0f172a',
        metalness: 0.95,
        roughness: 0.15,
      }),
      slsSRB: new THREE.MeshStandardMaterial({
        map: srbTexture,
        metalness: 0.35,
        roughness: 0.28,
      }),
      orionWhite: new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        metalness: 0.2,
        roughness: 0.3,
      }),
      engineBell: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        metalness: 0.95,
        roughness: 0.18,
      }),
      engineThroatGlow: new THREE.MeshBasicMaterial({
        color: '#ffffff',
      }),
      towerSteelGray: new THREE.MeshStandardMaterial({
        color: '#475569',
        metalness: 0.8,
        roughness: 0.3,
      }),
      towerSteelRed: new THREE.MeshStandardMaterial({
        color: '#dc2626',
        metalness: 0.65,
        roughness: 0.35,
      }),
      padConcrete: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.9,
      }),
      vaporConeMat: new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      }),
      waterOcean: new THREE.MeshStandardMaterial({
        color: '#020617',
        metalness: 0.95,
        roughness: 0.08,
      }),
      floridaGround: new THREE.MeshStandardMaterial({
        color: '#0a0f1d',
        roughness: 0.95,
      }),
      rs25BluePlume: new THREE.MeshBasicMaterial({
        map: rs25PlumeTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      rs25InnerCore: new THREE.MeshBasicMaterial({
        color: '#f0fdfa',
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.96,
      }),
      machShockDiamond: new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.98,
      }),
      lightningTowerWhite: new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        metalness: 0.4,
        roughness: 0.5,
      }),
    };
  }, [coreStageTexture, coreStageBumpTexture, srbTexture, rs25PlumeTexture, steamTexture, srbCoreTexture, smokeTexture, vaporTexture, starTexture]);

  // Frame animation loop
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const t = phaseProgress;

    let rocketY = 0;
    let cameraShake = 0;

    // Flash aviation beacon atop ML-1 tower
    if (beaconLightRef.current) {
      beaconLightRef.current.intensity = Math.sin(time * 6.0) > 0.4 ? 15.0 : 0.0;
    }

    // Artemis 1 Physics & Flight Telemetry Timeline
    if (flightPhase === 'LAUNCH_COUNTDOWN') {
      rocketY = 0;
      // Retract swing arms during final 4 seconds
      if (swingArmsRef.current) {
        swingArmsRef.current.rotation.y = THREE.MathUtils.lerp(
          0,
          -Math.PI / 3.2,
          Math.max(0, (phaseElapsed - 6) / 4)
        );
      }
      // RS-25 ignition at T-6.6s
      const isRS25Lit = phaseElapsed > 3.4;
      if (coreEnginePlumesRef.current) {
        coreEnginePlumesRef.current.visible = isRS25Lit;
      }
      // SRBs ignite at T-0s (phaseElapsed > 9.7s)
      const isSRBLit = phaseElapsed > 9.7;
      if (flameLeftSRBRef.current) flameLeftSRBRef.current.visible = isSRBLit;
      if (flameRightSRBRef.current) flameRightSRBRef.current.visible = isSRBLit;

      // BLINDING DAYLIGHT FLASH: Point lights and ambient lighting
      if (flameLightRef.current) {
        if (isSRBLit) {
          flameLightRef.current.intensity = 380.0 + Math.sin(time * 60) * 50.0;
        } else if (isRS25Lit) {
          flameLightRef.current.intensity = 45.0 + Math.sin(time * 30) * 8.0;
        } else {
          flameLightRef.current.intensity = 0;
        }
      }
      if (groundGlowLightRef.current) {
        groundGlowLightRef.current.intensity = isSRBLit ? 180.0 : isRS25Lit ? 30.0 : 0;
      }
      if (nightAmbientRef.current) {
        nightAmbientRef.current.intensity = isSRBLit ? 2.6 : 0.12;
      }

      // Pre-launch boiloff venting active until T-0
      if (boiloffVaporRef.current) {
        boiloffVaporRef.current.visible = phaseElapsed < 9.7;
        if (boiloffVaporRef.current.visible) {
          const vPos = boiloffVaporRef.current.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < boiloffCount; i++) {
            const vd = boiloffData[i];
            vd.life = (vd.life + delta * 0.7) % 1.0;
            vPos[i * 3] += vd.vx * delta;
            vPos[i * 3 + 1] += vd.vy * delta;
            vPos[i * 3 + 2] += vd.vz * delta;
            if (vd.life < delta * 0.7) {
              vPos[i * 3] = 2.8 + (Math.random() - 0.5) * 0.3;
              vPos[i * 3 + 1] = 28 + (Math.random() - 0.5) * 1.5;
              vPos[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
            }
          }
          boiloffVaporRef.current.geometry.attributes.position.needsUpdate = true;
        }
      }
    } else if (flightPhase === 'LAUNCH_LIFTOFF') {
      // Colossal Artemis SLS slowly and majestically clears the tower
      rocketY = t * t * 180;
      cameraShake = 0.14 * (1.0 - t * 0.3);

      if (coreEnginePlumesRef.current) coreEnginePlumesRef.current.visible = true;
      if (flameLeftSRBRef.current) flameLeftSRBRef.current.visible = true;
      if (flameRightSRBRef.current) flameRightSRBRef.current.visible = true;
      if (boiloffVaporRef.current) boiloffVaporRef.current.visible = false;

      // BLINDING DAYLIGHT FLASH: SLS SRBs turn night into golden daylight!
      if (flameLightRef.current) {
        flameLightRef.current.intensity = 380.0 + Math.sin(time * 65) * 60.0;
      }
      if (groundGlowLightRef.current) {
        groundGlowLightRef.current.intensity = Math.max(0, 160.0 * (1.0 - rocketY / 120));
      }
      if (nightAmbientRef.current) {
        nightAmbientRef.current.intensity = 2.8 + Math.sin(time * 30) * 0.4;
      }
    } else if (flightPhase === 'LAUNCH_MAX_Q') {
      rocketY = 180 + t * 520;
      cameraShake = 0.22 + Math.sin(time * 40) * 0.08; // Violent Max-Q aerodynamic buffet

      if (flameLeftSRBRef.current) flameLeftSRBRef.current.visible = true;
      if (flameRightSRBRef.current) flameRightSRBRef.current.visible = true;
      if (flameLightRef.current) flameLightRef.current.intensity = 320.0;
      if (nightAmbientRef.current) nightAmbientRef.current.intensity = 2.0;

      // Transonic Prandtl-Glauert aerodynamic condensation cloud
      if (vaporConeRef.current) {
        const coneFade = Math.sin(t * Math.PI);
        vaporConeRef.current.scale.set(
          1 + coneFade * 0.4 + Math.sin(time * 30) * 0.06,
          1 + coneFade * 0.25,
          1 + coneFade * 0.4 + Math.sin(time * 30) * 0.06
        );
        (vaporConeRef.current.material as THREE.MeshBasicMaterial).opacity = coneFade * 0.9;
      }
    } else if (flightPhase === 'LAUNCH_BOOSTER_SEP') {
      rocketY = 700 + t * 950;
      cameraShake = t < 0.25 ? 0.28 : 0.03; // Explosive separation kick

      // Twin 5-Segment SRBs decouple and tumble away sideways with tracer puffs
      const sepAngle = t * 0.65;
      const sepDist = t * 55;
      if (leftBoosterRef.current) {
        leftBoosterRef.current.position.set(-5.4 - sepDist, -t * 30, 0);
        leftBoosterRef.current.rotation.z = sepAngle;
      }
      if (rightBoosterRef.current) {
        rightBoosterRef.current.position.set(5.4 + sepDist, -t * 30, 0);
        rightBoosterRef.current.rotation.z = -sepAngle;
      }
      // SRBs flame diminishes, Core RS-25 continues
      if (flameLeftSRBRef.current) flameLeftSRBRef.current.visible = t < 0.15;
      if (flameRightSRBRef.current) flameRightSRBRef.current.visible = t < 0.15;
      if (vaporConeRef.current) (vaporConeRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
    } else if (flightPhase === 'LAUNCH_FAIRING_SEP') {
      rocketY = 1650 + t * 1600;
      cameraShake = 0.01;

      // Launch Abort System (LAS) tower jettisons forward with rocket motors
      if (lasRef.current) {
        lasRef.current.position.y = 7.5 + t * 140;
        lasRef.current.rotation.x = t * 0.32;
      }
      // Dual Fairing halves peel outward and tumble
      if (fairingLeftRef.current) {
        fairingLeftRef.current.position.set(-t * 38, 2.5 - t * 14, 0);
        fairingLeftRef.current.rotation.z = t * 0.55;
      }
      if (fairingRightRef.current) {
        fairingRightRef.current.position.set(t * 38, 2.5 - t * 14, 0);
        fairingRightRef.current.rotation.z = -t * 0.55;
      }
    }

    if (flightPhase !== 'LAUNCH_FAIRING_SEP') {
      if (lasRef.current) {
        lasRef.current.position.set(0, 7.5, 0);
        lasRef.current.rotation.set(0, 0, 0);
      }
      if (fairingLeftRef.current) {
        fairingLeftRef.current.position.set(0, 2.5, 0);
        fairingLeftRef.current.rotation.set(0, 0, 0);
      }
      if (fairingRightRef.current) {
        fairingRightRef.current.position.set(0, 2.5, 0);
        fairingRightRef.current.rotation.set(0, 0, 0);
      }
    }

    // RS-25 hydrolox supersonic plume dynamic roaring pulsation
    if (coreEnginePlumesRef.current && coreEnginePlumesRef.current.visible) {
      const pScale = 1.0 + Math.sin(time * 55) * 0.04 + (Math.random() - 0.5) * 0.02;
      const pLen = 1.0 + Math.cos(time * 42) * 0.06;
      coreEnginePlumesRef.current.scale.set(pScale, pLen, pScale);
    }

    if (rocketGroupRef.current) {
      rocketGroupRef.current.position.y = rocketY;
      if (
        flightPhase === 'LAUNCH_MAX_Q' ||
        flightPhase === 'LAUNCH_BOOSTER_SEP' ||
        flightPhase === 'LAUNCH_FAIRING_SEP'
      ) {
        const pitch = Math.min(0.48, (rocketY / 2600) * 0.48);
        rocketGroupRef.current.rotation.z = -pitch;
      }
    }

    // Dynamic Steam Deluge Simulation (Flame Trench)
    if (steamPointsRef.current) {
      const isSteamActive =
        flightPhase === 'LAUNCH_LIFTOFF' ||
        (flightPhase === 'LAUNCH_COUNTDOWN' && phaseElapsed > 6.5);
      steamPointsRef.current.visible = isSteamActive;

      if (isSteamActive) {
        const pos = steamPointsRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < steamCount; i++) {
          const sd = steamData[i];
          sd.life = (sd.life + delta * 0.6) % 1.0;
          const expansion = 1.0 + sd.life * 4.5;

          pos[i * 3] += sd.vx * delta * expansion;
          pos[i * 3 + 1] += sd.vy * delta;
          pos[i * 3 + 2] += sd.vz * delta * expansion;

          if (pos[i * 3 + 1] > 36.0 || sd.life < delta * 0.6) {
            const angle = Math.random() * Math.PI * 2;
            const r = 3 + Math.random() * 9;
            pos[i * 3] = Math.cos(angle) * r;
            pos[i * 3 + 1] = 1.0 + Math.random() * 4;
            pos[i * 3 + 2] = Math.sin(angle) * r;
          }
        }
        steamPointsRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }

    // Dynamic Supersonic SRB Fire Simulation (Dual Plumes at x = ±5.4)
    const updateSRBFlame = (ref: React.RefObject<THREE.Points | null>, fData: typeof leftFlameData) => {
      if (ref.current && ref.current.visible) {
        const fPos = ref.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < flameCountPerBooster; i++) {
          const fd = fData[i];
          fPos[i * 3 + 1] -= fd.vy * delta;
          const distDown = Math.abs(fPos[i * 3 + 1]);
          const spreadFactor = 1.0 + distDown * fd.spread;
          fPos[i * 3] += (Math.random() - 0.5) * delta * 14 * spreadFactor;
          fPos[i * 3 + 2] += (Math.random() - 0.5) * delta * 14 * spreadFactor;

          if (distDown > 42.0) {
            fPos[i * 3] = (Math.random() - 0.5) * 1.8;
            fPos[i * 3 + 1] = -0.5 - Math.random() * 3.0;
            fPos[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
          }
        }
        ref.current.geometry.attributes.position.needsUpdate = true;
      }
    };

    updateSRBFlame(flameLeftSRBRef, leftFlameData);
    updateSRBFlame(flameRightSRBRef, rightFlameData);

    // Towering Exhaust Smoke Trail Simulation (leaves lingering smoke behind ascending rocket)
    if (exhaustTrailRef.current) {
      const isAscending =
        flightPhase === 'LAUNCH_LIFTOFF' ||
        flightPhase === 'LAUNCH_MAX_Q' ||
        flightPhase === 'LAUNCH_BOOSTER_SEP';
      exhaustTrailRef.current.visible = isAscending;

      if (isAscending) {
        const sPos = exhaustTrailRef.current.geometry.attributes.position.array as Float32Array;
        const spawnCount = Math.floor(delta * 120); // spawn smoke rate

        let spawned = 0;
        for (let i = 0; i < smokeCount; i++) {
          const sd = smokeData[i];
          if (!sd.active && spawned < spawnCount) {
            sd.active = true;
            sd.life = 0;
            sd.x = (Math.random() - 0.5) * 4.5;
            sd.y = rocketY - 6.0;
            sd.z = (Math.random() - 0.5) * 4.5;
            spawned++;
          }

          if (sd.active) {
            sd.life += delta * 0.25;
            sd.x += sd.vx * delta * (1.0 + sd.life * 3.0);
            sd.z += sd.vz * delta * (1.0 + sd.life * 3.0);
            sd.y += delta * 1.5; // slight thermal buoyancy

            sPos[i * 3] = sd.x;
            sPos[i * 3 + 1] = sd.y;
            sPos[i * 3 + 2] = sd.z;

            if (sd.life >= 1.0) {
              sd.active = false;
              sPos[i * 3 + 1] = -9999;
            }
          }
        }
        exhaustTrailRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }

    // Cinematic Camera Choreography Matching Reference Video
    const shakeX = (Math.random() - 0.5) * cameraShake;
    const shakeY = (Math.random() - 0.5) * cameraShake;

    if (cameraAngle === 'onboard') {
      // Rocket Cam looking down along orange core and twin SRBs
      camera.position.set(shakeX + 4.8, rocketY + 38 + shakeY, 4.8);
      camera.lookAt(0, rocketY - 12, 0);
    } else if (cameraAngle === 'tracking') {
      // Coastal Telephoto Shot across the water (iconic view from video!)
      // Camera is stationed 180m across lagoon looking at Pad 39B
      const trackCamY = Math.max(16, rocketY * 0.65);
      camera.position.set(135 + shakeX, trackCamY + shakeY, 195);
      camera.lookAt(0, rocketY + 18, 0);
    } else {
      // Cinematic Heroic Views
      if (flightPhase === 'LAUNCH_COUNTDOWN') {
        // Dramatic low-angle heroic view looking up at the illuminated SLS on the pad at night
        const camOrbit = time * 0.08;
        camera.position.set(Math.sin(camOrbit) * 46, 14, Math.cos(camOrbit) * 46);
        camera.lookAt(0, 26, 0);
      } else if (flightPhase === 'LAUNCH_LIFTOFF') {
        // Tower Clear Shot: Low angle tracking the climbing rocket past ML-1 girders
        camera.position.set(34 + shakeX, 12 + rocketY * 0.55 + shakeY, 44);
        camera.lookAt(0, rocketY + 20, 0);
      } else if (flightPhase === 'LAUNCH_MAX_Q') {
        // High telephoto tracking showing glowing plume stretching behind the orange core
        camera.position.set(-56 + shakeX, rocketY - 16 + shakeY, 68);
        camera.lookAt(0, rocketY + 16, 0);
      } else if (flightPhase === 'LAUNCH_BOOSTER_SEP') {
        // High orbital staging camera showing twin SRBs tumbling away
        camera.position.set(58 + shakeX, rocketY - 10 + shakeY, 52);
        camera.lookAt(0, rocketY + 20, 0);
      } else {
        camera.position.set(24 + shakeX, rocketY + 38 + shakeY, 32);
        camera.lookAt(0, rocketY + 28, 0);
      }
    }
  });

  return (
    <group>
      {/* Night Sky & Cape Canaveral Atmospheric Lighting */}
      <ambientLight ref={nightAmbientRef} intensity={0.12} color="#cbd5e1" />

      {/* Industrial Pad Floodlights illuminating the rocket before launch */}
      <spotLight
        ref={padFloodlightRef}
        position={[-38, 16, 38]}
        intensity={220}
        angle={0.65}
        penumbra={0.8}
        color="#ffffff"
        target-position={[0, 26, 0]}
        castShadow
      />
      <spotLight
        position={[38, 16, -38]}
        intensity={190}
        angle={0.65}
        penumbra={0.8}
        color="#fef08a"
        target-position={[0, 26, 0]}
      />

      {/* Starfield */}
      <primitive object={new THREE.Points(starfieldPoints, materials.starMat)} />

      {/* Target Destination: Mars (Official NASA Mars 3D Model 24881_Mars_1_6792.usdz) */}
      <MarsPlanetModel radius={18} position={[420, 680, -520]} atmosphere={true} rotationSpeed={0.015} />

      {/* Atlantic Ocean & Dark Coastal Terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[1800, 1800, 32, 32]} />
        <primitive object={materials.floridaGround} attach="material" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[400, -0.4, 0]}>
        <planeGeometry args={[1200, 1800]} />
        <primitive object={materials.waterOcean} attach="material" />
      </mesh>

      {/* ================= 3 ICONIC PAD 39B LIGHTNING TOWERS (600ft tall white steel lattice) ================= */}
      {[
        [-90, -80],
        [90, -80],
        [0, 110],
      ].map(([tx, tz], ti) => (
        <group key={ti} position={[tx, 0, tz]}>
          <mesh position={[0, 48, 0]} castShadow>
            <cylinderGeometry args={[0.9, 3.8, 96, 6]} />
            <primitive object={materials.lightningTowerWhite} attach="material" />
          </mesh>
          {/* Spire mast atop tower */}
          <mesh position={[0, 102, 0]}>
            <cylinderGeometry args={[0.08, 0.6, 24, 6]} />
            <primitive object={materials.towerSteelGray} attach="material" />
          </mesh>
        </group>
      ))}

      {/* ================= HIGH-DETAIL PAD 39B & MOBILE LAUNCHER TOWER (ML-1) ================= */}
      <group position={[0, 0, 0]}>
        {/* Concrete Mobile Launcher Platform (MLP) Deck */}
        <mesh position={[0, 2.0, 0]} receiveShadow castShadow>
          <boxGeometry args={[54, 4, 54]} />
          <primitive object={materials.padConcrete} attach="material" />
        </mesh>
        {/* Flame Exhaust Trench Channels */}
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[18, 3.4, 48]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>

        {/* NASA Mobile Launcher Tower (MLT) Steel Lattice */}
        <group position={[-12, 4, 0]}>
          {[-2.4, 2.4].map((x, xi) =>
            [-2.4, 2.4].map((z, zi) => (
              <mesh key={`${xi}-${zi}`} position={[x, 34, z]} castShadow>
                <cylinderGeometry args={[0.42, 0.42, 68, 12]} />
                <primitive object={materials.towerSteelGray} attach="material" />
              </mesh>
            ))
          )}

          {/* 16 Intermediate Girder Levels & Diagonal Bracing */}
          {Array.from({ length: 16 }).map((_, i) => (
            <mesh key={i} position={[0, 4.5 + i * 4.3, 0]}>
              <boxGeometry args={[5.2, 0.5, 5.2]} />
              <primitive object={materials.towerSteelGray} attach="material" />
            </mesh>
          ))}

          {/* Red Crew Access Arm (CAA) & Intertank Umbilical Arms */}
          <group ref={swingArmsRef} position={[2.6, 46, 0]}>
            <mesh position={[4.0, 0, 0]}>
              <boxGeometry args={[8.0, 1.6, 1.6]} />
              <primitive object={materials.towerSteelRed} attach="material" />
            </mesh>
            {/* White Room at end of Crew Access Arm */}
            <mesh position={[8.2, 0, 0]}>
              <boxGeometry args={[2.0, 2.2, 2.2]} />
              <primitive object={materials.orionWhite} attach="material" />
            </mesh>
            {/* Intertank Umbilical Arm */}
            <mesh position={[4.0, -18, 0]}>
              <boxGeometry args={[8.0, 1.4, 1.4]} />
              <primitive object={materials.towerSteelGray} attach="material" />
            </mesh>
          </group>

          {/* Hammerhead Crane & 80ft Lightning Mast atop ML-1 */}
          <group position={[0, 71, 0]}>
            <mesh position={[3.0, 1.8, 0]}>
              <boxGeometry args={[13, 2.2, 2.4]} />
              <primitive object={materials.towerSteelRed} attach="material" />
            </mesh>
            <mesh position={[0, 12, 0]}>
              <cylinderGeometry args={[0.08, 0.28, 22, 8]} />
              <primitive object={materials.towerSteelGray} attach="material" />
            </mesh>
            {/* Red Aviation Warning Hazard Beacon */}
            <pointLight
              ref={beaconLightRef}
              position={[0, 23.5, 0]}
              color="#ef4444"
              distance={80}
              intensity={0}
            />
          </group>
        </group>

        {/* Billowing Launch Deluge Water Steam Particle System */}
        <points ref={steamPointsRef} geometry={steamGeo} material={materials.steamMat} position={[0, 4, 0]} />

        {/* Pre-launch Cryogenic Boiloff Venting Particles */}
        <points ref={boiloffVaporRef} geometry={boiloffGeo} material={materials.boiloffMat} position={[0, 0, 0]} />

        {/* Ground Flame Reflection Light */}
        <pointLight
          ref={groundGlowLightRef}
          position={[0, 1.0, 0]}
          color="#ff6600"
          distance={160}
          decay={1.8}
          intensity={0}
        />
      </group>

      {/* ================= TOWERING EXHAUST SMOKE PLUME TRAIL ================= */}
      <points ref={exhaustTrailRef} geometry={smokeGeo} material={materials.smokeMat} visible={false} />

      {/* ================= NASA SPACE LAUNCH SYSTEM (SLS) ASSEMBLY ================= */}
      <group ref={rocketGroupRef} position={[0, 4, 0]}>
        {/* Core Stage: Authentic Orange Spray-On Foam Insulation (SOFI) */}
        <group ref={coreStageRef} position={[0, 20, 0]}>
          {/* Open-Ended Cylinder - eliminates ugly flat end-cap texture stretch */}
          <mesh castShadow>
            <cylinderGeometry args={[2.8, 2.8, 36, 64, 1, true]} />
            <primitive object={materials.slsCore} attach="material" />
          </mesh>

          {/* Forward LOX Tank Convex Bulkhead inside interstage */}
          <mesh position={[0, 17.6, 0]}>
            <sphereGeometry args={[2.78, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.38]} />
            <primitive object={materials.domedBulkhead} attach="material" />
          </mesh>

          {/* Aft LH2 Tank Convex Bulkhead inside engine section */}
          <mesh position={[0, -17.6, 0]} rotation={[Math.PI, 0, 0]}>
            <sphereGeometry args={[2.78, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.38]} />
            <primitive object={materials.domedBulkhead} attach="material" />
          </mesh>

          {/* Launch Vehicle Stage Adapter (LVSA) Interstage Ring at Top */}
          <group position={[0, 20.0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[2.5, 2.8, 4.0, 48, 1, true]} />
              <primitive object={materials.lvsaInterstage} attach="material" />
            </mesh>
            {/* Staging retro-rocket motors & separation springs on LVSA rim */}
            {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ang, pi) => (
              <group key={pi} position={[Math.sin(ang) * 2.7, 0, Math.cos(ang) * 2.7]}>
                <mesh>
                  <boxGeometry args={[0.2, 1.4, 0.25]} />
                  <primitive object={materials.towerSteelGray} attach="material" />
                </mesh>
              </group>
            ))}
            {/* Interim Cryogenic Propulsion Stage (ICPS) RL10 Engine nestled inside LVSA */}
            <group position={[0, 0.4, 0]}>
              <mesh>
                <cylinderGeometry args={[0.28, 0.78, 1.9, 24]} />
                <primitive object={materials.rl10EngineBell} attach="material" />
              </mesh>
            </group>
          </group>

          {/* Aero Feedlines along Core Stage */}
          <mesh position={[2.82, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 34, 16]} />
            <primitive object={materials.towerSteelGray} attach="material" />
          </mesh>
          <mesh position={[-2.82, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 34, 16]} />
            <primitive object={materials.towerSteelGray} attach="material" />
          </mesh>

          {/* 4 RS-25 Core Engines Cluster at Base (Photorealistic Contoured Nozzles) */}
          <group position={[0, -18.5, 0]}>
            {[
              [1.15, 1.15],
              [-1.15, 1.15],
              [1.15, -1.15],
              [-1.15, -1.15],
            ].map(([ex, ez], i) => (
              <group key={i} position={[ex, 0, ez]}>
                {/* De Laval bell contour with dark metallic finish */}
                <mesh castShadow>
                  <cylinderGeometry args={[0.42, 1.0, 2.3, 32, 4, true]} />
                  <primitive object={materials.engineBell} attach="material" />
                </mesh>
                {/* Nozzle exit stiffener ring */}
                <mesh position={[0, -1.15, 0]}>
                  <torusGeometry args={[1.0, 0.05, 12, 32]} />
                  <primitive object={materials.engineBell} attach="material" />
                </mesh>
                {/* Regenerative cooling manifold */}
                <mesh position={[0, 0.5, 0]}>
                  <cylinderGeometry args={[0.45, 0.45, 0.35, 16]} />
                  <primitive object={materials.towerSteelGray} attach="material" />
                </mesh>
                {/* Glowing incandescent throat ring interior */}
                <mesh position={[0, -1.05, 0]}>
                  <cylinderGeometry args={[0.88, 0.88, 0.08, 24]} />
                  <primitive object={materials.engineThroatGlow} attach="material" />
                </mesh>
              </group>
            ))}

            {/* RS-25 Supersonic Hydrolox Flame Plumes with Luminous Mach Diamonds */}
            <group ref={coreEnginePlumesRef} visible={false}>
              {[
                [1.15, 1.15],
                [-1.15, 1.15],
                [1.15, -1.15],
                [-1.15, -1.15],
              ].map(([ex, ez], i) => (
                <group key={i} position={[ex, -1.2, ez]}>
                  {/* Outer supersonic expansion gas envelope (Additive blending with Gaussian fade) */}
                  <mesh position={[0, -4.6, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[1.35, 9.4, 32, 1, true]} />
                    <primitive object={materials.rs25BluePlume} attach="material" />
                  </mesh>
                  {/* Inner high-energy shock-core flame */}
                  <mesh position={[0, -2.4, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.55, 4.8, 24, 1, true]} />
                    <primitive object={materials.rs25InnerCore} attach="material" />
                  </mesh>
                  {/* Brilliant Mach Shock Diamonds (Bicone compression nodes) */}
                  {[1.1, 2.3, 3.7, 5.1, 6.6, 8.0].map((dy, di) => (
                    <group key={di} position={[0, -dy, 0]}>
                      <mesh rotation={[0, 0, Math.PI / 4]}>
                        <octahedronGeometry args={[0.34 - di * 0.035]} />
                        <primitive object={materials.machShockDiamond} attach="material" />
                      </mesh>
                      <mesh scale={[1.4, 1.4, 1.4]}>
                        <sphereGeometry args={[0.16, 12, 12]} />
                        <primitive object={materials.rs25InnerCore} attach="material" />
                      </mesh>
                    </group>
                  ))}
                  {/* Dynamic point light casting blue radiant glow on engine bay and launch pad */}
                  <pointLight color="#38bdf8" intensity={22} distance={30} decay={1.6} position={[0, -0.8, 0]} />
                </group>
              ))}
            </group>
          </group>

          {/* Transonic Aerodynamic Prandtl-Glauert Shock Cloud (Max-Q) */}
          <mesh ref={vaporConeRef} position={[0, 19.5, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[5.2, 4.0, 48, 1, true]} />
            <primitive object={materials.vaporConeMat} attach="material" />
          </mesh>
        </group>

        {/* ================= LEFT 5-SEGMENT SOLID ROCKET BOOSTER (SRB) ================= */}
        <group ref={leftBoosterRef} position={[-5.4, 16.5, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[1.75, 1.75, 32, 40]} />
            <primitive object={materials.slsSRB} attach="material" />
          </mesh>
          {/* Canted Aerodynamic Nose Cone with Forward Separation Motors */}
          <mesh position={[0, 18.2, 0]} castShadow>
            <coneGeometry args={[1.75, 4.8, 40]} />
            <primitive object={materials.slsSRB} attach="material" />
          </mesh>
          {/* Massive SRB Thrust Gimbal Nozzle */}
          <mesh position={[0, -16.8, 0]} castShadow>
            <cylinderGeometry args={[0.65, 1.45, 2.6, 24]} />
            <primitive object={materials.engineBell} attach="material" />
          </mesh>
          {/* Left SRB Dedicated Blinding Supersonic Fire Torrent */}
          <points
            ref={flameLeftSRBRef}
            geometry={leftFlameGeo}
            material={materials.srbFlameMat}
            position={[0, -17.5, 0]}
            visible={false}
          />
        </group>

        {/* ================= RIGHT 5-SEGMENT SOLID ROCKET BOOSTER (SRB) ================= */}
        <group ref={rightBoosterRef} position={[5.4, 16.5, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[1.75, 1.75, 32, 40]} />
            <primitive object={materials.slsSRB} attach="material" />
          </mesh>
          <mesh position={[0, 18.2, 0]} castShadow>
            <coneGeometry args={[1.75, 4.8, 40]} />
            <primitive object={materials.slsSRB} attach="material" />
          </mesh>
          <mesh position={[0, -16.8, 0]} castShadow>
            <cylinderGeometry args={[0.65, 1.45, 2.6, 24]} />
            <primitive object={materials.engineBell} attach="material" />
          </mesh>
          {/* Right SRB Dedicated Blinding Supersonic Fire Torrent */}
          <points
            ref={flameRightSRBRef}
            geometry={rightFlameGeo}
            material={materials.srbFlameMat}
            position={[0, -17.5, 0]}
            visible={false}
          />
        </group>

        {/* ================= ORION SPACECRAFT & LAUNCH ABORT SYSTEM (LAS) ================= */}
        <group position={[0, 43, 0]}>
          {/* ICPS Upper Stage Core Tank */}
          <mesh position={[0, -1.8, 0]} castShadow>
            <cylinderGeometry args={[2.5, 2.5, 3.2, 48]} />
            <primitive object={materials.icpsWhite} attach="material" />
          </mesh>

          {/* Orion European Service Module (ESM) */}
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[2.5, 2.5, 2.8, 48]} />
            <primitive object={materials.orionWhite} attach="material" />
          </mesh>

          {/* Orion Conical Crew Module */}
          <mesh position={[0, 3.8, 0]} castShadow>
            <cylinderGeometry args={[1.1, 2.5, 2.4, 48]} />
            <primitive object={materials.orionWhite} attach="material" />
          </mesh>

          {/* Jettisonable Fairing Halves */}
          <group ref={fairingLeftRef} position={[0, 2.5, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[2.55, 2.55, 5.5, 32, 1, true, -Math.PI / 2, Math.PI]} />
              <primitive object={materials.orionWhite} attach="material" />
            </mesh>
          </group>
          <group ref={fairingRightRef} position={[0, 2.5, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[2.55, 2.55, 5.5, 32, 1, true, Math.PI / 2, Math.PI]} />
              <primitive object={materials.orionWhite} attach="material" />
            </mesh>
          </group>

          {/* Launch Abort System (LAS) Tower (Jettisons during LAUNCH_FAIRING_SEP) */}
          <group ref={lasRef} position={[0, 7.5, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.45, 0.45, 6.5, 16]} />
              <primitive object={materials.orionWhite} attach="material" />
            </mesh>
            {/* LAS 4 Jettison Nozzles */}
            {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ang, ni) => (
              <mesh key={ni} position={[Math.sin(ang) * 0.48, -1.5, Math.cos(ang) * 0.48]} rotation={[0.4 * Math.cos(ang), 0, -0.4 * Math.sin(ang)]}>
                <coneGeometry args={[0.15, 0.4, 12]} />
                <primitive object={materials.engineBell} attach="material" />
              </mesh>
            ))}
            {/* LAS Aerodynamic Nose Needle Spike */}
            <mesh position={[0, 4.0, 0]} castShadow>
              <coneGeometry args={[0.45, 2.2, 16]} />
              <primitive object={materials.orionWhite} attach="material" />
            </mesh>
          </group>
        </group>

        {/* BLINDING DAYLIGHT FLASH: Point Light turning midnight into golden daylight! */}
        <pointLight
          ref={flameLightRef}
          position={[0, -3.5, 0]}
          color="#ff8800"
          distance={360}
          decay={1.5}
          intensity={0}
        />
      </group>
    </group>
  );
};

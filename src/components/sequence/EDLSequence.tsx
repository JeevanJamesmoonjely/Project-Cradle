'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useFlightTimelineStore } from '@/lib/store/useFlightTimelineStore';
import { getTerrainHeight } from '@/lib/physics/terrainHeight';
import { RoverModel } from '@/components/canvas/RoverModel';
import {
  getHeatShieldTexture,
  getGoldKaptonTexture,
  getSupersonicParachuteTexture,
  getHydrazinePlumeTexture,
  getBackshellTexture,
} from '@/lib/graphics/spaceflightTextures';
import {
  getVolumetricDustPuffTexture,
  getFireParticleTexture,
  getSparkParticleTexture,
  applyCircularPointShader,
} from '@/lib/graphics/particleTextures';
import { MarsPlanetModel } from '@/components/canvas/MarsPlanetModel';

// Target Touchdown Coordinates on Jezero Crater floor
const TOUCHDOWN_X = 0;
const TOUCHDOWN_Z = -15.0;

export const EDLSequence: React.FC = () => {
  const { camera } = useThree();
  const flightPhase = useFlightTimelineStore((s) => s.flightPhase);
  const phaseProgress = useFlightTimelineStore((s) => s.phaseProgress);
  const phaseElapsed = useFlightTimelineStore((s) => s.phaseElapsed);
  const cameraAngle = useFlightTimelineStore((s) => s.cameraAngle);

  // Scene component refs
  const edlGroupRef = useRef<THREE.Group>(null);
  const plasmaShockRef = useRef<THREE.Mesh>(null);
  const plasmaFirePointsRef = useRef<THREE.Points>(null);
  const plasmaSparksRef = useRef<THREE.Points>(null);
  const heatShieldRef = useRef<THREE.Group>(null);
  const backshellRef = useRef<THREE.Group>(null);
  const parachuteRef = useRef<THREE.Group>(null);
  const parachuteCanopyRef = useRef<THREE.Mesh>(null);
  const skyCraneRef = useRef<THREE.Group>(null);
  const thrusterPlumesRef = useRef<THREE.Group>(null);
  const groundDustPointsRef = useRef<THREE.Points>(null);
  const cableSparksRef = useRef<THREE.Points>(null);
  const bridleLineRef = useRef<THREE.LineSegments>(null);
  const groundBlastLightRef = useRef<THREE.PointLight>(null);

  // Procedural PBR Textures
  const heatShieldHotTexture = useMemo(() => getHeatShieldTexture(true), []);
  const heatShieldColdTexture = useMemo(() => getHeatShieldTexture(false), []);
  const goldKaptonTexture = useMemo(() => getGoldKaptonTexture(), []);
  const backshellTexture = useMemo(() => getBackshellTexture(), []);
  const parachuteTexture = useMemo(() => getSupersonicParachuteTexture(), []);
  const hydrazinePlumeTexture = useMemo(() => getHydrazinePlumeTexture(), []);
  const dustTexture = useMemo(() => getVolumetricDustPuffTexture(), []);
  const fireTexture = useMemo(() => getFireParticleTexture(), []);
  const sparkTexture = useMemo(() => getSparkParticleTexture(), []);

  // Surface ground height at landing coordinates
  const groundY = useMemo(() => getTerrainHeight(TOUCHDOWN_X, TOUCHDOWN_Z), []);
  const targetChassisY = groundY + 0.64;

  // Hypersonic Plasma Fire Particles (250 streaming fire particles)
  const plasmaParticleCount = 250;
  const [plasmaGeo, plasmaData] = useMemo(() => {
    const positions = new Float32Array(plasmaParticleCount * 3);
    const data: { vy: number; r: number; angle: number; life: number }[] = [];

    for (let i = 0; i < plasmaParticleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 2.1 + Math.random() * 0.8;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = -(Math.random() * 6);
      positions[i * 3 + 2] = Math.sin(angle) * r;

      data.push({
        vy: 20 + Math.random() * 30,
        r,
        angle,
        life: Math.random(),
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return [geo, data];
  }, [plasmaParticleCount]);

  // Re-entry Plasma Sparks / Embers (120 pinpoint sparks)
  const sparkParticleCount = 120;
  const [sparksGeo, sparksData] = useMemo(() => {
    const positions = new Float32Array(sparkParticleCount * 3);
    const data: { vy: number; r: number; angle: number }[] = [];

    for (let i = 0; i < sparkParticleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 2.0 + Math.random() * 1.5;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = -(Math.random() * 8);
      positions[i * 3 + 2] = Math.sin(angle) * r;

      data.push({
        vy: 35 + Math.random() * 40,
        r,
        angle,
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return [geo, data];
  }, [sparkParticleCount]);

  // Realistic Ground Regolith Dust Particle System (750 fine ground particles)
  const groundDustCount = 750;
  const [dustGeo, dustData] = useMemo(() => {
    const positions = new Float32Array(groundDustCount * 3);
    const data: { angle: number; r: number; vr: number; vy: number; life: number }[] = [];

    for (let i = 0; i < groundDustCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 1.2 + Math.random() * 16;
      positions[i * 3] = TOUCHDOWN_X + Math.cos(angle) * r;
      positions[i * 3 + 1] = groundY + Math.random() * 2.2;
      positions[i * 3 + 2] = TOUCHDOWN_Z + Math.sin(angle) * r;

      data.push({
        angle,
        r,
        vr: 12 + Math.random() * 20,
        vy: 1.2 + Math.random() * 3.5,
        life: Math.random(),
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return [geo, data];
  }, [groundDustCount, groundY]);

  // Pyrotechnic Cable Cut Sparks (60 magnesium sparks)
  const cableSparksCount = 60;
  const [cableSparksGeo, cableSparksData] = useMemo(() => {
    const positions = new Float32Array(cableSparksCount * 3);
    const data: { vx: number; vy: number; vz: number; life: number }[] = [];

    for (let i = 0; i < cableSparksCount; i++) {
      positions[i * 3] = TOUCHDOWN_X;
      positions[i * 3 + 1] = targetChassisY + 0.4;
      positions[i * 3 + 2] = TOUCHDOWN_Z;

      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      data.push({
        vx: Math.cos(angle) * speed,
        vy: 2 + Math.random() * 5,
        vz: Math.sin(angle) * speed,
        life: 0,
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return [geo, data];
  }, [cableSparksCount, targetChassisY]);

  // Materials
  const materials = useMemo(() => {
    const plasmaFireMat = new THREE.PointsMaterial({
      size: 2.8,
      map: fireTexture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    applyCircularPointShader(plasmaFireMat);

    const sparkMat = new THREE.PointsMaterial({
      size: 0.4,
      map: sparkTexture,
      color: '#fef08a',
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    applyCircularPointShader(sparkMat);

    const groundDustMat = new THREE.PointsMaterial({
      size: 2.4,
      map: dustTexture,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.NormalBlending,
      sizeAttenuation: true,
    });
    applyCircularPointShader(groundDustMat);

    const cableSparkMat = new THREE.PointsMaterial({
      size: 0.5,
      map: sparkTexture,
      color: '#ffffff',
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    applyCircularPointShader(cableSparkMat);

    return {
      plasmaFireMat,
      sparkMat,
      groundDustMat,
      cableSparkMat,
      backshellWhite: new THREE.MeshStandardMaterial({
        map: backshellTexture,
        metalness: 0.2,
        roughness: 0.35,
      }),
      heatShieldHot: new THREE.MeshStandardMaterial({
        map: heatShieldHotTexture,
        emissive: '#ea580c',
        emissiveIntensity: 2.6,
        roughness: 0.8,
      }),
      heatShieldCold: new THREE.MeshStandardMaterial({
        map: heatShieldColdTexture,
        roughness: 0.88,
      }),
      chuteJPLPattern: new THREE.MeshStandardMaterial({
        map: parachuteTexture,
        roughness: 0.55,
        side: THREE.DoubleSide,
      }),
      chuteCords: new THREE.LineBasicMaterial({
        color: '#fdba74',
        transparent: true,
        opacity: 0.75,
      }),
      skyCraneKapton: new THREE.MeshStandardMaterial({
        map: goldKaptonTexture,
        metalness: 0.95,
        roughness: 0.22,
        color: '#f59e0b',
      }),
      titaniumTruss: new THREE.MeshStandardMaterial({
        color: '#64748b',
        metalness: 0.9,
        roughness: 0.22,
      }),
      engineBellDark: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        metalness: 0.95,
        roughness: 0.15,
      }),
      engineThroatGlow: new THREE.MeshBasicMaterial({
        color: '#fef08a',
      }),
      copvCarbon: new THREE.MeshStandardMaterial({
        color: '#090d16',
        metalness: 0.35,
        roughness: 0.75,
      }),
      bowShockGlow: new THREE.MeshBasicMaterial({
        color: '#ffedd5',
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
      }),
      hydrazineFlame: new THREE.MeshBasicMaterial({
        map: hydrazinePlumeTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      hydrazineInnerCore: new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.98,
      }),
      hydrazineShockDiamond: new THREE.MeshBasicMaterial({
        color: '#fef08a',
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.95,
      }),
      trnGreen: new THREE.LineBasicMaterial({
        color: '#38bdf8',
        transparent: true,
        opacity: 0.22,
      }),
      bridleWire: new THREE.LineBasicMaterial({
        color: '#cbd5e1',
        linewidth: 2,
      }),
      umbilicalCable: new THREE.LineBasicMaterial({
        color: '#ea580c',
        linewidth: 2,
      }),
    };
  }, [
    heatShieldHotTexture,
    heatShieldColdTexture,
    goldKaptonTexture,
    backshellTexture,
    parachuteTexture,
    hydrazinePlumeTexture,
    dustTexture,
    fireTexture,
    sparkTexture,
  ]);

  // Parachute suspension cords geometry (48 Kevlar cords)
  const chuteCordsGeometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const numCords = 48;
    const radius = 7.6;
    for (let i = 0; i < numCords; i++) {
      const angle = (i / numCords) * Math.PI * 2;
      pts.push(new THREE.Vector3(0, 0, 0));
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 20, Math.sin(angle) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  // Dynamic Bridle lines geometry connecting Sky Crane to Rover (3 bridles + 1 umbilical = 4 segments)
  const bridleGeometry = useMemo(() => {
    const positions = new Float32Array(4 * 2 * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  // TRN Laser Scanner Line (Subtle scanning pulse)
  const trnLaserLine = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -0.6, 0),
      new THREE.Vector3(0, -28, 0),
    ]);
    return new THREE.Line(geo, materials.trnGreen);
  }, [materials.trnGreen]);

  // Bridle LineSegments
  const bridleLineSegments = useMemo(() => {
    return new THREE.LineSegments(bridleGeometry, materials.bridleWire);
  }, [bridleGeometry, materials.bridleWire]);

  // Frame Loop Animation
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const t = phaseProgress;

    // Atmospheric Plasma Bow Shock Pulsing
    if (plasmaShockRef.current) {
      if (flightPhase === 'EDL_ENTRY') {
        plasmaShockRef.current.visible = true;
        const heatPulse = 1.0 + Math.sin(time * 40) * 0.08;
        plasmaShockRef.current.scale.set(heatPulse, heatPulse, heatPulse);
      } else {
        plasmaShockRef.current.visible = false;
      }
    }

    // High-Velocity Hypersonic Plasma Streamers
    if (plasmaFirePointsRef.current) {
      if (flightPhase === 'EDL_ENTRY') {
        plasmaFirePointsRef.current.visible = true;
        const pPos = plasmaFirePointsRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < plasmaParticleCount; i++) {
          const pd = plasmaData[i];
          pPos[i * 3 + 1] += pd.vy * delta; // Streaming backwards
          if (pPos[i * 3 + 1] > 2.5) {
            pPos[i * 3 + 1] = -5.5 - Math.random() * 2;
          }
        }
        plasmaFirePointsRef.current.geometry.attributes.position.needsUpdate = true;
      } else {
        plasmaFirePointsRef.current.visible = false;
      }
    }

    // Re-entry Plasma Sparks / Embers
    if (plasmaSparksRef.current) {
      if (flightPhase === 'EDL_ENTRY') {
        plasmaSparksRef.current.visible = true;
        const sPos = plasmaSparksRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < sparkParticleCount; i++) {
          const sd = sparksData[i];
          sPos[i * 3 + 1] += sd.vy * delta;
          if (sPos[i * 3 + 1] > 3.0) {
            sPos[i * 3 + 1] = -7.0 - Math.random() * 3;
          }
        }
        plasmaSparksRef.current.geometry.attributes.position.needsUpdate = true;
      } else {
        plasmaSparksRef.current.visible = false;
      }
    }

    // Parachute dynamic aerodynamic flutter
    if (parachuteRef.current) {
      if (flightPhase === 'EDL_PARACHUTE') {
        parachuteRef.current.visible = true;
        parachuteRef.current.rotation.z = Math.sin(time * 16) * 0.04;
        parachuteRef.current.rotation.x = Math.cos(time * 18) * 0.035;
      } else if (
        flightPhase === 'EDL_POWERED_DESCENT' ||
        flightPhase === 'EDL_SKYCRANE' ||
        flightPhase === 'EDL_TOUCHDOWN'
      ) {
        parachuteRef.current.visible = true;
        parachuteRef.current.position.y += delta * 24;
        parachuteRef.current.position.z -= delta * 16;
        parachuteRef.current.rotation.z += delta * 0.35;
      } else {
        parachuteRef.current.visible = false;
      }
    }

    // Heat Shield Jettison
    if (heatShieldRef.current) {
      if (flightPhase === 'EDL_PARACHUTE') {
        heatShieldRef.current.visible = true;
        const dropDist = t * 85;
        heatShieldRef.current.position.set(0, -dropDist, 0);
        heatShieldRef.current.rotation.x = t * 2.8;
        heatShieldRef.current.rotation.z = t * 2.0;
      } else if (flightPhase === 'EDL_ENTRY') {
        heatShieldRef.current.visible = true;
        heatShieldRef.current.position.set(0, 0, 0);
        heatShieldRef.current.rotation.set(0, 0, 0);
      } else {
        heatShieldRef.current.visible = false;
      }
    }

    // Backshell Separation
    if (backshellRef.current) {
      if (flightPhase === 'EDL_ENTRY' || flightPhase === 'EDL_PARACHUTE') {
        backshellRef.current.visible = true;
        backshellRef.current.position.set(0, 0, 0);
      } else if (flightPhase === 'EDL_POWERED_DESCENT') {
        backshellRef.current.visible = true;
        backshellRef.current.position.y += delta * 18;
        backshellRef.current.position.z -= delta * 9;
      } else {
        backshellRef.current.visible = false;
      }
    }

    // Sky Crane & Rover Physics based on Subphase
    let currentRigY = 130;
    let cameraShake = 0;
    let roverTetherDrop = 0;

    if (flightPhase === 'EDL_ENTRY') {
      currentRigY = 260 - t * 130;
      cameraShake = 0.18; // Violent 12G atmospheric buffeting
    } else if (flightPhase === 'EDL_PARACHUTE') {
      currentRigY = 130 - t * 65;
      cameraShake = t < 0.2 ? 0.24 : 0.05;
    } else if (flightPhase === 'EDL_POWERED_DESCENT') {
      currentRigY = 65 - t * 45;
      cameraShake = 0.04;
    } else if (flightPhase === 'EDL_SKYCRANE') {
      currentRigY = groundY + 20.0;
      cameraShake = 0.02;

      const maxDrop = 20.0 - 0.64;
      roverTetherDrop = THREE.MathUtils.smoothstep(t, 0.1, 0.95) * maxDrop;

      // Update bridle lines dynamically
      if (bridleLineSegments) {
        const pts: THREE.Vector3[] = [];
        const rAttachments = [
          new THREE.Vector3(0, -roverTetherDrop + 0.4, 1.15),
          new THREE.Vector3(-0.95, -roverTetherDrop + 0.4, -0.95),
          new THREE.Vector3(0.95, -roverTetherDrop + 0.4, -0.95),
        ];
        rAttachments.forEach((apt) => {
          pts.push(new THREE.Vector3(apt.x * 0.35, -0.4, apt.z * 0.35));
          pts.push(apt);
        });
        bridleLineSegments.geometry.setFromPoints(pts);
      }
    } else if (flightPhase === 'EDL_TOUCHDOWN') {
      roverTetherDrop = 20.0 - 0.64;

      // Sky Crane Flyaway: Accelerates away and crashes safely
      if (skyCraneRef.current) {
        const flyTime = phaseElapsed;
        const flyawayX = flyTime * flyTime * 14.0;
        const flyawayY = groundY + 20.0 + flyTime * flyTime * 9.0;
        const flyawayZ = flyTime * flyTime * 18.0;

        skyCraneRef.current.position.set(flyawayX, flyawayY, flyawayZ);
        skyCraneRef.current.rotation.z = -0.72;
        skyCraneRef.current.rotation.x = -0.52;
      }

      // Pyrotechnic Cable Cut Sparks
      if (cableSparksRef.current) {
        cableSparksRef.current.visible = phaseElapsed < 1.8;
        if (phaseElapsed < 1.8) {
          const cPos = cableSparksRef.current.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < cableSparksCount; i++) {
            const cd = cableSparksData[i];
            cPos[i * 3] += cd.vx * delta;
            cPos[i * 3 + 1] += cd.vy * delta - 9.8 * delta * delta;
            cPos[i * 3 + 2] += cd.vz * delta;
          }
          cableSparksRef.current.geometry.attributes.position.needsUpdate = true;
        }
      }
    }

    // Apply rig position
    if (edlGroupRef.current) {
      if (flightPhase !== 'EDL_TOUCHDOWN') {
        edlGroupRef.current.position.set(TOUCHDOWN_X, currentRigY, TOUCHDOWN_Z);
      }
    }

    // Hydrazine Retro-Thruster Plumes animated flicker
    if (thrusterPlumesRef.current) {
      const isFiring =
        flightPhase === 'EDL_POWERED_DESCENT' ||
        flightPhase === 'EDL_SKYCRANE' ||
        flightPhase === 'EDL_TOUCHDOWN';
      thrusterPlumesRef.current.visible = isFiring;
      if (isFiring) {
        const plumeScale =
          flightPhase === 'EDL_TOUCHDOWN' ? 2.4 : 1.0 + Math.sin(time * 50) * 0.16;
        thrusterPlumesRef.current.scale.set(plumeScale, plumeScale * 1.35, plumeScale);
      }
    }

    // Dynamic ground thruster blast lighting
    if (groundBlastLightRef.current) {
      const isBlastActive =
        flightPhase === 'EDL_POWERED_DESCENT' ||
        flightPhase === 'EDL_SKYCRANE' ||
        flightPhase === 'EDL_TOUCHDOWN';
      groundBlastLightRef.current.intensity = isBlastActive
        ? 65.0 + Math.sin(time * 45) * 18.0
        : 0;
    }

    // Dynamic 3-point bridle cables + umbilical extending to lowered rover
    if (bridleLineRef.current) {
      const bPos = bridleLineRef.current.geometry.attributes.position.array as Float32Array;
      const currentRoverY = flightPhase === 'EDL_TOUCHDOWN' ? -19.36 : roverYOffset;
      const topAttachments = [
        [0, -0.3, 0.4],
        [-0.45, -0.3, -0.35],
        [0.45, -0.3, -0.35],
        [0.1, -0.3, 0], // umbilical top
      ];
      const botAttachments = [
        [0, currentRoverY + 0.45, 1.15],
        [-0.95, currentRoverY + 0.45, -0.95],
        [0.95, currentRoverY + 0.45, -0.95],
        [0.2, currentRoverY + 0.45, 0.1], // umbilical bottom
      ];

      for (let i = 0; i < 4; i++) {
        bPos[i * 6] = topAttachments[i][0];
        bPos[i * 6 + 1] = topAttachments[i][1];
        bPos[i * 6 + 2] = topAttachments[i][2];
        bPos[i * 6 + 3] = botAttachments[i][0];
        bPos[i * 6 + 4] = botAttachments[i][1];
        bPos[i * 6 + 5] = botAttachments[i][2];
      }
      bridleLineRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Realistic Ground Regolith Dust Swirl during Hover
    if (groundDustPointsRef.current) {
      const isDustActive = flightPhase === 'EDL_SKYCRANE' || flightPhase === 'EDL_TOUCHDOWN';
      groundDustPointsRef.current.visible = isDustActive;

      if (isDustActive) {
        const dPos = groundDustPointsRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < groundDustCount; i++) {
          const dd = dustData[i];
          dd.life = (dd.life + delta * 0.8) % 1.0;
          dd.r += dd.vr * delta;
          dd.angle += delta * 1.8;

          dPos[i * 3] = TOUCHDOWN_X + Math.cos(dd.angle) * dd.r;
          dPos[i * 3 + 1] = groundY + Math.sin(dd.life * Math.PI) * dd.vy;
          dPos[i * 3 + 2] = TOUCHDOWN_Z + Math.sin(dd.angle) * dd.r;

          if (dd.r > 24.0) {
            dd.r = 1.8 + Math.random() * 4.0;
          }
        }
        groundDustPointsRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }

    // Camera Director
    const shakeX = (Math.random() - 0.5) * cameraShake;
    const shakeY = (Math.random() - 0.5) * cameraShake;

    if (cameraAngle === 'onboard') {
      camera.position.set(TOUCHDOWN_X + 0.6, currentRigY - 1.4, TOUCHDOWN_Z);
      camera.lookAt(TOUCHDOWN_X, groundY, TOUCHDOWN_Z);
    } else if (cameraAngle === 'tracking') {
      camera.position.set(TOUCHDOWN_X + 26, Math.max(groundY + 9, currentRigY * 0.55), TOUCHDOWN_Z + 32);
      camera.lookAt(TOUCHDOWN_X, currentRigY, TOUCHDOWN_Z);
    } else {
      if (flightPhase === 'EDL_ENTRY') {
        camera.position.set(TOUCHDOWN_X + 14 + shakeX, currentRigY + 7 + shakeY, TOUCHDOWN_Z + 16);
        camera.lookAt(TOUCHDOWN_X, currentRigY, TOUCHDOWN_Z);
      } else if (flightPhase === 'EDL_PARACHUTE') {
        camera.position.set(TOUCHDOWN_X + 9 + shakeX, currentRigY - 14 + shakeY, TOUCHDOWN_Z + 9);
        camera.lookAt(TOUCHDOWN_X, currentRigY + 16, TOUCHDOWN_Z);
      } else if (flightPhase === 'EDL_POWERED_DESCENT') {
        camera.position.set(TOUCHDOWN_X - 18 + shakeX, currentRigY + 5 + shakeY, TOUCHDOWN_Z + 20);
        camera.lookAt(TOUCHDOWN_X, currentRigY, TOUCHDOWN_Z);
      } else if (flightPhase === 'EDL_SKYCRANE') {
        camera.position.set(TOUCHDOWN_X + 15 + shakeX, groundY + 3.4 + shakeY, TOUCHDOWN_Z + 13);
        camera.lookAt(TOUCHDOWN_X, groundY + (20.0 - roverTetherDrop) * 0.5, TOUCHDOWN_Z);
      } else if (flightPhase === 'EDL_TOUCHDOWN') {
        const targetCamPos = new THREE.Vector3(TOUCHDOWN_X, targetChassisY + 2.1, TOUCHDOWN_Z - 6.8);
        camera.position.lerp(targetCamPos, delta * 3.2);
        camera.lookAt(TOUCHDOWN_X, targetChassisY + 1.1, TOUCHDOWN_Z + 6.0);
      }
    }
  });

  const roverYOffset = -THREE.MathUtils.smoothstep(phaseProgress, 0.1, 0.95) * (20.0 - 0.64);
  const mastProgress = flightPhase === 'EDL_TOUCHDOWN' ? Math.min(1.0, phaseElapsed * 0.4) : 0.0;

  return (
    <group>
      {/* High-Altitude Entry Mars Horizon (Official NASA Mars 3D Model 24881_Mars_1_6792.usdz) */}
      {flightPhase === 'EDL_ENTRY' && (
        <MarsPlanetModel
          radius={480}
          position={[TOUCHDOWN_X, -490, TOUCHDOWN_Z]}
          rotation={[0.15, 0.4, 0.44]}
          atmosphere={true}
          atmosphereScale={1.035}
          rotationSpeed={0.005}
        />
      )}

      {/* Real-world Martian regolith dust particles during Sky Crane hover */}
      <points
        ref={groundDustPointsRef}
        geometry={dustGeo}
        material={materials.groundDustMat}
      />

      {/* Ground Thruster Blast Illumination on Martian surface */}
      <pointLight
        ref={groundBlastLightRef}
        position={[TOUCHDOWN_X, groundY + 1.2, TOUCHDOWN_Z]}
        color="#ea580c"
        distance={45}
        decay={1.5}
        intensity={0}
      />

      {/* Pyrotechnic Cable Cut Sparks */}
      <points
        ref={cableSparksRef}
        geometry={cableSparksGeo}
        material={materials.cableSparkMat}
        visible={false}
      />

      {/* Main EDL Descent Rig Group */}
      <group ref={edlGroupRef} position={[TOUCHDOWN_X, 130, TOUCHDOWN_Z]}>
        {/* ================= SUPERSONIC DISK-GAP-BAND PARACHUTE ================= */}
        <group ref={parachuteRef} position={[0, 4.8, 0]}>
          {/* Canopy (Disk-Gap-Band with authentic NASA JPL Binary Pattern) */}
          <group position={[0, 20, 0]}>
            <mesh ref={parachuteCanopyRef}>
              <sphereGeometry args={[7.8, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
              <primitive object={materials.chuteJPLPattern} attach="material" />
            </mesh>
            <mesh position={[0, -2.6, 0]}>
              <cylinderGeometry args={[7.4, 7.4, 1.4, 48, 1, true]} />
              <primitive object={materials.chuteJPLPattern} attach="material" />
            </mesh>
          </group>

          {/* 48 High-Tension Kevlar Suspension Lines */}
          <primitive object={new THREE.LineSegments(chuteCordsGeometry, materials.chuteCords)} />
        </group>

        {/* ================= BACKSHELL 70-DEGREE SPHERE-CONE ================= */}
        <group ref={backshellRef} position={[0, 2.6, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.95, 2.45, 2.6, 48]} />
            <primitive object={materials.backshellWhite} attach="material" />
          </mesh>
        </group>

        {/* ================= HEAT SHIELD (Charred PICA Ablative Tiles) ================= */}
        <group ref={heatShieldRef} position={[0, 0, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[2.48, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.28]} />
            <primitive
              object={
                flightPhase === 'EDL_ENTRY' ? materials.heatShieldHot : materials.heatShieldCold
              }
              attach="material"
            />
          </mesh>
        </group>

        {/* ================= REAL-WORLD HYPERSONIC PLASMA BOW SHOCK ================= */}
        <mesh ref={plasmaShockRef} position={[0, 0.1, 0]}>
          <sphereGeometry args={[2.55, 36, 18, 0, Math.PI * 2, 0, Math.PI * 0.32]} />
          <primitive object={materials.bowShockGlow} attach="material" />
        </mesh>

        {/* Trailing Hypersonic Fire Streamers */}
        <points
          ref={plasmaFirePointsRef}
          geometry={plasmaGeo}
          material={materials.plasmaFireMat}
        />

        {/* Streaming Plasma Sparks / Ablation Embers */}
        <points
          ref={plasmaSparksRef}
          geometry={sparksGeo}
          material={materials.sparkMat}
        />

        {/* ================= POWERED DESCENT VEHICLE (SKY CRANE) ================= */}
        <group ref={skyCraneRef} position={[0, 0, 0]}>
          {/* Main Welded Tubular Titanium Spaceframe Structure with Gold MLI Blankets */}
          <mesh castShadow>
            <cylinderGeometry args={[2.35, 2.35, 0.75, 24, 1, true]} />
            <primitive object={materials.skyCraneKapton} attach="material" />
          </mesh>

          {/* Upper Equipment Deck in Titanium */}
          <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[2.36, 2.36, 0.05, 24]} />
            <primitive object={materials.titaniumTruss} attach="material" />
          </mesh>

          {/* Lower Winch Deck in Titanium */}
          <mesh position={[0, -0.38, 0]}>
            <cylinderGeometry args={[2.36, 2.36, 0.05, 24]} />
            <primitive object={materials.titaniumTruss} attach="material" />
          </mesh>

          {/* Central Bridle Winch Mechanism & Cable Drum */}
          <group position={[0, -0.15, 0]}>
            <mesh>
              <cylinderGeometry args={[0.55, 0.55, 0.5, 24]} />
              <primitive object={materials.titaniumTruss} attach="material" />
            </mesh>
            {/* Pyrotechnic Guillotine Cable Cutter Heads */}
            {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((ang, ci) => (
              <mesh key={ci} position={[Math.sin(ang) * 0.45, -0.25, Math.cos(ang) * 0.45]}>
                <boxGeometry args={[0.15, 0.12, 0.15]} />
                <primitive object={materials.engineBellDark} attach="material" />
              </mesh>
            ))}
          </group>

          {/* 3 Spherical Hydrazine Propellant Tanks in Gold MLI with Retention Bands */}
          {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((ang, ti) => {
            const tx = Math.sin(ang) * 1.35;
            const tz = Math.cos(ang) * 1.35;
            return (
              <group key={ti} position={[tx, 0.3, tz]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.66, 28, 24]} />
                  <primitive object={materials.skyCraneKapton} attach="material" />
                </mesh>
                {/* Structural Retention Band */}
                <mesh>
                  <torusGeometry args={[0.665, 0.02, 12, 28]} />
                  <primitive object={materials.titaniumTruss} attach="material" />
                </mesh>
                {/* Fuel supply manifold tube */}
                <mesh position={[0, -0.65, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
                  <primitive object={materials.titaniumTruss} attach="material" />
                </mesh>
              </group>
            );
          })}

          {/* 2 High-Pressure Helium Pressurant Bottles (COPV Carbon Composite) */}
          <group position={[0.6, 0.65, -0.6]}>
            <mesh castShadow>
              <sphereGeometry args={[0.34, 20, 20]} />
              <primitive object={materials.copvCarbon} attach="material" />
            </mesh>
          </group>
          <group position={[-0.6, 0.65, 0.6]}>
            <mesh castShadow>
              <sphereGeometry args={[0.34, 20, 20]} />
              <primitive object={materials.copvCarbon} attach="material" />
            </mesh>
          </group>

          {/* Terminal Descent Sensor (TDS) Ka-Band Radar Dish Horn pointing downward */}
          <group position={[0, -0.42, 0.9]} rotation={[Math.PI, 0, 0]}>
            <mesh>
              <coneGeometry args={[0.24, 0.35, 16]} />
              <primitive object={materials.titaniumTruss} attach="material" />
            </mesh>
          </group>

          {/* 4 Canted Hydrazine Retro-Thruster Outrigger Pods (8 Mars Lander Engines) */}
          <group ref={thrusterPlumesRef}>
            {[
              { x: 1.95, z: 1.95, rotZ: -0.48, rotX: 0.48 },
              { x: -1.95, z: 1.95, rotZ: 0.48, rotX: 0.48 },
              { x: 1.95, z: -1.95, rotZ: -0.48, rotX: -0.48 },
              { x: -1.95, z: -1.95, rotZ: 0.48, rotX: -0.48 },
            ].map((pod, i) => (
              <group key={i} position={[pod.x, -0.35, pod.z]} rotation={[pod.rotX, 0, pod.rotZ]}>
                {/* Outrigger mounting bracket in Titanium */}
                <mesh position={[0, 0.35, 0]}>
                  <boxGeometry args={[0.7, 0.4, 0.4]} />
                  <primitive object={materials.titaniumTruss} attach="material" />
                </mesh>

                {/* Dual Canted MR-80B Engine Bells */}
                {[-0.22, 0.22].map((nx, ni) => (
                  <group key={ni} position={[nx, 0, 0]}>
                    <mesh castShadow>
                      <cylinderGeometry args={[0.13, 0.36, 0.85, 24, 2, true]} />
                      <primitive object={materials.engineBellDark} attach="material" />
                    </mesh>
                    {/* Engine bell exit rim */}
                    <mesh position={[0, -0.42, 0]}>
                      <torusGeometry args={[0.36, 0.02, 10, 24]} />
                      <primitive object={materials.engineBellDark} attach="material" />
                    </mesh>
                    {/* Incandescent glowing throat ring */}
                    <mesh position={[0, -0.38, 0]}>
                      <cylinderGeometry args={[0.3, 0.3, 0.04, 16]} />
                      <primitive object={materials.engineThroatGlow} attach="material" />
                    </mesh>
                  </group>
                ))}

                {/* Supersonic Hydrazine Exhaust Shock Plume (High-Energy Gaussian Shock Diamond Jet) */}
                <group position={[0, -0.45, 0]}>
                  {/* Outer translucent expanding gas boundary layer with Additive Blending */}
                  <mesh position={[0, -2.4, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.75, 4.8, 32, 1, true]} />
                    <primitive object={materials.hydrazineFlame} attach="material" />
                  </mesh>

                  {/* Inner incandescent core flame */}
                  <mesh position={[0, -1.3, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.3, 2.6, 24, 1, true]} />
                    <primitive object={materials.hydrazineInnerCore} attach="material" />
                  </mesh>

                  {/* 4 Supersonic Mach Shock Diamonds */}
                  {[0.7, 1.7, 2.8, 3.9].map((dy, di) => (
                    <group key={di} position={[0, -dy, 0]}>
                      <mesh rotation={[0, 0, Math.PI / 4]}>
                        <octahedronGeometry args={[0.2 - di * 0.028]} />
                        <primitive object={materials.hydrazineShockDiamond} attach="material" />
                      </mesh>
                      <mesh scale={[1.4, 1.4, 1.4]}>
                        <sphereGeometry args={[0.1, 10, 10]} />
                        <primitive object={materials.hydrazineInnerCore} attach="material" />
                      </mesh>
                    </group>
                  ))}

                  {/* Dynamic point light casting warm radiant thruster flare */}
                  <pointLight color="#f97316" intensity={20} distance={28} decay={1.6} position={[0, -0.5, 0]} />
                </group>
              </group>
            ))}
          </group>

          {/* TRN Downward Terrain Relative Navigation Laser Radar (Subtle scanning pulse) */}
          <primitive object={trnLaserLine} />

          {/* Dynamic 3-Point Mechanical Bridles & Electrical Umbilical */}
          {(flightPhase === 'EDL_SKYCRANE' || flightPhase === 'EDL_TOUCHDOWN') && (
            <primitive ref={bridleLineRef} object={bridleLineSegments} />
          )}

          {/* ================= SUSPENDED ROVER MODEL ================= */}
          <group position={[0, flightPhase === 'EDL_TOUCHDOWN' ? -19.36 : roverYOffset, 0]}>
            <RoverModel mastUnstowProgress={mastProgress} />
          </group>
        </group>
      </group>
    </group>
  );
};


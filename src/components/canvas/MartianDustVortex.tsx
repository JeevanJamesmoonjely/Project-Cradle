'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMissionStore } from '@/lib/store/useMissionStore';
import { getTerrainHeight } from '@/lib/physics/terrainHeight';
import { soundEngine } from '@/lib/audio/soundManager';
import {
  getVolumetricDustPuffTexture,
  applyCircularPointShader,
} from '@/lib/graphics/particleTextures';

/**
 * Photorealistic Towering Volumetric Martian Dust Vortex (Dust Devil)
 *
 * Modeled strictly after NASA Perseverance Navcam, Mastcam-Z, and HiRISE satellite observations:
 * 1. Realistic Appearance:
 *    - Tapered vertical geometry: narrow ground suction foot (1.8 - 2.5m) expanding into a towering,
 *      turbulent, billowing 85m+ funnel of swirling oxidized ferric dust (matching NASA surface photos).
 *    - Authentic Martian color palette: smoky burnt umber, deep ferric terracotta, oxidized basalt, and sunlit ochre.
 *    - Sinuous undulating spine tilted by aerodynamic wind drag.
 *    - Secondary distant horizon vortex roaming the Jezero Crater floor for planetary atmospheric depth.
 * 2. Scientific Spawn & Dissipation Physics:
 *    - Formed strictly during daytime convective heating (peaking 12:00 PM to 3:00 PM local solar time).
 *    - Suppressed at night (stable radiative cooling) and during thick global/regional dust storms (solar shading).
 * 3. Atmospheric Audio:
 *    - Pleasant, high-tech NASA telemetry advisory chime (no disturbing/jarring buzzer alarms).
 *    - Real-time 3D low-frequency atmospheric wind vortex roar & regolith suction scaling smoothly with proximity.
 */
export const MartianDustVortex: React.FC = () => {
  const primaryVortexGroup = useRef<THREE.Group>(null);
  const distantVortexGroup = useRef<THREE.Group>(null);

  const skirtPointsRef = useRef<THREE.Points>(null);
  const corePointsRef = useRef<THREE.Points>(null);
  const outerPointsRef = useRef<THREE.Points>(null);
  const distantPointsRef = useRef<THREE.Points>(null);

  const vortexIntensity = useRef(0.0); // Smooth fade in/out scalar (0 = dissipated, 1 = fully formed)

  const roverPos = useMissionStore((s) => s.rover.position);
  const dustDevilActive = useMissionStore((s) => s.env.dustDevilActive);
  const windSpeedMs = useMissionStore((s) => s.env.windSpeedMs);
  const windDirectionDeg = useMissionStore((s) => s.env.windDirectionDeg);
  const setDustDevilProximity = useMissionStore((s) => s.setDustDevilProximity);
  const triggerDustCleaning = useMissionStore((s) => s.triggerDustCleaning);

  // Volumetric Gaussian Dust Puff Texture (Natural alpha falloff, smoky billowing particulate)
  const volumetricPuffTexture = useMemo(() => getVolumetricDustPuffTexture(), []);

  // Photorealistic Martian Dust Palette (Dark ferric shadow core, burnt umber, rich oxidized terracotta)
  const marsPalette = useMemo(
    () => [
      new THREE.Color('#4a1a0c'), // Dense ferric shadow core
      new THREE.Color('#5e2411'), // Dark basalt-hematite dust
      new THREE.Color('#7a3217'), // Deep oxidized terracotta
      new THREE.Color('#943e1c'), // Warm Jezero regolith clay
      new THREE.Color('#ad4b22'), // Mid-level billowing plume
      new THREE.Color('#c45b29'), // Sunlit outer feathery edge
    ],
    []
  );

  const funnelMaxHeight = 84.0; // Towering 84-meter vortex column

  // =========================================================================
  // 1. TIER 1: TIGHT GROUND SUCTION & REGOLITH SALTATION SKIRT (1,400 PARTICLES)
  // =========================================================================
  const skirtCount = 1400;
  const [skirtGeo, skirtMeta] = useMemo(() => {
    const positions = new Float32Array(skirtCount * 3);
    const colors = new Float32Array(skirtCount * 3);
    // [radius, angle, speed, heightY, radialDir]
    const meta = new Float32Array(skirtCount * 5);

    for (let i = 0; i < skirtCount; i++) {
      const r = 1.2 + Math.random() * 8.5; // Compact, realistic ground suction footprint
      const angle = Math.random() * Math.PI * 2;
      const h = 0.05 + Math.random() * 4.2;
      const speed = 10.0 + Math.random() * 14.0;
      const radialDir = Math.random() > 0.3 ? -1.0 : 1.0; // Predominantly sucked inward

      meta[i * 5] = r;
      meta[i * 5 + 1] = angle;
      meta[i * 5 + 2] = speed;
      meta[i * 5 + 3] = h;
      meta[i * 5 + 4] = radialDir;

      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = h;
      positions[i * 3 + 2] = Math.sin(angle) * r;

      const col = marsPalette[Math.floor(Math.random() * marsPalette.length)];
      const variation = 0.85 + Math.random() * 0.25;
      colors[i * 3] = col.r * variation;
      colors[i * 3 + 1] = col.g * variation;
      colors[i * 3 + 2] = col.b * variation;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return [geo, meta];
  }, [marsPalette]);

  const skirtMaterial = useMemo(() => {
    const mat = new THREE.PointsMaterial({
      size: 4.2,
      map: volumetricPuffTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.58,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    applyCircularPointShader(mat);
    return mat;
  }, [volumetricPuffTexture]);

  // =========================================================================
  // 2. TIER 2: HIGH-VELOCITY DENSE EYE-WALL CORE COLUMN (2,800 PARTICLES)
  // =========================================================================
  const coreCount = 2800;
  const [coreGeo, coreMeta] = useMemo(() => {
    const positions = new Float32Array(coreCount * 3);
    const colors = new Float32Array(coreCount * 3);
    // [baseRadius, heightY, currentAngle, liftSpeed, phase]
    const meta = new Float32Array(coreCount * 5);

    for (let i = 0; i < coreCount; i++) {
      const h = Math.random() * funnelMaxHeight;
      const angle = Math.random() * Math.PI * 2;
      const baseR = 0.6 + Math.random() * 2.2;
      const liftSpeed = 18.0 + Math.random() * 16.0; // Rapid updraft
      const phase = Math.random() * Math.PI * 2;

      meta[i * 5] = baseR;
      meta[i * 5 + 1] = h;
      meta[i * 5 + 2] = angle;
      meta[i * 5 + 3] = liftSpeed;
      meta[i * 5 + 4] = phase;

      const normH = h / funnelMaxHeight;
      // Exponential flaring column matching real Mars dust devil photographs
      const r = baseR * (1.0 + Math.pow(normH, 1.35) * 4.6);
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = h;
      positions[i * 3 + 2] = Math.sin(angle) * r;

      const col = marsPalette[Math.floor(Math.random() * marsPalette.length)];
      // Darker core for dense light-blocking smoke appearance
      const coreShadow = 0.75 + Math.random() * 0.25;
      colors[i * 3] = col.r * coreShadow;
      colors[i * 3 + 1] = col.g * coreShadow;
      colors[i * 3 + 2] = col.b * coreShadow;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return [geo, meta];
  }, [marsPalette]);

  const coreMaterial = useMemo(() => {
    const mat = new THREE.PointsMaterial({
      size: 6.8,
      map: volumetricPuffTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.62,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    applyCircularPointShader(mat);
    return mat;
  }, [volumetricPuffTexture]);

  // =========================================================================
  // 3. TIER 3: TOWERING OUTER EXPANSIVE BILLOWING FUNNEL (2,200 PARTICLES)
  // =========================================================================
  const outerCount = 2200;
  const [outerGeo, outerMeta] = useMemo(() => {
    const positions = new Float32Array(outerCount * 3);
    const colors = new Float32Array(outerCount * 3);
    // [baseRadius, heightY, currentAngle, liftSpeed, phase]
    const meta = new Float32Array(outerCount * 5);

    for (let i = 0; i < outerCount; i++) {
      const h = 1.0 + Math.random() * (funnelMaxHeight + 10.0);
      const angle = Math.random() * Math.PI * 2;
      const baseR = 1.8 + Math.random() * 3.6;
      const liftSpeed = 12.0 + Math.random() * 12.0;
      const phase = Math.random() * Math.PI * 2;

      meta[i * 5] = baseR;
      meta[i * 5 + 1] = h;
      meta[i * 5 + 2] = angle;
      meta[i * 5 + 3] = liftSpeed;
      meta[i * 5 + 4] = phase;

      const normH = h / funnelMaxHeight;
      const r = baseR * (1.1 + Math.pow(normH, 1.25) * 5.2);
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = h;
      positions[i * 3 + 2] = Math.sin(angle) * r;

      const col = marsPalette[Math.floor(Math.random() * marsPalette.length)];
      colors[i * 3] = col.r * 0.95;
      colors[i * 3 + 1] = col.g * 0.95;
      colors[i * 3 + 2] = col.b * 0.95;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return [geo, meta];
  }, [marsPalette]);

  const outerMaterial = useMemo(() => {
    const mat = new THREE.PointsMaterial({
      size: 9.6,
      map: volumetricPuffTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.38,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    applyCircularPointShader(mat);
    return mat;
  }, [volumetricPuffTexture]);

  // =========================================================================
  // 4. TIER 4: SECONDARY DISTANT HORIZON DUST DEVIL (800 PARTICLES)
  // =========================================================================
  const distantCount = 800;
  const [distantGeo, distantMeta] = useMemo(() => {
    const positions = new Float32Array(distantCount * 3);
    const colors = new Float32Array(distantCount * 3);
    const meta = new Float32Array(distantCount * 4); // [baseR, h, angle, liftSpeed]

    for (let i = 0; i < distantCount; i++) {
      const h = Math.random() * 92.0;
      const angle = Math.random() * Math.PI * 2;
      const baseR = 1.4 + Math.random() * 3.2;
      const liftSpeed = 14.0 + Math.random() * 12.0;

      meta[i * 4] = baseR;
      meta[i * 4 + 1] = h;
      meta[i * 4 + 2] = angle;
      meta[i * 4 + 3] = liftSpeed;

      const normH = h / 92.0;
      const r = baseR * (1.0 + Math.pow(normH, 1.3) * 4.4);
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = h;
      positions[i * 3 + 2] = Math.sin(angle) * r;

      const col = marsPalette[Math.floor(Math.random() * marsPalette.length)];
      colors[i * 3] = col.r * 0.85;
      colors[i * 3 + 1] = col.g * 0.85;
      colors[i * 3 + 2] = col.b * 0.85;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return [geo, meta];
  }, [marsPalette]);

  const distantMaterial = useMemo(() => {
    const mat = new THREE.PointsMaterial({
      size: 8.8,
      map: volumetricPuffTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.32,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    applyCircularPointShader(mat);
    return mat;
  }, [volumetricPuffTexture]);

  // =========================================================================
  // ANIMATION, DRIFT & AERODYNAMIC PROXIMITY SIMULATION LOOP
  // =========================================================================
  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const dt = Math.min(0.08, delta);

    // Smooth volumetric fade-in / dissipation based on diurnal convective state
    vortexIntensity.current = THREE.MathUtils.lerp(
      vortexIntensity.current,
      dustDevilActive ? 1.0 : 0.0,
      dt * 1.8
    );
    const intensity = vortexIntensity.current;

    // Apply smooth opacity scaling
    skirtMaterial.opacity = 0.58 * intensity;
    coreMaterial.opacity = 0.62 * intensity;
    outerMaterial.opacity = 0.38 * intensity;
    distantMaterial.opacity = 0.32 * intensity;

    const isVisible = intensity > 0.01;
    if (primaryVortexGroup.current) primaryVortexGroup.current.visible = isVisible;
    if (distantVortexGroup.current) distantVortexGroup.current.visible = isVisible;

    if (!isVisible) {
      // Vortex is completely dissipated (night, storm, or winter)
      soundEngine.updateVortexProximitySound(999);
      return;
    }

    // 1. Calculate Primary Vortex Center Tracking across Landscape
    const windRad = (windDirectionDeg * Math.PI) / 180;
    const wanderRadius = 48.0;
    const wanderSpeed = 0.065 + windSpeedMs * 0.014;

    // Primary vortex roams across Jezero Crater floor with MEDA prevailing wind vector
    const vortexLocalX = Math.sin(t * wanderSpeed) * wanderRadius + Math.cos(t * 0.15) * 16.0;
    const vortexLocalZ = Math.cos(t * wanderSpeed * 0.85) * wanderRadius + Math.sin(windRad) * 22.0;

    const vortexWorldX = roverPos[0] + vortexLocalX;
    const vortexWorldZ = roverPos[2] + vortexLocalZ;
    const vortexWorldY = getTerrainHeight(vortexWorldX, vortexWorldZ);

    // Update Proximity to Rover
    const dx = roverPos[0] - vortexWorldX;
    const dz = roverPos[2] - vortexWorldZ;
    const distToRover = Math.sqrt(dx * dx + dz * dz);
    setDustDevilProximity(distToRover, [vortexWorldX, vortexWorldY, vortexWorldZ]);

    // Dynamic 3D Low-Frequency Swirling Vortex Audio
    soundEngine.updateVortexProximitySound(distToRover);

    // Telemetry Alert & Chime Trigger
    if (distToRover < 70.0 && dustDevilActive) {
      soundEngine.playVortexAlert();
    }

    // Rover Solar Panel Dust Sweep Event on direct pass (< 16m)
    if (distToRover < 16.0 && dustDevilActive) {
      triggerDustCleaning();
    }

    // Prevailing wind tilt vector for serpentine undulating spine
    const windTiltX = Math.cos(windRad) * 0.18;
    const windTiltZ = Math.sin(windRad) * 0.18;

    // 2. Position & Animate Primary Towering Vortex
    if (primaryVortexGroup.current) {
      primaryVortexGroup.current.position.set(vortexWorldX, vortexWorldY, vortexWorldZ);

      // Natural atmospheric swaying of column axis
      primaryVortexGroup.current.rotation.x = Math.sin(t * 1.5) * 0.05 + windTiltX * 0.25;
      primaryVortexGroup.current.rotation.z = Math.cos(t * 1.3) * 0.05 + windTiltZ * 0.25;
    }

    // 3. Update Tier 1 Ground Skirt (Inward suction + ejecta)
    if (skirtPointsRef.current) {
      const posAttr = skirtPointsRef.current.geometry.attributes.position as THREE.BufferAttribute;

      for (let i = 0; i < skirtCount; i++) {
        let r = skirtMeta[i * 5];
        let angle = skirtMeta[i * 5 + 1];
        const speed = skirtMeta[i * 5 + 2];
        let h = skirtMeta[i * 5 + 3];
        const radialDir = skirtMeta[i * 5 + 4];

        // Rankine cyclonic spin: intense rotation near the core
        const angularVelocity = (14.0 / (0.8 + r * 0.35)) * speed * 0.14;
        angle += dt * angularVelocity;

        if (radialDir < 0) {
          // Inward rush
          r -= dt * 5.8;
          h += dt * 1.6;
          if (r < 1.2) {
            r = 1.8;
            skirtMeta[i * 5 + 4] = 1.0;
          }
        } else {
          // Outward ejection
          r += dt * 4.2;
          h -= dt * 0.7;
          if (r > 9.0 || h < 0.05) {
            r = 6.0 + Math.random() * 3.0;
            h = 0.1 + Math.random() * 1.2;
            skirtMeta[i * 5 + 4] = -1.0;
          }
        }

        skirtMeta[i * 5] = r;
        skirtMeta[i * 5 + 1] = angle;
        skirtMeta[i * 5 + 3] = h;

        posAttr.setXYZ(i, Math.cos(angle) * r, h, Math.sin(angle) * r);
      }
      posAttr.needsUpdate = true;
    }

    // 4. Update Tier 2 Eye-Wall Core Column (Rapid cyclonic updraft)
    if (corePointsRef.current) {
      const posAttr = corePointsRef.current.geometry.attributes.position as THREE.BufferAttribute;

      for (let i = 0; i < coreCount; i++) {
        const baseR = coreMeta[i * 5];
        let h = coreMeta[i * 5 + 1];
        let angle = coreMeta[i * 5 + 2];
        const liftSpeed = coreMeta[i * 5 + 3];
        const phase = coreMeta[i * 5 + 4];

        // Rapid vertical updraft
        h += dt * liftSpeed;
        if (h > funnelMaxHeight) {
          h = Math.random() * 2.5;
        }
        coreMeta[i * 5 + 1] = h;

        const normH = h / funnelMaxHeight;
        const currentR = baseR * (1.0 + Math.pow(normH, 1.35) * 4.6) + Math.sin(t * 2.6 + phase) * 0.4;

        // Rankine cyclonic velocity
        const angularVelocity = (16.0 / (0.6 + currentR * 0.28)) * (1.0 + (1.0 - normH) * 0.7);
        angle += dt * angularVelocity;
        coreMeta[i * 5 + 2] = angle;

        // Sinuous undulating spine (sinusoidal snake-like bend with altitude matching real wind drag)
        const spineSwayX = Math.sin(normH * Math.PI * 1.5 + t * 1.8) * (normH * 7.5) + normH * 10.0 * windTiltX;
        const spineSwayZ = Math.cos(normH * Math.PI * 1.2 + t * 1.5) * (normH * 6.0) + normH * 10.0 * windTiltZ;

        const px = Math.cos(angle) * currentR + spineSwayX;
        const pz = Math.sin(angle) * currentR + spineSwayZ;

        posAttr.setXYZ(i, px, h, pz);
      }
      posAttr.needsUpdate = true;
    }

    // 5. Update Tier 3 Towering Outer Billowing Cloud (Volumetric churning plume)
    if (outerPointsRef.current) {
      const posAttr = outerPointsRef.current.geometry.attributes.position as THREE.BufferAttribute;

      for (let i = 0; i < outerCount; i++) {
        const baseR = outerMeta[i * 5];
        let h = outerMeta[i * 5 + 1];
        let angle = outerMeta[i * 5 + 2];
        const liftSpeed = outerMeta[i * 5 + 3];
        const phase = outerMeta[i * 5 + 4];

        h += dt * liftSpeed;
        if (h > funnelMaxHeight + 10.0) {
          h = 1.5 + Math.random() * 3.5;
        }
        outerMeta[i * 5 + 1] = h;

        const normH = h / funnelMaxHeight;
        const currentR = baseR * (1.1 + Math.pow(normH, 1.25) * 5.2) + Math.cos(t * 1.9 + phase) * 0.7;

        // Outer swirling circulation
        const angularVelocity = 6.2 / (1.2 + currentR * 0.22);
        angle += dt * angularVelocity;
        outerMeta[i * 5 + 2] = angle;

        // Spine sway
        const spineSwayX = Math.sin(normH * Math.PI * 1.5 + t * 1.8) * (normH * 7.5) + normH * 10.0 * windTiltX;
        const spineSwayZ = Math.cos(normH * Math.PI * 1.2 + t * 1.5) * (normH * 6.0) + normH * 10.0 * windTiltZ;

        const px = Math.cos(angle) * currentR + spineSwayX;
        const pz = Math.sin(angle) * currentR + spineSwayZ;

        posAttr.setXYZ(i, px, h, pz);
      }
      posAttr.needsUpdate = true;
    }

    // 6. Update Tier 4 Secondary Distant Horizon Dust Devil (~125m away on the plain)
    if (distantPointsRef.current && distantVortexGroup.current) {
      const distAngle = t * 0.024 + 1.2;
      const distDist = 125.0;
      const distX = roverPos[0] + Math.cos(distAngle) * distDist;
      const distZ = roverPos[2] + Math.sin(distAngle) * distDist;
      const distY = getTerrainHeight(distX, distZ);

      distantVortexGroup.current.position.set(distX, distY, distZ);

      const posAttr = distantPointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < distantCount; i++) {
        const baseR = distantMeta[i * 4];
        let h = distantMeta[i * 4 + 1];
        let angle = distantMeta[i * 4 + 2];
        const liftSpeed = distantMeta[i * 4 + 3];

        h += dt * liftSpeed;
        if (h > 92.0) h = Math.random() * 4.0;
        distantMeta[i * 4 + 1] = h;

        const normH = h / 92.0;
        const currentR = baseR * (1.0 + Math.pow(normH, 1.3) * 4.4);
        angle += dt * (5.0 / (0.8 + currentR * 0.25));
        distantMeta[i * 4 + 2] = angle;

        posAttr.setXYZ(i, Math.cos(angle) * currentR, h, Math.sin(angle) * currentR);
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <>
      {/* 1. PRIMARY REALISTIC TOWERING MARTIAN DUST DEVIL */}
      <group ref={primaryVortexGroup}>
        {/* Tier 1: Tight Ground Regolith Suction Skirt */}
        <points
          ref={skirtPointsRef}
          geometry={skirtGeo}
          material={skirtMaterial}
        />

        {/* Tier 2: High-Velocity Dense Eye-Wall Core Column */}
        <points
          ref={corePointsRef}
          geometry={coreGeo}
          material={coreMaterial}
        />

        {/* Tier 3: Towering Outer Billowing Cloud Funnel */}
        <points
          ref={outerPointsRef}
          geometry={outerGeo}
          material={outerMaterial}
        />
      </group>

      {/* 2. SECONDARY DISTANT HORIZON DUST DEVIL (As seen in real Mars surface photos) */}
      <group ref={distantVortexGroup}>
        <points
          ref={distantPointsRef}
          geometry={distantGeo}
          material={distantMaterial}
        />
      </group>
    </>
  );
};

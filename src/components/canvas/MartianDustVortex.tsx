'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMissionStore } from '@/lib/store/useMissionStore';
import { getTerrainHeight } from '@/lib/physics/terrainHeight';
import {
  getVolumetricDustPuffTexture,
  applyCircularPointShader,
} from '@/lib/graphics/particleTextures';

/**
 * Photorealistic Volumetric Martian Dust Vortex (Dust Devil / Sandstorm Funnel)
 *
 * Modeled strictly after NASA Perseverance Navcam & HiRISE satellite observations in Jezero Crater:
 * 1. Zero polygon cylinders or cones — 100% volumetric, soft-edged Gaussian billowing particle clouds.
 * 2. Multi-tier physics architecture:
 *    - Tier 1: Violent Ground Saltation & Ejecta Skirt (1,600 regolith particles rushing inward and flinging outward)
 *    - Tier 2: High-velocity Eye-Wall Core (2,400 particles in tight cyclonic updraft with serpentine swaying spine)
 *    - Tier 3: Towering Outer Billowing Funnel (1,800 expansive dust billows expanding to 85m+ altitude)
 *    - Tier 4: Faint Distant Horizon Dust Column (600 particles roaming Jezero crater rim)
 * 3. Authentic ferric oxide terracotta & oxidized basalt ochre coloration.
 * 4. Ground elevation contour clamping & real-time aerodynamic wind drift.
 */
export const MartianDustVortex: React.FC = () => {
  const primaryVortexGroup = useRef<THREE.Group>(null);
  const distantVortexGroup = useRef<THREE.Group>(null);

  const skirtPointsRef = useRef<THREE.Points>(null);
  const corePointsRef = useRef<THREE.Points>(null);
  const outerPointsRef = useRef<THREE.Points>(null);
  const distantPointsRef = useRef<THREE.Points>(null);

  const roverPos = useMissionStore((s) => s.rover.position);
  const dustDevilActive = useMissionStore((s) => s.env.dustDevilActive);
  const windSpeedMs = useMissionStore((s) => s.env.windSpeedMs);
  const windDirectionDeg = useMissionStore((s) => s.env.windDirectionDeg);
  const setDustDevilProximity = useMissionStore((s) => s.setDustDevilProximity);
  const triggerDustCleaning = useMissionStore((s) => s.triggerDustCleaning);

  // Volumetric Gaussian Dust Puff Texture (Earthy, non-luminous, natural alpha falloff)
  const volumetricPuffTexture = useMemo(() => getVolumetricDustPuffTexture(), []);

  // Natural Mars Dust Palette (Ferric oxides, hematite, oxidized clay, pulverized basalt)
  const marsPalette = useMemo(
    () => [
      new THREE.Color('#c2511e'), // Rich hematite terracotta
      new THREE.Color('#b44618'), // Dense ferric ochre
      new THREE.Color('#9c3a14'), // Deep oxidized clay
      new THREE.Color('#d9722a'), // Sun-illuminated silicate dust
      new THREE.Color('#7c2d12'), // Dark basalt sand
      new THREE.Color('#8f3b17'), // Weathered regolith
    ],
    []
  );

  const funnelMaxHeight = 88.0;

  // =========================================================================
  // 1. TIER 1: GROUND EJECTA & SALTATION SKIRT (1,600 PARTICLES)
  // =========================================================================
  const skirtCount = 1600;
  const [skirtGeo, skirtMeta] = useMemo(() => {
    const positions = new Float32Array(skirtCount * 3);
    const colors = new Float32Array(skirtCount * 3);
    // [radius, angle, speed, heightY, radialDir]
    const meta = new Float32Array(skirtCount * 5);

    for (let i = 0; i < skirtCount; i++) {
      const r = 1.5 + Math.random() * 21.0;
      const angle = Math.random() * Math.PI * 2;
      const h = Math.random() * 6.5;
      const speed = 7.0 + Math.random() * 9.0;
      const radialDir = Math.random() > 0.35 ? -1.0 : 1.0; // majority sucked inward, some ejected

      meta[i * 5] = r;
      meta[i * 5 + 1] = angle;
      meta[i * 5 + 2] = speed;
      meta[i * 5 + 3] = h;
      meta[i * 5 + 4] = radialDir;

      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = h;
      positions[i * 3 + 2] = Math.sin(angle) * r;

      const col = marsPalette[Math.floor(Math.random() * marsPalette.length)];
      const variation = 0.85 + Math.random() * 0.3;
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
      size: 2.6,
      map: volumetricPuffTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.52,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    applyCircularPointShader(mat);
    return mat;
  }, [volumetricPuffTexture]);

  // =========================================================================
  // 2. TIER 2: HIGH-VELOCITY EYE-WALL CORE COLUMN (2,400 PARTICLES)
  // =========================================================================
  const coreCount = 2400;
  const [coreGeo, coreMeta] = useMemo(() => {
    const positions = new Float32Array(coreCount * 3);
    const colors = new Float32Array(coreCount * 3);
    // [baseRadius, heightY, currentAngle, liftSpeed, phase]
    const meta = new Float32Array(coreCount * 5);

    for (let i = 0; i < coreCount; i++) {
      const h = Math.random() * funnelMaxHeight;
      const angle = Math.random() * Math.PI * 2;
      const baseR = 0.8 + Math.random() * 3.2;
      const liftSpeed = 16.0 + Math.random() * 16.0;
      const phase = Math.random() * Math.PI * 2;

      meta[i * 5] = baseR;
      meta[i * 5 + 1] = h;
      meta[i * 5 + 2] = angle;
      meta[i * 5 + 3] = liftSpeed;
      meta[i * 5 + 4] = phase;

      const normH = h / funnelMaxHeight;
      const r = baseR * (1.0 + Math.pow(normH, 1.3) * 3.4);
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = h;
      positions[i * 3 + 2] = Math.sin(angle) * r;

      const col = marsPalette[Math.floor(Math.random() * marsPalette.length)];
      const variation = 0.9 + Math.random() * 0.25;
      colors[i * 3] = col.r * variation;
      colors[i * 3 + 1] = col.g * variation;
      colors[i * 3 + 2] = col.b * variation;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return [geo, meta];
  }, [marsPalette]);

  const coreMaterial = useMemo(() => {
    const mat = new THREE.PointsMaterial({
      size: 3.4,
      map: volumetricPuffTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.44,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    applyCircularPointShader(mat);
    return mat;
  }, [volumetricPuffTexture]);

  // =========================================================================
  // 3. TIER 3: TOWERING OUTER BILLOWING FUNNEL (1,800 PARTICLES)
  // =========================================================================
  const outerCount = 1800;
  const [outerGeo, outerMeta] = useMemo(() => {
    const positions = new Float32Array(outerCount * 3);
    const colors = new Float32Array(outerCount * 3);
    // [baseRadius, heightY, currentAngle, liftSpeed, phase]
    const meta = new Float32Array(outerCount * 5);

    for (let i = 0; i < outerCount; i++) {
      const h = 2.0 + Math.random() * (funnelMaxHeight + 12.0);
      const angle = Math.random() * Math.PI * 2;
      const baseR = 2.4 + Math.random() * 4.6;
      const liftSpeed = 10.0 + Math.random() * 12.0;
      const phase = Math.random() * Math.PI * 2;

      meta[i * 5] = baseR;
      meta[i * 5 + 1] = h;
      meta[i * 5 + 2] = angle;
      meta[i * 5 + 3] = liftSpeed;
      meta[i * 5 + 4] = phase;

      const normH = h / funnelMaxHeight;
      const r = baseR * (1.2 + Math.pow(normH, 1.15) * 4.2);
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = h;
      positions[i * 3 + 2] = Math.sin(angle) * r;

      const col = marsPalette[Math.floor(Math.random() * marsPalette.length)];
      // Slightly hazier, softer ambient dust
      colors[i * 3] = col.r * 0.92;
      colors[i * 3 + 1] = col.g * 0.92;
      colors[i * 3 + 2] = col.b * 0.92;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return [geo, meta];
  }, [marsPalette]);

  const outerMaterial = useMemo(() => {
    const mat = new THREE.PointsMaterial({
      size: 4.8,
      map: volumetricPuffTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.28,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    applyCircularPointShader(mat);
    return mat;
  }, [volumetricPuffTexture]);

  // =========================================================================
  // 4. TIER 4: DISTANT HORIZON DUST DEVIL (600 PARTICLES)
  // =========================================================================
  const distantCount = 600;
  const [distantGeo, distantMeta] = useMemo(() => {
    const positions = new Float32Array(distantCount * 3);
    const colors = new Float32Array(distantCount * 3);
    const meta = new Float32Array(distantCount * 4); // [baseR, h, angle, liftSpeed]

    for (let i = 0; i < distantCount; i++) {
      const h = Math.random() * 95.0;
      const angle = Math.random() * Math.PI * 2;
      const baseR = 1.5 + Math.random() * 3.5;
      const liftSpeed = 12.0 + Math.random() * 10.0;

      meta[i * 4] = baseR;
      meta[i * 4 + 1] = h;
      meta[i * 4 + 2] = angle;
      meta[i * 4 + 3] = liftSpeed;

      const normH = h / 95.0;
      const r = baseR * (1.0 + normH * 3.2);
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = h;
      positions[i * 3 + 2] = Math.sin(angle) * r;

      const col = marsPalette[Math.floor(Math.random() * marsPalette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return [geo, meta];
  }, [marsPalette]);

  const distantMaterial = useMemo(() => {
    const mat = new THREE.PointsMaterial({
      size: 6.2,
      map: volumetricPuffTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.22,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    applyCircularPointShader(mat);
    return mat;
  }, [volumetricPuffTexture]);

  // =========================================================================
  // ANIMATION & AERODYNAMIC REVOLUTION LOOP
  // =========================================================================
  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    // 1. Calculate Primary Vortex Center Tracking across Landscape
    const windRad = (windDirectionDeg * Math.PI) / 180;
    const wanderRadius = 46.0;
    const wanderSpeed = 0.07 + windSpeedMs * 0.012;

    // Drifts around rover sector with prevailing MEDA wind bias
    const vortexLocalX = Math.sin(t * wanderSpeed) * wanderRadius + Math.cos(t * 0.16) * 14.0;
    const vortexLocalZ = Math.cos(t * wanderSpeed * 0.82) * wanderRadius + Math.sin(windRad) * 20.0;

    const vortexWorldX = roverPos[0] + vortexLocalX;
    const vortexWorldZ = roverPos[2] + vortexLocalZ;
    const vortexWorldY = getTerrainHeight(vortexWorldX, vortexWorldZ);

    // Update Proximity to Rover for physics & telemetry alerts
    const dx = roverPos[0] - vortexWorldX;
    const dz = roverPos[2] - vortexWorldZ;
    const distToRover = Math.sqrt(dx * dx + dz * dz);
    setDustDevilProximity(distToRover, [vortexWorldX, vortexWorldY, vortexWorldZ]);

    // Rover Solar Panel Cleaning Event on direct pass (<16m)
    if (distToRover < 16.0 && dustDevilActive) {
      triggerDustCleaning();
    }

    // Prevailing wind tilt vector for serpentine undulating spine
    const windTiltX = Math.cos(windRad) * 0.12;
    const windTiltZ = Math.sin(windRad) * 0.12;

    // 2. Position & Animate Primary Towering Vortex
    if (primaryVortexGroup.current) {
      primaryVortexGroup.current.position.set(vortexWorldX, vortexWorldY, vortexWorldZ);
      primaryVortexGroup.current.visible = dustDevilActive;

      // Natural atmospheric swaying of column axis
      primaryVortexGroup.current.rotation.x = Math.sin(t * 1.6) * 0.04 + windTiltX * 0.2;
      primaryVortexGroup.current.rotation.z = Math.cos(t * 1.4) * 0.04 + windTiltZ * 0.2;
    }

    // 3. Update Tier 1 Ground Skirt (Inward saltation + ejection)
    if (skirtPointsRef.current && dustDevilActive) {
      const posAttr = skirtPointsRef.current.geometry.attributes.position as THREE.BufferAttribute;

      for (let i = 0; i < skirtCount; i++) {
        let r = skirtMeta[i * 5];
        let angle = skirtMeta[i * 5 + 1];
        const speed = skirtMeta[i * 5 + 2];
        let h = skirtMeta[i * 5 + 3];
        const radialDir = skirtMeta[i * 5 + 4];

        // Angular spin: higher near the center (Rankine vortex)
        const angularVelocity = (12.0 / (1.0 + r * 0.4)) * speed * 0.15;
        angle += delta * angularVelocity;

        // Radial motion
        if (radialDir < 0) {
          // Rush inward towards center
          r -= delta * 5.2;
          h += delta * 1.4;
          if (r < 1.4) {
            // Reaches eye wall, gets lifted and flinged out
            r = 2.0;
            skirtMeta[i * 5 + 4] = 1.0;
          }
        } else {
          // Spiral outward along the ground
          r += delta * 4.0;
          h -= delta * 0.8;
          if (r > 22.0 || h < 0.1) {
            // Recycle
            r = 14.0 + Math.random() * 8.0;
            h = 0.2 + Math.random() * 1.5;
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
    if (corePointsRef.current && dustDevilActive) {
      const posAttr = corePointsRef.current.geometry.attributes.position as THREE.BufferAttribute;

      for (let i = 0; i < coreCount; i++) {
        const baseR = coreMeta[i * 5];
        let h = coreMeta[i * 5 + 1];
        let angle = coreMeta[i * 5 + 2];
        const liftSpeed = coreMeta[i * 5 + 3];
        const phase = coreMeta[i * 5 + 4];

        // Upward lift
        h += delta * liftSpeed;
        if (h > funnelMaxHeight) {
          // Recycle to ground
          h = Math.random() * 3.5;
        }
        coreMeta[i * 5 + 1] = h;

        const normH = h / funnelMaxHeight;
        const currentR = baseR * (1.0 + Math.pow(normH, 1.3) * 3.4) + Math.sin(t * 2.5 + phase) * 0.35;

        // Rankine cyclonic velocity (intense spin near center)
        const angularVelocity = (14.0 / (0.8 + currentR * 0.3)) * (1.0 + (1.0 - normH) * 0.6);
        angle += delta * angularVelocity;
        coreMeta[i * 5 + 2] = angle;

        // Serpentine undulating spine (sinusoidal snake-like bend with altitude)
        const spineSwayX = Math.sin(normH * Math.PI * 1.6 + t * 2.0) * (normH * 5.8) + normH * 6.0 * windTiltX;
        const spineSwayZ = Math.cos(normH * Math.PI * 1.3 + t * 1.7) * (normH * 4.6) + normH * 6.0 * windTiltZ;

        const px = Math.cos(angle) * currentR + spineSwayX;
        const pz = Math.sin(angle) * currentR + spineSwayZ;

        posAttr.setXYZ(i, px, h, pz);
      }
      posAttr.needsUpdate = true;
    }

    // 5. Update Tier 3 Towering Outer Billowing Cloud (Billowy atmospheric envelope)
    if (outerPointsRef.current && dustDevilActive) {
      const posAttr = outerPointsRef.current.geometry.attributes.position as THREE.BufferAttribute;

      for (let i = 0; i < outerCount; i++) {
        const baseR = outerMeta[i * 5];
        let h = outerMeta[i * 5 + 1];
        let angle = outerMeta[i * 5 + 2];
        const liftSpeed = outerMeta[i * 5 + 3];
        const phase = outerMeta[i * 5 + 4];

        h += delta * liftSpeed;
        if (h > funnelMaxHeight + 12.0) {
          h = 2.0 + Math.random() * 4.0;
        }
        outerMeta[i * 5 + 1] = h;

        const normH = h / funnelMaxHeight;
        const currentR = baseR * (1.2 + Math.pow(normH, 1.15) * 4.2) + Math.cos(t * 1.8 + phase) * 0.6;

        // Outer circulation
        const angularVelocity = 5.5 / (1.5 + currentR * 0.25);
        angle += delta * angularVelocity;
        outerMeta[i * 5 + 2] = angle;

        // Undulation
        const spineSwayX = Math.sin(normH * Math.PI * 1.6 + t * 2.0) * (normH * 5.8) + normH * 6.0 * windTiltX;
        const spineSwayZ = Math.cos(normH * Math.PI * 1.3 + t * 1.7) * (normH * 4.6) + normH * 6.0 * windTiltZ;

        const px = Math.cos(angle) * currentR + spineSwayX;
        const pz = Math.sin(angle) * currentR + spineSwayZ;

        posAttr.setXYZ(i, px, h, pz);
      }
      posAttr.needsUpdate = true;
    }

    // 6. Update Tier 4 Distant Horizon Dust Column (~155m away)
    if (distantPointsRef.current && distantVortexGroup.current) {
      const distAngle = t * 0.022;
      const distDist = 155.0;
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

        h += delta * liftSpeed;
        if (h > 95.0) h = Math.random() * 5.0;
        distantMeta[i * 4 + 1] = h;

        const normH = h / 95.0;
        const currentR = baseR * (1.0 + normH * 3.2);
        angle += delta * (4.0 / (1.0 + currentR * 0.3));
        distantMeta[i * 4 + 2] = angle;

        posAttr.setXYZ(i, Math.cos(angle) * currentR, h, Math.sin(angle) * currentR);
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <>
      {/* 1. PRIMARY REALISTIC VOLUMETRIC MARTIAN DUST DEVIL */}
      <group ref={primaryVortexGroup}>
        {/* Tier 1: Ground Ejecta Skirt */}
        <points
          ref={skirtPointsRef}
          geometry={skirtGeo}
          material={skirtMaterial}
        />

        {/* Tier 2: High-Velocity Eye-Wall Core Column */}
        <points
          ref={corePointsRef}
          geometry={coreGeo}
          material={coreMaterial}
        />

        {/* Tier 3: Towering Outer Billowing Funnel */}
        <points
          ref={outerPointsRef}
          geometry={outerGeo}
          material={outerMaterial}
        />
      </group>

      {/* 2. SECONDARY DISTANT HORIZON DUST DEVIL (Pure soft volumetric billows) */}
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

'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMissionStore } from '@/lib/store/useMissionStore';
import { getDustParticleTexture, applyCircularPointShader } from '@/lib/graphics/particleTextures';

export const AtmosphericDustParticles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const roverPos = useMissionStore((s) => s.rover.position);
  const dustTau = useMissionStore((s) => s.env.dustTau);
  const windSpeedMs = useMissionStore((s) => s.env.windSpeedMs);
  const windDirectionDeg = useMissionStore((s) => s.env.windDirectionDeg);
  const dustDevilActive = useMissionStore((s) => s.env.dustDevilActive);

  const particleCount = 1000;

  // Soft circular dust particle texture
  const dustTexture = useMemo(() => getDustParticleTexture(), []);

  // Dedicated PointsMaterial with procedural circular alpha map + GPU fragment shader discard
  const dustMaterial = useMemo(() => {
    const mat = new THREE.PointsMaterial({
      size: 0.11,
      map: dustTexture,
      transparent: true,
      opacity: 0.65,
      vertexColors: true,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      alphaTest: 0.005,
    });
    // Discard any pixel outside radius 0.5 in gl_PointCoord (ZERO square/cubic pixels)
    applyCircularPointShader(mat);
    return mat;
  }, [dustTexture]);

  const [geo, initialOffsets] = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const offsets = new Float32Array(particleCount * 3);

    // Multi-spectral Martian dust palette (hematite, goethite, basalt, silica)
    const palette = [
      new THREE.Color('#e07a3c'), // warm ferric oxide
      new THREE.Color('#c25e2e'), // deep terracotta
      new THREE.Color('#d98b48'), // golden amber clay
      new THREE.Color('#f5a65b'), // sunlit silica mote
      new THREE.Color('#9e482b'), // oxidized basalt grain
    ];

    for (let i = 0; i < particleCount; i++) {
      // Local bounding volume around rover: 85m x 25m x 85m
      const ox = (Math.random() - 0.5) * 85;
      const oy = Math.random() * 24;
      const oz = (Math.random() - 0.5) * 85;

      offsets[i * 3] = ox;
      offsets[i * 3 + 1] = oy;
      offsets[i * 3 + 2] = oz;

      positions[i * 3] = ox;
      positions[i * 3 + 1] = oy;
      positions[i * 3 + 2] = oz;

      const baseCol = palette[Math.floor(Math.random() * palette.length)];
      const lumVar = 0.85 + Math.random() * 0.3;
      colors[i * 3] = Math.min(1.0, baseCol.r * lumVar);
      colors[i * 3 + 1] = Math.min(1.0, baseCol.g * lumVar);
      colors[i * 3 + 2] = Math.min(1.0, baseCol.b * lumVar);
    }

    const bufferGeo = new THREE.BufferGeometry();
    bufferGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    bufferGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return [bufferGeo, offsets];
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;

    // Dynamically adjust size & opacity with real MEDA dust tau
    if (dustMaterial) {
      dustMaterial.size = 0.09 + dustTau * 0.055;
      dustMaterial.opacity = Math.min(0.85, 0.32 + dustTau * 0.28);
    }

    // Real-data physical wind vector in world coordinates
    const windRad = (windDirectionDeg * Math.PI) / 180;
    const speedScale = 0.6 + windSpeedMs * 0.22;
    const windVx = Math.sin(windRad) * speedScale;
    const windVz = Math.cos(windRad) * speedScale;

    // Convective dust devil vortex center (wandering across plains)
    const vortexX = dustDevilActive ? Math.sin(t * 0.15) * 28 : 999;
    const vortexZ = dustDevilActive ? Math.cos(t * 0.12) * 28 : 999;

    for (let i = 0; i < particleCount; i++) {
      const ox = initialOffsets[i * 3];
      const oy = initialOffsets[i * 3 + 1];
      const oz = initialOffsets[i * 3 + 2];

      // Physical wind drift
      let px = (ox + t * windVx * 6) % 85 - 42.5;
      let py = oy + Math.sin(t * 1.2 + ox * 0.1) * 1.4;
      let pz = (oz + t * windVz * 6) % 85 - 42.5;

      // Dust Devil convective vortex acceleration if in proximity
      if (dustDevilActive) {
        const dx = px - vortexX;
        const dz = pz - vortexZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 18.0) {
          const vortexAngle = Math.atan2(dz, dx) + t * 4.2;
          const vortexLift = (1 - dist / 18.0) * 8.5;
          px = vortexX + Math.cos(vortexAngle) * dist;
          pz = vortexZ + Math.sin(vortexAngle) * dist;
          py = (py + vortexLift) % 24;
        }
      }

      posAttr.setXYZ(
        i,
        roverPos[0] + px,
        Math.max(roverPos[1] - 1.2, roverPos[1] + py),
        roverPos[2] + pz
      );
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geo} material={dustMaterial} />
  );
};

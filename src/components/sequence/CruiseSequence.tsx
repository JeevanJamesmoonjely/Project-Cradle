'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useFlightTimelineStore } from '@/lib/store/useFlightTimelineStore';
import {
  getGoldKaptonTexture,
  getEarthPlanetTexture,
  getHeatShieldTexture,
  getBackshellTexture,
  getSolarCellTexture,
  getAntennaMeshTexture,
} from '@/lib/graphics/spaceflightTextures';
import { getStarParticleTexture, applyCircularPointShader } from '@/lib/graphics/particleTextures';
import { MarsPlanetModel } from '@/components/canvas/MarsPlanetModel';

export const CruiseSequence: React.FC = () => {
  const { camera } = useThree();
  const flightPhase = useFlightTimelineStore((s) => s.flightPhase);
  const phaseProgress = useFlightTimelineStore((s) => s.phaseProgress);
  const cameraAngle = useFlightTimelineStore((s) => s.cameraAngle);

  const spacecraftGroupRef = useRef<THREE.Group>(null);
  const cruiseBusRef = useRef<THREE.Group>(null);
  const aeroshellRef = useRef<THREE.Group>(null);
  const rcsPuffRef = useRef<THREE.Group>(null);
  const earthRef = useRef<THREE.Mesh>(null);

  // Procedural PBR Textures
  const goldKaptonTexture = useMemo(() => getGoldKaptonTexture(), []);
  const earthTexture = useMemo(() => getEarthPlanetTexture(), []);
  const backshellTexture = useMemo(() => getBackshellTexture(), []);
  const heatShieldTexture = useMemo(() => getHeatShieldTexture(false), []);
  const solarCellTexture = useMemo(() => getSolarCellTexture(), []);
  const antennaMeshTexture = useMemo(() => getAntennaMeshTexture(), []);
  const starTexture = useMemo(() => getStarParticleTexture(), []);

  // Dense Starfield with Realistic Astronomical Falloff (2,500 pinpoint stars)
  const starfieldPoints = useMemo(() => {
    const count = 2500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const spectralColors = [
      [1.0, 1.0, 1.0], // White
      [0.8, 0.9, 1.0], // Blue-white
      [1.0, 0.95, 0.85], // Yellow
      [1.0, 0.85, 0.7], // Orange
      [0.7, 0.85, 1.0], // Cyan-blue
    ];

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 480 + Math.random() * 40;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const col = spectralColors[Math.floor(Math.random() * spectralColors.length)];
      const brightness = 0.6 + Math.random() * 0.4;
      colors[i * 3] = col[0] * brightness;
      colors[i * 3 + 1] = col[1] * brightness;
      colors[i * 3 + 2] = col[2] * brightness;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  // Materials
  const materials = useMemo(() => {
    const starMat = new THREE.PointsMaterial({
      size: 2.2,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: true,
      depthWrite: false,
    });
    applyCircularPointShader(starMat);

    return {
      starMat,
      goldKapton: new THREE.MeshStandardMaterial({
        map: goldKaptonTexture,
        metalness: 0.94,
        roughness: 0.22,
        color: '#f59e0b',
      }),
      silverMLI: new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        metalness: 0.92,
        roughness: 0.2,
      }),
      solarCell: new THREE.MeshStandardMaterial({
        map: solarCellTexture,
        metalness: 0.85,
        roughness: 0.18,
      }),
      solarBacking: new THREE.MeshStandardMaterial({
        map: goldKaptonTexture,
        metalness: 0.88,
        roughness: 0.25,
      }),
      solarTruss: new THREE.MeshStandardMaterial({
        color: '#475569',
        metalness: 0.85,
        roughness: 0.25,
      }),
      aeroshellWhite: new THREE.MeshStandardMaterial({
        map: backshellTexture,
        metalness: 0.2,
        roughness: 0.35,
      }),
      heatShieldCarbon: new THREE.MeshStandardMaterial({
        map: heatShieldTexture,
        metalness: 0.15,
        roughness: 0.82,
      }),
      antennaDishGold: new THREE.MeshStandardMaterial({
        map: antennaMeshTexture,
        metalness: 0.95,
        roughness: 0.15,
        color: '#fbbf24',
      }),
      titaniumTank: new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        metalness: 0.92,
        roughness: 0.25,
      }),
      earthMat: new THREE.MeshStandardMaterial({
        map: earthTexture,
        metalness: 0.15,
        roughness: 0.6,
      }),
      orbitArc: new THREE.LineBasicMaterial({
        color: '#06b6d4',
        transparent: true,
        opacity: 0.35,
      }),
      rcsGas: new THREE.MeshBasicMaterial({
        color: '#38bdf8',
        transparent: true,
        opacity: 0.85,
      }),
    };
  }, [goldKaptonTexture, earthTexture, backshellTexture, heatShieldTexture, solarCellTexture, antennaMeshTexture, starTexture]);

  // Keplerian elliptical trajectory curve
  const { trajectoryPoints, curve } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-190, 0, 85),
      new THREE.Vector3(-95, 28, 115),
      new THREE.Vector3(0, 36, 75),
      new THREE.Vector3(95, 22, -25),
      new THREE.Vector3(190, 0, -110),
    ]);
    const sampled = curve.getPoints(120);
    return { trajectoryPoints: sampled, curve };
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const t = phaseProgress;

    // Slow planetary rotation
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.04;

    // Position along orbital transfer curve
    const pathPoint = curve.getPoint(flightPhase === 'CRUISE_TRANSIT' ? t : 0.98);
    const tangent = curve.getTangent(flightPhase === 'CRUISE_TRANSIT' ? t : 0.98);

    if (spacecraftGroupRef.current) {
      spacecraftGroupRef.current.position.copy(pathPoint);

      // Orient spacecraft toward flight vector
      const lookTarget = pathPoint.clone().add(tangent);
      spacecraftGroupRef.current.lookAt(lookTarget);

      // Passive thermal control barbecue roll
      spacecraftGroupRef.current.rotateZ(delta * 0.2);
    }

    // Cold-Gas RCS Thruster puffs
    if (rcsPuffRef.current) {
      const isFiring =
        flightPhase === 'CRUISE_TRANSIT' &&
        ((t > 0.22 && t < 0.27) || (t > 0.52 && t < 0.57) || (t > 0.82 && t < 0.87));
      rcsPuffRef.current.visible = isFiring;
      if (isFiring) {
        const s = 1.0 + Math.sin(time * 45) * 0.35;
        rcsPuffRef.current.scale.set(s, s * 2.2, s);
      }
    }

    // Cruise stage separation
    if (flightPhase === 'CRUISE_SEP') {
      const sepDist = t * 32;
      const sepTumble = t * 0.65;
      if (cruiseBusRef.current) {
        cruiseBusRef.current.position.set(0, 0, -sepDist);
        cruiseBusRef.current.rotation.x = sepTumble;
        cruiseBusRef.current.rotation.y = sepTumble * 0.75;
      }
      if (aeroshellRef.current) {
        aeroshellRef.current.rotation.y = THREE.MathUtils.lerp(0, Math.PI, Math.min(1.0, t * 1.4));
      }
    }

    // Camera perspective
    if (cameraAngle === 'onboard') {
      const camPos = pathPoint.clone().add(new THREE.Vector3(3.2, 1.6, 4.2));
      camera.position.copy(camPos);
      camera.lookAt(pathPoint.clone().add(tangent.clone().multiplyScalar(18)));
    } else if (cameraAngle === 'tracking') {
      camera.position.set(pathPoint.x + 24, pathPoint.y + 15, pathPoint.z + 30);
      camera.lookAt(pathPoint);
    } else {
      // Cinematic orbit with spacecraft always properly illuminated
      const angle = time * 0.18;
      const dist = 11.0;
      camera.position.set(
        pathPoint.x + Math.sin(angle) * dist,
        pathPoint.y + 4.0 + Math.sin(time * 0.12) * 2.5,
        pathPoint.z + Math.cos(angle) * dist
      );
      camera.lookAt(pathPoint);
    }
  });

  return (
    <group>
      {/* High-Fidelity Deep Space Four-Point Astronomical Lighting */}
      <ambientLight intensity={0.5} color="#94a3b8" />
      <directionalLight position={[180, 120, 200]} intensity={4.8} color="#fffbeb" castShadow />
      {/* Delicate Earthshine Fill (Soft cyan-blue from Earth direction) */}
      <directionalLight position={[-180, -40, 80]} intensity={1.4} color="#38bdf8" />
      {/* Forward Marsshine Fill (Warm ferric orange from destination) */}
      <directionalLight position={[180, 20, -100]} intensity={0.9} color="#fb923c" />

      {/* Starfield */}
      <primitive object={new THREE.Points(starfieldPoints, materials.starMat)} />

      {/* Earth */}
      <group position={[-190, 0, 85]}>
        <mesh ref={earthRef}>
          <sphereGeometry args={[20, 48, 48]} />
          <primitive object={materials.earthMat} attach="material" />
        </mesh>
        <mesh scale={[1.06, 1.06, 1.06]}>
          <sphereGeometry args={[20, 32, 32]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.28} side={THREE.BackSide} />
        </mesh>
      </group>

      {/* Official NASA Mars 3D Model (24881_Mars_1_6792.usdz) */}
      <MarsPlanetModel radius={25} position={[190, 0, -110]} rotationSpeed={0.035} atmosphere={true} />

      {/* Keplerian Trajectory (Offset slightly below spacecraft to avoid clipping hull) */}
      <group position={[0, -2.8, 0]}>
        <primitive
          object={
            new THREE.Line(
              new THREE.BufferGeometry().setFromPoints(trajectoryPoints),
              materials.orbitArc
            )
          }
        />
      </group>

      {/* ================= HIGH-DETAIL CRUISE SPACECRAFT ================= */}
      <group ref={spacecraftGroupRef}>
        {/* Conical Aeroshell Capsule */}
        <group ref={aeroshellRef} position={[0, 0, 0.9]}>
          {/* Backshell truncated cone (SLA-561V ablative tile seams & umbilical doors) */}
          <mesh castShadow position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.8, 2.35, 2.6, 64]} />
            <primitive object={materials.aeroshellWhite} attach="material" />
          </mesh>

          {/* Blunt-body PICA Heat Shield (Hexagonal tiles & MEDLI2 sensor ports) */}
          <mesh position={[0, 0, 1.35]}>
            <sphereGeometry args={[2.36, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.28]} />
            <primitive object={materials.heatShieldCarbon} attach="material" />
          </mesh>

          {/* Umbilical Release Mechanism & Balance Ballast Masses */}
          {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ang, ui) => (
            <mesh
              key={ui}
              position={[Math.sin(ang) * 2.36, Math.cos(ang) * 2.36, 0.05]}
              rotation={[0, 0, ang]}
            >
              <boxGeometry args={[0.22, 0.12, 0.35]} />
              <primitive object={materials.silverMLI} attach="material" />
            </mesh>
          ))}
        </group>

        {/* Jettisonable Cruise Stage Assembly */}
        <group ref={cruiseBusRef} position={[0, 0, -0.65]}>
          {/* 48-Segment Circular Bus Frame in Crinkled Golden Kapton MLI */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[2.35, 2.35, 0.9, 48]} />
            <primitive object={materials.goldKapton} attach="material" />
          </mesh>

          {/* Upper Equipment Deck with Silver MLI Blanket */}
          <mesh position={[0, 0, 0.46]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[2.36, 2.36, 0.04, 48]} />
            <primitive object={materials.silverMLI} attach="material" />
          </mesh>

          {/* 2 Spherical Titanium Hydrazine Propellant Tanks */}
          <group position={[0.95, 0.15, 0.75]}>
            <mesh castShadow>
              <sphereGeometry args={[0.55, 32, 24]} />
              <primitive object={materials.titaniumTank} attach="material" />
            </mesh>
            {/* Equatorial weld seam & mounting strap */}
            <mesh>
              <torusGeometry args={[0.555, 0.02, 12, 32]} />
              <primitive object={materials.solarTruss} attach="material" />
            </mesh>
          </group>

          <group position={[-0.95, 0.15, -0.75]}>
            <mesh castShadow>
              <sphereGeometry args={[0.55, 32, 24]} />
              <primitive object={materials.titaniumTank} attach="material" />
            </mesh>
            <mesh>
              <torusGeometry args={[0.555, 0.02, 12, 32]} />
              <primitive object={materials.solarTruss} attach="material" />
            </mesh>
          </group>

          {/* High-Gain Parabolic Antenna (HGA) with 3-Strut Focal Feed Horn */}
          <group position={[1.5, 0.9, -0.7]} rotation={[0.4, 0.65, 0]}>
            {/* Parabolic Gold Mesh Reflector Dish */}
            <mesh castShadow>
              <sphereGeometry args={[0.78, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.44]} />
              <primitive object={materials.antennaDishGold} attach="material" />
            </mesh>
            {/* 3-Strut Tripod Mount supporting Sub-Reflector Feed */}
            {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((strutAngle, si) => (
              <mesh
                key={si}
                position={[Math.sin(strutAngle) * 0.22, Math.cos(strutAngle) * 0.22, 0.26]}
                rotation={[0.35 * Math.cos(strutAngle), 0, -0.35 * Math.sin(strutAngle)]}
              >
                <cylinderGeometry args={[0.012, 0.012, 0.62, 8]} />
                <primitive object={materials.solarTruss} attach="material" />
              </mesh>
            ))}
            {/* Central Sub-Reflector Feed Horn at Focal Point */}
            <mesh position={[0, 0, 0.52]}>
              <coneGeometry args={[0.08, 0.18, 16]} />
              <primitive object={materials.solarTruss} attach="material" />
            </mesh>
            {/* Gimbal Actuator Base */}
            <mesh position={[0, 0, -0.15]}>
              <cylinderGeometry args={[0.12, 0.12, 0.25, 16]} />
              <primitive object={materials.solarTruss} attach="material" />
            </mesh>
          </group>

          {/* Low-Gain Antenna (LGA) Mast */}
          <group position={[-1.6, 0.8, -0.6]}>
            <mesh>
              <cylinderGeometry args={[0.035, 0.035, 0.95, 12]} />
              <primitive object={materials.solarTruss} attach="material" />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
              <coneGeometry args={[0.08, 0.15, 12]} />
              <primitive object={materials.solarTruss} attach="material" />
            </mesh>
          </group>

          {/* Star Scanner Optical Camera Baffle */}
          <group position={[0, 2.38, 0]} rotation={[0, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.14, 0.18, 0.4, 16]} />
              <primitive object={materials.solarTruss} attach="material" />
            </mesh>
          </group>

          {/* Left Solid Photovoltaic Solar Panel Wing (GaAs Silicon Contact Grid) */}
          <group position={[-4.1, 0, 0]}>
            {/* Front GaAs Silicon Solar Cells */}
            <mesh castShadow position={[0, 0.02, 0]}>
              <boxGeometry args={[3.6, 0.04, 1.8]} />
              <primitive object={materials.solarCell} attach="material" />
            </mesh>
            {/* Back Golden Kapton Substrate */}
            <mesh position={[0, -0.02, 0]}>
              <boxGeometry args={[3.6, 0.04, 1.8]} />
              <primitive object={materials.solarBacking} attach="material" />
            </mesh>
            {/* Hinged Mounting Yoke & Trusses */}
            <mesh position={[2.0, 0, 0]}>
              <boxGeometry args={[0.6, 0.08, 0.35]} />
              <primitive object={materials.solarTruss} attach="material" />
            </mesh>
          </group>

          {/* Right Solid Photovoltaic Solar Panel Wing */}
          <group position={[4.1, 0, 0]}>
            <mesh castShadow position={[0, 0.02, 0]}>
              <boxGeometry args={[3.6, 0.04, 1.8]} />
              <primitive object={materials.solarCell} attach="material" />
            </mesh>
            <mesh position={[0, -0.02, 0]}>
              <boxGeometry args={[3.6, 0.04, 1.8]} />
              <primitive object={materials.solarBacking} attach="material" />
            </mesh>
            <mesh position={[-2.0, 0, 0]}>
              <boxGeometry args={[0.6, 0.08, 0.35]} />
              <primitive object={materials.solarTruss} attach="material" />
            </mesh>
          </group>

          {/* 8 Perimeter Cold-Gas / Hydrazine RCS Thruster Modules */}
          {[0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4].map(
            (ang, ti) => {
              const rx = Math.sin(ang) * 2.36;
              const ry = Math.cos(ang) * 2.36;
              return (
                <group key={ti} position={[rx, ry, -0.2]} rotation={[0, 0, -ang]}>
                  {/* Gold MLI Heat Shield Bracket */}
                  <mesh>
                    <boxGeometry args={[0.2, 0.15, 0.2]} />
                    <primitive object={materials.goldKapton} attach="material" />
                  </mesh>
                  {/* Dual miniature thruster nozzles */}
                  <mesh position={[0.08, 0.1, 0]} rotation={[0, 0, -0.3]}>
                    <coneGeometry args={[0.04, 0.12, 12]} />
                    <primitive object={materials.antennaDishGold} attach="material" />
                  </mesh>
                  <mesh position={[-0.08, 0.1, 0]} rotation={[0, 0, 0.3]}>
                    <coneGeometry args={[0.04, 0.12, 12]} />
                    <primitive object={materials.antennaDishGold} attach="material" />
                  </mesh>
                </group>
              );
            }
          )}

          {/* Cold-Gas RCS Thruster Jet Puffs (dynamic) */}
          <group ref={rcsPuffRef}>
            {[
              [2.35, 0, -0.2],
              [-2.35, 0, -0.2],
            ].map(([rx, ry, rz], i) => (
              <mesh key={i} position={[rx, ry, rz]} rotation={[0, 0, i === 0 ? Math.PI / 2 : -Math.PI / 2]}>
                <coneGeometry args={[0.25, 1.2, 16]} />
                <primitive object={materials.rcsGas} attach="material" />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
};

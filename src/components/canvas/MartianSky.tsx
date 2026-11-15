'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useMissionStore } from '@/lib/store/useMissionStore';
import { getStarParticleTexture, applyCircularPointShader } from '@/lib/graphics/particleTextures';
import {
  createPhobosGeometry,
  createDeimosGeometry,
  calculateMartianMoonEphemeris,
} from '@/lib/science/martianMoons';

export const MartianSky: React.FC = () => {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const skyDomeRef = useRef<THREE.Mesh>(null);
  const sunGroupRef = useRef<THREE.Group>(null);
  const sunSphereRef = useRef<THREE.Mesh>(null);
  const phobosGroupRef = useRef<THREE.Group>(null);
  const phobosMeshRef = useRef<THREE.Mesh>(null);
  const deimosGroupRef = useRef<THREE.Group>(null);
  const deimosMeshRef = useRef<THREE.Mesh>(null);
  const { scene } = useThree();

  const timeOfDay = useMissionStore((s) => s.env.timeOfDay);
  const dustTau = useMissionStore((s) => s.env.dustTau);
  const solNumber = useMissionStore((s) => s.env.solNumber);

  // Load Real NASA High-Res Surface Textures for Phobos & Deimos
  const { phobosTexture, deimosTexture } = useMemo(() => {
    if (typeof window === 'undefined') return { phobosTexture: null, deimosTexture: null };
    const loader = new THREE.TextureLoader();

    const pTex = loader.load('/textures/mars_phobos.jpg');
    pTex.wrapS = THREE.ClampToEdgeWrapping;
    pTex.wrapT = THREE.ClampToEdgeWrapping;
    pTex.anisotropy = 16;

    const dTex = loader.load('/textures/mars_deimos.jpg');
    dTex.wrapS = THREE.ClampToEdgeWrapping;
    dTex.wrapT = THREE.ClampToEdgeWrapping;
    dTex.anisotropy = 16;

    return { phobosTexture: pTex, deimosTexture: dTex };
  }, []);

  // Scientific Non-Spherical Potato Asteroid Geometries
  // Phobos: 26.8 x 22.4 x 18.4 km with Stickney crater bowl and radial grooves
  const phobosGeo = useMemo(() => createPhobosGeometry(), []);
  // Deimos: 15.0 x 12.2 x 10.4 km with smooth regolith blankets
  const deimosGeo = useMemo(() => createDeimosGeometry(), []);

  // Sky Gradient Hemisphere Dome Geometry
  const skyDomeGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(4700, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const horizonWarmAmber = new THREE.Color('#d47a4c');
    const midAmberClay = new THREE.Color('#94422e');
    const zenithDarkRust = new THREE.Color('#42181d');
    const spaceIndigo = new THREE.Color('#100818');

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const normY = Math.max(0, Math.min(1, y / 4700));

      let c = new THREE.Color();
      if (normY < 0.22) {
        c.copy(horizonWarmAmber).lerp(midAmberClay, normY / 0.22);
      } else if (normY < 0.65) {
        c.copy(midAmberClay).lerp(zenithDarkRust, (normY - 0.22) / 0.43);
      } else {
        c.copy(zenithDarkRust).lerp(spaceIndigo, (normY - 0.65) / 0.35);
      }

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  // Starfield for deep space twilight
  const starGeo = useMemo(() => {
    const count = 1400;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0) * 0.48;
      const r = 4600;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 150;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const isBright = Math.random() < 0.15;
      const brightness = isBright ? 0.95 : 0.4 + Math.random() * 0.4;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness * 0.92;
      colors[i * 3 + 2] = brightness * 0.82;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  // Soft circular star texture & anti-aliased discard shader
  const starTexture = useMemo(() => getStarParticleTexture(), []);
  const starMaterial = useMemo(() => {
    const mat = new THREE.PointsMaterial({
      size: 14,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: timeOfDay > 6 && timeOfDay < 18 ? 0.08 : 0.9,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    applyCircularPointShader(mat);
    return mat;
  }, [starTexture, timeOfDay]);

  useFrame(() => {
    // Diurnal Cycle: calculate sun azimuth and elevation
    const sunAngle = (timeOfDay / 24) * Math.PI * 2 - Math.PI / 2;
    const sunElevation = Math.sin(sunAngle);
    const sunAzimuth = Math.cos(sunAngle);

    const isDay = sunElevation > -0.08;
    const sunIntensity = Math.max(0, Math.sin(Math.max(0, sunElevation) * Math.PI)) * 1.85;

    // Atmospheric Dust Extinction (Optical Depth Tau)
    const currentDustTau = dustTau || 0.44;

    let fogColor = new THREE.Color('#0a0710');
    let skyLightColor = new THREE.Color('#140b12');

    if (isDay) {
      if (sunElevation < 0.25) {
        fogColor = new THREE.Color('#aa4b2a').lerp(new THREE.Color('#5a2838'), 0.4);
        skyLightColor = new THREE.Color('#e07842');
      } else {
        fogColor = new THREE.Color('#b8542c').lerp(new THREE.Color('#cb693a'), 0.5);
        skyLightColor = new THREE.Color('#f59a68');
      }
    }

    if (currentDustTau > 1.0) {
      fogColor.lerp(new THREE.Color('#5c2818'), Math.min(0.8, (currentDustTau - 1.0) * 0.6));
    }

    scene.fog = new THREE.Fog(fogColor, 140, 4300);
    scene.background = fogColor;

    // Dynamically center directional sunlight around rover for crisp shadows
    const roverPos = useMissionStore.getState().rover.position;
    if (dirLightRef.current) {
      const sunDist = 180;
      const sunY = Math.max(25, sunElevation * sunDist);
      const sunX = sunAzimuth * sunDist;
      const sunZ = -70;

      dirLightRef.current.position.set(roverPos[0] + sunX, roverPos[1] + sunY, roverPos[2] + sunZ);
      dirLightRef.current.target.position.set(roverPos[0], roverPos[1], roverPos[2]);
      dirLightRef.current.target.updateMatrixWorld();

      dirLightRef.current.intensity = sunIntensity;
      dirLightRef.current.color = isDay ? new THREE.Color('#fff2e2') : new THREE.Color('#556f96');
    }

    if (ambientLightRef.current) {
      ambientLightRef.current.color = skyLightColor;
      ambientLightRef.current.intensity = isDay ? 0.55 + sunElevation * 0.25 : 0.14;
    }

    // Sun Disc & Corona
    if (sunGroupRef.current) {
      const sunDist = 4400;
      sunGroupRef.current.position.set(sunAzimuth * sunDist, sunElevation * sunDist, -1400);
      sunGroupRef.current.visible = isDay;
    }

    // Calculate Real Ephemeris for Martian Moons: Phobos & Deimos
    const currentSol = solNumber || 412;
    const ephemeris = calculateMartianMoonEphemeris(currentSol, timeOfDay);

    // 1. Phobos: Rapid 7.65h Prograde Orbit (Rises in WEST, sets in EAST!)
    if (phobosGroupRef.current) {
      const [px, py, pz] = ephemeris.phobos.position;
      phobosGroupRef.current.position.set(px, py, pz);
      phobosGroupRef.current.lookAt(0, 50, 0); // Tidally locked towards Mars

      // Slowly rotate mesh to track orbital orientation
      if (phobosMeshRef.current) {
        phobosMeshRef.current.rotation.y = timeOfDay * 0.18;
      }

      // Hide when dipped below horizon
      phobosGroupRef.current.visible = py > -150;
    }

    // 2. Deimos: Slow 30.35h Retrograde-Appearing Orbit (Rises in EAST, sets in WEST!)
    if (deimosGroupRef.current) {
      const [dx, dy, dz] = ephemeris.deimos.position;
      deimosGroupRef.current.position.set(dx, dy, dz);
      deimosGroupRef.current.lookAt(0, 50, 0);

      if (deimosMeshRef.current) {
        deimosMeshRef.current.rotation.y = timeOfDay * 0.05;
      }

      deimosGroupRef.current.visible = dy > -150;
    }
  });

  return (
    <>
      {/* 1. Inverted Atmospheric Sky Gradient Dome */}
      <mesh ref={skyDomeRef} geometry={skyDomeGeo}>
        <meshBasicMaterial vertexColors side={THREE.BackSide} />
      </mesh>

      {/* 2. Directional Raking Sunlight with Soft Shadow Cascades (Centered on rover) */}
      <directionalLight
        ref={dirLightRef}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1.0}
        shadow-camera-far={320}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
        shadow-bias={-0.0002}
        shadow-normalBias={0.035}
      />

      {/* 3. Ambient Light & Warm Regolith Ground Bounce */}
      <ambientLight ref={ambientLightRef} />
      <hemisphereLight
        args={[new THREE.Color('#f59a68'), new THREE.Color('#421a10'), 0.45]}
      />

      {/* 4. REAL MOON 1: PHOBOS (Fear) */}
      {/* Authentic 26.8 x 22.4 x 18.4 km irregular potato body with Stickney crater bowl & grooves */}
      {/* Rises in the WEST and sets in the EAST every 4.3 hours */}
      <group ref={phobosGroupRef}>
        <mesh
          ref={phobosMeshRef}
          geometry={phobosGeo}
          scale={[160, 160, 160]}
        >
          {phobosTexture ? (
            <meshStandardMaterial
              map={phobosTexture}
              bumpMap={phobosTexture}
              bumpScale={0.08}
              roughness={0.92}
              metalness={0.02}
            />
          ) : (
            <meshStandardMaterial color="#4a423e" roughness={0.92} />
          )}
        </mesh>

        {/* Subtle Ethereal Limb Glow / Space Backlight */}
        <mesh scale={[165, 165, 165]} geometry={phobosGeo}>
          <meshBasicMaterial
            color="#818cf8"
            transparent
            opacity={0.12}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

      {/* 5. REAL MOON 2: DEIMOS (Dread) */}
      {/* Authentic 15.0 x 12.2 x 10.4 km smooth regolith-blanketed irregular body */}
      {/* Rises in the EAST and sets in the WEST slowly over 65 hours */}
      <group ref={deimosGroupRef}>
        <mesh
          ref={deimosMeshRef}
          geometry={deimosGeo}
          scale={[44, 44, 44]}
        >
          {deimosTexture ? (
            <meshStandardMaterial
              map={deimosTexture}
              bumpMap={deimosTexture}
              bumpScale={0.06}
              roughness={0.94}
              metalness={0.02}
            />
          ) : (
            <meshStandardMaterial color="#5c4e46" roughness={0.94} />
          )}
        </mesh>

        {/* Delicate Starlight Glimmer */}
        <mesh scale={[48, 48, 48]} geometry={deimosGeo}>
          <meshBasicMaterial
            color="#fed7aa"
            transparent
            opacity={0.18}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

      {/* 6. Martian Sun Disc & Atmospheric Corona Halo */}
      <group ref={sunGroupRef}>
        {/* Core Sun Disc */}
        <mesh ref={sunSphereRef}>
          <sphereGeometry args={[75, 32, 32]} />
          <meshBasicMaterial color="#fffaf0" />
        </mesh>
        {/* Soft Blue Rayleigh Corona Halo (Characteristic Martian Blue Sunset) */}
        <mesh>
          <sphereGeometry args={[130, 32, 32]} />
          <meshBasicMaterial
            color="#60a5fa"
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
          />
        </mesh>
        {/* Outer Solar Glare */}
        <mesh>
          <sphereGeometry args={[260, 32, 32]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

      {/* 7. Twinkling Starfield in Upper Atmosphere with smooth circular stars */}
      <points geometry={starGeo} material={starMaterial} />
    </>
  );
};

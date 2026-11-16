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
  const starsRef = useRef<THREE.Points>(null);
  const sunGroupRef = useRef<THREE.Group>(null);
  const sunSphereRef = useRef<THREE.Mesh>(null);
  const phobosGroupRef = useRef<THREE.Group>(null);
  const phobosMeshRef = useRef<THREE.Mesh>(null);
  const deimosGroupRef = useRef<THREE.Group>(null);
  const deimosMeshRef = useRef<THREE.Mesh>(null);
  const { scene, camera } = useThree();

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
  const phobosGeo = useMemo(() => createPhobosGeometry(), []);
  const deimosGeo = useMemo(() => createDeimosGeometry(), []);

  // =========================================================================
  // AUTHENTIC NASA MARS ATMOSPHERE SHADER (MIE SCATTERING BY DUST AEROSOLS)
  // Recreates the true butterscotch-apricot daytime sky, dusty salmon mid-elevations,
  // rust-mauve zenith, forward Mie-scattering blue solar halo, and cobalt blue twilight.
  // =========================================================================
  const skyShaderUniforms = useMemo(
    () => ({
      uSunPosition: { value: new THREE.Vector3(0, 1, 0) },
      uSunElevation: { value: 0.8 },
      uDustTau: { value: 0.44 },
    }),
    []
  );

  const skyShaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: skyShaderUniforms,
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uSunPosition;
        uniform float uSunElevation;
        uniform float uDustTau;
        varying vec3 vWorldPosition;

        void main() {
          vec3 dir = normalize(vWorldPosition);
          float height = clamp(dir.y, 0.0, 1.0);
          vec3 sunDir = normalize(uSunPosition);
          float cosGamma = clamp(dot(dir, sunDir), -1.0, 1.0);

          // Day / sunset / night transitions based on sun elevation
          float dayFactor = smoothstep(-0.10, 0.15, uSunElevation);
          float sunsetFactor = smoothstep(0.35, 0.0, abs(uSunElevation - 0.05));

          // NASA Curiosity & Perseverance True Colors:
          // Horizon: Luminous warm butterscotch ochre
          vec3 horizonDay = vec3(0.92, 0.65, 0.45);
          // Mid-Sky: Warm salmon-apricot terracotta
          vec3 midDay     = vec3(0.82, 0.48, 0.32);
          // Zenith: Dusky rust-amber
          vec3 zenithDay  = vec3(0.55, 0.25, 0.18);

          // Sunset Sky:
          vec3 horizonSunset = vec3(0.72, 0.40, 0.35);
          vec3 zenithSunset  = vec3(0.28, 0.12, 0.20);

          // Cosmic Night:
          vec3 horizonNight = vec3(0.04, 0.06, 0.10);
          vec3 zenithNight  = vec3(0.012, 0.016, 0.035);

          // Blend elevation gradient
          vec3 dayAtmosphere = mix(horizonDay, midDay, smoothstep(0.0, 0.35, height));
          dayAtmosphere = mix(dayAtmosphere, zenithDay, smoothstep(0.35, 0.90, height));

          vec3 sunsetAtmosphere = mix(horizonSunset, zenithSunset, smoothstep(0.0, 0.70, height));
          vec3 nightAtmosphere  = mix(horizonNight, zenithNight, smoothstep(0.0, 0.60, height));

          vec3 baseAtmosphere = mix(nightAtmosphere, sunsetAtmosphere, sunsetFactor * dayFactor);
          baseAtmosphere = mix(baseAtmosphere, dayAtmosphere, dayFactor * (1.0 - sunsetFactor * 0.7));

          // Forward Mie Scattering (Iconic Martian Blue Twilight / Sun Halo)
          // Forward lobe: dust scatters blue light preferentially in forward direction
          float forwardGlow = pow(max(0.0, cosGamma), 3.5);
          float intenseGlow = pow(max(0.0, cosGamma), 32.0);

          vec3 blueHaloColor = vec3(0.38, 0.72, 0.98); // Electric Martian blue
          vec3 blueScattering = blueHaloColor * (forwardGlow * 0.95 + intenseGlow * 2.4) * dayFactor;

          // Dust Tau Extinction modifier during regional storms
          if (uDustTau > 0.8) {
            float stormFactor = clamp((uDustTau - 0.8) * 0.7, 0.0, 0.8);
            vec3 stormColor = vec3(0.68, 0.36, 0.20);
            baseAtmosphere = mix(baseAtmosphere, stormColor, stormFactor);
            blueScattering *= (1.0 - stormFactor * 0.5);
          }

          gl_FragColor = vec4(baseAtmosphere + blueScattering, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false, // Critical: sky dome is never occluded by distance fog!
    });
  }, [skyShaderUniforms]);

  // Starfield for deep space twilight & night
  const starGeo = useMemo(() => {
    const count = 1800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0) * 0.48;
      const r = 3400;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 120;
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
    // 1. Center sky dome and stars on camera so they never clip or shift
    if (skyDomeRef.current) {
      skyDomeRef.current.position.copy(camera.position);
    }
    if (starsRef.current) {
      starsRef.current.position.copy(camera.position);
    }

    // Diurnal Cycle: calculate sun azimuth and elevation
    const sunAngle = (timeOfDay / 24) * Math.PI * 2 - Math.PI / 2;
    const sunElevation = Math.sin(sunAngle);
    const sunAzimuth = Math.cos(sunAngle);

    const isDay = sunElevation > -0.08;

    // Atmospheric Dust Extinction (Optical Depth Tau)
    const currentDustTau = dustTau || 0.44;

    // Update custom sky shader uniforms
    skyShaderUniforms.uSunPosition.value.set(sunAzimuth, Math.max(-0.2, sunElevation), -0.32).normalize();
    skyShaderUniforms.uSunElevation.value = sunElevation;
    skyShaderUniforms.uDustTau.value = currentDustTau;

    // Atmospheric horizon haze smoothly blending distant terrain with the sky
    const horizonHazeColor = isDay
      ? new THREE.Color('#df966e').lerp(new THREE.Color('#e8a478'), Math.max(0, sunElevation))
      : new THREE.Color('#0a0d18');

    if (currentDustTau > 1.0) {
      horizonHazeColor.lerp(new THREE.Color('#6c301a'), Math.min(0.7, (currentDustTau - 1.0) * 0.5));
    }

    // Fog blends distant terrain into the horizon without occluding the sky dome
    scene.fog = new THREE.Fog(horizonHazeColor, 220, 4200);
    scene.background = null;

    // Dynamically center directional sunlight around rover for crisp, clear shadows
    const roverPos = useMissionStore.getState().rover.position;
    if (dirLightRef.current) {
      const sunDist = 180;
      const sunY = Math.max(25, sunElevation * sunDist);
      const sunX = sunAzimuth * sunDist;
      const sunZ = -70;

      dirLightRef.current.position.set(roverPos[0] + sunX, roverPos[1] + sunY, roverPos[2] + sunZ);
      dirLightRef.current.target.position.set(roverPos[0], roverPos[1], roverPos[2]);
      dirLightRef.current.target.updateMatrixWorld();

      // Clear, radiant Martian direct sunlight
      dirLightRef.current.intensity = isDay
        ? 2.4 * Math.sin(Math.max(0, sunElevation) * Math.PI) + 0.35
        : 0.05;
      dirLightRef.current.color = isDay ? new THREE.Color('#fff7ec') : new THREE.Color('#6882a8');
    }

    if (ambientLightRef.current) {
      ambientLightRef.current.color = isDay ? new THREE.Color('#f3a778') : new THREE.Color('#141828');
      ambientLightRef.current.intensity = isDay ? 0.65 + Math.max(0, sunElevation) * 0.25 : 0.15;
    }

    // Sun Disc & Corona Halo centered on camera
    if (sunGroupRef.current) {
      const sunDist = 3200;
      sunGroupRef.current.position.set(
        camera.position.x + sunAzimuth * sunDist,
        camera.position.y + sunElevation * sunDist,
        camera.position.z - 1100
      );
      sunGroupRef.current.visible = isDay;
    }

    // Calculate Real Ephemeris for Martian Moons: Phobos & Deimos
    const currentSol = solNumber || 412;
    const ephemeris = calculateMartianMoonEphemeris(currentSol, timeOfDay);

    // 1. Phobos: Rapid 7.65h Prograde Orbit (Rises in WEST, sets in EAST!)
    if (phobosGroupRef.current) {
      const [px, py, pz] = ephemeris.phobos.position;
      phobosGroupRef.current.position.set(
        camera.position.x + px * 0.75,
        camera.position.y + py * 0.75,
        camera.position.z + pz * 0.75
      );
      phobosGroupRef.current.lookAt(camera.position.x, camera.position.y, camera.position.z);

      if (phobosMeshRef.current) {
        phobosMeshRef.current.rotation.y = timeOfDay * 0.18;
      }
      phobosGroupRef.current.visible = py > -150;
    }

    // 2. Deimos: Slow 30.35h Retrograde-Appearing Orbit (Rises in EAST, sets in WEST!)
    if (deimosGroupRef.current) {
      const [dx, dy, dz] = ephemeris.deimos.position;
      deimosGroupRef.current.position.set(
        camera.position.x + dx * 0.75,
        camera.position.y + dy * 0.75,
        camera.position.z + dz * 0.75
      );
      deimosGroupRef.current.lookAt(camera.position.x, camera.position.y, camera.position.z);

      if (deimosMeshRef.current) {
        deimosMeshRef.current.rotation.y = timeOfDay * 0.05;
      }
      deimosGroupRef.current.visible = dy > -150;
    }
  });

  return (
    <>
      {/* 1. Inverted Authentic Mie-Scattered Sky Gradient Dome (Never occluded by fog) */}
      <mesh ref={skyDomeRef} material={skyShaderMaterial}>
        <sphereGeometry args={[3600, 48, 28]} />
      </mesh>

      {/* 2. Directional Raking Sunlight with Soft Shadow Cascades */}
      <directionalLight
        ref={dirLightRef}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1.0}
        shadow-camera-far={320}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-bias={-0.0002}
        shadow-normalBias={0.035}
      />

      {/* 3. Ambient Light & Warm Regolith Ground Bounce */}
      <ambientLight ref={ambientLightRef} />
      <hemisphereLight
        args={[new THREE.Color('#f6a87b'), new THREE.Color('#6e2512'), 0.7]}
      />

      {/* 4. REAL MOON 1: PHOBOS */}
      <group ref={phobosGroupRef}>
        <mesh ref={phobosMeshRef} geometry={phobosGeo} scale={[130, 130, 130]}>
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
        <mesh scale={[135, 135, 135]} geometry={phobosGeo}>
          <meshBasicMaterial
            color="#818cf8"
            transparent
            opacity={0.12}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

      {/* 5. REAL MOON 2: DEIMOS */}
      <group ref={deimosGroupRef}>
        <mesh ref={deimosMeshRef} geometry={deimosGeo} scale={[38, 38, 38]}>
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
        <mesh scale={[42, 42, 42]} geometry={deimosGeo}>
          <meshBasicMaterial
            color="#fed7aa"
            transparent
            opacity={0.18}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

      {/* 6. Martian Sun Disc & Atmospheric Forward-Scattering Corona Halo */}
      <group ref={sunGroupRef}>
        {/* Core Sun Disc */}
        <mesh ref={sunSphereRef}>
          <sphereGeometry args={[55, 32, 32]} />
          <meshBasicMaterial color="#fffef8" />
        </mesh>
        {/* Soft Blue Rayleigh Corona Halo (Characteristic Martian Blue Twilight / Sun Flare) */}
        <mesh>
          <sphereGeometry args={[115, 32, 32]} />
          <meshBasicMaterial
            color="#60a5fa"
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
          />
        </mesh>
        {/* Outer Solar Glare */}
        <mesh>
          <sphereGeometry args={[230, 32, 32]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.18}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

      {/* 7. Twinkling Starfield in Upper Atmosphere with smooth circular stars */}
      <points ref={starsRef} geometry={starGeo} material={starMaterial} />
    </>
  );
};

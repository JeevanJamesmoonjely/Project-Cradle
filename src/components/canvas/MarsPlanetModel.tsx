'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { USDLoader } from 'three/examples/jsm/loaders/USDLoader.js';

interface MarsPlanetModelProps {
  radius?: number; // Target radius in Three.js world units (default: 25)
  position?: [number, number, number];
  rotation?: [number, number, number];
  rotationSpeed?: number; // Rotation speed in rad/sec (default: 0.02)
  atmosphere?: boolean; // Whether to render atmospheric glow shell
  atmosphereScale?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

// Module-level cache so the official NASA Mars USDZ model parses only once
let cachedMarsGroup: THREE.Group | null = null;
let marsLoadingPromise: Promise<THREE.Group> | null = null;

function loadMarsUSDZ(): Promise<THREE.Group> {
  if (cachedMarsGroup) {
    return Promise.resolve(cachedMarsGroup);
  }
  if (!marsLoadingPromise) {
    marsLoadingPromise = new Promise<THREE.Group>((resolve, reject) => {
      const loader = new USDLoader();
      loader.load(
        '/models/Mars_1_6792.usdz',
        (group) => {
          group.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              const mat = (child as THREE.Mesh).material as THREE.MeshPhysicalMaterial;
              if (mat) {
                mat.roughness = 0.88;
                mat.metalness = 0.0;
                mat.clearcoat = 0.04;
                mat.clearcoatRoughness = 0.8;
              }
            }
          });
          cachedMarsGroup = group;
          resolve(group);
        },
        undefined,
        (err) => {
          console.error('Failed to load Mars USDZ model:', err);
          reject(err);
        }
      );
    });
  }
  return marsLoadingPromise;
}

export const MarsPlanetModel: React.FC<MarsPlanetModelProps> = ({
  radius = 25,
  position = [0, 0, 0],
  rotation = [0.15, 0, 0.44], // Mars's axial tilt (approx 25.19°)
  rotationSpeed = 0.02,
  atmosphere = true,
  atmosphereScale = 1.055,
  castShadow = true,
  receiveShadow = true,
}) => {
  const [modelGroup, setModelGroup] = useState<THREE.Group | null>(() =>
    cachedMarsGroup ? cachedMarsGroup.clone(true) : null
  );

  const groupRef = useRef<THREE.Group>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  // Load NASA Mars USDZ model
  useEffect(() => {
    let isMounted = true;
    loadMarsUSDZ()
      .then((loaded) => {
        if (isMounted) {
          setModelGroup(loaded.clone(true));
        }
      })
      .catch((err) => {
        console.warn('Using texture fallback for Mars:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Textures fallback using the exact extracted NASA textures from the USDZ package
  const { albedoTexture, normalTexture } = useMemo(() => {
    if (typeof window === 'undefined') return { albedoTexture: null, normalTexture: null };
    const loader = new THREE.TextureLoader();
    const alb = loader.load('/textures/mars_albedo.jpg');
    alb.colorSpace = THREE.SRGBColorSpace;
    const nrm = loader.load('/textures/mars_normal.jpg');
    return { albedoTexture: alb, normalTexture: nrm };
  }, []);

  const fallbackMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: albedoTexture,
      normalMap: normalTexture,
      roughness: 0.88,
      metalness: 0.0,
    });
  }, [albedoTexture, normalTexture]);

  // Native Mars USDZ radius is 150.0 units
  // Scale factor to reach requested radius R = radius / 150
  const modelScale = radius / 150.0;

  // Axial Rotation Loop
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Planetary Rotation Group */}
      <group ref={groupRef}>
        {modelGroup ? (
          // Official NASA 3D Mars Globe from 24881_Mars_1_6792.usdz
          <group scale={[modelScale, modelScale, modelScale]}>
            <primitive object={modelGroup} />
          </group>
        ) : (
          // High-Resolution Fallback using extracted USGS Mars Albedo & Normal Maps
          <mesh castShadow={castShadow} receiveShadow={receiveShadow}>
            <sphereGeometry args={[radius, 64, 64]} />
            <primitive object={fallbackMaterial} attach="material" />
          </mesh>
        )}
      </group>

      {/* Atmospheric Rayleigh Scattering Glow Halo */}
      {atmosphere && (
        <mesh ref={atmosphereRef} scale={[atmosphereScale, atmosphereScale, atmosphereScale]}>
          <sphereGeometry args={[radius, 48, 48]} />
          <meshBasicMaterial
            color="#f87171"
            transparent
            opacity={0.22}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
};

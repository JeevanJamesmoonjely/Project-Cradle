'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { USDLoader } from 'three/examples/jsm/loaders/USDLoader.js';
import { useMissionStore } from '@/lib/store/useMissionStore';
import { getSolarCellTexture, getGoldKaptonTexture } from '@/lib/graphics/spaceflightTextures';
import {
  getSparkParticleTexture,
  getVolumetricDustPuffTexture,
  applyCircularPointShader,
} from '@/lib/graphics/particleTextures';

interface RoverModelProps {
  steeringAngle?: number;
  wheelRotation?: number;
  isScanning?: boolean;
  scanProgress?: number;
  isSolarCharging?: boolean;
  mastUnstowProgress?: number;
}

// 6 Wheel definitions & spatial centers relative to Wheels_objs
const WHEEL_KEYS = ['FL', 'FR', 'ML', 'MR', 'RL', 'RR'] as const;
type WheelKey = (typeof WHEEL_KEYS)[number];

const WHEEL_CENTERS: Record<WheelKey, THREE.Vector3> = {
  FL: new THREE.Vector3(-1.062, 0, 1.13),
  FR: new THREE.Vector3(1.062, 0, 1.13),
  ML: new THREE.Vector3(-1.184, 0, -0.055),
  MR: new THREE.Vector3(1.184, 0, -0.055),
  RL: new THREE.Vector3(-1.062, 0, -1.13),
  RR: new THREE.Vector3(1.062, 0, -1.13),
};

// Module-level cache so the 13MB Perseverance USDZ model parses and splits wheels only once
let cachedPerseveranceModel: THREE.Group | null = null;
let usdzLoadingPromise: Promise<THREE.Group> | null = null;

function loadPerseveranceUSDZ(): Promise<THREE.Group> {
  if (cachedPerseveranceModel) {
    return Promise.resolve(cachedPerseveranceModel);
  }
  if (!usdzLoadingPromise) {
    usdzLoadingPromise = new Promise<THREE.Group>((resolve, reject) => {
      const loader = new USDLoader();
      loader.load(
        '/models/Perseverance.usdz',
        (group) => {
          try {
            // Configure shadows, material enhancements, and PBR properties
            group.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                const mat = (child as THREE.Mesh).material;
                if (mat) {
                  if (Array.isArray(mat)) {
                    mat.forEach((m) => {
                      if ('envMapIntensity' in m) (m as THREE.MeshStandardMaterial).envMapIntensity = 1.2;
                    });
                  } else if ('envMapIntensity' in mat) {
                    (mat as THREE.MeshStandardMaterial).envMapIntensity = 1.2;
                  }
                }
              }
            });

            // Split Wheels_objs into 6 articulated wheel groups with separate steering & rolling pivots
            const wheelsObj = group.getObjectByName('Wheels_objs');
            if (wheelsObj && wheelsObj.parent) {
              wheelsObj.visible = false;

              const splitSpinGroups: Record<WheelKey, THREE.Group> = {} as Record<WheelKey, THREE.Group>;
              WHEEL_KEYS.forEach((k) => {
                const steerGroup = new THREE.Group();
                steerGroup.name = `Wheel_${k}_Steer`;
                steerGroup.position.copy(WHEEL_CENTERS[k]);

                const spinGroup = new THREE.Group();
                spinGroup.name = `Wheel_${k}_Spin`;
                steerGroup.add(spinGroup);

                splitSpinGroups[k] = spinGroup;
                wheelsObj.parent!.add(steerGroup);
              });

              wheelsObj.children.forEach((child) => {
                const prim = child as THREE.Mesh;
                if (!prim.geometry) return;

                const posAttr = prim.geometry.attributes.position;
                const normAttr = prim.geometry.attributes.normal;
                const uvAttr = prim.geometry.attributes.uv;

                const buckets: Record<WheelKey, number[]> = {
                  FL: [],
                  FR: [],
                  ML: [],
                  MR: [],
                  RL: [],
                  RR: [],
                };

                for (let i = 0; i < posAttr.count; i += 3) {
                  const x = posAttr.getX(i);
                  const z = posAttr.getZ(i);
                  let key: WheelKey | '' = '';
                  if (x < -0.5) {
                    if (z > 0.4) key = 'FL';
                    else if (z < -0.4) key = 'RL';
                    else key = 'ML';
                  } else if (x > 0.5) {
                    if (z > 0.4) key = 'FR';
                    else if (z < -0.4) key = 'RR';
                    else key = 'MR';
                  }
                  if (key) buckets[key].push(i);
                }

                WHEEL_KEYS.forEach((k) => {
                  const tris = buckets[k];
                  const count = tris.length * 3;
                  if (count === 0) return;

                  const pos = new Float32Array(count * 3);
                  const norm = normAttr ? new Float32Array(count * 3) : null;
                  const uvs = uvAttr ? new Float32Array(count * 2) : null;
                  const center = WHEEL_CENTERS[k];

                  let ptr = 0;
                  for (const startIdx of tris) {
                    for (let v = 0; v < 3; v++) {
                      const vi = startIdx + v;
                      pos[ptr * 3] = posAttr.getX(vi) - center.x;
                      pos[ptr * 3 + 1] = posAttr.getY(vi) - center.y;
                      pos[ptr * 3 + 2] = posAttr.getZ(vi) - center.z;

                      if (norm && normAttr) {
                        norm[ptr * 3] = normAttr.getX(vi);
                        norm[ptr * 3 + 1] = normAttr.getY(vi);
                        norm[ptr * 3 + 2] = normAttr.getZ(vi);
                      }

                      if (uvs && uvAttr) {
                        uvs[ptr * 2] = uvAttr.getX(vi);
                        uvs[ptr * 2 + 1] = uvAttr.getY(vi);
                      }
                      ptr++;
                    }
                  }

                  const geo = new THREE.BufferGeometry();
                  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
                  if (norm) geo.setAttribute('normal', new THREE.BufferAttribute(norm, 3));
                  if (uvs) geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

                  const mesh = new THREE.Mesh(geo, prim.material);
                  mesh.castShadow = true;
                  mesh.receiveShadow = true;
                  splitSpinGroups[k].add(mesh);
                });
              });
            }

            cachedPerseveranceModel = group;
            resolve(group);
          } catch (e) {
            console.error('Error processing Perseverance model:', e);
            cachedPerseveranceModel = group;
            resolve(group);
          }
        },
        undefined,
        (err) => {
          console.error('Failed to load Perseverance USDZ model:', err);
          reject(err);
        }
      );
    });
  }
  return usdzLoadingPromise;
}

/**
 * High-Efficiency Deployable Space Solar Array Wings
 * Articulated twin wings mounted on the rover chassis deck with multi-segment folding hinges,
 * authentic GaAs triple-junction photovoltaic cells, Gold Kapton thermal MLI backing,
 * active deployment unfolding animation, and electrostatic dust cleaning vibration.
 */
const DeployableSolarArray: React.FC<{
  isSolarCharging: boolean;
  isCleaning: boolean;
}> = ({ isSolarCharging, isCleaning }) => {
  const leftRootRef = useRef<THREE.Group>(null);
  const leftOuterRef = useRef<THREE.Group>(null);
  const rightRootRef = useRef<THREE.Group>(null);
  const rightOuterRef = useRef<THREE.Group>(null);
  const deployProgress = useRef(0);

  const solarCellTexture = useMemo(() => getSolarCellTexture(), []);
  const goldKaptonTexture = useMemo(() => getGoldKaptonTexture(), []);

  // Photovoltaic cell material (Navy/indigo anti-reflective specular surface with gold busbars)
  const solarCellMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: solarCellTexture,
        roughness: 0.2,
        metalness: 0.85,
        bumpMap: solarCellTexture,
        bumpScale: 0.002,
        emissive: new THREE.Color('#0369a1'),
        emissiveIntensity: 0.08,
      }),
    [solarCellTexture]
  );

  // Gold Kapton MLI thermal insulation blanket for underside
  const kaptonMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: goldKaptonTexture,
        roughness: 0.35,
        metalness: 0.9,
        color: '#fbbf24',
      }),
    [goldKaptonTexture]
  );

  // Structural titanium border frame
  const frameMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.45,
        metalness: 0.8,
      }),
    []
  );

  // Multi-material array for box: [+X, -X, +Y (cells), -Y (kapton), +Z, -Z]
  const panelMaterials = useMemo(
    () => [frameMat, frameMat, solarCellMat, kaptonMat, frameMat, frameMat],
    [frameMat, solarCellMat, kaptonMat]
  );

  useFrame((state, delta) => {
    const dt = Math.min(0.08, delta);
    const target = isSolarCharging ? 1.0 : 0.0;
    deployProgress.current = THREE.MathUtils.lerp(deployProgress.current, target, dt * 3.5);
    const p = deployProgress.current;

    // Vibration oscillation during electrostatic dust cleaning
    const cleanVibe = isCleaning ? Math.sin(state.clock.elapsedTime * 65.0) * 0.035 : 0;

    // Port (Left) Wing Kinematics:
    // Stowed: folded flat over chassis deck (angle 0). Deployed: swings out ~85° with slight dihedral tilt
    if (leftRootRef.current) {
      leftRootRef.current.rotation.z = -p * (Math.PI * 0.48) + cleanVibe;
      leftRootRef.current.rotation.x = p * 0.08;
    }
    // Outer panel unfolds 175° outward from inner panel
    if (leftOuterRef.current) {
      leftOuterRef.current.rotation.z = (1.0 - p) * Math.PI + cleanVibe * 0.5;
    }

    // Starboard (Right) Wing Kinematics:
    if (rightRootRef.current) {
      rightRootRef.current.rotation.z = p * (Math.PI * 0.48) - cleanVibe;
      rightRootRef.current.rotation.x = p * 0.08;
    }
    if (rightOuterRef.current) {
      rightOuterRef.current.rotation.z = -(1.0 - p) * Math.PI - cleanVibe * 0.5;
    }
  });

  // Panel Dimensions
  const innerW = 0.62;
  const innerL = 1.32;
  const outerW = 0.58;
  const outerL = 1.26;

  return (
    <group position={[0, 1.27, -0.12]}>
      {/* ================= PORT (LEFT) SOLAR ARRAY WING ================= */}
      <group ref={leftRootRef} position={[-0.72, 0, 0]}>
        {/* Chassis Mounting Hinge Bracket */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.4, 12]} />
          <primitive object={frameMat} attach="material" />
        </mesh>

        {/* Inner Solar Panel */}
        <mesh position={[-innerW * 0.5, 0.015, 0]} castShadow receiveShadow>
          <boxGeometry args={[innerW, 0.018, innerL]} />
          {panelMaterials.map((mat, idx) => (
            <primitive key={idx} object={mat} attach={`material-${idx}`} />
          ))}
        </mesh>

        {/* Outer Fold-Out Solar Panel */}
        <group ref={leftOuterRef} position={[-innerW, 0.018, 0]}>
          <mesh position={[-outerW * 0.5, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[outerW, 0.016, outerL]} />
            {panelMaterials.map((mat, idx) => (
              <primitive key={idx} object={mat} attach={`material-${idx}`} />
            ))}
          </mesh>
        </group>
      </group>

      {/* ================= STARBOARD (RIGHT) SOLAR ARRAY WING ================= */}
      <group ref={rightRootRef} position={[0.72, 0, 0]}>
        {/* Chassis Mounting Hinge Bracket */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.4, 12]} />
          <primitive object={frameMat} attach="material" />
        </mesh>

        {/* Inner Solar Panel */}
        <mesh position={[innerW * 0.5, 0.015, 0]} castShadow receiveShadow>
          <boxGeometry args={[innerW, 0.018, innerL]} />
          {panelMaterials.map((mat, idx) => (
            <primitive key={idx} object={mat} attach={`material-${idx}`} />
          ))}
        </mesh>

        {/* Outer Fold-Out Solar Panel */}
        <group ref={rightOuterRef} position={[innerW, 0.018, 0]}>
          <mesh position={[outerW * 0.5, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[outerW, 0.016, outerL]} />
            {panelMaterials.map((mat, idx) => (
              <primitive key={idx} object={mat} attach={`material-${idx}`} />
            ))}
          </mesh>
        </group>
      </group>

      {/* Radiant Solar Power Charging Flux Flare */}
      {isSolarCharging && (
        <pointLight
          position={[0, 0.6, 0]}
          color="#38bdf8"
          intensity={14}
          distance={6}
          decay={1.8}
        />
      )}
    </group>
  );
};

export const RoverModel: React.FC<RoverModelProps> = ({
  steeringAngle = 0,
  wheelRotation = 0,
  isScanning = false,
  scanProgress = 0,
  isSolarCharging = false,
  mastUnstowProgress = 1.0,
}) => {
  const [modelGroup, setModelGroup] = useState<THREE.Group | null>(() =>
    cachedPerseveranceModel ? cachedPerseveranceModel.clone(true) : null
  );

  const laserRef = useRef<THREE.Line>(null);
  const sparkRef = useRef<THREE.Points>(null);
  const activeScanPOI = useMissionStore((s) => s.activeScanPOI);
  const subsystems = useMissionStore((s) => s.subsystems);

  // Cached node references from cloned model for smooth 60fps frame loop animations
  const nodesRef = useRef<{
    head?: THREE.Object3D;
    arm003?: THREE.Object3D;
    arm001?: THREE.Object3D;
    antenna?: THREE.Object3D;
    wheels: {
      FL_Steer?: THREE.Object3D;
      FR_Steer?: THREE.Object3D;
      RL_Steer?: THREE.Object3D;
      RR_Steer?: THREE.Object3D;
      FL_Spin?: THREE.Object3D;
      FR_Spin?: THREE.Object3D;
      ML_Spin?: THREE.Object3D;
      MR_Spin?: THREE.Object3D;
      RL_Spin?: THREE.Object3D;
      RR_Spin?: THREE.Object3D;
    };
  }>({ wheels: {} });

  // Load and cache the official NASA Perseverance USDZ model with split wheels
  useEffect(() => {
    let isMounted = true;
    loadPerseveranceUSDZ()
      .then((loadedGroup) => {
        if (isMounted) {
          const clone = loadedGroup.clone(true);
          setModelGroup(clone);
        }
      })
      .catch((err) => {
        console.warn('Perseverance USDZ model error, fallback active:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Cache animated node references whenever modelGroup updates
  useEffect(() => {
    if (!modelGroup) return;

    nodesRef.current = {
      head: modelGroup.getObjectByName('head'),
      arm003: modelGroup.getObjectByName('arm_003'),
      arm001: modelGroup.getObjectByName('arm_001'),
      antenna: modelGroup.getObjectByName('antenna_hg'),
      wheels: {
        FL_Steer: modelGroup.getObjectByName('Wheel_FL_Steer'),
        FR_Steer: modelGroup.getObjectByName('Wheel_FR_Steer'),
        RL_Steer: modelGroup.getObjectByName('Wheel_RL_Steer'),
        RR_Steer: modelGroup.getObjectByName('Wheel_RR_Steer'),
        FL_Spin: modelGroup.getObjectByName('Wheel_FL_Spin'),
        FR_Spin: modelGroup.getObjectByName('Wheel_FR_Spin'),
        ML_Spin: modelGroup.getObjectByName('Wheel_ML_Spin'),
        MR_Spin: modelGroup.getObjectByName('Wheel_MR_Spin'),
        RL_Spin: modelGroup.getObjectByName('Wheel_RL_Spin'),
        RR_Spin: modelGroup.getObjectByName('Wheel_RR_Spin'),
      },
    };
  }, [modelGroup]);

  // Scientific SuperCam LIBS Laser Pulser & Plasma Sparks
  const sparkTexture = useMemo(() => getSparkParticleTexture(), []);
  const sparkCount = 48;
  const [sparkGeo, sparkData] = useMemo(() => {
    const positions = new Float32Array(sparkCount * 3);
    const data: { vx: number; vy: number; vz: number; life: number }[] = [];
    for (let i = 0; i < sparkCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      data.push({
        vx: (Math.random() - 0.5) * 4.5,
        vy: Math.random() * 4.0 + 1.0,
        vz: (Math.random() - 0.5) * 4.5,
        life: Math.random(),
      });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return [geo, data];
  }, [sparkCount]);

  const sparkMaterial = useMemo(() => {
    const mat = new THREE.PointsMaterial({
      size: 0.18,
      map: sparkTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    applyCircularPointShader(mat);
    return mat;
  }, [sparkTexture]);

  const laserGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(6);
    positions[0] = -0.55;
    positions[1] = 1.74;
    positions[2] = 0.72;
    positions[3] = 0;
    positions[4] = -0.3;
    positions[5] = 4.0;
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  // Frame loop: Real-time wheel rotation, 4-corner steering, mast unstowing, robotic arm coring
  useFrame((state, delta) => {
    const dt = Math.min(0.08, delta);
    const nodes = nodesRef.current;

    // 1. Rocker-Bogie 6-Wheel Real-Time Kinematics (Rolling + 4-Corner Steering)
    const wh = nodes.wheels;
    if (wh.FL_Steer) wh.FL_Steer.rotation.y = steeringAngle;
    if (wh.FR_Steer) wh.FR_Steer.rotation.y = steeringAngle;
    // Authentic NASA Mars Rover counter-steering on rear wheels
    if (wh.RL_Steer) wh.RL_Steer.rotation.y = -steeringAngle * 0.7;
    if (wh.RR_Steer) wh.RR_Steer.rotation.y = -steeringAngle * 0.7;

    // Longitudinal wheel spin proportional to distance traveled
    if (wh.FL_Spin) wh.FL_Spin.rotation.x = wheelRotation;
    if (wh.FR_Spin) wh.FR_Spin.rotation.x = wheelRotation;
    if (wh.ML_Spin) wh.ML_Spin.rotation.x = wheelRotation;
    if (wh.MR_Spin) wh.MR_Spin.rotation.x = wheelRotation;
    if (wh.RL_Spin) wh.RL_Spin.rotation.x = wheelRotation;
    if (wh.RR_Spin) wh.RR_Spin.rotation.x = wheelRotation;

    // 2. Remote Sensing Mast Unstowing & Head Tracking Animation
    if (nodes.head) {
      // Mast is folded forward when stowed; elevates upright when deployed
      const foldX = (1.0 - THREE.MathUtils.clamp(mastUnstowProgress, 0, 1)) * 1.35;
      nodes.head.rotation.x = foldX;

      if (mastUnstowProgress >= 0.95 && isScanning) {
        // Pan head gently during deep scan
        nodes.head.rotation.y = Math.sin(state.clock.elapsedTime * 2.2) * 0.22;
      } else if (mastUnstowProgress >= 0.95) {
        nodes.head.rotation.y = THREE.MathUtils.lerp(nodes.head.rotation.y, 0, dt * 5.0);
      }
    }

    // 3. 5-DOF Robotic Arm & Coring Drill Animation
    if (nodes.arm003) {
      if (isScanning) {
        // Articulate arm forward towards target sample
        nodes.arm003.rotation.x = THREE.MathUtils.lerp(nodes.arm003.rotation.x, -0.62, dt * 3.5);
        nodes.arm003.rotation.y = THREE.MathUtils.lerp(nodes.arm003.rotation.y, 0.38, dt * 3.5);

        // Coring drill vibration phase (25% - 50%)
        if (scanProgress >= 25 && scanProgress < 50) {
          nodes.arm003.position.y = 0.915 + Math.sin(state.clock.elapsedTime * 55.0) * 0.007;
        } else {
          nodes.arm003.position.y = 0.915;
        }
      } else {
        // Return robotic arm safely into travel stowage cradle
        nodes.arm003.rotation.x = THREE.MathUtils.lerp(nodes.arm003.rotation.x, 0, dt * 4.0);
        nodes.arm003.rotation.y = THREE.MathUtils.lerp(nodes.arm003.rotation.y, 0, dt * 4.0);
        nodes.arm003.position.y = 0.915;
      }
    }

    // 4. Steerable High-Gain Dish Antenna Celestial Tracking
    if (nodes.antenna) {
      nodes.antenna.rotation.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.35;
      nodes.antenna.rotation.x = 0.2 + Math.cos(state.clock.elapsedTime * 0.08) * 0.12;
    }

    // 5. SuperCam LIBS Laser Pulser & Plasma Sparks
    if (isScanning && activeScanPOI && laserRef.current) {
      const posAttr = laserRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const targetLocalZ = Math.min(8.0, Math.max(2.5, 3.5 + Math.sin(state.clock.elapsedTime * 4.0) * 0.4));
      posAttr.setXYZ(1, 0, -0.3, targetLocalZ);
      posAttr.needsUpdate = true;

      if (sparkRef.current) {
        sparkRef.current.position.set(0, -0.3, targetLocalZ);
        const sPos = sparkRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < sparkCount; i++) {
          const sd = sparkData[i];
          sd.life = (sd.life + delta * 3.5) % 1.0;
          sPos[i * 3] = sd.vx * sd.life * 0.35;
          sPos[i * 3 + 1] = sd.vy * sd.life * 0.35 - 0.5 * 3.721 * sd.life * sd.life * 0.15;
          sPos[i * 3 + 2] = sd.vz * sd.life * 0.35;
        }
        sparkRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }
  });

  const isCleaning = subsystems.solarDustCleanProgress > 0 && subsystems.solarDustCleanProgress < 100;

  return (
    <group>
      {modelGroup ? (
        // NASA Mars 2020 Perseverance USDZ Model with dynamic articulated parts
        <group position={[0, -0.32, 0]}>
          <primitive object={modelGroup} />

          {/* Forward Hazcam LED Nav Floodlights */}
          <spotLight
            position={[0.35, 1.15, 1.25]}
            target-position={[0.35, 0, 9.0]}
            color="#fef08a"
            intensity={18}
            angle={0.65}
            penumbra={0.6}
            distance={22}
          />
          <spotLight
            position={[-0.35, 1.15, 1.25]}
            target-position={[-0.35, 0, 9.0]}
            color="#fef08a"
            intensity={18}
            angle={0.65}
            penumbra={0.6}
            distance={22}
          />

          {/* Deployable High-Efficiency Solar Array Wings */}
          <DeployableSolarArray
            isSolarCharging={isSolarCharging}
            isCleaning={isCleaning}
          />
        </group>
      ) : (
        // Clean loading silhouette while USDZ is being downloaded & parsed
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[1.6, 0.7, 2.5]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.8} wireframe />
          </mesh>
          <mesh position={[0, 1.2, 0.6]}>
            <cylinderGeometry args={[0.08, 0.08, 1.2, 8]} />
            <meshStandardMaterial color="#94a3b8" wireframe />
          </mesh>
        </group>
      )}

      {/* SuperCam LIBS Laser Pulser & Plasma Sparks during deep rock scans */}
      {isScanning && (
        <>
          <primitive
            object={
              new THREE.Line(
                laserGeo,
                new THREE.LineBasicMaterial({
                  color: '#38bdf8',
                  linewidth: 3,
                  transparent: true,
                  opacity: 0.9,
                })
              )
            }
            ref={laserRef}
          />
          <points geometry={sparkGeo} material={sparkMaterial} ref={sparkRef} />
        </>
      )}
    </group>
  );
};

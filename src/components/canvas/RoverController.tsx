'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useMissionStore } from '@/lib/store/useMissionStore';
import { getTerrainHeight, getTerrainNormal } from '@/lib/physics/terrainHeight';
import { resolveRoverCollisions, getRockElevationAt } from '@/lib/physics/rockObstacles';
import { getMotherShipRampSurfaceY } from './MotherShipLander';
import { soundEngine } from '@/lib/audio/soundManager';
import { RoverModel } from './RoverModel';

// Authentic Mars Physical Constants
const G_MARS = 3.721; // m/s^2 (38% of Earth gravity)
const ROVER_MASS = 1025.0; // kg (NASA Perseverance flight mass)
const ROVER_COLLISION_RADIUS = 1.35; // meters
const AXLE_HALF_LENGTH = 1.15; // wheelbase front/rear
const TRACK_HALF_WIDTH = 1.15; // track width left/right

export const RoverController: React.FC = () => {
  const roverGroupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Inputs
  const keys = useRef<{
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    brake: boolean;
  }>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
  });

  // Physical State Variables (Rigid Body & Terramechanics)
  const velocity = useRef(0); // longitudinal speed in m/s
  const verticalVel = useRef(0); // vertical velocity in m/s (gravity)
  const yaw = useRef(0); // heading in radians
  const pitch = useRef(0); // chassis pitch in radians
  const roll = useRef(0); // chassis roll in radians
  const steering = useRef(0); // current front/rear steering angle
  const wheelTurn = useRef(0); // accumulated wheel rotation

  // Camera Orbit & Cursor Look Controls
  const camOrbitYaw = useRef(0); // azimuth offset relative to rover heading (radians)
  const camOrbitPitch = useRef(0.28); // elevation angle (radians, ~16 degrees)
  const camDistance = useRef(6.8); // distance from rover (meters)
  const isDragging = useRef(false);
  const lastPointerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastMouseInteractionTime = useRef(0);

  // Store state
  const setRoverPosition = useMissionStore((s) => s.setRoverPosition);
  const cameraMode = useMissionStore((s) => s.cameraMode);
  const isScanning = useMissionStore((s) => s.isScanning);
  const scanProgress = useMissionStore((s) => s.scanProgress);
  const updateScanProgress = useMissionStore((s) => s.updateScanProgress);
  const completeDeepScan = useMissionStore((s) => s.completeDeepScan);
  const activeScanPOI = useMissionStore((s) => s.activeScanPOI);
  const pois = useMissionStore((s) => s.pois);
  const startDeepScan = useMissionStore((s) => s.startDeepScan);
  const openModal = useMissionStore((s) => s.openModal);
  const activeModal = useMissionStore((s) => s.activeModal);
  const closeModal = useMissionStore((s) => s.closeModal);
  const currentBiome = useMissionStore((s) => s.env.currentBiome);
  const drainBattery = useMissionStore((s) => s.drainBattery);
  const isHibernating = useMissionStore((s) => s.rover.isHibernating);
  const isSolarCharging = useMissionStore((s) => s.isSolarCharging);
  const toggleSolarCharging = useMissionStore((s) => s.toggleSolarCharging);
  const motherShip = useMissionStore((s) => s.motherShip);
  const checkMotherShipProximity = useMissionStore((s) => s.checkMotherShipProximity);
  const deployment = useMissionStore((s) => s.deployment);
  const updateDeploymentProgress = useMissionStore((s) => s.updateDeploymentProgress);
  const skipDeployment = useMissionStore((s) => s.skipDeployment);
  const env = useMissionStore((s) => s.env);
  const triggerDustCleaning = useMissionStore((s) => s.triggerDustCleaning);

  const [steerAngleDisplay, setSteerAngleDisplay] = useState(0);
  const [wheelTurnDisplay, setWheelTurnDisplay] = useState(0);
  const [mastUnstowDisplay, setMastUnstowDisplay] = useState(deployment.status === 'deployed' ? 1.0 : 0.0);

  // Sync rover group position when deployed
  useEffect(() => {
    if (deployment.status === 'deployed' && roverGroupRef.current) {
      const p = useMissionStore.getState().rover.position;
      roverGroupRef.current.position.set(p[0], p[1], p[2]);
    }
  }, [deployment.status]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      soundEngine.init();

      // Space or Enter or W skips active deployment sequence to drive-ready state
      if (deployment.status !== 'deployed') {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyW') {
          skipDeployment();
          setMastUnstowDisplay(1.0);
          return;
        }
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          if (useMissionStore.getState().rover.battery <= 0.05) {
            soundEngine.playBatteryDepletedAlarm();
            return;
          }
          if (isSolarCharging) toggleSolarCharging();
          keys.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          if (useMissionStore.getState().rover.battery <= 0.05) {
            soundEngine.playBatteryDepletedAlarm();
            return;
          }
          if (isSolarCharging) toggleSolarCharging();
          keys.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          if (useMissionStore.getState().rover.battery <= 0.05) {
            soundEngine.playBatteryDepletedAlarm();
            return;
          }
          keys.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          if (useMissionStore.getState().rover.battery <= 0.05) {
            soundEngine.playBatteryDepletedAlarm();
            return;
          }
          keys.current.right = true;
          break;
        case 'Space':
          keys.current.brake = true;
          break;
        case 'KeyP':
          toggleSolarCharging();
          break;
        case 'KeyE':
          if (motherShip.isDocked) {
            openModal('mothership');
          }
          break;
        case 'KeyF':
          if (!isScanning) {
            const currentPos = roverGroupRef.current?.position;
            if (currentPos) {
              const nearby = pois.find((p) => {
                const dx = currentPos.x - p.position[0];
                const dz = currentPos.z - p.position[2];
                return Math.sqrt(dx * dx + dz * dz) < 16.0;
              });
              if (nearby && !nearby.sampleCollected) {
                startDeepScan(nearby);
              }
            }
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (activeModal === 'tablet') {
            closeModal();
          } else {
            openModal('tablet');
          }
          break;
        case 'KeyC':
          const nextCam = cameraMode === 'follow' ? 'orbit' : cameraMode === 'orbit' ? 'cockpit' : 'follow';
          useMissionStore.getState().setCameraMode(nextCam);
          break;
        case 'KeyH':
        case 'KeyV':
          useMissionStore.getState().toggleCinematicHUD();
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = false;
          break;
        case 'Space':
          keys.current.brake = false;
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isScanning, pois, startDeepScan, activeModal, openModal, closeModal, cameraMode, isSolarCharging, toggleSolarCharging, motherShip, deployment, skipDeployment]);

  // Mouse & Pointer Orbit Look Listeners (Drag to rotate, canvas click to mouse-look, scroll to zoom)
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      // Do not trigger camera orbit drag when clicking interactive UI elements
      if (target?.closest('button, input, select, textarea, a, [role="button"], .pointer-events-auto')) {
        return;
      }
      isDragging.current = true;
      lastPointerPos.current = { x: e.clientX, y: e.clientY };

      // Clicking directly on the 3D scene requests pointer lock for full standard game mouse-look
      if (target?.tagName === 'CANVAS' && !activeModal) {
        try {
          target.requestPointerLock?.();
        } catch {
          // Ignore any browser pointer lock restrictions
        }
      }
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const isLocked = typeof document !== 'undefined' && document.pointerLockElement !== null;

      if (isLocked) {
        // High-precision pointer-lock mouse look
        const dx = e.movementX || 0;
        const dy = e.movementY || 0;
        camOrbitYaw.current -= dx * 0.0035;
        camOrbitPitch.current = Math.min(1.22, Math.max(-0.12, camOrbitPitch.current + dy * 0.0035));
        lastMouseInteractionTime.current = performance.now();
      } else if (isDragging.current) {
        // Drag-to-orbit camera angle
        const dx = e.clientX - lastPointerPos.current.x;
        const dy = e.clientY - lastPointerPos.current.y;
        lastPointerPos.current = { x: e.clientX, y: e.clientY };
        camOrbitYaw.current -= dx * 0.0048;
        camOrbitPitch.current = Math.min(1.22, Math.max(-0.12, camOrbitPitch.current + dy * 0.0048));
        lastMouseInteractionTime.current = performance.now();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.overflow-y-auto, .overflow-auto')) return;
      camDistance.current = Math.min(22.0, Math.max(3.5, camDistance.current + e.deltaY * 0.008));
    };

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'CANVAS') {
        e.preventDefault();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [activeModal]);

  // Exit pointer lock when opening modals so UI navigation is seamless
  useEffect(() => {
    if (activeModal && typeof document !== 'undefined' && document.pointerLockElement) {
      document.exitPointerLock?.();
    }
  }, [activeModal]);

  // Main Martian Physics & Terramechanics Simulation Frame Loop
  useFrame((_, delta) => {
    if (!roverGroupRef.current) return;

    // 1. Science Deep Scan & Coring Procedure Progression
    if (isScanning && activeScanPOI) {
      const nextProgress = scanProgress + delta * 18;
      if (nextProgress >= 100) {
        completeDeepScan();
      } else {
        updateScanProgress(nextProgress);
        // Phase 2 (25-50%): Coring drill abrasion against rock
        if (nextProgress >= 25 && nextProgress < 50) {
          if (Math.random() < 0.45) soundEngine.playCoringDrill();
        } else if (nextProgress >= 50 && nextProgress < 85) {
          // Phase 3 (50-85%): Raman LIBS laser spectroscopic pulses
          if (Math.random() < 0.35) soundEngine.playScanLaserPulse();
        }
      }
    }

    const dt = Math.min(0.08, delta);

    // ================= REAL-LIFE MOTHER SHIP EGRESS PHYSICS SEQUENCE =================
    if (deployment.status !== 'deployed') {
      const DEPLOY_DURATION = 12.0; // 12-second authentic NASA egress sequence
      const nextP = Math.min(1.0, deployment.progress + dt / DEPLOY_DURATION);

      let curStatus: 'stowed' | 'unstowing' | 'egressing' | 'deployed' = deployment.status;
      let logMsg = deployment.telemetryLog;
      const depX = 0;
      let depZ = -23.5;
      let depPitch = 0;
      let curSteer = 0;
      let curSpeed = 0;
      let curMastP = 0;

      const groundLanderY = getTerrainHeight(0, -25);
      const deckY = groundLanderY + 1.14;
      const groundFootY = getTerrainHeight(0, -16.8);
      // Slope of dual titanium egress ramps
      const rampSlopePitch = Math.atan2(groundFootY - deckY, 6.7);

      if (nextP < 0.20) {
        // Stage 1: Pyrotechnic Retention Release
        curStatus = 'stowed';
        curMastP = 0.0;
        depZ = -23.5;
        depPitch = 0.0;
        logMsg = 'NASA EDL FLIGHT OPS: PYROTECHNIC BOLTS FIRED // TRANSPORT CRADLE RELEASE';
        if (nextP > 0.08 && deployment.progress <= 0.08) {
          soundEngine.playQuindarTone(false);
        }
      } else if (nextP < 0.44) {
        // Stage 2: Remote Sensing Mast (RSM) Un-stow
        curStatus = 'unstowing';
        curMastP = THREE.MathUtils.smoothstep(nextP, 0.20, 0.42);
        depZ = -23.5;
        depPitch = 0.0;
        logMsg = `RSM MAST UN-STOWING: ${Math.round(curMastP * 100)}% // SUPERCAM & MASTCAM-Z CALIBRATION`;
        if (nextP > 0.40 && deployment.progress <= 0.40) {
          soundEngine.playTelemetrySuccess();
        }
      } else if (nextP < 0.52) {
        // Stage 3: Mobility Steering Actuator Pre-Drive Sweep (NASA Flight Checklist)
        curStatus = 'unstowing';
        curMastP = 1.0;
        depZ = -23.5;
        depPitch = 0.0;
        const sweepP = (nextP - 0.44) / (0.52 - 0.44);
        curSteer = Math.sin(sweepP * Math.PI * 2) * 0.28;
        logMsg = 'MOBILITY CHECK: 6-WHEEL DRIVE & STEERING ACTUATORS ENERGIZED // CLEARED FOR EGRESS';
      } else if (nextP < 0.88) {
        // Stage 4: Dual Titanium Egress Ramp Descent
        curStatus = 'egressing';
        curMastP = 1.0;
        const rampT = (nextP - 0.52) / (0.88 - 0.52);
        depZ = THREE.MathUtils.lerp(-23.5, -16.8, rampT);
        curSpeed = 0.28; // authentic steady egress velocity in m/s
        wheelTurn.current += (curSpeed / 0.32) * dt;
        depPitch = rampSlopePitch; // rover tilts downward matching ramp pitch
        logMsg = `RAMP EGRESS: DESCENT SPEED 0.28 M/S // SLOPE ${Math.round((rampSlopePitch * 180) / Math.PI)}°`;
        if (Math.random() < 0.08) {
          soundEngine.playGravelCrunch();
        }
      } else if (nextP < 1.0) {
        // Stage 5: Martian Regolith Touchdown & Suspension Settlement
        curStatus = 'egressing';
        curMastP = 1.0;
        const soilT = (nextP - 0.88) / (1.0 - 0.88);
        depZ = THREE.MathUtils.lerp(-16.8, -15.0, soilT);
        curSpeed = 0.22;
        wheelTurn.current += (curSpeed / 0.32) * dt;
        depPitch = THREE.MathUtils.lerp(rampSlopePitch, 0.0, soilT);
        logMsg = 'TOUCHDOWN CONFIRMED: 6-WHEEL CONTACT ON MARTIAN REGOLITH // EGRESS COMPLETE';
        if (nextP > 0.90 && deployment.progress <= 0.90) {
          soundEngine.playQuindarTone(true);
        }
      } else {
        // Stage 6: Egress Complete -> Hand-off to player
        skipDeployment();
        setMastUnstowDisplay(1.0);
        yaw.current = 0;
        pitch.current = 0;
        roll.current = 0;
        velocity.current = 0;
        verticalVel.current = 0;
        return;
      }

      // Exact surface elevation from ramp/deck with zero penetration
      const rampSurf = getMotherShipRampSurfaceY(depX, depZ);
      const groundAtPos = getTerrainHeight(depX, depZ);
      const surfaceY = rampSurf !== null ? rampSurf : groundAtPos;
      const depY = surfaceY + 0.64;

      roverGroupRef.current.position.set(depX, depY, depZ);
      const deployQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(-depPitch, 0, 0, 'YXZ')
      );
      roverGroupRef.current.quaternion.copy(deployQuat);

      yaw.current = 0;
      pitch.current = depPitch;
      roll.current = 0;
      velocity.current = curSpeed;

      setMastUnstowDisplay(curMastP);
      setSteerAngleDisplay(curSteer);
      setWheelTurnDisplay(wheelTurn.current);

      updateDeploymentProgress(curStatus, nextP, logMsg);

      // Cinematic Multi-Camera Orchestration during Egress (Unobstructed angles)
      if (cameraMode === 'orbit') {
        // OrbitHandler controls camera freely when user selects Orbit mode
      } else if (nextP < 0.44) {
        // Hero shot from the side-front of the Mother Ship cradle deck
        // Pulled back and up slightly so the whole lander, rocket, and rover are elegantly framed
        const camTarget = new THREE.Vector3(4.4, deckY + 2.2, -20.2);
        camera.position.lerp(camTarget, dt * 3.5);
        camera.lookAt(0, deckY + 0.9, -23.5);
      } else if (nextP < 0.84) {
        // Low-angle ramp front shot looking up at rover descending down titanium tracks
        const camTarget = new THREE.Vector3(-3.4, groundFootY + 1.4, -12.2);
        camera.position.lerp(camTarget, dt * 3.5);
        camera.lookAt(depX, depY + 0.4, depZ);
      } else {
        // Seamless glide to standard follow camera view
        const targetCamX = depX;
        const targetCamY = depY + 2.1;
        const targetCamZ = depZ - 6.8;
        camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), dt * 4.0);
        camera.lookAt(depX, depY + 1.1, depZ + 6.0);
      }

      setRoverPosition(
        [depX, depY, depZ],
        0,
        Math.round((depPitch * 180) / Math.PI),
        0,
        Number(curSpeed.toFixed(2))
      );

      return;
    }

    const currentX = roverGroupRef.current.position.x;
    const currentY = roverGroupRef.current.position.y;
    const currentZ = roverGroupRef.current.position.z;

    // 2. Terrain Normal & Downhill Martian Gravitational Force
    const normal = getTerrainNormal(currentX, currentZ);
    const forwardX = Math.sin(yaw.current);
    const forwardZ = Math.cos(yaw.current);
    const rightX = Math.cos(yaw.current);
    const rightZ = -Math.sin(yaw.current);

    // Downhill gravity acceleration vector: a = -g * (Nx, Nz)
    const gravityAccelX = -G_MARS * normal[0];
    const gravityAccelZ = -G_MARS * normal[2];
    // Downhill acceleration projected along rover's forward axis
    const slopeGravityAccel = gravityAccelX * forwardX + gravityAccelZ * forwardZ;

    // 3. Regolith Terramechanics by Biome (Soil Cohesion, Wheel Sinkage, Slip)
    let maxSpeed = 5.6; // flat bedrock top speed
    let motorAccel = 4.5; // m/s^2
    let rollingDrag = 2.4; // friction resistance
    let regolithSinkage = 0.0;
    let slipFactor = 1.0;

    if (currentBiome === 'Dunes') {
      // Loose aeolian basalt sand dunes (high slip, lower speed, deep sinkage)
      maxSpeed = 3.4;
      motorAccel = 2.6;
      rollingDrag = 4.2;
      regolithSinkage = 0.055;
      slipFactor = 1.35; // wheels slip 35%
    } else if (currentBiome === 'Delta') {
      // Stratified lacustrine mudstone
      maxSpeed = 5.8;
      motorAccel = 4.8;
      rollingDrag = 2.2;
      regolithSinkage = 0.01;
      slipFactor = 1.05;
    } else if (currentBiome === 'Escarpment') {
      // Rocky rubble slope
      maxSpeed = 4.8;
      motorAccel = 3.8;
      rollingDrag = 3.0;
      regolithSinkage = 0.02;
    }

    // 4. Steering Dynamics (A = Left, D = Right)
    const steerSpeed = 3.8;
    const maxSteer = 0.52; // ~30 degrees
    let targetSteer = 0;
    const currentBattery = useMissionStore.getState().rover.battery;
    const isBatteryDepleted = currentBattery <= 0.05;

    if (!isHibernating && !isSolarCharging && !isBatteryDepleted) {
      if (keys.current.left) targetSteer += maxSteer;  // 'A' turns LEFT
      if (keys.current.right) targetSteer -= maxSteer; // 'D' turns RIGHT
    }
    steering.current = THREE.MathUtils.lerp(steering.current, targetSteer, dt * steerSpeed);

    // 5. Motor Throttle & Gravity Integration
    let throttle = 0;
    if (!isHibernating && !isScanning && !isSolarCharging && !isBatteryDepleted) {
      if (keys.current.forward) throttle += 1.0;
      if (keys.current.backward) throttle -= 0.65;
    }

    if (keys.current.brake || isHibernating || isSolarCharging || isBatteryDepleted) {
      velocity.current = THREE.MathUtils.lerp(velocity.current, 0, dt * 9.0);
    } else if (throttle !== 0) {
      // Net acceleration = Motor force + Gravity downhill pull - Rolling drag
      const netAccel = throttle * motorAccel + slopeGravityAccel;
      velocity.current += netAccel * dt;
      velocity.current = THREE.MathUtils.clamp(velocity.current, -maxSpeed * 0.5, maxSpeed);

      // Battery drain based on motor load (climbing uphill in sand draws more current)
      const slopeLoad = Math.max(0, -slopeGravityAccel * 0.15);
      drainBattery(dt * (0.065 + (currentBiome === 'Dunes' ? 0.05 : 0.0) + slopeLoad * 0.1));
    } else {
      // Coasting: gravity can pull rover down hills or rolling drag brings it to rest
      if (Math.abs(slopeGravityAccel) > 0.8) {
        velocity.current += slopeGravityAccel * dt * 0.75;
      }
      velocity.current = THREE.MathUtils.lerp(velocity.current, 0, dt * rollingDrag);
    }

    // 6. Heading Update (Ackermann Steering Geometry)
    if (Math.abs(velocity.current) > 0.03) {
      const turnRate = (velocity.current / 2.3) * Math.sin(steering.current);
      yaw.current += turnRate * dt;
      wheelTurn.current += (velocity.current / 0.32) * slipFactor * dt;

      // Audio: gravel and regolith crunch
      soundEngine.playGravelCrunch();
    }

    // Update electric servo motor sound pitch
    soundEngine.updateMotor(velocity.current / maxSpeed);

    // 7. Plan Candidate Displacement
    let candidateX = currentX + forwardX * velocity.current * dt;
    let candidateZ = currentZ + forwardZ * velocity.current * dt;

    // 8a. Steep Slope & Cliff Face Collision Barrier (Terramechanics max limit 30°)
    const currentElevation = getTerrainHeight(currentX, currentZ);
    const candidateElevation = getTerrainHeight(candidateX, candidateZ);
    const deltaElev = candidateElevation - currentElevation;
    const horizDist = Math.hypot(candidateX - currentX, candidateZ - currentZ);

    if (horizDist > 0.0001) {
      const slopeGradient = deltaElev / horizDist;
      // Slopes > 30° cannot be climbed (tangent ≈ 0.58). Impassable rock wall barrier!
      if (slopeGradient > 0.58) {
        candidateX = currentX;
        candidateZ = currentZ;
        velocity.current = Math.min(0, velocity.current * 0.1);
      }
    }

    // 8b. Martian Atmospheric Dust Vortex Physical Force Field
    if (env.dustDevilActive && env.dustDevilVortexPos) {
      const vPos = env.dustDevilVortexPos;
      const dxV = candidateX - vPos[0];
      const dzV = candidateZ - vPos[2];
      const distV = Math.hypot(dxV, dzV);

      if (distV < 34.0 && distV > 0.2) {
        const normDist = distV / 34.0;
        const vortexPower = (1.0 - normDist) * 1.8;
        // Tangential cyclonic rotation vector + inward updraft suction
        const tangX = -dzV / distV;
        const tangZ = dxV / distV;
        const inX = -dxV / distV;
        const inZ = -dzV / distV;

        candidateX += (tangX * 0.85 + inX * 0.25) * vortexPower * dt;
        candidateZ += (tangZ * 0.85 + inZ * 0.25) * vortexPower * dt;

        // Dynamic chassis suspension buffeting
        roll.current += (Math.random() - 0.5) * (1.0 - normDist) * 0.08;
        pitch.current += (Math.random() - 0.5) * (1.0 - normDist) * 0.06;

        // Direct pass-over: cleans solar panel wings of dust
        if (distV < 14.0) {
          triggerDustCleaning();
        }
      }
    }

    // 8c. NASA MEDA Ambient Wind Vector Drag
    if (env.windSpeedMs > 5.0) {
      const windRad = (env.windDirectionDeg * Math.PI) / 180;
      const windVecX = -Math.sin(windRad);
      const windVecZ = -Math.cos(windRad);
      const windPush = (env.windSpeedMs / 25.0) * (env.weatherState === 'Regional Dust Storm' ? 0.35 : 0.08);
      candidateX += windVecX * windPush * dt;
      candidateZ += windVecZ * windPush * dt;
    }

    // 8d. Physical Rock & POI Outcrop Collision Resolution (ZERO PASS-THROUGH)
    const collision = resolveRoverCollisions(
      candidateX,
      candidateZ,
      forwardX * velocity.current,
      forwardZ * velocity.current,
      ROVER_COLLISION_RADIUS
    );

    candidateX = collision.x;
    candidateZ = collision.z;

    if (collision.collided) {
      // Re-project velocity along the rover's heading after obstacle deflection
      const resolvedForwardSpeed = collision.vx * forwardX + collision.vz * forwardZ;
      velocity.current = Math.max(0, resolvedForwardSpeed * 0.4); // eliminate inward penetration momentum

      // Play authentic mechanical / geological rock impact sound
      if (collision.impactSpeed > 0.3) {
        soundEngine.playRockImpact(collision.impactSpeed);
      }
    }

    // 9. Planetary Martian Exploration Boundary (Full Mars: R <= 4,150m)
    const distFromCenter = Math.sqrt(candidateX * candidateX + candidateZ * candidateZ);
    const maxSafeRadius = 4150;
    if (distFromCenter > maxSafeRadius) {
      candidateX = (candidateX / distFromCenter) * maxSafeRadius;
      candidateZ = (candidateZ / distFromCenter) * maxSafeRadius;
      velocity.current *= 0.8;
    }

    // Check Mother Ship Lander Docking Proximity
    checkMotherShipProximity([candidateX, currentY, candidateZ]);

    // 10. Rocker-Bogie 6-Wheel Terrain & Rock Contact Kinematics
    // Sample contact heights at all 6 wheels (including ramp, small rock and slab elevations)
    const sampleWheelElevation = (wx: number, wz: number) => {
      const rampElevation = getMotherShipRampSurfaceY(wx, wz);
      if (rampElevation !== null) {
        return rampElevation;
      }
      const ground = getTerrainHeight(wx, wz);
      const rockBump = getRockElevationAt(wx, wz);
      return ground + rockBump - regolithSinkage;
    };

    const wFL_x = candidateX + forwardX * AXLE_HALF_LENGTH - rightX * TRACK_HALF_WIDTH;
    const wFL_z = candidateZ + forwardZ * AXLE_HALF_LENGTH - rightZ * TRACK_HALF_WIDTH;

    const wFR_x = candidateX + forwardX * AXLE_HALF_LENGTH + rightX * TRACK_HALF_WIDTH;
    const wFR_z = candidateZ + forwardZ * AXLE_HALF_LENGTH + rightZ * TRACK_HALF_WIDTH;

    const wML_x = candidateX - rightX * (TRACK_HALF_WIDTH + 0.1);
    const wML_z = candidateZ - rightZ * (TRACK_HALF_WIDTH + 0.1);

    const wMR_x = candidateX + rightX * (TRACK_HALF_WIDTH + 0.1);
    const wMR_z = candidateZ + rightZ * (TRACK_HALF_WIDTH + 0.1);

    const wRL_x = candidateX - forwardX * AXLE_HALF_LENGTH - rightX * TRACK_HALF_WIDTH;
    const wRL_z = candidateZ - forwardZ * AXLE_HALF_LENGTH - rightZ * TRACK_HALF_WIDTH;

    const wRR_x = candidateX - forwardX * AXLE_HALF_LENGTH + rightX * TRACK_HALF_WIDTH;
    const wRR_z = candidateZ - forwardZ * AXLE_HALF_LENGTH + rightZ * TRACK_HALF_WIDTH;

    const hFL = sampleWheelElevation(wFL_x, wFL_z);
    const hFR = sampleWheelElevation(wFR_x, wFR_z);
    const hML = sampleWheelElevation(wML_x, wML_z);
    const hMR = sampleWheelElevation(wMR_x, wMR_z);
    const hRL = sampleWheelElevation(wRL_x, wRL_z);
    const hRR = sampleWheelElevation(wRR_x, wRR_z);

    // NASA Rocker-Bogie Linkage Mechanics for Pitch & Roll:
    const hBogieL = (hML + hRL) * 0.5;
    const hBogieR = (hMR + hRR) * 0.5;
    const hRockerL = hFL * 0.45 + hBogieL * 0.55;
    const hRockerR = hFR * 0.45 + hBogieR * 0.55;

    // Chassis Pitch & Roll Orientation
    const targetPitch = Math.atan2((hFL + hFR) * 0.5 - (hRL + hRR) * 0.5, 2.3);
    const targetRoll = Math.atan2(hRockerR - hRockerL, 2.3);

    pitch.current = THREE.MathUtils.lerp(pitch.current, targetPitch, dt * 10.0);
    roll.current = THREE.MathUtils.lerp(roll.current, targetRoll, dt * 10.0);

    const targetQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(-pitch.current, yaw.current, roll.current, 'YXZ')
    );

    // ZERO WHEEL SINKAGE KINEMATIC RESOLUTION:
    // Determine the exact required chassis Y so that every wheel bottom rests ON or ABOVE ground
    const wheelLocalContacts = [
      new THREE.Vector3(-TRACK_HALF_WIDTH, -0.64, AXLE_HALF_LENGTH),  // FL
      new THREE.Vector3(TRACK_HALF_WIDTH, -0.64, AXLE_HALF_LENGTH),   // FR
      new THREE.Vector3(-TRACK_HALF_WIDTH - 0.1, -0.64, 0),           // ML
      new THREE.Vector3(TRACK_HALF_WIDTH + 0.1, -0.64, 0),            // MR
      new THREE.Vector3(-TRACK_HALF_WIDTH, -0.64, -AXLE_HALF_LENGTH), // RL
      new THREE.Vector3(TRACK_HALF_WIDTH, -0.64, -AXLE_HALF_LENGTH),  // RR
    ];

    let maxRequiredChassisY = -Infinity;
    for (const localOffset of wheelLocalContacts) {
      const worldRotated = localOffset.clone().applyQuaternion(targetQuat);
      const wx = candidateX + worldRotated.x;
      const wz = candidateZ + worldRotated.z;
      const groundAtWheel = sampleWheelElevation(wx, wz);
      // required Y = ground - worldRotated.y
      const neededY = groundAtWheel - worldRotated.y;
      if (neededY > maxRequiredChassisY) {
        maxRequiredChassisY = neededY;
      }
    }

    const targetChassisY = maxRequiredChassisY;

    // 11. Vertical Dynamics & Martian Gravitational Force (Fall / Land)
    let newY = currentY;
    if (currentY > targetChassisY + 0.02) {
      // Free falling under Mars low gravity: v = v - g_mars * dt
      verticalVel.current -= G_MARS * dt;
      newY += verticalVel.current * dt;
      if (newY <= targetChassisY) {
        newY = targetChassisY;
        verticalVel.current = 0;
        soundEngine.playGravelCrunch();
      }
    } else {
      // Grounded: suspension settling towards target non-penetrating elevation
      verticalVel.current = 0;
      newY = THREE.MathUtils.lerp(currentY, targetChassisY, dt * 14.0);
    }

    const pitchDeg = Math.round((pitch.current * 180) / Math.PI);
    const rollDeg = Math.round((roll.current * 180) / Math.PI);

    // Apply 3D position and orientation
    roverGroupRef.current.position.set(candidateX, newY, candidateZ);
    roverGroupRef.current.quaternion.slerp(targetQuat, dt * 12.0);

    // 13. Synchronize Telemetry with Zustand Store
    setRoverPosition(
      [candidateX, newY, candidateZ],
      yaw.current,
      pitchDeg,
      rollDeg,
      Number(velocity.current.toFixed(2))
    );

    setSteerAngleDisplay(steering.current);
    setWheelTurnDisplay(wheelTurn.current);

    // 14. Dynamic Camera Tracking Modes (Interactive Cursor Angle & Zoom)
    if (cameraMode === 'follow' || cameraMode === 'orbit') {
      const now = performance.now();
      // Smooth auto-realign behind rover if driving forward/backward and user hasn't moved mouse recently
      if (
        (keys.current.forward || keys.current.backward) &&
        now - lastMouseInteractionTime.current > 1400
      ) {
        camOrbitYaw.current = THREE.MathUtils.lerp(camOrbitYaw.current, 0, dt * 2.2);
        camOrbitPitch.current = THREE.MathUtils.lerp(camOrbitPitch.current, 0.28, dt * 2.2);
      }

      const totalYaw = yaw.current + camOrbitYaw.current;
      const pitchAngle = camOrbitPitch.current;
      const dist = camDistance.current;

      const horizDist = dist * Math.cos(pitchAngle);
      const vertDist = dist * Math.sin(pitchAngle);

      const targetCamX = candidateX - Math.sin(totalYaw) * horizDist;
      const targetCamZ = candidateZ - Math.cos(totalYaw) * horizDist;

      // Real-time terrain clearance so camera never sinks below the surface
      const groundAtCam = getTerrainHeight(targetCamX, targetCamZ);
      const targetCamY = Math.max(groundAtCam + 0.65, newY + 1.1 + vertDist);

      camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), Math.min(1.0, dt * 10.0));

      const lookTarget = new THREE.Vector3(
        candidateX + Math.sin(totalYaw) * 1.5,
        newY + 1.1 + Math.sin(pitchAngle) * 0.35,
        candidateZ + Math.cos(totalYaw) * 1.5
      );
      camera.lookAt(lookTarget);
    } else if (cameraMode === 'cockpit') {
      // Mastcam-Z stereo camera viewpoint with interactive pan/tilt look
      const mastHeadWorldX = candidateX + forwardX * 0.72 + rightX * 0.42;
      const mastHeadWorldY = newY + 1.82;
      const mastHeadWorldZ = candidateZ + forwardZ * 0.72 - rightZ * 0.42;
      camera.position.set(mastHeadWorldX, mastHeadWorldY, mastHeadWorldZ);

      const totalYaw = yaw.current + camOrbitYaw.current;
      const lookPitch = camOrbitPitch.current - 0.25;
      const lookDist = 20.0;
      const lookTarget = new THREE.Vector3(
        mastHeadWorldX + Math.sin(totalYaw) * Math.cos(lookPitch) * lookDist,
        mastHeadWorldY + Math.sin(lookPitch) * lookDist,
        mastHeadWorldZ + Math.cos(totalYaw) * Math.cos(lookPitch) * lookDist
      );
      camera.lookAt(lookTarget);
    }
  });

  return (
    <group ref={roverGroupRef} position={[0, 1.82, -23.5]}>
      <RoverModel
        steeringAngle={steerAngleDisplay}
        wheelRotation={wheelTurnDisplay}
        isScanning={isScanning}
        scanProgress={scanProgress}
        isSolarCharging={isSolarCharging}
        mastUnstowProgress={mastUnstowDisplay}
      />
    </group>
  );
};

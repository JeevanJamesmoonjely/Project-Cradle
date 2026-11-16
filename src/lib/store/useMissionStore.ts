import { create } from 'zustand';
import { INITIAL_POIS, INITIAL_OBJECTIVES } from '../science/poiData';
import { GeologicalPOI, MissionObjective, BiomeType } from '../science/types';
import { soundEngine } from '../audio/soundManager';
import { REAL_NASA_SOL_DATASETS, calculateMedaAtmosphericTelemetry } from '../science/medaWeatherData';
import { calculateMartianMoonEphemeris, MoonTelemetry } from '../science/martianMoons';

export interface RoverTelemetry {
  position: [number, number, number];
  rotation: number; // yaw in radians
  pitch: number; // in degrees
  roll: number; // in degrees
  speed: number; // in m/s
  wheelSlip: number; // 0 to 1
  battery: number; // 0 to 100 %
  solarWatts: number; // 0 to 600 W
  consumptionWatts: number; // 80 W idle, up to 450 W
  motorTemp: number; // degrees Celsius
  storageUsedMB: number; // in MB
  storageMaxMB: number; // 32000 MB
  dsnSignalDb: number; // -110 dBm
  inclineWarning: boolean;
  batteryWarning: boolean;
  isHibernating: boolean;
}

export interface EnvironmentState {
  timeOfDay: number; // 0.0 to 24.0 Sol hours
  timeSpeed: number; // multiplier
  solNumber: number; // e.g. 412
  solarLongitudeLs: number; // e.g. 18.4 degrees
  seasonName: string; // e.g. "Late Northern Spring"
  dustTau: number; // optical depth (0.32 to 2.45)
  ambientTemp: number; // air temp at 1.5m (°C)
  groundTemp: number; // ground surface temp via TIR (°C)
  pressurePa: number; // atmospheric pressure in Pascals (e.g. 748 Pa)
  pressureHpa: number; // in hPa (e.g. 7.48 hPa)
  pressureTrend: 'Rising' | 'Falling' | 'Stable';
  windSpeedMs: number; // in m/s
  windGustMs: number; // in m/s
  windDirectionDeg: number; // 0 to 360 deg
  windCompass: string; // "N", "SSE", etc.
  relativeHumidityPct: number; // %
  uvIndex: number;
  solarInsolationWatts: number;
  dustDevilActive: boolean;
  dustDevilDistance: number; // distance in meters from rover
  dustDevilDist: number; // alias
  dustDevilVortexPos: [number, number, number];
  dustDevilPos: [number, number, number]; // alias
  currentBiome: BiomeType;
  weatherState: 'Clear' | 'Dust Haze' | 'Regional Dust Storm';
  selectedSolProfile: string; // 'sol412' | 'sol540' | 'sol670' | 'sol890'
  activeWeatherAlert: WeatherAlert | null;
  moons: {
    phobos: MoonTelemetry;
    deimos: MoonTelemetry;
  };
}

export interface WeatherAlert {
  type: 'vortex' | 'dust_storm' | 'frost' | 'wind';
  title: string;
  message: string;
  description?: string;
  recommendation?: string;
  severity: 'warning' | 'critical' | 'advisory';
}

export interface MissionStore {
  // Rover Telemetry
  rover: RoverTelemetry;
  setRoverPosition: (pos: [number, number, number], rot: number, pitch?: number, roll?: number, speed?: number) => void;
  drainBattery: (amount: number) => void;
  chargeBattery: (amount: number) => void;
  toggleHibernation: () => void;

  // Environment & NASA MEDA Weather Telemetry
  env: EnvironmentState;
  updateTime: (deltaSeconds: number) => void;
  setTimeSpeed: (speed: number) => void;
  setWeather: (state: 'Clear' | 'Dust Haze' | 'Regional Dust Storm') => void;
  setSolProfile: (profileId: string) => void;
  setDustDevilProximity: (dist: number, pos: [number, number, number]) => void;
  toggleDustDevil: () => void;

  // Science & POIs
  pois: GeologicalPOI[];
  sciencePoints: number;
  activeScanPOI: GeologicalPOI | null;
  selectedDossierPOI: GeologicalPOI | null;
  isScanning: boolean;
  scanProgress: number;
  startDeepScan: (poi: GeologicalPOI) => void;
  updateScanProgress: (progress: number) => void;
  completeDeepScan: () => void;
  collectSample: (poiId: string) => void;
  downlinkTelemetry: (poiId: string) => void;
  downlinkAllData: () => void;

  // Solar Power-Up & Mother Ship
  isSolarCharging: boolean;
  toggleSolarCharging: () => void;
  motherShip: {
    position: [number, number, number];
    samplesDeposited: number;
    dataTransmitted: number;
    isDocked: boolean;
    lastSubmission: { samples: number; data: number; reward: number } | null;
  };
  submitToMotherShip: () => void;
  checkMotherShipProximity: (roverPos: [number, number, number]) => void;

  // Real-life Deployment Sequence from Mother Ship
  deployment: {
    status: 'stowed' | 'unstowing' | 'egressing' | 'deployed';
    progress: number; // 0 to 1
    telemetryLog: string;
    method: 'lander_ramp' | 'sky_crane';
  };
  startDeployment: (method?: 'lander_ramp' | 'sky_crane') => void;
  updateDeploymentProgress: (status: 'stowed' | 'unstowing' | 'egressing' | 'deployed', progress: number, log?: string) => void;
  skipDeployment: () => void;
  restartDeployment: () => void;

  // Modals & Navigation
  activeModal: 'dossier' | 'tablet' | 'help' | 'mothership' | null;
  tabletTab: 'satnav' | 'encyclopedia' | 'subsystems' | 'missions' | 'meda';
  activeWaypoint: [number, number] | null;
  cameraMode: 'follow' | 'orbit' | 'cockpit';
  isCinematicHUD: boolean;
  openModal: (modal: 'dossier' | 'tablet' | 'help' | 'mothership') => void;
  closeModal: () => void;
  setTabletTab: (tab: 'satnav' | 'encyclopedia' | 'subsystems' | 'missions' | 'meda') => void;
  setDossierPOI: (poi: GeologicalPOI | null) => void;
  setWaypoint: (pos: [number, number] | null) => void;
  setCameraMode: (mode: 'follow' | 'orbit' | 'cockpit') => void;
  toggleCinematicHUD: () => void;

  // Subsystems & Instruments
  subsystems: {
    mastcam: boolean;
    supercam: boolean;
    rimfax: boolean;
    hazcams: boolean;
    solarDustCleanProgress: number; // 0 to 100
  };
  toggleSubsystem: (key: 'mastcam' | 'supercam' | 'rimfax' | 'hazcams') => void;
  triggerDustCleaning: () => void;

  // Objectives
  objectives: MissionObjective[];
  updateObjective: (id: string, delta: number) => void;
}

export const useMissionStore = create<MissionStore>((set, get) => ({
  // Real-life Deployment Sequence from Mother Ship
  deployment: {
    status: 'stowed',
    progress: 0,
    telemetryLog: 'MISSION INITIALIZED // STOWED ON MOTHER SHIP PAYLOAD CRADLE',
    method: 'lander_ramp',
  },

  startDeployment: (method = 'lander_ramp') => {
    soundEngine.init();
    soundEngine.playQuindarTone(true);
    set((state) => ({
      deployment: {
        status: 'stowed',
        progress: 0,
        telemetryLog: 'PYROS ARMED // RETENTION CLAMPS READY // COMM CHECK GOOD',
        method,
      },
      rover: {
        ...state.rover,
        position: [0, 1.82, -23.5],
        rotation: 0,
        pitch: 0,
        roll: 0,
        speed: 0,
      },
    }));
  },

  updateDeploymentProgress: (status, progress, log) => {
    set((state) => ({
      deployment: {
        ...state.deployment,
        status,
        progress,
        telemetryLog: log !== undefined ? log : state.deployment.telemetryLog,
      },
    }));
  },

  skipDeployment: () => {
    soundEngine.playTelemetrySuccess();
    set((state) => ({
      deployment: {
        ...state.deployment,
        status: 'deployed',
        progress: 1.0,
        telemetryLog: 'EGRESS COMPLETE // ALL 6 WHEELS ON MARTIAN REGOLITH // MOBILITY ACTIVE',
      },
      rover: {
        ...state.rover,
        position: [0, 0.9, -15.0],
        rotation: 0,
        pitch: 0,
        roll: 0,
        speed: 0,
      },
    }));
  },

  restartDeployment: () => {
    const { startDeployment } = get();
    startDeployment('lander_ramp');
  },

  // Initial Rover State: Begins on the Mother Ship deployment cradle
  rover: {
    position: [0, 1.82, -23.5],
    rotation: 0,
    pitch: 0,
    roll: 0,
    speed: 0,
    wheelSlip: 0.05,
    battery: 100,
    solarWatts: 420,
    consumptionWatts: 140,
    motorTemp: 18.4,
    storageUsedMB: 1820,
    storageMaxMB: 32000,
    dsnSignalDb: -96,
    inclineWarning: false,
    batteryWarning: false,
    isHibernating: false,
  },

  setRoverPosition: (pos, rot, pitch = 0, roll = 0, speed = 0) => {
    const { env, pois, subsystems } = get();

    // Determine current biome based on coordinates
    let biome: BiomeType = 'Delta';
    if (pos[0] < -20 && pos[2] > 0) biome = 'Dunes';
    else if (pos[2] < -30 && pos[0] < 30) biome = 'Crater';
    else if (pos[0] > 40) biome = 'Escarpment';

    // Calculate wheel slip based on terrain
    const wheelSlip = biome === 'Dunes' ? 0.38 : biome === 'Crater' ? 0.22 : 0.08;

    // Power calculations
    const isMoving = Math.abs(speed) > 0.1;
    let baseConsumption = 80; // base avionics
    if (subsystems.mastcam) baseConsumption += 25;
    if (subsystems.supercam) baseConsumption += 35;
    if (subsystems.rimfax) baseConsumption += 30;
    if (subsystems.hazcams) baseConsumption += 15;

    const driveConsumption = isMoving ? 160 + wheelSlip * 180 : 0;
    const totalConsumption = baseConsumption + driveConsumption;

    // Check steep slopes
    const isSteep = Math.abs(pitch) > 22 || Math.abs(roll) > 22;

    // Motor temperature shifts
    const targetTemp = isMoving ? 38 + wheelSlip * 20 : 15;

    set((state) => ({
      rover: {
        ...state.rover,
        position: pos,
        rotation: rot,
        pitch,
        roll,
        speed,
        wheelSlip,
        consumptionWatts: Math.round(totalConsumption),
        inclineWarning: isSteep,
        motorTemp: Math.round(state.rover.motorTemp * 0.95 + targetTemp * 0.05),
      },
      env: {
        ...state.env,
        currentBiome: biome,
      },
    }));

    // Auto-discover POIs within 18 meters
    pois.forEach((poi) => {
      if (!poi.discovered) {
        const dx = pos[0] - poi.position[0];
        const dz = pos[2] - poi.position[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 18) {
          set((state) => ({
            pois: state.pois.map((p) =>
              p.id === poi.id ? { ...p, discovered: true, discoveredAtSol: 412 } : p
            ),
          }));
          soundEngine.playQuindarTone(true);
        }
      }
    });
  },

  drainBattery: (amount) => {
    set((state) => {
      const nextBattery = Math.max(0, state.rover.battery - amount);
      return {
        rover: {
          ...state.rover,
          battery: Number(nextBattery.toFixed(1)),
          batteryWarning: nextBattery < 18,
        },
      };
    });
  },

  chargeBattery: (amount) => {
    set((state) => {
      const nextBattery = Math.min(100, state.rover.battery + amount);
      return {
        rover: {
          ...state.rover,
          battery: Number(nextBattery.toFixed(1)),
          batteryWarning: nextBattery < 18,
        },
      };
    });
  },

  toggleHibernation: () => {
    set((state) => {
      const nextHib = !state.rover.isHibernating;
      return {
        rover: {
          ...state.rover,
          isHibernating: nextHib,
        },
      };
    });
    soundEngine.playClick();
  },

  // Environment & NASA MEDA Meteorological State
  env: {
    timeOfDay: 11.2, // ~11:12 AM Mars local solar time
    timeSpeed: 0.05,
    solNumber: 412,
    solarLongitudeLs: 18.4,
    seasonName: 'Late Northern Spring',
    dustTau: 0.44,
    ambientTemp: -24,
    groundTemp: -2,
    pressurePa: 748,
    pressureHpa: 7.48,
    pressureTrend: 'Stable',
    windSpeedMs: 4.2,
    windGustMs: 12.8,
    windDirectionDeg: 155,
    windCompass: 'SSE',
    relativeHumidityPct: 0.4,
    uvIndex: 7.2,
    solarInsolationWatts: 540,
    dustDevilActive: true, // Active by default for spectacular visibility
    dustDevilDistance: 45,
    dustDevilDist: 45,
    dustDevilVortexPos: [25, 0, 35],
    dustDevilPos: [25, 0, 35],
    currentBiome: 'Delta',
    weatherState: 'Clear',
    selectedSolProfile: 'sol412',
    activeWeatherAlert: null,
    moons: {
      phobos: calculateMartianMoonEphemeris(412, 11.2).phobos.telemetry,
      deimos: calculateMartianMoonEphemeris(412, 11.2).deimos.telemetry,
    },
  },

  updateTime: (deltaSeconds) => {
    const { env, rover } = get();
    // Delta in Sol hours: 1 real second = (timeSpeed * 0.4) Sol hours
    const hourDelta = deltaSeconds * env.timeSpeed * 0.4;
    let newTime = (env.timeOfDay + hourDelta) % 24;

    const solProfile = REAL_NASA_SOL_DATASETS[env.selectedSolProfile] || REAL_NASA_SOL_DATASETS.sol412;
    const meda = calculateMedaAtmosphericTelemetry(solProfile, newTime);

    // Realistic solar panel conversion efficiency driven by real MEDA insolation & dust accumulation
    const dustCleanFactor = get().subsystems.solarDustCleanProgress / 100;
    const panelEfficiency = 0.95 * dustCleanFactor;
    let solarWatts = Math.round(meda.solarInsolationWatts * panelEfficiency);

    const isSolarCharging = get().isSolarCharging;
    let updatedBattery = rover.battery;

    if (isSolarCharging) {
      // Deployed solar array wings absorb direct + diffuse ambient sunlight
      solarWatts = Math.round(solarWatts * 2.2);
      // Authentic solar charging: in direct midday Martian sun (550+ W/m²), charges ~0.50% per second (~3 mins for full 0-100% recharge)
      // At lower sun elevations it charges proportionally less; at night (0 W) it cannot charge.
      const sunRatio = Math.max(0, meda.solarInsolationWatts / 550);
      const chargeRatePerSec = sunRatio * 0.50 * dustCleanFactor;
      updatedBattery += deltaSeconds * chargeRatePerSec;
    } else {
      // Passive solar trickle from body-mounted panels vs baseline standby avionics consumption
      const passiveRatePerSec = (Math.max(0, meda.solarInsolationWatts) / 550) * 0.04 * dustCleanFactor;
      const heaterWatts = meda.airTemp < -70 ? 35 : 0;
      const avionicsDrainRatePerSec = ((rover.consumptionWatts + heaterWatts) / 2500) * 0.03;
      updatedBattery += deltaSeconds * (passiveRatePerSec - avionicsDrainRatePerSec);
    }

    updatedBattery = Math.max(0, Math.min(100, updatedBattery));
    if (updatedBattery < 0.05) {
      updatedBattery = 0;
    }

    // NASA MEDA Dynamic Weather Warning & Meteorological Alert System
    let weatherAlert: WeatherAlert | null = null;
    const dxV = rover.position[0] - env.dustDevilVortexPos[0];
    const dzV = rover.position[2] - env.dustDevilVortexPos[2];
    const distV = Math.round(Math.hypot(dxV, dzV));

    if (meda.dustDevilActive && distV < 75) {
      soundEngine.playVortexAlert();
      weatherAlert = {
        type: 'vortex',
        title: distV < 28 ? 'CRITICAL // CONVECTIVE VORTEX PROXIMITY' : 'NASA MEDA ALERT // CONVECTIVE DUST DEVIL',
        message: `Active vortex ${distV}m ${env.windCompass}. Tangential wind ${meda.windGustMs} m/s. Barometric drop -3.5 Pa.`,
        description: `Active convective vortex ${distV}m ${env.windCompass} (Afternoon Solar Convection).`,
        recommendation: distV < 28 ? 'Maintain drive traction or let vortex clean solar array' : 'Thermal updraft active — approach to sweep solar panels',
        severity: distV < 28 ? 'critical' : 'warning',
      };
    } else if (meda.weatherState === 'Regional Dust Storm') {
      weatherAlert = {
        type: 'dust_storm',
        title: 'NASA MEDA WARNING // REGIONAL DUST STORM EVENT',
        message: `High optical depth (τ: ${meda.dustTau.toFixed(2)}). Solar conversion degraded 75%. Gale gusts ${meda.windGustMs} m/s.`,
        description: `High atmospheric optical depth (τ: ${meda.dustTau.toFixed(2)}). Solar conversion degraded.`,
        recommendation: 'Deploy solar charging or navigate towards low-elevation shelter',
        severity: 'warning',
      };
    } else if (meda.airTemp < -76) {
      weatherAlert = {
        type: 'frost',
        title: 'NASA MEDA ADVISORY // CRYOGENIC TEMPERATURE DROP',
        message: `Surface air ${meda.airTemp}°C. Water-ice frost equilibrium. MMRTG battery heating engaged.`,
        description: `Surface air ${meda.airTemp}°C. Water-ice frost equilibrium.`,
        recommendation: 'Internal avionics survival heaters engaged (+35W draw)',
        severity: 'advisory',
      };
    }

    set({
      env: {
        ...env,
        timeOfDay: newTime,
        solNumber: meda.sol,
        solarLongitudeLs: meda.seasonLs,
        seasonName: meda.seasonName,
        ambientTemp: Math.round(meda.airTemp),
        groundTemp: Math.round(meda.groundTemp),
        pressurePa: meda.pressurePa,
        pressureHpa: meda.pressureHpa,
        pressureTrend: meda.pressureTrend,
        windSpeedMs: meda.windSpeedMs,
        windGustMs: meda.windGustMs,
        windDirectionDeg: meda.windDirectionDeg,
        windCompass: meda.windCompass,
        dustTau: meda.dustTau,
        relativeHumidityPct: meda.relativeHumidityPct,
        uvIndex: meda.uvIndex,
        solarInsolationWatts: meda.solarInsolationWatts,
        dustDevilActive: meda.dustDevilActive,
        dustDevilDistance: distV,
        weatherState: meda.weatherState,
        activeWeatherAlert: weatherAlert,
        moons: {
          phobos: calculateMartianMoonEphemeris(meda.sol, newTime).phobos.telemetry,
          deimos: calculateMartianMoonEphemeris(meda.sol, newTime).deimos.telemetry,
        },
      },
      rover: {
        ...rover,
        solarWatts,
        battery: Number(updatedBattery.toFixed(1)),
        batteryWarning: updatedBattery < 18,
      },
    });

    soundEngine.updateWind(meda.dustTau);
  },

  setTimeSpeed: (speed) => set((s) => ({ env: { ...s.env, timeSpeed: speed } })),

  setWeather: (state) => {
    const tauMap = { Clear: 0.44, 'Dust Haze': 0.78, 'Regional Dust Storm': 2.35 };
    set((s) => ({
      env: {
        ...s.env,
        weatherState: state,
        dustTau: tauMap[state],
      },
    }));
  },

  setSolProfile: (profileId) => {
    soundEngine.playTelemetrySuccess();
    const solProfile = REAL_NASA_SOL_DATASETS[profileId] || REAL_NASA_SOL_DATASETS.sol412;
    const meda = calculateMedaAtmosphericTelemetry(solProfile, get().env.timeOfDay);
    set((state) => ({
      env: {
        ...state.env,
        selectedSolProfile: profileId,
        solNumber: meda.sol,
        solarLongitudeLs: meda.seasonLs,
        seasonName: meda.seasonName,
        ambientTemp: Math.round(meda.airTemp),
        groundTemp: Math.round(meda.groundTemp),
        pressurePa: meda.pressurePa,
        pressureHpa: meda.pressureHpa,
        pressureTrend: meda.pressureTrend,
        windSpeedMs: meda.windSpeedMs,
        windGustMs: meda.windGustMs,
        windDirectionDeg: meda.windDirectionDeg,
        windCompass: meda.windCompass,
        dustTau: meda.dustTau,
        relativeHumidityPct: meda.relativeHumidityPct,
        uvIndex: meda.uvIndex,
        solarInsolationWatts: meda.solarInsolationWatts,
        dustDevilActive: meda.dustDevilActive,
      },
    }));
  },

  setDustDevilProximity: (dist, pos) => {
    set((s) => ({
      env: {
        ...s.env,
        dustDevilDistance: Math.round(dist),
        dustDevilDist: Math.round(dist),
        dustDevilVortexPos: pos,
        dustDevilPos: pos,
      },
    }));
  },

  toggleDustDevil: () => {
    soundEngine.playClick();
    const willBeActive = !get().env.dustDevilActive;
    if (willBeActive) {
      soundEngine.playVortexAlert();
    }
    set((s) => ({
      env: {
        ...s.env,
        dustDevilActive: willBeActive,
      },
    }));
  },

  // Science & POIs
  pois: INITIAL_POIS,
  sciencePoints: 120,
  activeScanPOI: null,
  selectedDossierPOI: null,
  isScanning: false,
  scanProgress: 0,

  startDeepScan: (poi) => {
    soundEngine.init();
    soundEngine.playScanLaserPulse();
    set({
      activeScanPOI: poi,
      selectedDossierPOI: poi,
      activeModal: 'dossier',
      isScanning: true,
      scanProgress: 5,
    });
    get().drainBattery(4.5);
  },


  updateScanProgress: (progress) => {
    set({ scanProgress: progress });
    if (Math.random() < 0.3) {
      soundEngine.playScanLaserPulse();
    }
  },

  completeDeepScan: () => {
    const { activeScanPOI, pois } = get();
    if (!activeScanPOI) return;

    soundEngine.playTelemetrySuccess();
    set((state) => ({
      isScanning: false,
      scanProgress: 100,
      activeModal: 'dossier',
      selectedDossierPOI: activeScanPOI,
      pois: state.pois.map((p) =>
        p.id === activeScanPOI.id ? { ...p, sampleCollected: true, discovered: true } : p
      ),
      rover: {
        ...state.rover,
        storageUsedMB: Math.min(state.rover.storageMaxMB, state.rover.storageUsedMB + 480),
      },
    }));

    // Update objectives
    get().updateObjective('obj-2', 1);
    if (activeScanPOI.biome === 'Delta' || activeScanPOI.biome === 'Escarpment') {
      get().updateObjective('obj-1', 1);
    }
    if (activeScanPOI.id === 'poi-methane-vent') {
      get().updateObjective('obj-3', 1);
    }
  },

  collectSample: (poiId) => {
    soundEngine.playClick();
    set((state) => ({
      pois: state.pois.map((p) =>
        p.id === poiId ? { ...p, sampleCollected: true } : p
      ),
    }));
    get().updateObjective('obj-1', 1);
  },

  downlinkTelemetry: (poiId) => {
    const { pois } = get();
    const poi = pois.find((p) => p.id === poiId);
    if (!poi || poi.downlinked) return;

    soundEngine.playQuindarTone(false);
    soundEngine.playTelemetrySuccess();

    set((state) => ({
      sciencePoints: state.sciencePoints + poi.sciencePoints,
      pois: state.pois.map((p) =>
        p.id === poiId ? { ...p, downlinked: true } : p
      ),
      rover: {
        ...state.rover,
        storageUsedMB: Math.max(800, state.rover.storageUsedMB - 420),
      },
    }));

    get().updateObjective('obj-4', poi.sciencePoints);
  },

  downlinkAllData: () => {
    const { pois } = get();
    const pendingPOIs = pois.filter((p) => p.sampleCollected && !p.downlinked);
    if (pendingPOIs.length === 0) return;

    const totalReward = pendingPOIs.reduce((sum, p) => sum + p.sciencePoints, 0);
    soundEngine.playQuindarTone(false);
    soundEngine.playTelemetrySuccess();

    set((state) => ({
      sciencePoints: state.sciencePoints + totalReward,
      pois: state.pois.map((p) => ({ ...p, downlinked: true })),
      rover: {
        ...state.rover,
        storageUsedMB: 800,
      },
    }));

    get().updateObjective('obj-4', totalReward);
  },

  // Solar Power-Up & Mother Ship
  isSolarCharging: false,
  toggleSolarCharging: () => {
    soundEngine.init();
    soundEngine.playClick();
    set((state) => {
      const nextCharging = !state.isSolarCharging;
      if (nextCharging) {
        soundEngine.playQuindarTone(true);
      }
      return { isSolarCharging: nextCharging };
    });
    if (!get().isSolarCharging) {
      get().updateObjective('obj-6', 1);
    }
  },

  motherShip: {
    position: [0, 0, -25],
    samplesDeposited: 0,
    dataTransmitted: 0,
    isDocked: false,
    lastSubmission: null,
  },

  checkMotherShipProximity: (roverPos) => {
    const { motherShip } = get();
    const dx = roverPos[0] - motherShip.position[0];
    const dz = roverPos[2] - motherShip.position[2];
    const dist = Math.sqrt(dx * dx + dz * dz);
    const isDocked = dist < 18.0;
    if (isDocked !== motherShip.isDocked) {
      set((state) => ({
        motherShip: { ...state.motherShip, isDocked },
      }));
      if (isDocked) {
        soundEngine.playQuindarTone(true);
      }
    }
  },

  submitToMotherShip: () => {
    const { pois } = get();
    const collectedSamples = pois.filter((p) => p.sampleCollected);
    const pendingData = pois.filter((p) => p.discovered && !p.downlinked);

    const samplePoints = collectedSamples.length * 400;
    const dataPoints = pendingData.reduce((sum, p) => sum + p.sciencePoints, 0);
    const orbitalDeliveryBonus = 500;
    const totalPoints = samplePoints + dataPoints + orbitalDeliveryBonus;

    soundEngine.playQuindarTone(true);
    soundEngine.playTelemetrySuccess();

    set((state) => ({
      sciencePoints: state.sciencePoints + totalPoints,
      pois: state.pois.map((p) => ({ ...p, downlinked: true })),
      rover: {
        ...state.rover,
        battery: 100, // Mother Ship powers up rover to 100%
        storageUsedMB: 400, // Data transferred
      },
      motherShip: {
        ...state.motherShip,
        samplesDeposited: state.motherShip.samplesDeposited + collectedSamples.length,
        dataTransmitted: state.motherShip.dataTransmitted + pendingData.length,
        lastSubmission: {
          samples: collectedSamples.length,
          data: pendingData.length,
          reward: totalPoints,
        },
      },
      activeModal: 'mothership',
    }));

    get().updateObjective('obj-1', collectedSamples.length);
    get().updateObjective('obj-4', totalPoints);
    get().updateObjective('obj-5', 1);
  },

  // Modals & Navigation
  activeModal: null,
  tabletTab: 'satnav',
  activeWaypoint: null,
  cameraMode: 'follow',
  isCinematicHUD: false,

  openModal: (modal) => {
    soundEngine.init();
    soundEngine.playClick();
    set({ activeModal: modal });
  },

  closeModal: () => {
    soundEngine.playClick();
    set({ activeModal: null });
  },

  setTabletTab: (tab) => {
    soundEngine.playClick();
    set({ tabletTab: tab });
  },

  setDossierPOI: (poi) => set({ selectedDossierPOI: poi }),

  setWaypoint: (pos) => {
    soundEngine.playClick();
    set({ activeWaypoint: pos });
  },

  setCameraMode: (mode) => {
    soundEngine.playClick();
    set({ cameraMode: mode });
  },

  toggleCinematicHUD: () => {
    soundEngine.init();
    soundEngine.playClick();
    set((state) => ({ isCinematicHUD: !state.isCinematicHUD }));
  },

  // Subsystems
  subsystems: {
    mastcam: true,
    supercam: true,
    rimfax: true,
    hazcams: true,
    solarDustCleanProgress: 100,
  },

  toggleSubsystem: (key) => {
    soundEngine.playClick();
    set((state) => ({
      subsystems: {
        ...state.subsystems,
        [key]: !state.subsystems[key],
      },
    }));
  },

  triggerDustCleaning: () => {
    soundEngine.playTelemetrySuccess();
    set((state) => ({
      subsystems: {
        ...state.subsystems,
        solarDustCleanProgress: 100,
      },
      rover: {
        ...state.rover,
        solarWatts: Math.round(state.rover.solarWatts * 1.15),
      },
    }));
  },

  // Objectives
  objectives: INITIAL_OBJECTIVES,

  updateObjective: (id, delta) => {
    set((state) => {
      const nextObjs = state.objectives.map((obj) => {
        if (obj.id !== id) return obj;
        const newCount = Math.min(obj.targetCount, obj.currentCount + delta);
        const newlyDone = newCount >= obj.targetCount && !obj.completed;
        return {
          ...obj,
          currentCount: newCount,
          completed: newCount >= obj.targetCount,
        };
      });

      // Award bonus points for newly completed objective
      const completedNow = nextObjs.find((o) => o.id === id && o.completed && !state.objectives.find((x) => x.id === id)?.completed);
      const bonus = completedNow ? completedNow.rewardPoints : 0;

      return {
        objectives: nextObjs,
        sciencePoints: state.sciencePoints + bonus,
      };
    });
  },
}));

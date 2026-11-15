import { create } from 'zustand';
import { soundEngine } from '../audio/soundManager';
import { useMissionStore } from './useMissionStore';

export type GamePhase = 'HANGAR' | 'LAUNCH' | 'CRUISE' | 'EDL' | 'SURFACE_EXPLORATION';

export type FlightPhase =
  | 'LAUNCH_COUNTDOWN'
  | 'LAUNCH_LIFTOFF'
  | 'LAUNCH_MAX_Q'
  | 'LAUNCH_BOOSTER_SEP'
  | 'LAUNCH_FAIRING_SEP'
  | 'CRUISE_TRANSIT'
  | 'CRUISE_SEP'
  | 'EDL_ENTRY'
  | 'EDL_PARACHUTE'
  | 'EDL_POWERED_DESCENT'
  | 'EDL_SKYCRANE'
  | 'EDL_TOUCHDOWN';

export interface TelemetryLog {
  id: string;
  time: string;
  phase: string;
  message: string;
  type: 'info' | 'warn' | 'success' | 'critical';
}

export interface FlightTelemetry {
  altitudeM: number;
  velocityKmh: number;
  velocityMs: number;
  mach: number;
  gForce: number;
  heatShieldTempC: number;
  dynamicPressureKPa: number;
  downrangeKm: number;
  distanceToMarsKm: number;
  transitDays: number;
  countdown: number;
}

export interface FlightTimelineStore {
  gamePhase: GamePhase;
  flightPhase: FlightPhase;
  phaseProgress: number; // 0 to 1 within active subphase
  phaseElapsed: number; // seconds within active subphase
  totalElapsed: number; // total flight seconds
  isPlaying: boolean;
  playbackSpeed: 1 | 2;
  cameraAngle: 'cinematic' | 'tracking' | 'onboard';
  activeMilestone: string;
  telemetry: FlightTelemetry;
  eventLogs: TelemetryLog[];
  hasTouchedDown: boolean;
  surfaceHandoverProgress: number; // 0 to 1 during flyaway & camera transition to rover

  // Actions
  setGamePhase: (phase: GamePhase) => void;
  setFlightPhase: (phase: FlightPhase) => void;
  jumpToPhase: (phase: FlightPhase) => void;
  skipToSurface: () => void;
  togglePlay: () => void;
  setPlaybackSpeed: (speed: 1 | 2) => void;
  setCameraAngle: (angle: 'cinematic' | 'tracking' | 'onboard') => void;
  addEventLog: (message: string, type?: 'info' | 'warn' | 'success' | 'critical') => void;
  tick: (rawDelta: number) => void;
  resetTimeline: () => void;
}

// Duration of each subphase in seconds (at 1x playback speed)
export const PHASE_DURATIONS: Record<FlightPhase, number> = {
  LAUNCH_COUNTDOWN: 10.0,
  LAUNCH_LIFTOFF: 12.0,
  LAUNCH_MAX_Q: 10.0,
  LAUNCH_BOOSTER_SEP: 10.0,
  LAUNCH_FAIRING_SEP: 12.0,
  CRUISE_TRANSIT: 14.0,
  CRUISE_SEP: 8.0,
  EDL_ENTRY: 12.0,
  EDL_PARACHUTE: 12.0,
  EDL_POWERED_DESCENT: 10.0,
  EDL_SKYCRANE: 12.0,
  EDL_TOUCHDOWN: 10.0,
};

const INITIAL_TELEMETRY: FlightTelemetry = {
  altitudeM: 0,
  velocityKmh: 0,
  velocityMs: 0,
  mach: 0,
  gForce: 1.0,
  heatShieldTempC: 24,
  dynamicPressureKPa: 0,
  downrangeKm: 0,
  distanceToMarsKm: 54600000,
  transitDays: 0,
  countdown: 10,
};

const INITIAL_LOGS: TelemetryLog[] = [
  {
    id: 'log-0',
    time: 'T-00:00:10',
    phase: 'PRE-LAUNCH',
    message: 'CAPE CANAVERAL SLC-41: TERMINAL COUNTDOWN ACTIVE // ALL SYSTEMS NOMINAL',
    type: 'info',
  },
  {
    id: 'log-1',
    time: 'T-00:00:05',
    phase: 'PRE-LAUNCH',
    message: 'FLIGHT COMPUTER ON INTERNAL POWER // RANGE SAFETY GREEN',
    type: 'info',
  },
];

export const useFlightTimelineStore = create<FlightTimelineStore>((set, get) => ({
  gamePhase: 'LAUNCH',
  flightPhase: 'LAUNCH_COUNTDOWN',
  phaseProgress: 0,
  phaseElapsed: 0,
  totalElapsed: 0,
  isPlaying: true,
  playbackSpeed: 1,
  cameraAngle: 'cinematic',
  activeMilestone: 'TERMINAL COUNTDOWN',
  telemetry: { ...INITIAL_TELEMETRY },
  eventLogs: [...INITIAL_LOGS],
  hasTouchedDown: false,
  surfaceHandoverProgress: 0,

  setGamePhase: (gamePhase) => set({ gamePhase }),

  setFlightPhase: (flightPhase) => {
    let milestone = '';
    let gamePhase: GamePhase = 'LAUNCH';
    switch (flightPhase) {
      case 'LAUNCH_COUNTDOWN':
        milestone = 'TERMINAL COUNTDOWN';
        gamePhase = 'LAUNCH';
        break;
      case 'LAUNCH_LIFTOFF':
        milestone = 'IGNITION & LIFTOFF';
        gamePhase = 'LAUNCH';
        break;
      case 'LAUNCH_MAX_Q':
        milestone = 'MAXIMUM DYNAMIC PRESSURE (MAX-Q)';
        gamePhase = 'LAUNCH';
        break;
      case 'LAUNCH_BOOSTER_SEP':
        milestone = 'BOOSTER SEPARATION & MECO';
        gamePhase = 'LAUNCH';
        break;
      case 'LAUNCH_FAIRING_SEP':
        milestone = 'PAYLOAD FAIRING JETTISON // MTI BURN';
        gamePhase = 'LAUNCH';
        break;
      case 'CRUISE_TRANSIT':
        milestone = 'INTERPLANETARY KEPLERIAN CRUISE';
        gamePhase = 'CRUISE';
        break;
      case 'CRUISE_SEP':
        milestone = 'CRUISE STAGE JETTISON';
        gamePhase = 'CRUISE';
        break;
      case 'EDL_ENTRY':
        milestone = 'ATMOSPHERIC ENTRY INTERFACE // PEAK PLASMA';
        gamePhase = 'EDL';
        break;
      case 'EDL_PARACHUTE':
        milestone = 'SUPERSONIC CHUTE DEPLOY // HEAT SHIELD JETTISON';
        gamePhase = 'EDL';
        break;
      case 'EDL_POWERED_DESCENT':
        milestone = 'BACKSHELL RELEASE // RETRO-PROPULSION IGNITION';
        gamePhase = 'EDL';
        break;
      case 'EDL_SKYCRANE':
        milestone = 'SKY CRANE HOVER // ROVER LOWERING';
        gamePhase = 'EDL';
        break;
      case 'EDL_TOUCHDOWN':
        milestone = 'WHEELS DOWN // BRIDLE CUT // SKY CRANE FLYAWAY';
        gamePhase = 'EDL';
        break;
    }

    set({
      flightPhase,
      gamePhase,
      phaseProgress: 0,
      phaseElapsed: 0,
      activeMilestone: milestone,
    });
  },

  jumpToPhase: (phase) => {
    const { setFlightPhase, addEventLog } = get();
    soundEngine.stopRocketRumble();
    soundEngine.stopPlasmaRoar();
    soundEngine.playClick();
    setFlightPhase(phase);
    addEventLog(`FLIGHT DIRECTOR MANUAL JUMP TO [${phase}]`, 'warn');
  },

  skipToSurface: () => {
    soundEngine.stopRocketRumble();
    soundEngine.stopPlasmaRoar();
    soundEngine.playQuindarTone(true);
    soundEngine.playTelemetrySuccess();

    // Deploy rover directly onto Martian surface in useMissionStore
    useMissionStore.getState().skipDeployment();

    set({
      gamePhase: 'SURFACE_EXPLORATION',
      flightPhase: 'EDL_TOUCHDOWN',
      phaseProgress: 1.0,
      hasTouchedDown: true,
      surfaceHandoverProgress: 1.0,
      activeMilestone: 'SURFACE EXPLORATION READY',
    });

    get().addEventLog('SEQUENCE SKIPPED // DIRECT HANDOVER TO OPEN-WORLD MARTIAN SURVEYOR', 'success');
  },

  togglePlay: () => {
    const current = get().isPlaying;
    soundEngine.playClick();
    set({ isPlaying: !current });
  },

  setPlaybackSpeed: (speed) => {
    soundEngine.playClick();
    set({ playbackSpeed: speed });
  },

  setCameraAngle: (angle) => {
    soundEngine.playClick();
    set({ cameraAngle: angle });
  },

  addEventLog: (message, type = 'info') => {
    const totalSecs = Math.floor(get().totalElapsed);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    const timeStr = `T+${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    const newLog: TelemetryLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      time: timeStr,
      phase: get().flightPhase,
      message,
      type,
    };
    set((state) => ({
      eventLogs: [newLog, ...state.eventLogs.slice(0, 40)],
    }));
  },

  resetTimeline: () => {
    soundEngine.stopRocketRumble();
    soundEngine.stopPlasmaRoar();
    set({
      gamePhase: 'LAUNCH',
      flightPhase: 'LAUNCH_COUNTDOWN',
      phaseProgress: 0,
      phaseElapsed: 0,
      totalElapsed: 0,
      isPlaying: true,
      hasTouchedDown: false,
      surfaceHandoverProgress: 0,
      telemetry: { ...INITIAL_TELEMETRY },
      eventLogs: [...INITIAL_LOGS],
      activeMilestone: 'TERMINAL COUNTDOWN',
    });
  },

  tick: (rawDelta) => {
    const { isPlaying, playbackSpeed, flightPhase, phaseElapsed, setFlightPhase, addEventLog } = get();
    if (!isPlaying) return;

    const dt = Math.min(0.1, rawDelta * playbackSpeed);
    const duration = PHASE_DURATIONS[flightPhase] || 10.0;
    const nextElapsed = phaseElapsed + dt;
    const progress = Math.min(1.0, nextElapsed / duration);

    // Compute dynamic authentic telemetry based on active phase & progress
    const t = progress;
    let telem: FlightTelemetry = { ...get().telemetry };

    switch (flightPhase) {
      case 'LAUNCH_COUNTDOWN': {
        const cd = Math.max(0, 10 - nextElapsed);
        telem = {
          altitudeM: 0,
          velocityKmh: 0,
          velocityMs: 0,
          mach: 0,
          gForce: 1.0,
          heatShieldTempC: 24,
          dynamicPressureKPa: 0,
          downrangeKm: 0,
          distanceToMarsKm: 54600000,
          transitDays: 0,
          countdown: Number(cd.toFixed(1)),
        };

        // Beep at whole seconds
        const prevSec = Math.floor(10 - phaseElapsed);
        const currSec = Math.floor(cd);
        if (prevSec !== currSec && currSec <= 10 && currSec >= 0) {
          soundEngine.playCountdownBeep(currSec === 0);
          if (currSec === 6) {
            soundEngine.playRocketRumble(0.35);
            addEventLog('T-6.6s: 4x RS-25 MAIN ENGINES START // HYDROGEN DELUGE ACTIVE', 'info');
          }
          if (currSec === 0) {
            soundEngine.playSRBIgnitionFlash();
            soundEngine.playRocketRumble(1.0);
            addEventLog('T-0: SRB IGNITION // WE HAVE LIFTOFF OF THE ARTEMIS 1 MISSION', 'critical');
          }
        }
        break;
      }

      case 'LAUNCH_LIFTOFF': {
        soundEngine.playRocketRumble(0.8 + t * 0.2);
        const alt = t * t * 1800;
        const velMs = t * 120;
        telem = {
          ...telem,
          altitudeM: alt,
          velocityKmh: velMs * 3.6,
          velocityMs: velMs,
          mach: velMs / 340,
          gForce: 1.2 + t * 1.5,
          dynamicPressureKPa: t * 18,
          downrangeKm: t * 0.4,
          countdown: 0,
        };
        break;
      }

      case 'LAUNCH_MAX_Q': {
        soundEngine.playRocketRumble(1.0);
        const alt = 1800 + t * 14000;
        const velMs = 120 + t * 450;
        const mach = 0.8 + t * 1.2; // Transonic to supersonic (Mach 0.8 - 2.0)
        telem = {
          ...telem,
          altitudeM: alt,
          velocityKmh: velMs * 3.6,
          velocityMs: velMs,
          mach,
          gForce: 2.7 + Math.sin(t * Math.PI) * 1.2,
          dynamicPressureKPa: 18 + Math.sin(t * Math.PI) * 17, // Max-Q peaks at ~35 kPa
          downrangeKm: 0.4 + t * 12,
        };
        break;
      }

      case 'LAUNCH_BOOSTER_SEP': {
        soundEngine.playRocketRumble(0.7);
        const alt = 15800 + t * 45000;
        const velMs = 570 + t * 1200;
        telem = {
          ...telem,
          altitudeM: alt,
          velocityKmh: velMs * 3.6,
          velocityMs: velMs,
          mach: (570 + t * 1200) / 320,
          gForce: t < 0.2 ? 1.0 : 2.5 + t * 1.8,
          dynamicPressureKPa: Math.max(0.5, 35 * (1 - t)),
          downrangeKm: 12.4 + t * 65,
        };
        break;
      }

      case 'LAUNCH_FAIRING_SEP': {
        soundEngine.playRocketRumble(0.6);
        const alt = 60800 + t * 140000;
        const velKmh = 6372 + t * 21628; // Accelerating to orbital / escape velocity 28,000 km/h
        telem = {
          ...telem,
          altitudeM: alt,
          velocityKmh: velKmh,
          velocityMs: velKmh / 3.6,
          mach: (velKmh / 3.6) / 300,
          gForce: 3.2,
          dynamicPressureKPa: 0.05,
          downrangeKm: 77.4 + t * 380,
        };
        break;
      }

      case 'CRUISE_TRANSIT': {
        soundEngine.stopRocketRumble();
        const distTravelled = t * 54600000;
        const days = Math.round(t * 203);
        telem = {
          ...telem,
          altitudeM: 200000 + t * 1000000,
          velocityKmh: 20500 - t * 2500,
          velocityMs: 5700,
          mach: 0,
          gForce: 0.0,
          heatShieldTempC: -40 + Math.sin(t * 8) * 15,
          dynamicPressureKPa: 0,
          downrangeKm: 500 + t * 20000,
          distanceToMarsKm: Math.max(0, 54600000 - distTravelled),
          transitDays: days,
        };
        break;
      }

      case 'CRUISE_SEP': {
        telem = {
          ...telem,
          altitudeM: 140000 - t * 15000,
          velocityKmh: 19800,
          velocityMs: 5500,
          mach: 24,
          gForce: 0.05,
          heatShieldTempC: 35 + t * 120,
          distanceToMarsKm: Math.max(0, 125000 * (1 - t)),
        };
        break;
      }

      case 'EDL_ENTRY': {
        soundEngine.playPlasmaRoar(t * 1.0);
        const alt = 125000 - t * 114000; // 125 km down to 11 km
        const velKmh = 19800 - t * 18300; // 19,800 km/h down to 1,500 km/h (Mach 1.7)
        const peakHeat = 1350 * Math.sin(t * Math.PI);
        const peakG = 1.0 + 11.2 * Math.sin(t * Math.PI); // Peaks at ~12.2G!
        telem = {
          ...telem,
          altitudeM: alt,
          velocityKmh: velKmh,
          velocityMs: velKmh / 3.6,
          mach: 24 - t * 22.3,
          gForce: peakG,
          heatShieldTempC: Math.max(25, peakHeat),
          dynamicPressureKPa: 5 + Math.sin(t * Math.PI) * 28,
          distanceToMarsKm: 0,
        };
        break;
      }

      case 'EDL_PARACHUTE': {
        soundEngine.stopPlasmaRoar();
        const alt = 11000 - t * 8900; // 11,000 m down to 2,100 m
        const velMs = 420 - t * 340; // 420 m/s down to 80 m/s
        telem = {
          ...telem,
          altitudeM: alt,
          velocityKmh: velMs * 3.6,
          velocityMs: velMs,
          mach: (velMs / 240),
          gForce: t < 0.15 ? 9.2 : 1.8 - t * 0.8,
          heatShieldTempC: Math.max(45, 1200 * (1 - t)),
          dynamicPressureKPa: Math.max(0.2, 12 * (1 - t)),
        };
        break;
      }

      case 'EDL_POWERED_DESCENT': {
        soundEngine.playRocketRumble(0.7);
        const alt = 2100 - t * 2080; // 2,100 m down to 20 m
        const velMs = 80 - t * 79.25; // 80 m/s down to 0.75 m/s
        telem = {
          ...telem,
          altitudeM: alt,
          velocityKmh: velMs * 3.6,
          velocityMs: velMs,
          mach: velMs / 240,
          gForce: 1.5,
          heatShieldTempC: 38,
          dynamicPressureKPa: 0.1,
        };
        break;
      }

      case 'EDL_SKYCRANE': {
        soundEngine.playRocketRumble(0.85);
        const alt = 20 - t * 19.36; // 20 m down to 0.64 m (surface elevation offset)
        telem = {
          ...telem,
          altitudeM: Math.max(0.64, alt),
          velocityKmh: 2.7 * (1 - t * 0.8),
          velocityMs: 0.75 * (1 - t * 0.8),
          mach: 0.003,
          gForce: 0.38, // Mars surface 0.38G
          heatShieldTempC: 22,
          dynamicPressureKPa: 0,
        };
        break;
      }

      case 'EDL_TOUCHDOWN': {
        const alt = 0.64;
        telem = {
          ...telem,
          altitudeM: alt,
          velocityKmh: 0,
          velocityMs: 0,
          mach: 0,
          gForce: 0.38,
          heatShieldTempC: 20,
          dynamicPressureKPa: 0,
        };
        break;
      }
    }

    set({
      phaseElapsed: nextElapsed,
      phaseProgress: progress,
      totalElapsed: get().totalElapsed + dt,
      telemetry: telem,
    });

    // Check if phase is complete and trigger transitions
    if (progress >= 1.0) {
      switch (flightPhase) {
        case 'LAUNCH_COUNTDOWN':
          soundEngine.playRocketRumble(0.9);
          addEventLog('LIFTOFF OF PROJECT CRADLE! TOWER CLEARED // VEHICLE ROLLING TO AZIMUTH 093°', 'critical');
          setFlightPhase('LAUNCH_LIFTOFF');
          break;
        case 'LAUNCH_LIFTOFF':
          addEventLog('TRANSONIC COMPRESSION // ENTERING MAX-Q REGIME', 'info');
          setFlightPhase('LAUNCH_MAX_Q');
          break;
        case 'LAUNCH_MAX_Q':
          soundEngine.playStageSeparation();
          addEventLog('MAX-Q PASSED // SOLID ROCKET BOOSTER CUTOFF & STAGE SEPARATION CONFIRMED', 'success');
          setFlightPhase('LAUNCH_BOOSTER_SEP');
          break;
        case 'LAUNCH_BOOSTER_SEP':
          soundEngine.playStageSeparation();
          addEventLog('PAYLOAD FAIRING JETTISON // CRUISE STAGE & AEROSHELL EXPOSED TO SPACE', 'success');
          addEventLog('MARS TRANSFER INJECTION (MTI) BURN IGNITED // ESCAPE VELOCITY ACHIEVED', 'critical');
          setFlightPhase('LAUNCH_FAIRING_SEP');
          break;
        case 'LAUNCH_FAIRING_SEP':
          soundEngine.stopRocketRumble();
          soundEngine.playTelemetrySuccess();
          addEventLog('MTI SHUTDOWN // INSERTION INTO KEPLERIAN TRANS-MARS HYPERBOLIC TRAJECTORY', 'success');
          setFlightPhase('CRUISE_TRANSIT');
          break;
        case 'CRUISE_TRANSIT':
          soundEngine.playStageSeparation();
          addEventLog('MARS GRAVITATIONAL SPHERE OF INFLUENCE ENTERED // CRUISE STAGE SEPARATION', 'info');
          setFlightPhase('CRUISE_SEP');
          break;
        case 'CRUISE_SEP':
          soundEngine.playQuindarTone(true);
          addEventLog('AEROSHELL SLEWED TO ENTRY ATTITUDE // ATMOSPHERIC ENTRY INTERFACE REACHED', 'warn');
          addEventLog('COMMUNICATION PLASMA BLACKOUT IMMINENT // THE 7 MINUTES OF TERROR BEGIN', 'critical');
          setFlightPhase('EDL_ENTRY');
          break;
        case 'EDL_ENTRY':
          soundEngine.stopPlasmaRoar();
          soundEngine.playMortarDeployment();
          addEventLog('SUPERSONIC PARACHUTE DEPLOYED AT MACH 1.7 // RADIAL DECELERATION SHOCK: 9.2G', 'critical');
          addEventLog('HEAT SHIELD JETTISONED // TRN RADAR RADOME UNMASKED // SCANNING JEZERO CRATER', 'success');
          setFlightPhase('EDL_PARACHUTE');
          break;
        case 'EDL_PARACHUTE':
          soundEngine.playStageSeparation();
          soundEngine.playRocketRumble(0.7);
          addEventLog('TRN TERRAIN RELATIVE NAVIGATION LOCK: JEZERO CRATER DELTA CONFIRMED (0.00% DRIFT)', 'success');
          addEventLog('BACKSHELL SEPARATED // SKY CRANE 8 HYDRAZINE RETRO-THRUSTERS IGNITED', 'critical');
          setFlightPhase('EDL_POWERED_DESCENT');
          break;
        case 'EDL_POWERED_DESCENT':
          addEventLog('POWERED DESCENT VEER TERMINATED // HOVER CEILING 20 METERS ACQUIRED', 'info');
          addEventLog('TETHER WINCHES UNLATCHED // ROVER LOWERING INITIATED // SURFACE DUST BLAST ACTIVE', 'warn');
          setFlightPhase('EDL_SKYCRANE');
          break;
        case 'EDL_SKYCRANE':
          soundEngine.playCableCut();
          soundEngine.playSkyCraneFlyaway();
          soundEngine.playQuindarTone(true);
          soundEngine.playTelemetrySuccess();
          addEventLog('WEIGHT ON WHEELS DETECTED // TOUCHDOWN CONFIRMED ON JEZERO CRATER FLOOR!', 'critical');
          addEventLog('PYROTECHNIC BRIDLE CUTTERS FIRED // SKY CRANE FLYAWAY DISPOSAL INITIATED', 'success');
          set({ hasTouchedDown: true });
          setFlightPhase('EDL_TOUCHDOWN');
          break;
        case 'EDL_TOUCHDOWN':
          soundEngine.stopRocketRumble();
          addEventLog('TOUCHDOWN CONFIRMED. SYSTEMS NOMINAL. WELCOME TO MARS. SOL 0 BEGUN.', 'success');
          useMissionStore.getState().skipDeployment();
          set({
            gamePhase: 'SURFACE_EXPLORATION',
            surfaceHandoverProgress: 1.0,
            activeMilestone: 'SOL 0 SURFACE SURVEYOR ACTIVE',
          });
          break;
      }
    }
  },
}));

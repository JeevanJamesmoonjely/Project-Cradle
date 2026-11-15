'use client';

import React, { useEffect } from 'react';
import {
  Rocket,
  FastForward,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  Flame,
  ShieldAlert,
  Compass,
  Activity,
  Layers,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  useFlightTimelineStore,
  FlightPhase,
} from '@/lib/store/useFlightTimelineStore';
import { soundEngine } from '@/lib/audio/soundManager';

const FLIGHT_STEPS: { phase: FlightPhase; label: string; sub: string }[] = [
  { phase: 'LAUNCH_COUNTDOWN', label: '1. LAUNCHPAD', sub: 'T-10s Count' },
  { phase: 'LAUNCH_LIFTOFF', label: '2. LIFTOFF', sub: 'Thrust Vector' },
  { phase: 'LAUNCH_MAX_Q', label: '3. MAX-Q', sub: 'Transonic' },
  { phase: 'LAUNCH_BOOSTER_SEP', label: '4. STAGING', sub: 'MECO / Sep' },
  { phase: 'LAUNCH_FAIRING_SEP', label: '5. MTI BURN', sub: 'Mars Injection' },
  { phase: 'CRUISE_TRANSIT', label: '6. CRUISE', sub: '54.6M km' },
  { phase: 'EDL_ENTRY', label: '7. EDL ENTRY', sub: '12G / 1300°C' },
  { phase: 'EDL_PARACHUTE', label: '8. CHUTE & HEATSHIELD', sub: 'Mach 1.7' },
  { phase: 'EDL_POWERED_DESCENT', label: '9. RETRO-THRUST', sub: 'Sky Crane' },
  { phase: 'EDL_SKYCRANE', label: '10. TETHER HOVER', sub: 'Lowering' },
  { phase: 'EDL_TOUCHDOWN', label: '11. TOUCHDOWN', sub: 'Sol 0 Start' },
];

export const FlightHud: React.FC = () => {
  const flightPhase = useFlightTimelineStore((s) => s.flightPhase);
  const phaseProgress = useFlightTimelineStore((s) => s.phaseProgress);
  const totalElapsed = useFlightTimelineStore((s) => s.totalElapsed);
  const isPlaying = useFlightTimelineStore((s) => s.isPlaying);
  const playbackSpeed = useFlightTimelineStore((s) => s.playbackSpeed);
  const activeMilestone = useFlightTimelineStore((s) => s.activeMilestone);
  const telemetry = useFlightTimelineStore((s) => s.telemetry);
  const eventLogs = useFlightTimelineStore((s) => s.eventLogs);
  const cameraAngle = useFlightTimelineStore((s) => s.cameraAngle);

  const skipToSurface = useFlightTimelineStore((s) => s.skipToSurface);
  const jumpToPhase = useFlightTimelineStore((s) => s.jumpToPhase);
  const togglePlay = useFlightTimelineStore((s) => s.togglePlay);
  const setPlaybackSpeed = useFlightTimelineStore((s) => s.setPlaybackSpeed);
  const setCameraAngle = useFlightTimelineStore((s) => s.setCameraAngle);

  // Keyboard shortcut listener for spacebar skip & controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        skipToSurface();
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'Digit1') {
        setPlaybackSpeed(1);
      } else if (e.code === 'Digit2') {
        setPlaybackSpeed(2);
      } else if (e.code === 'KeyC') {
        const modes: ('cinematic' | 'tracking' | 'onboard')[] = ['cinematic', 'tracking', 'onboard'];
        const next = modes[(modes.indexOf(cameraAngle) + 1) % modes.length];
        setCameraAngle(next);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [skipToSurface, togglePlay, setPlaybackSpeed, setCameraAngle, cameraAngle]);

  const [isMuted, setIsMuted] = React.useState(false);
  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  // Format Elapsed Time MET
  const metSecs = Math.floor(totalElapsed);
  const metMin = Math.floor(metSecs / 60);
  const metRemSec = metSecs % 60;
  const metFormatted = `MET +${String(metMin).padStart(2, '0')}:${String(metRemSec).padStart(2, '0')}`;

  // G-Force color
  const gForceColor =
    telemetry.gForce > 8
      ? 'text-red-400 border-red-500/50 bg-red-950/40 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
      : telemetry.gForce > 4
      ? 'text-amber-400 border-amber-500/50 bg-amber-950/40'
      : 'text-cyan-400 border-cyan-500/30 bg-cyan-950/30';

  // Heat Shield Temp color
  const tempRatio = Math.min(1.0, telemetry.heatShieldTempC / 1350);
  const isHighHeat = telemetry.heatShieldTempC > 500;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex flex-col justify-between p-3 sm:p-5 text-white font-mono select-none">
      {/* ================= TOP MISSION BAR ================= */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-950/80 p-3 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.8)] pointer-events-auto">
        {/* Left: NASA JPL Mission Operations Branding */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 via-orange-500 to-amber-600 p-0.5 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-zinc-950">
              <Rocket className="h-5 w-5 text-red-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-wider text-white">PROJECT CRADLE</span>
              <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/40">
                NASA JPL EDL OPS
              </span>
            </div>
            <p className="text-[10px] tracking-widest text-zinc-400 font-sans">
              FLIGHT DYNAMICS FACILITY • JEZERO CRATER ARRIVAL
            </p>
          </div>
        </div>

        {/* Center: Mission Clock & Target Telemetry */}
        <div className="hidden md:flex items-center gap-6 text-xs">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-zinc-400 tracking-wider">MISSION ELAPSED TIME</span>
            <span className="text-base font-extrabold text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
              {metFormatted}
            </span>
          </div>

          <div className="h-7 w-px bg-white/10" />

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-zinc-400 tracking-wider">TARGET SITE</span>
            <span className="font-bold text-emerald-400">JEZERO CRATER DELTA</span>
          </div>

          <div className="h-7 w-px bg-white/10" />

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-zinc-400 tracking-wider">DSN LIGHT DELAY</span>
            <span className="font-bold text-zinc-300">11m 22s (OWLT)</span>
          </div>
        </div>

        {/* Right: Controls & SKIP BUTTON */}
        <div className="flex items-center gap-2">
          {/* Mute button */}
          <button
            onClick={handleToggleMute}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-cyan-400" />}
          </button>

          {/* Speed Toggle */}
          <button
            onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : 1)}
            className="flex h-9 items-center gap-1 px-2.5 rounded-lg border border-white/10 bg-white/5 text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Toggle Playback Speed (1/2)"
          >
            <span className="text-[10px] text-zinc-400">SPD</span>
            <strong className="text-cyan-400 font-bold">{playbackSpeed}x</strong>
          </button>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Play / Pause (P)"
          >
            {isPlaying ? <Pause className="h-4 w-4 text-amber-400" /> : <Play className="h-4 w-4 text-emerald-400" />}
          </button>

          {/* Camera View Switcher */}
          <button
            onClick={() => {
              const modes: ('cinematic' | 'tracking' | 'onboard')[] = ['cinematic', 'tracking', 'onboard'];
              const next = modes[(modes.indexOf(cameraAngle) + 1) % modes.length];
              setCameraAngle(next);
            }}
            className="hidden sm:flex h-9 items-center gap-1.5 px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Camera Perspective"
          >
            <Eye className="h-3.5 w-3.5 text-cyan-400" />
            <span className="capitalize text-[11px]">{cameraAngle}</span>
          </button>

          {/* SLEEK SKIP TO SURFACE BUTTON */}
          <button
            onClick={skipToSurface}
            className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 px-4 py-2 text-xs font-black text-black shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all hover:scale-105 active:scale-95 hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] cursor-pointer"
            title="Skip sequence and immediately take rover controls on surface"
          >
            <FastForward className="h-4 w-4 fill-black transition-transform group-hover:translate-x-0.5" />
            <span className="tracking-wider">SKIP TO SURFACE [SPACE]</span>
          </button>
        </div>
      </header>

      {/* ================= MIDDLE SECTION: TELEMETRY GAUGES & EVENT LOG ================= */}
      <div className="flex flex-1 items-center justify-between gap-4 py-4 overflow-hidden">
        {/* LEFT COLUMN: CRITICAL FLIGHT GAUGES */}
        <div className="flex flex-col gap-2.5 w-64 sm:w-72 pointer-events-auto">
          {/* Active Flight Milestone Banner */}
          <div className="rounded-xl border border-cyan-500/30 bg-zinc-950/85 p-3 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                ACTIVE FLIGHT REGIME
              </span>
              <span className="font-bold text-cyan-400">{Math.round(phaseProgress * 100)}%</span>
            </div>
            <p className="text-xs font-bold text-white tracking-wide leading-tight">
              {activeMilestone}
            </p>
            {/* Progress bar */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 transition-all duration-150"
                style={{ width: `${phaseProgress * 100}%` }}
              />
            </div>
          </div>

          {/* Altitude & Descent Velocity */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-zinc-950/85 p-2.5 backdrop-blur-md">
              <span className="text-[10px] text-zinc-400 block mb-0.5">ALTITUDE</span>
              <span className="text-lg font-black text-white">
                {telemetry.altitudeM >= 1000
                  ? `${(telemetry.altitudeM / 1000).toFixed(1)} km`
                  : `${Math.round(telemetry.altitudeM)} m`}
              </span>
              <div className="text-[10px] text-cyan-400/80 mt-0.5">
                {telemetry.altitudeM > 100000 ? 'EXOSPHERE' : telemetry.altitudeM > 11000 ? 'UPPER MESOSPHERE' : 'LOW TERRAIN'}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-zinc-950/85 p-2.5 backdrop-blur-md">
              <span className="text-[10px] text-zinc-400 block mb-0.5">VELOCITY</span>
              <span className="text-lg font-black text-cyan-300">
                {telemetry.velocityKmh > 100
                  ? `${Math.round(telemetry.velocityKmh).toLocaleString()} km/h`
                  : `${telemetry.velocityMs.toFixed(1)} m/s`}
              </span>
              <div className="text-[10px] text-emerald-400 mt-0.5">
                {telemetry.mach > 0.05 ? `Mach ${telemetry.mach.toFixed(1)}` : 'Sub-Sonic'}
              </div>
            </div>
          </div>

          {/* G-Force & Heat Shield Thermal Bar */}
          <div className="grid grid-cols-2 gap-2">
            <div className={`rounded-xl border p-2.5 backdrop-blur-md transition-all ${gForceColor}`}>
              <div className="flex items-center justify-between text-[10px] mb-0.5">
                <span className="text-zinc-400">G-FORCE</span>
                <Activity className="h-3.5 w-3.5" />
              </div>
              <span className="text-lg font-black">
                {telemetry.gForce.toFixed(1)} G
              </span>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {telemetry.gForce > 10 ? 'PEAK DECEL' : 'STRUCTURAL LOAD'}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-zinc-950/85 p-2.5 backdrop-blur-md">
              <div className="flex items-center justify-between text-[10px] mb-0.5">
                <span className="text-zinc-400">HEAT SHIELD</span>
                <Flame className={`h-3.5 w-3.5 ${isHighHeat ? 'text-orange-400 animate-pulse' : 'text-zinc-500'}`} />
              </div>
              <span className={`text-lg font-black ${isHighHeat ? 'text-orange-400' : 'text-zinc-300'}`}>
                {Math.round(telemetry.heatShieldTempC)}°C
              </span>
              <div className="mt-1 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 transition-all"
                  style={{ width: `${tempRatio * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Interplanetary or Downrange Distance */}
          {flightPhase.startsWith('CRUISE') ? (
            <div className="rounded-xl border border-cyan-500/20 bg-zinc-950/85 p-2.5 backdrop-blur-md">
              <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                <span>INTERPLANETARY TRANSIT</span>
                <span className="text-cyan-400 font-bold">SOL {telemetry.transitDays} / 203</span>
              </div>
              <div className="text-xs font-bold text-white">
                {(telemetry.distanceToMarsKm / 1000000).toFixed(1)}M km remaining to Mars
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">
                Keplerian Hohmann Hyperbolic Insertion
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-zinc-950/85 p-2.5 backdrop-blur-md">
              <div className="flex justify-between text-[10px] text-zinc-400 mb-0.5">
                <span>DYNAMIC PRESSURE (Q)</span>
                <span>{telemetry.dynamicPressureKPa.toFixed(1)} kPa</span>
              </div>
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>DOWNRANGE</span>
                <span className="text-white font-bold">{telemetry.downrangeKm.toFixed(1)} km</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: NASA JPL EVENT LOG CONSOLE */}
        <div className="hidden lg:flex flex-col w-80 h-72 rounded-2xl border border-white/10 bg-zinc-950/85 p-3.5 backdrop-blur-xl shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span className="text-xs font-bold text-white tracking-wider">JPL TELEMETRY LOG</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              LIVE STREAM
            </span>
          </div>

          {/* Scrollable event log entries */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[11px] leading-relaxed scrollbar-thin">
            {eventLogs.map((log) => {
              const badgeClass =
                log.type === 'critical'
                  ? 'text-red-400 border-red-500/30 bg-red-950/40'
                  : log.type === 'success'
                  ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40'
                  : log.type === 'warn'
                  ? 'text-amber-400 border-amber-500/30 bg-amber-950/40'
                  : 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40';

              return (
                <div key={log.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
                  <div className="flex items-center justify-between text-[9px] mb-1">
                    <span className="text-zinc-500">{log.time}</span>
                    <span className={`px-1 rounded border text-[8px] font-bold ${badgeClass}`}>
                      {log.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-zinc-300 font-sans text-[11px] leading-snug">{log.message}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= BOTTOM INTERACTIVE PHASE TIMELINE STEPPER ================= */}
      <footer className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-zinc-950/85 p-2.5 backdrop-blur-xl shadow-[0_-4px_30px_rgba(0,0,0,0.8)] pointer-events-auto">
        <div className="flex items-center justify-between px-2 text-[10px] text-zinc-400">
          <span className="tracking-wider">MISSION CHRONOLOGY (CLICK ANY STAGE TO PREVIEW):</span>
          <span className="hidden sm:inline text-zinc-400">
            [Space]: Skip to Surface • [P]: Pause/Resume • [1/2]: Playback Speed
          </span>
        </div>

        {/* Horizontal scrollable stepper */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FLIGHT_STEPS.map((step, idx) => {
            const isActive = flightPhase === step.phase;
            const currentIdx = FLIGHT_STEPS.findIndex((s) => s.phase === flightPhase);
            const isPast = idx < currentIdx;

            return (
              <button
                key={step.phase}
                onClick={() => jumpToPhase(step.phase)}
                className={`flex-shrink-0 flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-left transition-all cursor-pointer ${
                  isActive
                    ? 'border border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-102'
                    : isPast
                    ? 'border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/30'
                    : 'border border-white/5 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white'
                }`}
              >
                {isPast ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                ) : isActive ? (
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 flex-shrink-0" />
                )}
                <div>
                  <div className="text-[10px] font-bold tracking-tight">{step.label}</div>
                  <div className="text-[9px] text-zinc-400 font-sans">{step.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
};

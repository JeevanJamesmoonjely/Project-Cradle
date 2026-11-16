'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Battery,
  BatteryWarning,
  Sun,
  Thermometer,
  Radio,
  Volume2,
  VolumeX,
  HelpCircle,
  Tablet,
  Camera,
  AlertTriangle,
  Sparkles,
  Layers,
  Wind,
  Zap,
  FastForward,
  Rocket,
  Flame,
  Gauge,
  CloudSun,
  Moon,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2,
  DoorOpen,
} from 'lucide-react';
import { useMissionStore } from '@/lib/store/useMissionStore';
import { useFlightTimelineStore } from '@/lib/store/useFlightTimelineStore';
import { soundEngine } from '@/lib/audio/soundManager';
import { GTAMiniMap } from './GTAMiniMap';

export const HUDOverlay: React.FC = () => {
  const rover = useMissionStore((s) => s.rover);
  const env = useMissionStore((s) => s.env);
  const pois = useMissionStore((s) => s.pois);
  const sciencePoints = useMissionStore((s) => s.sciencePoints);
  const isScanning = useMissionStore((s) => s.isScanning);
  const scanProgress = useMissionStore((s) => s.scanProgress);
  const activeScanPOI = useMissionStore((s) => s.activeScanPOI);
  const cameraMode = useMissionStore((s) => s.cameraMode);
  const setCameraMode = useMissionStore((s) => s.setCameraMode);
  const openModal = useMissionStore((s) => s.openModal);
  const setTabletTab = useMissionStore((s) => s.setTabletTab);
  const setTimeSpeed = useMissionStore((s) => s.setTimeSpeed);
  const startDeepScan = useMissionStore((s) => s.startDeepScan);
  const objectives = useMissionStore((s) => s.objectives);
  const isSolarCharging = useMissionStore((s) => s.isSolarCharging);
  const toggleSolarCharging = useMissionStore((s) => s.toggleSolarCharging);
  const motherShip = useMissionStore((s) => s.motherShip);
  const deployment = useMissionStore((s) => s.deployment);
  const skipDeployment = useMissionStore((s) => s.skipDeployment);
  const restartDeployment = useMissionStore((s) => s.restartDeployment);
  const toggleDustDevil = useMissionStore((s) => s.toggleDustDevil);
  const isCinematicHUD = useMissionStore((s) => s.isCinematicHUD);
  const toggleCinematicHUD = useMissionStore((s) => s.toggleCinematicHUD);

  const [isMuted, setIsMuted] = useState(() => (typeof window !== 'undefined' ? soundEngine.getMuted() : false));
  const [isDeploymentMinimized, setIsDeploymentMinimized] = useState(false);

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  // Format Sol time of day (e.g. 11.45 -> "11:27 LST")
  const solHours = Math.floor(env.timeOfDay);
  const solMinutes = Math.floor((env.timeOfDay - solHours) * 60);
  const timeFormatted = `${String(solHours).padStart(2, '0')}:${String(solMinutes).padStart(2, '0')} LST`;

  // Find nearest POI to rover
  const nearestPOI = React.useMemo<{ poi: (typeof pois)[0]; dist: number } | null>(() => {
    let closest: { poi: (typeof pois)[0]; dist: number } | null = null;
    let minDist = Infinity;
    pois.forEach((poi) => {
      const dx = rover.position[0] - poi.position[0];
      const dz = rover.position[2] - poi.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < minDist) {
        minDist = dist;
        closest = { poi, dist };
      }
    });
    return closest;
  }, [pois, rover.position]);


  const inScanRange = nearestPOI && nearestPOI.dist < 16.0;

  // Battery bar color
  const batteryColor =
    rover.battery > 50 ? 'bg-emerald-500' : rover.battery > 20 ? 'bg-amber-500' : 'bg-red-500 animate-pulse';

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 font-mono select-none">
      {/* ================= TOP TELEMETRY BAR ================= */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 transition-all duration-300 ${
          isCinematicHUD ? 'opacity-0 pointer-events-none -translate-y-4' : 'opacity-100 pointer-events-auto'
        }`}
      >
        {/* Mission Sol & Time */}
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/60 px-3.5 py-2 backdrop-blur-md shadow-lg shadow-black/40">
          <div className="flex flex-col">
            <span className="text-[10px] tracking-wider text-zinc-400">MISSION CLOCK • JEZERO</span>
            <span className="text-sm font-bold tracking-tight text-white">
              SOL {env.solNumber || 412} • {timeFormatted}{' '}
              <span className="text-[11px] text-cyan-400 font-normal">
                Ls {env.solarLongitudeLs ? env.solarLongitudeLs.toFixed(1) : '18.4'}°
              </span>
            </span>
          </div>
          <div className="h-6 w-px bg-white/15" />
          {/* Biome Badge */}
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            <div className="flex flex-col">
              <span className="text-[10px] tracking-wider text-zinc-400">BIOME</span>
              <span className="text-xs font-semibold text-cyan-300 uppercase">{env.currentBiome}</span>
            </div>
          </div>
        </div>

        {/* NASA MEDA Environmental Weather Station (Clickable to open MEDA Dashboard) */}
        <div
          onClick={() => {
            setTabletTab('meda');
            openModal('tablet');
          }}
          className="pointer-events-auto hidden sm:flex items-center gap-3.5 rounded-lg border border-cyan-500/30 bg-black/75 px-3.5 py-2 backdrop-blur-md shadow-lg shadow-black/50 hover:border-cyan-400 hover:bg-black/90 transition-all cursor-pointer group"
          title="NASA MEDA Atmospheric Weather Station — Click for Full Meteorological Telemetry"
        >
          {/* Thermal Sensors: Air & Ground */}
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-sky-400 group-hover:scale-110 transition-transform" />
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-400 leading-tight">AIR / GND</span>
              <span className="text-xs font-bold text-white">
                {env.ambientTemp}° <span className="text-[10px] text-zinc-400">/</span>{' '}
                <span className={env.groundTemp > 0 ? 'text-amber-400 font-bold' : 'text-sky-300'}>
                  {env.groundTemp > 0 ? `+${env.groundTemp}` : env.groundTemp}°C
                </span>
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-white/15" />

          {/* Barometric Pressure (MEDA PS) */}
          <div className="flex items-center gap-1.5">
            <Gauge className="h-4 w-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-400 leading-tight">PRESSURE</span>
              <span className="text-xs font-bold text-white">
                {env.pressurePa || 748} <span className="text-[10px] text-zinc-400 font-normal">Pa</span>
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-white/15" />

          {/* Wind Vector (MEDA WS) */}
          <div className="flex items-center gap-1.5">
            <Wind className="h-4 w-4 text-cyan-400" />
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-400 leading-tight">WIND</span>
              <span className="text-xs font-bold text-cyan-200">
                {env.windCompass || 'SSE'} {env.windSpeedMs || 4.2}{' '}
                <span className="text-[10px] text-zinc-400 font-normal">m/s</span>
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-white/15" />

          {/* Optical Depth (MEDA RDS) */}
          <div className="flex items-center gap-1.5">
            <Sun className={`h-4 w-4 ${env.dustTau > 1.5 ? 'text-orange-500' : 'text-amber-400'}`} />
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-400 leading-tight">DUST TAU (RDS)</span>
              <span className="text-xs font-bold text-amber-300">
                τ {env.dustTau ? env.dustTau.toFixed(2) : '0.44'}
              </span>
            </div>
          </div>

          {/* Dust Devil Convective Alert */}
          {env.dustDevilActive ? (
            <>
              <div className="h-6 w-px bg-white/15" />
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDustDevil();
                }}
                className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300 animate-pulse bg-amber-500/25 px-2 py-1 rounded border border-amber-500/50 hover:bg-amber-500/40 cursor-pointer transition-colors shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                title="Active Convective Sandstorm Vortex in Jezero Crater — Click to Toggle"
              >
                <Wind className="h-3.5 w-3.5 text-amber-300 animate-spin" />
                <span>VORTEX {env.dustDevilDistance ? `${env.dustDevilDistance}m` : 'ACTIVE'}</span>
              </div>
            </>
          ) : (
            <>
              <div className="h-6 w-px bg-white/15" />
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDustDevil();
                }}
                className="hidden sm:flex items-center gap-1 text-[9px] text-zinc-500 hover:text-amber-400 px-2 py-0.5 rounded border border-white/5 hover:border-amber-500/30 cursor-pointer transition-colors"
                title="Spawn Martian Dust Devil / Sandstorm Vortex"
              >
                <span>+ VORTEX</span>
              </div>
            </>
          )}

          <div className="hidden lg:flex items-center text-[9px] text-cyan-400 font-bold tracking-widest border-l border-white/10 pl-2">
            MEDA [TAB]
          </div>
        </div>

        {/* Mars Moons Ephemeris Tracker (Phobos & Deimos) */}
        {env.moons && (
          <div
            onClick={() => {
              setTabletTab('meda');
              openModal('tablet');
            }}
            className="pointer-events-auto hidden xl:flex items-center gap-2.5 rounded-lg border border-purple-500/30 bg-black/75 px-3 py-1.5 backdrop-blur-md shadow-lg shadow-black/50 hover:border-purple-400 hover:bg-black/90 transition-all cursor-pointer group"
            title="Martian Celestial Moons (Phobos & Deimos) Ephemeris — Click for Astrometry Details"
          >
            <Moon className="h-4 w-4 text-purple-400 group-hover:rotate-12 transition-transform" />
            <div className="flex flex-col text-[9px] leading-tight font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">PHOBOS:</span>
                <span
                  className={
                    env.moons.phobos.isTransitingSun
                      ? 'text-amber-400 font-bold animate-pulse'
                      : env.moons.phobos.isVisible
                      ? 'text-purple-300 font-semibold'
                      : 'text-zinc-500'
                  }
                >
                  {env.moons.phobos.isTransitingSun
                    ? '☀ SOLAR TRANSIT'
                    : env.moons.phobos.isVisible
                    ? `▲ ${env.moons.phobos.altitudeDeg}° W➔E (4.3h)`
                    : '▼ Below Horiz'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">DEIMOS:</span>
                <span className={env.moons.deimos.isVisible ? 'text-indigo-300 font-semibold' : 'text-zinc-500'}>
                  {env.moons.deimos.isVisible
                    ? `▲ ${env.moons.deimos.altitudeDeg}° E➔W (65h)`
                    : '▼ Below Horiz'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Power & Science Stats */}
        <div className="flex items-center gap-3">
          {/* Battery Status */}
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/60 px-3.5 py-2 backdrop-blur-md shadow-lg">
            {rover.batteryWarning ? (
              <BatteryWarning className="h-4 w-4 text-red-400 animate-bounce" />
            ) : (
              <Battery className="h-4 w-4 text-emerald-400" />
            )}
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400">BATTERY</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-16 rounded-full bg-zinc-800 overflow-hidden">
                  <div className={`h-full ${batteryColor}`} style={{ width: `${rover.battery}%` }} />
                </div>
                <span className="text-xs font-bold text-white">{rover.battery.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Science Points Award */}
          <div className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-2 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Sparkles className="h-4 w-4 text-cyan-300 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] text-cyan-300/80">SCIENCE POINTS</span>
              <span className="text-sm font-black tracking-wider text-cyan-200">{sciencePoints} SP</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              onClick={toggleSolarCharging}
              className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-md ${
                isSolarCharging
                  ? 'bg-amber-500/30 text-amber-300 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse'
                  : 'bg-black/70 text-zinc-300 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
              title="Deploy Solar Array Wings for Fast Power-Up [P]"
            >
              <Sun className={`h-3.5 w-3.5 ${isSolarCharging ? 'text-amber-300 animate-spin' : 'text-yellow-400'}`} />
              <span className="hidden sm:inline">{isSolarCharging ? 'CHARGING' : 'SOLAR'}</span>
              <kbd className="rounded bg-white/10 px-1 text-[9px] text-zinc-300">P</kbd>
            </button>

            <button
              onClick={() => openModal('tablet')}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-black/70 px-3 text-xs font-bold text-cyan-200 backdrop-blur-md transition-all hover:bg-cyan-900/40 hover:border-cyan-400 active:scale-95 cursor-pointer shadow-md"
              title="Open Mission Operations Tablet [Tab]"
            >
              <Tablet className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden md:inline">OPS TABLET</span>
              <kbd className="rounded bg-white/10 px-1 text-[9px] text-zinc-300">Tab</kbd>
            </button>

            <button
              onClick={() => {
                const nextCam = cameraMode === 'follow' ? 'orbit' : cameraMode === 'orbit' ? 'cockpit' : 'follow';
                setCameraMode(nextCam);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/70 text-zinc-300 backdrop-blur-md hover:bg-white/10 active:scale-95 cursor-pointer"
              title={`Camera Mode: ${cameraMode.toUpperCase()} [C]`}
            >
              <Camera className="h-4 w-4" />
            </button>

            <button
              onClick={() => setTimeSpeed(env.timeSpeed > 0.1 ? 0.05 : 0.4)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/70 backdrop-blur-md hover:bg-white/10 active:scale-95 cursor-pointer ${
                env.timeSpeed > 0.1 ? 'text-amber-400 border-amber-500/40' : 'text-zinc-400'
              }`}
              title="Toggle Time Acceleration (Fast Forward)"
            >
              <FastForward className="h-4 w-4" />
            </button>

            <button
              onClick={handleToggleMute}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/70 text-zinc-300 backdrop-blur-md hover:bg-white/10 active:scale-95 cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-zinc-300" />}
            </button>

            <button
              onClick={() => openModal('help')}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/70 text-zinc-300 backdrop-blur-md hover:bg-white/10 active:scale-95 cursor-pointer"
              title="Controls & Space Mission Guide [?]"
            >
              <HelpCircle className="h-4 w-4" />
            </button>

            {/* Re-deploy from Mother Ship Quick Button */}
            <button
              onClick={restartDeployment}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-2.5 text-xs font-bold text-cyan-300 backdrop-blur-md transition-all hover:bg-cyan-900/60 hover:border-cyan-400 active:scale-95 cursor-pointer shadow-md"
              title="Re-deploy Rover from Mother Ship with authentic NASA egress sequence"
            >
              <Rocket className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden xl:inline text-[11px]">RE-DEPLOY</span>
            </button>

            {/* Replay 3D Launch & EDL Sequence Button */}
            <button
              onClick={() => {
                soundEngine.playQuindarTone(true);
                useFlightTimelineStore.getState().resetTimeline();
                useFlightTimelineStore.getState().setGamePhase('LAUNCH');
              }}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-orange-500/40 bg-orange-950/40 px-2.5 text-xs font-bold text-orange-300 backdrop-blur-md transition-all hover:bg-orange-900/60 hover:border-orange-400 active:scale-95 cursor-pointer shadow-md"
              title="Replay Complete 3D Launch, Cruise & EDL Prologue"
            >
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span className="hidden xl:inline text-[11px]">LAUNCH & EDL</span>
            </button>

            {/* Cinematic Clean Screen Toggle */}
            <button
              onClick={toggleCinematicHUD}
              className={`flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-md ${
                isCinematicHUD
                  ? 'bg-amber-500/30 text-amber-300 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-black/70 text-zinc-300 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
              title="Toggle Full Cinematic View (Hide HUD) [H]"
            >
              {isCinematicHUD ? <EyeOff className="h-3.5 w-3.5 text-amber-400" /> : <Eye className="h-3.5 w-3.5 text-cyan-400" />}
              <span className="hidden xl:inline text-[11px]">VIEW</span>
              <kbd className="rounded bg-white/10 px-1 text-[9px] text-zinc-300">H</kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Cinematic Mode HUD Restore & Skip Controls (Only in Cinematic View) */}
      {isCinematicHUD && (
        <div className="pointer-events-auto fixed top-4 right-4 z-50 flex items-center gap-2 animate-in fade-in duration-200">
          {deployment.status !== 'deployed' && (
            <button
              onClick={skipDeployment}
              className="flex items-center gap-1.5 rounded-full bg-cyan-950/85 hover:bg-cyan-900 border border-cyan-400/50 px-3.5 py-1.5 text-xs font-bold text-cyan-200 backdrop-blur-md shadow-lg transition-all cursor-pointer active:scale-95 font-mono"
            >
              <span>SKIP EGRESS</span>
              <kbd className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-zinc-300">SPACE</kbd>
            </button>
          )}
          <button
            onClick={toggleCinematicHUD}
            className="flex items-center gap-1.5 rounded-full bg-black/85 hover:bg-black border border-white/25 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md shadow-lg transition-all cursor-pointer active:scale-95 font-mono"
            title="Restore Mission HUD [H]"
          >
            <Eye className="h-3.5 w-3.5 text-cyan-400" />
            <span>SHOW HUD</span>
            <kbd className="rounded bg-white/15 px-1.5 py-0.5 text-[9px] text-zinc-300">H</kbd>
          </button>
        </div>
      )}

      {/* ================= 100% UNOBSTRUCTED CENTER VIEWPORT SPACER ================= */}
      {/* Zero central overlays — the 3D rover, lander, ramps, and Mars terrain remain crystal clear! */}
      <div className="flex-1 pointer-events-none" />

      {/* ================= BOTTOM INSTRUMENT CLUSTERS ================= */}
      <div
        className={`flex flex-wrap items-end justify-between gap-3 w-full transition-all duration-300 ${
          isCinematicHUD ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 pointer-events-auto'
        }`}
      >
        {/* Bottom Left: GTA V Style Topographic Radar Mini-Map & Telemetry */}
        <GTAMiniMap />

        {/* Dynamic Center Action Dock (Egress Telemetry, Solar Charging, Docking, Proximity) */}
        {/* Docked along the bottom border between Left Map and Right Objectives: Zero Rover View Blocking! */}
        <div className="flex-1 flex flex-col items-center justify-end px-2 pb-0.5 max-w-xl mx-auto pointer-events-auto">
          {/* 1. Mother Ship Egress & Deployment Telemetry Strip */}
          {deployment.status !== 'deployed' && (
            isDeploymentMinimized ? (
              <div
                onClick={() => setIsDeploymentMinimized(false)}
                className="flex items-center gap-2 rounded-full border border-cyan-400/50 bg-black/85 px-3.5 py-1.5 text-xs backdrop-blur-md shadow-lg cursor-pointer hover:bg-black/95 transition-all text-cyan-300 font-mono"
                title="Expand NASA EDL Telemetry"
              >
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-bold text-[11px]">NASA EDL: {Math.round(deployment.progress * 100)}%</span>
                <Maximize2 className="h-3 w-3 text-cyan-400 ml-1" />
              </div>
            ) : (
              <div className="w-full rounded-xl border border-cyan-400/50 bg-black/80 px-4 py-2 backdrop-blur-md shadow-[0_0_25px_rgba(6,182,212,0.25)] animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                    <span className="font-mono text-[11px] font-bold tracking-wider text-cyan-300 truncate">
                      NASA EDL //{' '}
                      <span className="text-white">
                        {deployment.progress < 0.2
                          ? 'STAGE 1: PYRO RETENTION RELEASE'
                          : deployment.progress < 0.44
                          ? 'STAGE 2: RSM MAST UN-STOW'
                          : deployment.progress < 0.52
                          ? 'STAGE 3: 6-WHEEL STEER SWEEP'
                          : deployment.progress < 0.88
                          ? 'STAGE 4: DUAL RAMP DESCENT'
                          : 'STAGE 5: REGOLITH TOUCHDOWN'}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-xs font-black text-cyan-400">
                      {Math.round(deployment.progress * 100)}%
                    </span>
                    <button
                      onClick={skipDeployment}
                      className="flex items-center gap-1 rounded bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 px-2 py-0.5 text-[10px] font-bold text-cyan-200 transition-all cursor-pointer shadow-sm active:scale-95"
                      title="Skip Egress to Drive Ready [Space]"
                    >
                      <span>SKIP</span>
                      <kbd className="rounded bg-black/50 px-1 text-[8px] text-zinc-300 font-mono">SPACE</kbd>
                    </button>
                    <button
                      onClick={() => setIsDeploymentMinimized(true)}
                      className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Minimize Telemetry Strip"
                    >
                      <Minimize2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Micro 1.5px glowing progress bar */}
                <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-800/80 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 transition-all duration-150"
                    style={{ width: `${Math.round(deployment.progress * 100)}%` }}
                  />
                </div>

                {/* Sub-line: Live Radio Telemetry */}
                <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-zinc-400 truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <Radio className="h-3 w-3 text-cyan-400 shrink-0" />
                    <span className="truncate text-zinc-300">{deployment.telemetryLog}</span>
                  </div>
                  <span className="hidden sm:inline shrink-0 text-zinc-500 text-[9px] pl-2">
                    g=3.72m/s² • Dual Titanium Ramps
                  </span>
                </div>
              </div>
            )
          )}

          {/* 1b. NASA MEDA Real-Time Planetary Weather Alert Banner */}
          {env.activeWeatherAlert && (
            <div
              onClick={() => {
                setTabletTab('meda');
                openModal('tablet');
              }}
              className={`flex items-center gap-3 rounded-full border px-4 py-2 backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom-2 duration-200 cursor-pointer transition-all hover:scale-[1.02] ${
                env.activeWeatherAlert.severity === 'critical'
                  ? 'border-red-500/80 bg-red-950/90 text-red-200 shadow-[0_0_25px_rgba(239,68,68,0.4)]'
                  : env.activeWeatherAlert.severity === 'warning'
                  ? 'border-amber-500/80 bg-black/90 text-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.4)]'
                  : 'border-cyan-500/80 bg-black/85 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
              }`}
              title="Click to Open NASA MEDA Weather Telemetry [Tab]"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={`h-4 w-4 shrink-0 ${
                    env.activeWeatherAlert.severity === 'critical'
                      ? 'text-red-400 animate-bounce'
                      : env.activeWeatherAlert.severity === 'warning'
                      ? 'text-amber-400 animate-pulse'
                      : 'text-cyan-400'
                  }`}
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black tracking-wide uppercase text-white">
                      {env.activeWeatherAlert.title}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/10 uppercase tracking-wider">
                      {env.activeWeatherAlert.severity}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-300">
                    {env.activeWeatherAlert.description} • {env.activeWeatherAlert.recommendation}
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-amber-400 border border-amber-500/30 rounded px-2 py-0.5 bg-black/40 shrink-0 ml-2">
                MEDA [TAB] ↗
              </span>
            </div>
          )}

          {/* 1. Critical Battery Depletion Alert Banner */}
          {deployment.status === 'deployed' && rover.battery <= 0 && (
            <div className="flex items-center gap-3.5 rounded-2xl border-2 border-red-500/90 bg-black/95 px-5 py-2.5 backdrop-blur-xl shadow-[0_0_35px_rgba(239,68,68,0.55)] animate-pulse font-mono">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/30 border border-red-500 text-red-400">
                <BatteryWarning className="h-5 w-5 animate-bounce" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-widest text-red-400">
                    CRITICAL POWER FAILURE // BATTERY DEPLETED (0%)
                  </span>
                  <span className="rounded bg-red-950 px-1.5 py-0.2 text-[9px] font-bold text-red-300 border border-red-500/50">
                    IMMOBILIZED
                  </span>
                </div>
                <span className="text-[10px] text-zinc-300">
                  Drive motors disabled. Deploy solar arrays [P] in sunlight to restore power.
                </span>
              </div>
              <button
                onClick={toggleSolarCharging}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 cursor-pointer ml-1 shrink-0"
              >
                <Sun className="h-3.5 w-3.5" />
                <span>CHARGE [P]</span>
              </button>
            </div>
          )}

          {/* 2. Mars Base Habitat Docking Prompt */}
          {deployment.status === 'deployed' && motherShip.isDocked && (
            <div className="flex items-center gap-3 rounded-full border border-amber-400/80 bg-black/90 px-4 py-2 backdrop-blur-md shadow-[0_0_25px_rgba(245,158,11,0.4)] animate-in slide-in-from-bottom-2 duration-200">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-amber-300">
                  MARS HABITAT BASE // HUB 08 REACHED
                </span>
                <span className="text-[10px] text-zinc-300">
                  Enter Server Room, Store Room & Power Bay
                </span>
              </div>
              <button
                onClick={() => openModal('mothership')}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-3.5 py-1 text-xs font-bold text-white shadow-md hover:scale-105 active:scale-95 cursor-pointer ml-1"
              >
                <DoorOpen className="h-3.5 w-3.5" />
                <span>ENTER BASE [E]</span>
              </button>
            </div>
          )}

          {/* 3. Solar Rapid Charging Indicator */}
          {deployment.status === 'deployed' && !motherShip.isDocked && isSolarCharging && (
            <div className="flex items-center gap-3 rounded-full border border-amber-400/70 bg-black/85 px-4 py-1.5 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.35)] animate-in slide-in-from-bottom-2 duration-200">
              <Sun className="h-4 w-4 text-amber-400 animate-spin" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-amber-300">
                  SOLAR ARRAY DEPLOYED — RAPID POWER-UP ACTIVE
                </span>
                <span className="text-[10px] text-zinc-300">
                  Absorbing +{rover.solarWatts}W solar energy • Press [P] to stow
                </span>
              </div>
              <button
                onClick={toggleSolarCharging}
                className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] text-zinc-300 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                STOW
              </button>
            </div>
          )}

          {/* 4. POI Proximity Scan Trigger Pill */}
          {deployment.status === 'deployed' && !motherShip.isDocked && !isSolarCharging && !isScanning && inScanRange && nearestPOI && !nearestPOI.poi.sampleCollected && (
            <div className="flex items-center gap-3 rounded-full border border-cyan-400/60 bg-black/85 px-4 py-1.5 backdrop-blur-md shadow-[0_0_20px_rgba(34,211,238,0.35)] animate-in slide-in-from-bottom-2 duration-200">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-white">{nearestPOI.poi.name}</span>
                  <span className="text-[10px] text-zinc-400">({nearestPOI.dist.toFixed(1)}m)</span>
                </div>
                <span className="text-[9px] text-cyan-300/80">
                  {nearestPOI.poi.sensorAcronym} • {nearestPOI.poi.geologicalEra}
                </span>
              </div>
              <button
                onClick={() => startDeepScan(nearestPOI.poi)}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1 text-xs font-bold text-white shadow-md hover:scale-105 active:scale-95 cursor-pointer ml-1"
              >
                <Zap className="h-3 w-3 text-yellow-300" />
                <span>SCAN [F]</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Right: Science Sampling Panel (when active) + Mission Objectives + Controls */}
        <div className="flex flex-col items-end gap-2 max-w-xs">
          {/* Active Scientific Data & Core Sampling Procedure (Docked cleanly on Right Stack) */}
          {isScanning && activeScanPOI && (
            <div className="w-80 rounded-xl border border-cyan-400/60 bg-black/90 p-3 backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.3)] animate-in slide-in-from-right duration-200 font-mono">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-[10px] font-black tracking-wider text-cyan-300 truncate">
                    ROBOTIC ARM TURRET ENGAGED
                  </span>
                </div>
                <span className="text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-200 px-1.5 py-0.5 rounded border border-cyan-500/40">
                  PIXL • SHERLOC • DRILL
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="truncate mr-2">
                  <span className="text-xs font-black text-white truncate block">{activeScanPOI.name}</span>
                  <span className="text-[9px] text-zinc-400 block font-mono truncate">
                    {activeScanPOI.category} • {activeScanPOI.geologicalEra}
                  </span>
                </div>
                <span className="text-sm font-black text-cyan-300 font-mono">
                  {Math.round(scanProgress)}%
                </span>
              </div>

              <div className="mt-1.5 text-[9px] font-mono font-bold text-amber-300 flex items-center gap-1.5 truncate">
                <Zap className="h-3 w-3 text-yellow-400 animate-bounce shrink-0" />
                <span className="truncate">
                  {scanProgress < 25
                    ? 'PHASE 1: ARM DEPLOYMENT & ALIGNMENT'
                    : scanProgress < 50
                    ? 'PHASE 2: ROTARY PERCUSSIVE DRILL ABRASION'
                    : scanProgress < 85
                    ? 'PHASE 3: SHERLOC UV RAMAN & PIXL X-RAY'
                    : 'PHASE 4: TITANIUM CORE CAROUSEL CACHING'}
                </span>
              </div>

              <div className="mt-1.5 h-1.5 w-full rounded-full bg-zinc-900 border border-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-cyan-400 to-emerald-400 transition-all duration-150"
                  style={{ width: `${Math.round(scanProgress)}%` }}
                />
              </div>

              <div className="mt-1.5 grid grid-cols-4 gap-1 text-center text-[9px] font-mono bg-white/5 rounded p-1 border border-white/5">
                <div>
                  <span className="text-zinc-400 block text-[8px]">Fe</span>
                  <span className="text-cyan-300 font-bold">38.4%</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[8px]">Si</span>
                  <span className="text-cyan-300 font-bold">42.1%</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[8px]">Mg</span>
                  <span className="text-cyan-300 font-bold">14.6%</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[8px]">BIO</span>
                  <span className="text-emerald-400 font-bold">SIG</span>
                </div>
              </div>
            </div>
          )}

          {/* Active Primary Objective Snippet */}
          <div className="flex flex-col rounded-xl border border-white/10 bg-black/70 p-3.5 backdrop-blur-md shadow-2xl w-full">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] font-bold tracking-wider text-cyan-400">ACTIVE MISSION</span>
              <span className="text-[10px] text-zinc-400">
                {objectives.filter((o) => o.completed).length} / {objectives.length} DONE
              </span>
            </div>
            <span className="mt-1 text-xs font-bold text-white">{objectives[0].title}</span>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (objectives[0].currentCount / objectives[0].targetCount) * 100
                    )}%`,
                  }}
                />
              </div>
              <span className="text-[10px] font-bold text-zinc-300">
                {objectives[0].currentCount}/{objectives[0].targetCount}
              </span>
            </div>
          </div>

          {/* Quick Keys legend */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-400 bg-black/50 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm">
            <span>
              <kbd className="text-white font-bold">[W,A,S,D]</kbd> Drive
            </span>
            <span>•</span>
            <span>
              <kbd className="text-white font-bold">[P]</kbd> Solar
            </span>
            <span>•</span>
            <span>
              <kbd className="text-white font-bold">[E]</kbd> MAV
            </span>
            <span>•</span>
            <span>
              <kbd className="text-white font-bold">[F]</kbd> Scan
            </span>
            <span>•</span>
            <span>
              <kbd className="text-white font-bold">[Tab]</kbd> Tablet
            </span>
            <span>•</span>
            <span>
              <kbd className="text-white font-bold">[C]</kbd> View
            </span>
            <span>•</span>
            <span>
              <kbd className="text-cyan-300 font-bold">[H]</kbd> Clean HUD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

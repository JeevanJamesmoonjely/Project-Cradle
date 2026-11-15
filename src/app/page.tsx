'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { HUDOverlay } from '@/components/ui/HUDOverlay';
import { ScienceDossierModal } from '@/components/ui/ScienceDossierModal';
import { MissionTablet } from '@/components/ui/MissionTablet';
import { ControlsModal } from '@/components/ui/ControlsModal';
import { MotherShipModal } from '@/components/ui/MotherShipModal';
import { FlightHud } from '@/components/sequence/FlightHud';
import { soundEngine } from '@/lib/audio/soundManager';
import { useFlightTimelineStore } from '@/lib/store/useFlightTimelineStore';
import { Rocket, Flame, Globe, FastForward } from 'lucide-react';

// Dynamic import for Three.js Canvas to disable SSR cleanly
const WorldCanvas = dynamic(
  () => import('@/components/canvas/WorldCanvas').then((mod) => mod.WorldCanvas),
  { ssr: false }
);

export default function Home() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const gamePhase = useFlightTimelineStore((s) => s.gamePhase);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLaunchFullSequence = () => {
    soundEngine.init();
    soundEngine.playQuindarTone(true);
    useFlightTimelineStore.getState().resetTimeline();
    useFlightTimelineStore.getState().setGamePhase('LAUNCH');
    setHasStarted(true);
  };

  const handleLaunchEDLDirect = () => {
    soundEngine.init();
    soundEngine.playQuindarTone(true);
    useFlightTimelineStore.getState().setFlightPhase('EDL_ENTRY');
    setHasStarted(true);
  };

  const handleDirectSurface = () => {
    soundEngine.init();
    useFlightTimelineStore.getState().skipToSurface();
    setHasStarted(true);
  };

  if (!isClient) return null;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white select-none">
      {/* 3D WebGL Multi-Phase World */}
      <WorldCanvas />

      {/* Flight Telemetry HUD during Launch, Cruise & EDL */}
      {hasStarted && gamePhase !== 'SURFACE_EXPLORATION' && <FlightHud />}

      {/* Surface Tactical HUD and Modals during Surface Exploration */}
      {hasStarted && gamePhase === 'SURFACE_EXPLORATION' && (
        <>
          <HUDOverlay />
          <ScienceDossierModal />
          <MissionTablet />
          <ControlsModal />
          <MotherShipModal />
        </>
      )}

      {/* Initial Mission Launch Splash Screen */}
      {!hasStarted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative flex max-w-xl flex-col items-center text-center rounded-3xl border border-cyan-500/30 bg-zinc-950/90 p-8 shadow-[0_0_80px_rgba(6,182,212,0.2)]">
            {/* Mission Badge */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 mb-4 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Globe className="h-8 w-8 animate-pulse" />
            </div>

            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold tracking-widest text-cyan-400">
                NASA SPACE APPS CHALLENGE
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              PROJECT CRADLE
            </h1>
            <p className="font-mono text-sm text-cyan-300/90 tracking-wide mt-1">
              LAUNCH & EDL (ENTRY, DESCENT & LANDING) PROLOGUE
            </p>

            <p className="mt-4 text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-md font-sans">
              Experience the authentic Earth lift-off, deep-space transit, atmospheric plasma entry, and the
              &quot;7 Minutes of Terror&quot; Sky Crane landing sequence before taking command of your Martian rover on the floor of Jezero Crater.
            </p>

            {/* Launch Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full">
              {/* Full Prologue Sequence Button */}
              <button
                onClick={handleLaunchFullSequence}
                className="w-full flex-1 flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-5 py-3.5 font-mono text-xs sm:text-sm font-extrabold text-black shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all hover:scale-102 active:scale-95 cursor-pointer"
              >
                <Rocket className="h-4 w-4 fill-black flex-shrink-0" />
                <span>LAUNCH SEQUENCE (FULL PROLOGUE)</span>
              </button>
            </div>

            {/* Quick Option Pills */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 w-full">
              <button
                onClick={handleLaunchEDLDirect}
                className="flex items-center gap-1.5 rounded-lg border border-orange-500/40 bg-orange-950/30 px-3 py-1.5 text-xs font-bold text-orange-300 hover:bg-orange-900/50 hover:border-orange-400 transition-all cursor-pointer"
                title="Jump directly to Mach 1.7 entry, supersonic chute, and Sky Crane touchdown"
              >
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                <span>JUMP TO &quot;7 MINUTES OF TERROR&quot; (EDL)</span>
              </button>

              <button
                onClick={handleDirectSurface}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-400 transition-all cursor-pointer"
                title="Directly deploy onto Martian surface with rover controls"
              >
                <FastForward className="h-3.5 w-3.5 text-emerald-400" />
                <span>DIRECT SURFACE EXPLORATION</span>
              </button>
            </div>

            {/* Quick keys footer */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-zinc-400 border-t border-white/10 pt-4 w-full">
              <span>Drive: <strong className="text-white">WASD / Arrows</strong></span>
              <span>•</span>
              <span>Skip: <strong className="text-cyan-300">[Space]</strong></span>
              <span>•</span>
              <span>Scan: <strong className="text-white">[F]</strong></span>
              <span>•</span>
              <span>Tablet: <strong className="text-white">[Tab]</strong></span>
              <span>•</span>
              <span>View: <strong className="text-white">[C]</strong></span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

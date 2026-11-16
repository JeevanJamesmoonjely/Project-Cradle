'use client';

import React, { useState } from 'react';
import {
  Rocket,
  X,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  Zap,
  HardDrive,
  Database,
  Radio,
  ArrowRight,
  ShieldCheck,
  Server,
  Package,
  Wrench,
  Compass,
  DoorOpen,
  Cpu,
  Layers,
  Activity,
  Gauge,
  Thermometer,
  Wind,
} from 'lucide-react';
import { useMissionStore } from '@/lib/store/useMissionStore';
import { soundEngine } from '@/lib/audio/soundManager';

export const MotherShipModal: React.FC = () => {
  const activeModal = useMissionStore((s) => s.activeModal);
  const closeModal = useMissionStore((s) => s.closeModal);
  const pois = useMissionStore((s) => s.pois);
  const rover = useMissionStore((s) => s.rover);
  const env = useMissionStore((s) => s.env);
  const motherShip = useMissionStore((s) => s.motherShip);
  const sciencePoints = useMissionStore((s) => s.sciencePoints);
  const baseHabitat = useMissionStore((s) => s.baseHabitat);
  const setBaseRoom = useMissionStore((s) => s.setBaseRoom);

  const depositSampleToVault = useMissionStore((s) => s.depositSampleToVault);
  const depositAllSamplesToVault = useMissionStore((s) => s.depositAllSamplesToVault);
  const uploadTelemetryInServerRoom = useMissionStore((s) => s.uploadTelemetryInServerRoom);
  const uploadAllTelemetryInServerRoom = useMissionStore((s) => s.uploadAllTelemetryInServerRoom);
  const superchargeAtPowerBay = useMissionStore((s) => s.superchargeAtPowerBay);
  const cleanSolarDustAtPowerBay = useMissionStore((s) => s.cleanSolarDustAtPowerBay);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isSupercharging, setIsSupercharging] = useState(false);

  if (activeModal !== 'mothership') return null;

  // Active room in the base
  const activeRoom = baseHabitat.activeRoom;

  // Inventory breakdown
  const collectedSamples = pois.filter((p) => p.sampleCollected);
  const pendingData = pois.filter((p) => p.discovered && !p.downlinked);

  const handleUploadAll = () => {
    setIsUploading(true);
    setUploadProgress(10);
    soundEngine.playServerUplinkStream();

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          uploadAllTelemetryInServerRoom();
          setIsUploading(false);
          return 100;
        }
        return prev + 25;
      });
    }, 280);
  };

  const handleDepositAll = () => {
    setIsDepositing(true);
    soundEngine.playVaultCanisterLock();
    setTimeout(() => {
      depositAllSamplesToVault();
      setIsDepositing(false);
    }, 600);
  };

  const handleSupercharge = () => {
    setIsSupercharging(true);
    soundEngine.playSuperchargeHum();
    setTimeout(() => {
      superchargeAtPowerBay();
      setIsSupercharging(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* High-Tech Base Interior Terminal Frame */}
      <div className="relative flex w-full max-w-4xl max-h-[92vh] flex-col rounded-3xl border-2 border-amber-500/40 bg-zinc-950 shadow-[0_0_80px_rgba(245,158,11,0.25)] font-mono text-white overflow-hidden">
        {/* Top Base Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/30 border border-amber-400/50 text-amber-300 shadow-md">
              <Compass className="h-6 w-6 animate-spin" style={{ animationDuration: '30s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-amber-400">
                  MARS HABITAT BASE // HUB 08 COLONY COMPLEX
                </span>
                <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/40 font-bold">
                  PRESSURIZED • 101.3 kPa
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Primary Surface Research Habitat & Logistics Facility
              </h2>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Exit Base to Rover [ESC]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Room Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 bg-black/50 px-6 py-2.5 overflow-x-auto">
          <button
            onClick={() => setBaseRoom('airlock')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeRoom === 'airlock'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-sm'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <DoorOpen className="h-4 w-4" />
            <span>EVA AIRLOCK</span>
          </button>

          <button
            onClick={() => setBaseRoom('server_room')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer relative ${
              activeRoom === 'server_room'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Server className="h-4 w-4" />
            <span>SERVER ROOM // UPLINK</span>
            {pendingData.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[9px] font-black text-black">
                {pendingData.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setBaseRoom('store_room')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer relative ${
              activeRoom === 'store_room'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-sm'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>STORE ROOM // VAULT</span>
            {collectedSamples.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-black text-black">
                {collectedSamples.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setBaseRoom('power_bay')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeRoom === 'power_bay'
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/50 shadow-sm'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Wrench className="h-4 w-4" />
            <span>POWER & MAINTENANCE</span>
            {rover.battery < 90 && (
              <span className="h-2 w-2 rounded-full bg-yellow-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setBaseRoom('mav')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeRoom === 'mav'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-400/50 shadow-sm'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Rocket className="h-4 w-4" />
            <span>MAV ROCKET GANTRY</span>
          </button>
        </div>

        {/* Room Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* =========================================================================
              ROOM 1: 🖥️ SERVER ROOM & DEEP SPACE TELEMETRY UPLINK (WING L-04)
              "go to the server room to upload the data"
              ========================================================================= */}
          {activeRoom === 'server_room' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Server Room Banner */}
              <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 to-black p-5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-400 text-cyan-300">
                      <Server className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black tracking-widest text-cyan-400">
                          WING L-04 // SUPERCOMPUTING BLADE RACKS
                        </span>
                        <span className="rounded bg-cyan-950 border border-cyan-500/50 px-1.5 py-0.5 text-[9px] text-cyan-300 font-bold">
                          DSN LINK 18.0m DISH ACTIVE
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-0.5">
                        Deep Space Telemetry Uplink & Data Offload Terminal
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Transmit your multispectral imagery, subsurface radar scans, and MEDA datasets to Earth via the Deep Space Network.
                      </p>
                    </div>
                  </div>

                  {pendingData.length > 0 && (
                    <button
                      onClick={handleUploadAll}
                      disabled={isUploading}
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-50 text-xs"
                    >
                      <UploadCloud className="h-4 w-4" />
                      <span>{isUploading ? `UPLINKING (${uploadProgress}%)` : `UPLOAD ALL (${pendingData.length}) DATASETS`}</span>
                    </button>
                  )}
                </div>

                {/* Upload Progress Bar */}
                {isUploading && (
                  <div className="mt-4 pt-4 border-t border-cyan-500/20">
                    <div className="flex justify-between text-[11px] text-cyan-300 mb-1.5">
                      <span>STREAMING PACKETS TO ORBITAL RELAY (45.2 MB/s)...</span>
                      <span>{uploadProgress}% COMPLETE</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Rover Storage Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/60 p-3.5 flex flex-col">
                  <span className="text-[10px] text-zinc-400">ROVER ONBOARD STORAGE</span>
                  <span className="text-lg font-bold text-cyan-300 mt-1">
                    {rover.storageUsedMB} MB / {rover.storageMaxMB} MB
                  </span>
                  <span className="text-[9px] text-zinc-500">Offloaded upon server upload</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/60 p-3.5 flex flex-col">
                  <span className="text-[10px] text-zinc-400">PENDING DATASETS</span>
                  <span className="text-lg font-bold text-amber-300 mt-1">
                    {pendingData.length} Scientific Records
                  </span>
                  <span className="text-[9px] text-zinc-500">Awaiting Earth transmission</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/60 p-3.5 flex flex-col">
                  <span className="text-[10px] text-zinc-400">TOTAL DATA UPLINKED</span>
                  <span className="text-lg font-bold text-emerald-300 mt-1">
                    {motherShip.dataTransmitted} Datasets Delivered
                  </span>
                  <span className="text-[9px] text-zinc-500">Secured in JPL Planetary Data System</span>
                </div>
              </div>

              {/* Datasets Table */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                  Scientific Telemetry Datasets Queue
                </h4>

                {pendingData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-zinc-500 text-xs">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
                    <span className="font-bold text-white">All Scientific Telemetry Uplinked!</span>
                    <span className="text-[10px] text-zinc-400 mt-1">
                      Rover storage memory is clear. Explore new Martian POIs to record more telemetry!
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingData.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-xs hover:border-cyan-500/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Database className="h-4 w-4 text-cyan-400" />
                          <div>
                            <span className="font-bold text-white">{p.name}</span>
                            <span className="block text-[10px] text-zinc-400">
                              {p.category} • {p.biome} • Est. Size 480 MB
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="rounded bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 text-xs font-bold text-cyan-300">
                            +{p.sciencePoints} SP
                          </span>
                          <button
                            onClick={() => uploadTelemetryInServerRoom(p.id)}
                            className="flex items-center gap-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/50 px-3 py-1 text-xs font-bold text-cyan-200 hover:bg-cyan-500 hover:text-black transition-all cursor-pointer"
                          >
                            <UploadCloud className="h-3.5 w-3.5" />
                            <span>UPLOAD</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              ROOM 2: 📦 STORE ROOM & GEOLOGICAL CORE SAMPLE VAULT (WING L-03)
              "go to store room to put the collected item"
              ========================================================================= */}
          {activeRoom === 'store_room' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Store Room Banner */}
              <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 to-black p-5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300">
                      <Package className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black tracking-widest text-emerald-400">
                          WING L-03 // STORE ROOM & CORE SAMPLE VAULT
                        </span>
                        <span className="rounded bg-emerald-950 border border-emerald-500/50 px-1.5 py-0.5 text-[9px] text-emerald-300 font-bold">
                          HERMETIC NITROGEN PURGED
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-0.5">
                        Martian Regolith & Geological Core Specimen Storage
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Secure physical rock core tubes into hermetically sealed vault canisters, freeing rover drill carousel slots and queuing them for the MAV rocket.
                      </p>
                    </div>
                  </div>

                  {collectedSamples.length > 0 && (
                    <button
                      onClick={handleDepositAll}
                      disabled={isDepositing}
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 font-bold text-white shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-50 text-xs"
                    >
                      <HardDrive className="h-4 w-4" />
                      <span>{isDepositing ? 'SECURING IN VAULT...' : `LOCK ALL (${collectedSamples.length}) IN VAULT`}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sample Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/60 p-3.5 flex flex-col">
                  <span className="text-[10px] text-zinc-400">ONBOARD ROVER CAROUSEL</span>
                  <span className="text-lg font-bold text-amber-300 mt-1">
                    {collectedSamples.length} Sealed Tubes
                  </span>
                  <span className="text-[9px] text-zinc-500">Currently in rover coring drill</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/60 p-3.5 flex flex-col">
                  <span className="text-[10px] text-zinc-400">STORED IN BASE VAULT</span>
                  <span className="text-lg font-bold text-emerald-300 mt-1">
                    {baseHabitat.vaultCanisters.length} Specimen Tubes
                  </span>
                  <span className="text-[9px] text-zinc-500">Safely preserved in nitrogen bays</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/60 p-3.5 flex flex-col">
                  <span className="text-[10px] text-zinc-400">MAV PAYLOAD ALLOCATION</span>
                  <span className="text-lg font-bold text-orange-300 mt-1">
                    {baseHabitat.vaultCanisters.length} / 30 Maximum
                  </span>
                  <span className="text-[9px] text-zinc-500">Queued for Earth Return</span>
                </div>
              </div>

              {/* Onboard Core Samples List */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                  Physical Samples Carried by Rover (Ready for Deposit)
                </h4>

                {collectedSamples.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-zinc-500 text-xs">
                    <HardDrive className="h-8 w-8 text-zinc-600 mb-2" />
                    <span>No physical samples currently held in the rover carousel.</span>
                    <span className="text-[10px] text-zinc-400 mt-1">
                      Drive to Jezero crater outcrops and use [F] to drill new core specimens!
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {collectedSamples.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-xs hover:border-emerald-500/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <HardDrive className="h-4 w-4 text-emerald-400" />
                          <div>
                            <span className="font-bold text-white">{p.name}</span>
                            <span className="block text-[10px] text-zinc-400">
                              {p.composition?.map((c) => c.mineral).join(', ') || 'Silicate & Ferric Matrix'} • {p.biosignaturePotential} Potential
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="rounded bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 text-xs font-bold text-emerald-300">
                            +450 SP
                          </span>
                          <button
                            onClick={() => depositSampleToVault(p.id)}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/50 px-3 py-1 text-xs font-bold text-emerald-200 hover:bg-emerald-500 hover:text-black transition-all cursor-pointer"
                          >
                            <Package className="h-3.5 w-3.5" />
                            <span>DEPOSIT</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stored Canisters Rack */}
              {baseHabitat.vaultCanisters.length > 0 && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4">
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-3">
                    Vault Storage Canister Rack // Nitrogen Purged Status
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {baseHabitat.vaultCanisters.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-lg border border-emerald-500/30 bg-black/60 p-2.5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/30 text-[10px] font-bold text-emerald-300">
                            #{c.slotIndex}
                          </span>
                          <span className="text-[11px] font-bold text-zinc-200 truncate max-w-[140px]">
                            {c.name}
                          </span>
                        </div>
                        <span className="text-[9px] text-emerald-400 font-mono">SECURED</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              ROOM 3: ⚡ POWER & MAINTENANCE BAY (WING L-02)
              ========================================================================= */}
          {activeRoom === 'power_bay' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-950/40 to-black p-5 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500/20 border border-yellow-400 text-yellow-300">
                    <Wrench className="h-6 w-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black tracking-widest text-yellow-400">
                        WING L-02 // ROVER SERVICE & HIGH-VOLTAGE DOCK
                      </span>
                      <span className="rounded bg-yellow-950 border border-yellow-500/50 px-1.5 py-0.5 text-[9px] text-yellow-300 font-bold">
                        400V DC UMBILICAL ENERGIZED
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      Robotic Maintenance & High-Current Recharging Bay
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Connect the heavy surface umbilical to rapid-charge the rover battery to 100%, deploy high-pressure CO2 to blow dust off solar cells, and cool motor actuators.
                    </p>
                  </div>
                </div>
              </div>

              {/* Maintenance Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Supercharge Battery */}
                <div className="rounded-2xl border border-white/10 bg-black/60 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-white text-sm">400V DC SUPERCHARGE</span>
                      <Zap className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-3 flex-1 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                          style={{ width: `${rover.battery}%` }}
                        />
                      </div>
                      <span className="text-base font-bold text-white">{rover.battery.toFixed(0)}%</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Bypasses solar limitations to immediately recharge dual 43 Ah lithium-ion packs to full capacity.
                    </p>
                  </div>

                  <button
                    onClick={handleSupercharge}
                    disabled={isSupercharging || rover.battery >= 99.5}
                    className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 px-4 py-2.5 font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-40 text-xs"
                  >
                    <Zap className="h-4 w-4" />
                    <span>{isSupercharging ? 'ENERGIZING...' : rover.battery >= 99.5 ? 'BATTERY AT 100%' : 'SUPERCHARGE TO 100%'}</span>
                  </button>
                </div>

                {/* Pneumatic Solar Dust Sweep */}
                <div className="rounded-2xl border border-white/10 bg-black/60 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-white text-sm">PNEUMATIC CO2 DUST SWEEP</span>
                      <Wind className="h-5 w-5 text-cyan-400" />
                    </div>
                    <p className="text-[11px] text-zinc-400 mb-3">
                      Uses compressed Martian carbon dioxide gas jets to blow fine aeolian dust off the photovoltaic array cells, maximizing solar conversion efficiency.
                    </p>
                  </div>

                  <button
                    onClick={cleanSolarDustAtPowerBay}
                    className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer text-xs"
                  >
                    <Wind className="h-4 w-4" />
                    <span>RESTORE SOLAR CLEANLINESS (100%)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              ROOM 4: 🚀 MARS ASCENT VEHICLE (MAV) LAUNCH GANTRY
              ========================================================================= */}
          {activeRoom === 'mav' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-950/40 to-black p-5 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/20 border border-orange-400 text-orange-300">
                    <Rocket className="h-6 w-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black tracking-widest text-orange-400">
                        REAR LAUNCH PAD // MARS ASCENT VEHICLE
                      </span>
                      <span className="rounded bg-orange-950 border border-orange-500/50 px-1.5 py-0.5 text-[9px] text-orange-300 font-bold">
                        TWO-STAGE SOLID MOTOR READY
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      Earth-Return Sample Canister Rocket Gantry
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      The MAV rocket stands behind Hub 08. When enough geological specimens are deposited into the Store Room, they are loaded into the nosecone for launch to Mars orbit!
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/60 p-3.5 flex flex-col">
                  <span className="text-[10px] text-zinc-400">ROCKET STAGE 1</span>
                  <span className="text-base font-bold text-emerald-400 mt-1">SOLID PROPELLANT ARMED</span>
                  <span className="text-[9px] text-zinc-500">Delta-V: 4,200 m/s</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/60 p-3.5 flex flex-col">
                  <span className="text-[10px] text-zinc-400">NOSECONE CANISTER</span>
                  <span className="text-base font-bold text-amber-300 mt-1">
                    {baseHabitat.vaultCanisters.length} Tubes Loaded
                  </span>
                  <span className="text-[9px] text-zinc-500">Hermetically Sealed</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/60 p-3.5 flex flex-col">
                  <span className="text-[10px] text-zinc-400">ORBITAL RENDEZVOUS</span>
                  <span className="text-base font-bold text-cyan-300 mt-1">EARTH RETURN ORBITER (ERO)</span>
                  <span className="text-[9px] text-zinc-500">Awaiting Launch Command</span>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              ROOM 5: 🚪 EVA AIRLOCK (ENTRY & HABITAT STATUS)
              ========================================================================= */}
          {activeRoom === 'airlock' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 to-black p-5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-300">
                      <DoorOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black tracking-widest text-amber-400">
                          PRIMARY EVA DECONTAMINATION & SUIT AIRLOCK
                        </span>
                        <span className="rounded bg-emerald-950 border border-emerald-500/50 px-1.5 py-0.5 text-[9px] text-emerald-300 font-bold">
                          INTERNAL EQUALIZED
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-0.5">
                        Central Habitat Hub 08 Portal
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Welcome to the Martian Surface Base. Use the room navigation tabs above to visit the Server Room, Store Room, or Power Bay.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={closeModal}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-3 font-bold text-white shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0 text-xs"
                  >
                    <DoorOpen className="h-4 w-4" />
                    <span>EXIT BASE TO ROVER [ESC]</span>
                  </button>
                </div>
              </div>

              {/* Environmental telemetry */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/60 p-3 flex flex-col">
                  <span className="text-[10px] text-zinc-400">HABITAT TEMP</span>
                  <span className="text-base font-bold text-white mt-0.5">+21.5 °C</span>
                  <span className="text-[9px] text-emerald-400">Nominal 101.3 kPa</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/60 p-3 flex flex-col">
                  <span className="text-[10px] text-zinc-400">EXTERIOR AIR</span>
                  <span className="text-base font-bold text-amber-300 mt-0.5">{env.ambientTemp} °C</span>
                  <span className="text-[9px] text-zinc-500">{env.pressurePa} Pa Pressure</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/60 p-3 flex flex-col">
                  <span className="text-[10px] text-zinc-400">SOL CLOCK</span>
                  <span className="text-base font-bold text-white mt-0.5">Sol {env.solNumber}</span>
                  <span className="text-[9px] text-cyan-300">{env.timeOfDay.toFixed(1)} LST</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/60 p-3 flex flex-col">
                  <span className="text-[10px] text-zinc-400">CURRENT SP</span>
                  <span className="text-base font-bold text-cyan-200 mt-0.5">{sciencePoints} SP</span>
                  <span className="text-[9px] text-emerald-400">Active Campaign</span>
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setBaseRoom('server_room')}
                  className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-left hover:bg-cyan-950/40 transition-all cursor-pointer group"
                >
                  <Server className="h-5 w-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-white block text-sm">Server Room</span>
                  <span className="text-[11px] text-zinc-400 block mt-1">
                    Upload spectral telemetry datasets to Earth via DSN dish.
                  </span>
                  <span className="text-[10px] text-cyan-300 font-bold mt-2 block">GO TO SERVER ROOM →</span>
                </button>

                <button
                  onClick={() => setBaseRoom('store_room')}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-left hover:bg-emerald-950/40 transition-all cursor-pointer group"
                >
                  <Package className="h-5 w-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-white block text-sm">Store Room</span>
                  <span className="text-[11px] text-zinc-400 block mt-1">
                    Deposit drilled core sample tubes into the nitrogen vault.
                  </span>
                  <span className="text-[10px] text-emerald-300 font-bold mt-2 block">GO TO STORE ROOM →</span>
                </button>

                <button
                  onClick={() => setBaseRoom('power_bay')}
                  className="rounded-xl border border-yellow-500/30 bg-yellow-950/20 p-4 text-left hover:bg-yellow-950/40 transition-all cursor-pointer group"
                >
                  <Wrench className="h-5 w-5 text-yellow-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-white block text-sm">Power Bay</span>
                  <span className="text-[11px] text-zinc-400 block mt-1">
                    Supercharge battery to 100% and clean solar array dust.
                  </span>
                  <span className="text-[10px] text-yellow-300 font-bold mt-2 block">GO TO POWER BAY →</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status Ticker */}
        <div className="border-t border-white/10 bg-black/80 px-6 py-2.5 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span className="font-mono text-zinc-300 truncate max-w-[500px]">
              {baseHabitat.lastActionLog}
            </span>
          </div>

          <button
            onClick={closeModal}
            className="flex items-center gap-1 font-bold text-amber-300 hover:text-white transition-colors cursor-pointer"
          >
            <span>RETURN TO ROVER</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

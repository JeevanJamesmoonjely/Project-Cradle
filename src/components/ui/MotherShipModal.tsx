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
} from 'lucide-react';
import { useMissionStore } from '@/lib/store/useMissionStore';
import { soundEngine } from '@/lib/audio/soundManager';

export const MotherShipModal: React.FC = () => {
  const activeModal = useMissionStore((s) => s.activeModal);
  const closeModal = useMissionStore((s) => s.closeModal);
  const pois = useMissionStore((s) => s.pois);
  const rover = useMissionStore((s) => s.rover);
  const motherShip = useMissionStore((s) => s.motherShip);
  const submitToMotherShip = useMissionStore((s) => s.submitToMotherShip);
  const sciencePoints = useMissionStore((s) => s.sciencePoints);

  const [isTransferring, setIsTransferring] = useState(false);
  const [transferDone, setTransferDone] = useState(false);
  const [lastReward, setLastReward] = useState<number | null>(null);

  if (activeModal !== 'mothership') return null;

  // Calculate pending samples and data
  const collectedSamples = pois.filter((p) => p.sampleCollected);
  const pendingData = pois.filter((p) => p.discovered && !p.downlinked);

  const sampleReward = collectedSamples.length * 400;
  const dataReward = pendingData.reduce((sum, p) => sum + p.sciencePoints, 0);
  const orbitalDeliveryBonus = 500;
  const totalPotentialReward = sampleReward + dataReward + orbitalDeliveryBonus;

  const handleTransfer = () => {
    setIsTransferring(true);
    soundEngine.playScanLaserPulse();

    setTimeout(() => {
      submitToMotherShip();
      setIsTransferring(false);
      setTransferDone(true);
      setLastReward(totalPotentialReward);
    }, 1800);
  };

  const handleClose = () => {
    setTransferDone(false);
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* High-Tech Mother Ship Terminal Frame */}
      <div className="relative flex w-full max-w-2xl flex-col rounded-3xl border-2 border-amber-500/40 bg-zinc-950 p-6 shadow-[0_0_60px_rgba(245,158,11,0.25)] font-mono text-white">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/30 border border-amber-400/50 text-amber-300 shadow-md">
              <Rocket className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-amber-400">
                  MARS HABITAT BASE // HUB 08 & MAV FACILITY
                </span>
                <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/40 font-bold">
                  EVA DOCKING BAY ACTIVE
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Hub 08 Primary Airlock & Mars Ascent Vehicle
              </h2>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Transfer Success Screen */}
        {transferDone ? (
          <div className="flex flex-col items-center text-center py-8 animate-in zoom-in-95 duration-200">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-white">
              SAMPLES & TELEMETRY SUBMITTED TO MARS HABITAT BASE!
            </h3>
            <p className="mt-2 text-xs text-zinc-300 max-w-md">
              Core samples are secured in Hub 08 storage and queued for MAV orbital launch. Scientific telemetry beamed to Earth via the Deep Space Network dish. Rover battery recharged to 100%.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-amber-300 font-bold text-sm">
                <Sparkles className="h-4 w-4" />
                <span>+{lastReward} SCIENCE POINTS</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-emerald-300 font-bold text-sm">
                <Zap className="h-4 w-4" />
                <span>BATTERY RECHARGED: 100%</span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="mt-8 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2.5 font-bold text-white shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer text-xs"
            >
              RESUME SURFACE EXPLORATION
            </button>
          </div>
        ) : (
          /* Transfer Details & Confirmation Screen */
          <div className="flex flex-col gap-5 py-4">
            {/* Status Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col rounded-xl border border-white/10 bg-black/60 p-3">
                <span className="text-[10px] text-zinc-400">PHYSICAL SAMPLES</span>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-lg font-bold text-amber-300">
                    {collectedSamples.length} Sealed Tubes
                  </span>
                  <HardDrive className="h-4 w-4 text-amber-400/80" />
                </div>
                <span className="text-[9px] text-zinc-400">+{sampleReward} SP</span>
              </div>

              <div className="flex flex-col rounded-xl border border-white/10 bg-black/60 p-3">
                <span className="text-[10px] text-zinc-400">SPECTRAL TELEMETRY</span>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-lg font-bold text-cyan-300">
                    {pendingData.length} Datasets
                  </span>
                  <Database className="h-4 w-4 text-cyan-400/80" />
                </div>
                <span className="text-[9px] text-zinc-400">+{dataReward} SP</span>
              </div>

              <div className="flex flex-col rounded-xl border border-white/10 bg-black/60 p-3">
                <span className="text-[10px] text-zinc-400">ORBITAL BONUS</span>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-lg font-bold text-emerald-300">
                    +{orbitalDeliveryBonus} SP
                  </span>
                  <Radio className="h-4 w-4 text-emerald-400/80" />
                </div>
                <span className="text-[9px] text-zinc-400">Delivery incentive</span>
              </div>
            </div>

            {/* Collected Materials List */}
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-white tracking-wide">
                  GEOLOGICAL CORE SAMPLE CAROUSEL INVENTORY
                </span>
                <span className="text-zinc-400">{collectedSamples.length} of {pois.length} collected</span>
              </div>

              {collectedSamples.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-zinc-500 text-xs">
                  <HardDrive className="h-8 w-8 mb-2 opacity-40" />
                  <span>No physical core samples collected yet.</span>
                  <span className="text-[10px] text-zinc-400 mt-1">
                    Explore Mars POIs and press [F] to deep scan and drill core samples!
                  </span>
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                  {collectedSamples.map((poi) => (
                    <div
                      key={poi.id}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <span className="font-bold text-white">{poi.name}</span>
                        <span className="text-[10px] text-zinc-400">({poi.category})</span>
                      </div>
                      <span className="text-amber-300 font-mono text-[10px]">
                        +{poi.sciencePoints + 400} SP
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mother Ship Umbilical Power-Up Notice */}
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
              <span>
                <strong>Lander Docking Umbilical Active:</strong> Submitting materials will immediately rapid-charge the rover battery to <strong>100%</strong> and offload onboard storage.
              </span>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400">TOTAL SCIENTIFIC AWARD</span>
                <span className="text-base font-black text-amber-300">
                  +{totalPotentialReward} SCIENCE POINTS
                </span>
              </div>

              <button
                onClick={handleTransfer}
                disabled={isTransferring}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-3 font-bold text-white shadow-lg shadow-amber-500/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 text-xs"
              >
                {isTransferring ? (
                  <>
                    <UploadCloud className="h-4 w-4 animate-bounce" />
                    <span>TRANSFERRING TO MAV...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    <span>SUBMIT SAMPLES & DATA TO MOTHER SHIP</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

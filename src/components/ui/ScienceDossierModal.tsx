'use client';

import React from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Radio,
  Sparkles,
  Database,
  Layers,
  Award,
  Microscope,
  FileText,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useMissionStore } from '@/lib/store/useMissionStore';

export const ScienceDossierModal: React.FC = () => {
  const activeModal = useMissionStore((s) => s.activeModal);
  const selectedDossierPOI = useMissionStore((s) => s.selectedDossierPOI);
  const closeModal = useMissionStore((s) => s.closeModal);
  const downlinkTelemetry = useMissionStore((s) => s.downlinkTelemetry);
  const isScanning = useMissionStore((s) => s.isScanning);
  const scanProgress = useMissionStore((s) => s.scanProgress);

  if (activeModal !== 'dossier' || !selectedDossierPOI) return null;

  const poi = selectedDossierPOI;

  const handleDownlink = () => {
    downlinkTelemetry(poi.id);

    // Trigger celebratory Mars telemetry confetti burst
    confetti({
      particleCount: 75,
      spread: 60,
      origin: { x: 0.85, y: 0.7 },
      colors: ['#38bdf8', '#4ade80', '#fb923c', '#f43f5e'],
    });
  };

  // Biosignature badge styling
  const bioColor =
    poi.biosignaturePotential === 'Biosignature Candidate'
      ? 'border-emerald-400 bg-emerald-950/60 text-emerald-300'
      : poi.biosignaturePotential === 'High'
      ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300'
      : poi.biosignaturePotential === 'Moderate'
      ? 'border-amber-400 bg-amber-950/60 text-amber-300'
      : 'border-zinc-500 bg-zinc-900/60 text-zinc-400';

  return (
    /* Non-blocking Side Info Card docked on the right */
    <div className="fixed right-4 top-18 bottom-6 z-40 flex w-[400px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-cyan-500/40 bg-zinc-950/92 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.85)] font-sans text-white overflow-hidden pointer-events-auto animate-in slide-in-from-right duration-300">
      {/* Top Card Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-cyan-950/50 via-zinc-900 to-black px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Microscope className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold text-cyan-400 tracking-wider">
                {poi.code}
              </span>
              <span className={`rounded-full border px-1.5 py-0.2 text-[9px] font-bold ${bioColor}`}>
                {poi.biosignaturePotential}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white truncate max-w-[240px]">{poi.name}</h3>
          </div>
        </div>

        <button
          onClick={closeModal}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          title="Close Info Card [Esc]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Live Scanning Progress Banner on the side card */}
      {isScanning && (
        <div className="border-b border-cyan-500/30 bg-cyan-950/60 p-3 space-y-1.5">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="font-bold text-cyan-300 animate-pulse flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              LASER SPECTROMETER SWEEP
            </span>
            <span className="font-bold text-white">{Math.round(scanProgress)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-sky-300 transition-all duration-100"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">
            Active: {poi.sensorRequirement}
          </span>
        </div>
      )}

      {/* Scrollable Scientific Details */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">

        {/* Quick Parameters */}
        <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
          <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-2">
            <span className="text-[9px] text-zinc-400 tracking-wider">GEOLOGICAL ERA</span>
            <p className="font-bold text-zinc-100 truncate">{poi.geologicalEra}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-2">
            <span className="text-[9px] text-zinc-400 tracking-wider">BIOME FORMATION</span>
            <p className="font-bold text-cyan-300">{poi.biome} Terrane</p>
          </div>
        </div>

        {/* Mineral & Lithochemical Breakdown */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-zinc-200">
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span>Mineral Composition</span>
            </div>
            <span className="font-mono text-[10px] text-zinc-400">{poi.sensorAcronym}</span>
          </div>

          <div className="space-y-2">
            {poi.composition.map((min, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-zinc-200">{min.mineral}</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-zinc-500 text-[10px]">{min.formula}</span>
                    <span className="font-bold text-white">{min.percentage}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${min.percentage}%`,
                      backgroundColor: min.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spectrogram Graph */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-zinc-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Raman Spectral Peaks</span>
            </div>
            <span className="font-mono text-[9px] text-zinc-500">Intensity (a.u.)</span>
          </div>

          <div className="relative h-20 w-full rounded-lg bg-black/60 p-2 border border-white/5 overflow-hidden">
            <svg className="h-full w-full overflow-visible" viewBox="0 0 360 80" preserveAspectRatio="none">
              <line x1="0" y1="20" x2="360" y2="20" stroke="#ffffff10" strokeDasharray="3 3" />
              <line x1="0" y1="40" x2="360" y2="40" stroke="#ffffff10" strokeDasharray="3 3" />
              <line x1="0" y1="60" x2="360" y2="60" stroke="#ffffff10" strokeDasharray="3 3" />

              <path
                d={poi.spectrogramData
                  .map((pt, i) => {
                    const x = (i / (poi.spectrogramData.length - 1)) * 340 + 10;
                    const y = 72 - (pt.intensity / 100) * 60;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
              />

              {poi.spectrogramData.map((pt, i) => {
                const x = (i / (poi.spectrogramData.length - 1)) * 340 + 10;
                const y = 72 - (pt.intensity / 100) * 60;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="2.5" fill="#38bdf8" />
                    {pt.label && (
                      <text
                        x={x}
                        y={y - 5}
                        fill="#f8fafc"
                        fontSize="8"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {pt.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Astrobiology Significance */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
            <Award className="h-3.5 w-3.5" />
            <span>Astrobiological Assessment</span>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-300">{poi.astrobiologyRelevance}</p>
        </div>

        {/* NASA Mission Citation */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
            <FileText className="h-3.5 w-3.5" />
            <span>NASA Mission Reference</span>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-400">{poi.nasaMissionCitation}</p>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="border-t border-white/10 bg-zinc-950 p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400">
          <Database className="h-3.5 w-3.5 text-cyan-400" />
          <span>{poi.downlinked ? 'DOWNLINKED' : 'IN ROVER CACHE'}</span>
        </div>

        {!poi.downlinked ? (
          <button
            onClick={handleDownlink}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Radio className="h-3.5 w-3.5" />
            <span>DOWNLINK (+{poi.sciencePoints} SP)</span>
          </button>
        ) : (
          <div className="flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-1 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>TRANSMITTED</span>
          </div>
        )}
      </div>
    </div>
  );
};

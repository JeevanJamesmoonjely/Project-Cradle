'use client';

import React from 'react';
import { X, Navigation, Zap, Compass, Tablet, Camera, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useMissionStore } from '@/lib/store/useMissionStore';

export const ControlsModal: React.FC = () => {
  const activeModal = useMissionStore((s) => s.activeModal);
  const closeModal = useMissionStore((s) => s.closeModal);

  if (activeModal !== 'help') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-white/15 bg-zinc-950 p-6 shadow-2xl overflow-y-auto font-sans text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <span className="font-mono text-xs font-bold text-cyan-400 tracking-wider">
              PROJECT CRADLE • MISSION FLIGHT MANUAL
            </span>
            <h3 className="text-xl font-black text-white">Rover Controls & Scientific Protocol</h3>
          </div>
          <button
            onClick={closeModal}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-5 text-sm">
          {/* Keybindings Grid */}
          {/* Keybindings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <KeyCard
              keys={['W', 'A', 'S', 'D']}
              desc="Drive Rover & Steer (A=Left, D=Right)"
              icon={<Navigation className="h-4 w-4 text-cyan-400" />}
            />
            <KeyCard
              keys={['P']}
              desc="Deploy Solar Array Wings & Fast Charge"
              icon={<Zap className="h-4 w-4 text-amber-400" />}
            />
            <KeyCard
              keys={['E']}
              desc="Dock with Mother Ship & Submit Samples"
              icon={<Navigation className="h-4 w-4 text-emerald-400" />}
            />
            <KeyCard
              keys={['F']}
              desc="Engage Deep Scan (within 15m of POI)"
              icon={<Zap className="h-4 w-4 text-yellow-400" />}
            />
            <KeyCard
              keys={['Space']}
              desc="Emergency Mechanical Brake"
              icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
            />
            <KeyCard
              keys={['Tab']}
              desc="Topographic Sat-Nav Map & Missions"
              icon={<Tablet className="h-4 w-4 text-emerald-400" />}
            />
            <KeyCard
              keys={['Mouse']}
              desc="Move Cursor / Drag to Orbit Camera, Scroll to Zoom"
              icon={<Camera className="h-4 w-4 text-cyan-400" />}
            />
            <KeyCard
              keys={['C']}
              desc="Switch Camera View (Follow, Orbit, Cockpit)"
              icon={<Camera className="h-4 w-4 text-sky-400" />}
            />
            <KeyCard
              keys={['Mini-Map']}
              desc="Click Radar to Expand Full Mars Map"
              icon={<Compass className="h-4 w-4 text-cyan-400" />}
            />
          </div>

          {/* NASA Planetary Surveyor Tips */}
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 space-y-2 text-xs">
            <h4 className="font-bold text-cyan-300">Planetary Surface Physics Tips</h4>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300">
              <li>
                <strong className="text-white">Basaltic Dunes:</strong> Soft loose regolith causes up to 38% wheel slip. Watch your power consumption and motor heating.
              </li>
              <li>
                <strong className="text-white">Day/Night Cycle:</strong> Solar irradiance drops to zero at night. Monitor battery reserves and sleep non-essential payloads using the Subsystems tab.
              </li>
              <li>
                <strong className="text-white">Steep Slopes:</strong> Entering escarpment cliffs or crater walls above 22° pitch triggers rollover safety alarms.
              </li>
              <li>
                <strong className="text-white">Downlink Value:</strong> Always downlink cached telemetry to NASA Ground Stations via the DSN relay for maximum Science Points!
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={closeModal}
            className="rounded-lg bg-cyan-500 px-5 py-2 font-mono text-xs font-bold text-black hover:bg-cyan-400 transition-colors cursor-pointer"
          >
            ACKNOWLEDGE & RESUME EXPLORATION
          </button>
        </div>
      </div>
    </div>
  );
};

interface KeyCardProps {
  keys: string[];
  desc: string;
  icon: React.ReactNode;
}

const KeyCard: React.FC<KeyCardProps> = ({ keys, desc, icon }) => (
  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900/60 p-3">
    <div className="flex items-center gap-2.5">
      {icon}
      <span className="text-zinc-200">{desc}</span>
    </div>
    <div className="flex items-center gap-1">
      {keys.map((k) => (
        <kbd
          key={k}
          className="rounded border border-white/20 bg-zinc-800 px-1.5 py-0.5 text-[11px] font-bold text-white shadow"
        >
          {k}
        </kbd>
      ))}
    </div>
  </div>
);

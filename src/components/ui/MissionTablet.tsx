'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Compass,
  BookOpen,
  Cpu,
  Target,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Radio,
  Layers,
  Zap,
  Wind,
  RefreshCw,
  Search,
  Gauge,
  CloudSun,
  Thermometer,
  Sun,
  Moon,
  Orbit,
} from 'lucide-react';
import { useMissionStore, EnvironmentState } from '@/lib/store/useMissionStore';
import { ScienceCategory, GeologicalPOI } from '@/lib/science/types';
import { soundEngine } from '@/lib/audio/soundManager';
import { REAL_NASA_SOL_DATASETS, calculateMedaAtmosphericTelemetry } from '@/lib/science/medaWeatherData';

export const MissionTablet: React.FC = () => {
  const activeModal = useMissionStore((s) => s.activeModal);
  const closeModal = useMissionStore((s) => s.closeModal);
  const tabletTab = useMissionStore((s) => s.tabletTab);
  const setTabletTab = useMissionStore((s) => s.setTabletTab);
  const rover = useMissionStore((s) => s.rover);
  const env = useMissionStore((s) => s.env);
  const pois = useMissionStore((s) => s.pois);
  const sciencePoints = useMissionStore((s) => s.sciencePoints);
  const objectives = useMissionStore((s) => s.objectives);
  const activeWaypoint = useMissionStore((s) => s.activeWaypoint);
  const setWaypoint = useMissionStore((s) => s.setWaypoint);
  const subsystems = useMissionStore((s) => s.subsystems);
  const toggleSubsystem = useMissionStore((s) => s.toggleSubsystem);
  const triggerDustCleaning = useMissionStore((s) => s.triggerDustCleaning);
  const setDossierPOI = useMissionStore((s) => s.setDossierPOI);
  const openModal = useMissionStore((s) => s.openModal);
  const downlinkAllData = useMissionStore((s) => s.downlinkAllData);
  const setSolProfile = useMissionStore((s) => s.setSolProfile);

  const [encyclopediaFilter, setEncyclopediaFilter] = useState<ScienceCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  if (activeModal !== 'tablet') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Tablet Device Frame */}
      <div className="relative flex h-full max-h-[92vh] w-full max-w-5xl flex-col rounded-3xl border-2 border-cyan-500/30 bg-zinc-950 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden font-sans text-white">
        {/* Tablet Top Status Bar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-zinc-900/90 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-3 w-3 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-xs font-black tracking-widest text-cyan-300">
              NASA JPL / SPACE APPS • MISSION OPERATIONS TABLET
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
            <span>SOL 412</span>
            <span>BATTERY: {rover.battery.toFixed(0)}%</span>
            <span>DSN: -96 dBm</span>
            <button
              onClick={closeModal}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-black/60 px-6 py-2">
          <TabButton
            active={tabletTab === 'satnav'}
            onClick={() => setTabletTab('satnav')}
            icon={<Compass className="h-4 w-4" />}
            label="TOPOGRAPHIC SAT-NAV"
          />
          <TabButton
            active={tabletTab === 'encyclopedia'}
            onClick={() => setTabletTab('encyclopedia')}
            icon={<BookOpen className="h-4 w-4" />}
            label="PLANETARY ENCYCLOPEDIA"
            badge={`${pois.filter((p) => p.discovered).length}/${pois.length}`}
          />
          <TabButton
            active={tabletTab === 'subsystems'}
            onClick={() => setTabletTab('subsystems')}
            icon={<Cpu className="h-4 w-4" />}
            label="SUBSYSTEM DIAGNOSTICS"
          />
          <TabButton
            active={tabletTab === 'missions'}
            onClick={() => setTabletTab('missions')}
            icon={<Target className="h-4 w-4" />}
            label="MISSION OBJECTIVES"
            badge={`${objectives.filter((o) => o.completed).length}/${objectives.length}`}
          />
          <TabButton
            active={tabletTab === 'meda'}
            onClick={() => setTabletTab('meda')}
            icon={<CloudSun className="h-4 w-4" />}
            label="NASA MEDA WEATHER"
            badge={`${env.ambientTemp}°C`}
          />
        </div>

        {/* Tab Content Display */}
        <div className="flex-1 overflow-y-auto p-6">
          {tabletTab === 'satnav' && (
            <SatNavTab
              rover={rover}
              pois={pois}
              activeWaypoint={activeWaypoint}
              onSetWaypoint={setWaypoint}
              env={env}
            />
          )}

          {tabletTab === 'encyclopedia' && (
            <EncyclopediaTab
              pois={pois}
              filter={encyclopediaFilter}
              onFilterChange={setEncyclopediaFilter}
              search={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectPOI={(poi) => {
                setDossierPOI(poi);
                openModal('dossier');
              }}
            />
          )}

          {tabletTab === 'subsystems' && (
            <SubsystemsTab
              rover={rover}
              env={env}
              subsystems={subsystems}
              onToggleSubsystem={toggleSubsystem}
              onTriggerDustCleaning={triggerDustCleaning}
            />
          )}

          {tabletTab === 'missions' && (
            <MissionsTab
              objectives={objectives}
              pois={pois}
              sciencePoints={sciencePoints}
              onDownlinkAll={downlinkAllData}
            />
          )}

          {tabletTab === 'meda' && (
            <MedaWeatherTab
              env={env}
              onSelectSolProfile={setSolProfile}
            />
          )}
        </div>
      </div>
    </div>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs font-bold transition-all cursor-pointer ${
      active
        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
        : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
    }`}
  >
    {icon}
    <span>{label}</span>
    {badge && (
      <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[10px] text-cyan-300 border border-cyan-500/30">
        {badge}
      </span>
    )}
  </button>
);

/* ================= 1. SAT-NAV TOPOGRAPHIC RADAR ================= */
interface SatNavTabProps {
  rover: { position: [number, number, number]; rotation: number };
  pois: GeologicalPOI[];
  activeWaypoint: [number, number] | null;
  onSetWaypoint: (pos: [number, number] | null) => void;
  env?: EnvironmentState;
}

const SatNavTab: React.FC<SatNavTabProps> = ({ rover, pois, activeWaypoint, onSetWaypoint, env }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapSpan, setMapSpan] = useState<number>(260); // 260m (Jezero local) vs 4200m (Full Mars)

  // Render top-down topographic radar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Coordinate mapping: world (-mapSpan to +mapSpan) -> canvas (0 to w)
    const halfSpan = mapSpan;
    const mapScale = w / (halfSpan * 2);
    const worldToCanvas = (wx: number, wz: number): [number, number] => {
      const cx = (wx + halfSpan) * mapScale;
      const cy = (wz + halfSpan) * mapScale;
      return [cx, cy];
    };

    // Draw Biome Background Zones
    if (mapSpan > 1000) {
      // FULL MARS PLANETARY TOPOGRAPHY
      // Dark Basalt Space Background
      ctx.fillStyle = '#0f111a';
      ctx.fillRect(0, 0, w, h);

      // Outer Planet Disk Boundary
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      const [pcx, pcy] = worldToCanvas(0, 0);
      ctx.arc(pcx, pcy, 4150 * mapScale, 0, Math.PI * 2);
      ctx.fill();

      // Northern Lowlands (Vastitas Borealis)
      ctx.fillStyle = '#1e1b2e';
      ctx.beginPath();
      ctx.arc(pcx, pcy - 1200 * mapScale, 2200 * mapScale, 0, Math.PI * 2);
      ctx.fill();

      // Olympus Mons Foothills & Volcanic Tharsis Rise
      ctx.fillStyle = '#2d1b18';
      ctx.beginPath();
      const [volcX, volcY] = worldToCanvas(-1800, -1400);
      ctx.arc(volcX, volcY, 1200 * mapScale, 0, Math.PI * 2);
      ctx.fill();

      // Isidis Planitia Ancient Impact Basin
      ctx.fillStyle = '#26201b';
      ctx.beginPath();
      const [isidisX, isidisY] = worldToCanvas(1500, 1200);
      ctx.arc(isidisX, isidisY, 1400 * mapScale, 0, Math.PI * 2);
      ctx.fill();

      // Central Jezero Crater Highlight
      ctx.fillStyle = '#3f2c22';
      ctx.beginPath();
      ctx.arc(pcx, pcy, 260 * mapScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b88';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Labels
      ctx.font = '10px monospace';
      ctx.fillStyle = '#ffffff60';
      ctx.fillText('OLYMPUS MONS FOOTHILLS', (w * 0.1), (h * 0.25));
      ctx.fillText('ISIDIS BASIN CONTINENTAL RISE', (w * 0.55), (h * 0.8));
      ctx.fillText('VASTITAS BOREALIS LOWLANDS', (w * 0.35), (h * 0.12));
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('• JEZERO CRATER LANDING SITE', pcx + 12, pcy + 4);
    } else {
      // LOCAL JEZERO CRATER TOPOGRAPHY
      ctx.fillStyle = '#141724';
      ctx.fillRect(0, 0, w, h);

      // Dunes (X < -15, Z > 0)
      ctx.fillStyle = '#1e2438';
      ctx.fillRect(0, h / 2, (halfSpan - 15) * mapScale, h / 2);
      // Escarpment (X > 28)
      ctx.fillStyle = '#33261e';
      ctx.fillRect((halfSpan + 28) * mapScale, 0, (halfSpan - 28) * mapScale, h);
      // Crater (Z < -20, X < 25)
      ctx.fillStyle = '#2b2320';
      ctx.beginPath();
      const [craterX, craterY] = worldToCanvas(0, -55);
      ctx.arc(craterX, craterY, 40 * mapScale, 0, Math.PI * 2);
      ctx.fill();

      // Biome Text Labels
      ctx.font = '10px monospace';
      ctx.fillStyle = '#ffffff40';
      ctx.fillText('ANCIENT RIVERBED DELTA', (halfSpan + 30) * mapScale, (halfSpan + 40) * mapScale);
      ctx.fillText('BASALTIC DUNE FIELDS', (halfSpan - 110) * mapScale, (halfSpan + 70) * mapScale);
      ctx.fillText('BELVA CRATER BASIN', (halfSpan - 60) * mapScale, (halfSpan - 70) * mapScale);
      ctx.fillText('JEZERO ESCARPMENT SCARP', (halfSpan + 50) * mapScale, (halfSpan - 70) * mapScale);
    }

    // Concentric Range Rings
    ctx.strokeStyle = '#ffffff08';
    ctx.lineWidth = 1;
    const ringStep = mapSpan > 1000 ? 1000 : 50;
    for (let r = ringStep; r <= mapSpan; r += ringStep) {
      const [rx, ry] = worldToCanvas(0, 0);
      ctx.beginPath();
      ctx.arc(rx, ry, r * mapScale, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Grid coordinates
    ctx.strokeStyle = '#ffffff0a';
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw Active Waypoint Line
    if (activeWaypoint) {
      const [rx, ry] = worldToCanvas(rover.position[0], rover.position[2]);
      const [wx, wy] = worldToCanvas(activeWaypoint[0], activeWaypoint[1]);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(wx, wy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Waypoint flag
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(wx, wy, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw POIs
    pois.forEach((poi) => {
      const [px, py] = worldToCanvas(poi.position[0], poi.position[2]);
      ctx.fillStyle = poi.sampleCollected ? '#4ade80' : poi.discovered ? '#38bdf8' : '#fb923c';
      ctx.beginPath();
      ctx.arc(px, py, mapSpan > 1000 ? 3 : poi.discovered ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Label in local mode
      if (poi.discovered && mapSpan <= 1000) {
        ctx.fillStyle = '#ffffffbb';
        ctx.font = '9px monospace';
        ctx.fillText(poi.code, px + 8, py + 3);
      }
    });

    // Draw NASA Mother Ship / MAV Return Lander Landmark
    const [mavX, mavY] = worldToCanvas(0, -25);
    // Pulsing Beacon Ring
    ctx.strokeStyle = '#f59e0b88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mavX, mavY, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Lander Icon
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(mavX, mavY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('MOTHER SHIP (MAV)', mavX + 13, mavY + 3);

    // Draw Active Martian Dust Devil / Vortex & Danger Zone (if active)
    if (env?.dustDevilActive && env.dustDevilPos) {
      const [vx, vy] = worldToCanvas(env.dustDevilPos[0], env.dustDevilPos[2]);

      // 25m Danger Perimeter Circle
      ctx.strokeStyle = '#f97316cc';
      ctx.fillStyle = 'rgba(249, 115, 22, 0.16)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(vx, vy, 25 * mapScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cyclonic spiral icon
      ctx.save();
      ctx.translate(vx, vy);
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      for (let arm = 0; arm < 3; arm++) {
        ctx.rotate((Math.PI * 2) / 3);
        ctx.beginPath();
        ctx.arc(0, 0, mapSpan > 1000 ? 5 : 8, 0, Math.PI * 0.7);
        ctx.stroke();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#fb923c';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`DUST VORTEX [${Math.round(env.dustDevilDist)}m]`, vx + 12, vy + 3);
    }

    // Draw Rover Position & Heading Vector
    const [rx, ry] = worldToCanvas(rover.position[0], rover.position[2]);

    // Heading beam
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(rover.rotation);
    ctx.fillStyle = '#38bdf840';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, mapSpan > 1000 ? 20 : 35, -Math.PI / 6, Math.PI / 6);
    ctx.fill();

    // Rover icon
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(0, 0, mapSpan > 1000 ? 5 : 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Forward direction line
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, mapSpan > 1000 ? 8 : 14);
    ctx.stroke();
    ctx.restore();
  }, [rover, pois, activeWaypoint, mapSpan, env]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const cy = (e.clientY - rect.top) * (canvas.height / rect.height);

    const halfSpan = mapSpan;
    const mapScale = canvas.width / (halfSpan * 2);
    const wx = cx / mapScale - halfSpan;
    const wz = cy / mapScale - halfSpan;

    onSetWaypoint([Math.round(wx), Math.round(wz)]);
  };

  const distToMotherShip = Math.sqrt(
    rover.position[0] * rover.position[0] + (rover.position[2] - (-25)) * (rover.position[2] - (-25))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Topographic Map Canvas */}
      <div className="lg:col-span-2 flex flex-col items-center rounded-2xl border border-white/10 bg-black/60 p-4">
        <div className="flex w-full items-center justify-between mb-3 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">
              {mapSpan > 1000 ? 'FULL PLANETARY MARS TOPOGRAPHY (4,200m)' : 'JEZERO CRATER SECTOR (260m)'}
            </span>
          </div>
          {/* Zoom Toggles */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMapSpan(260)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                mapSpan <= 1000
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                  : 'bg-black/40 text-zinc-400 border-white/10 hover:text-white'
              }`}
            >
              LOCAL SECTOR (260m)
            </button>
            <button
              onClick={() => setMapSpan(4200)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                mapSpan > 1000
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                  : 'bg-black/40 text-zinc-400 border-white/10 hover:text-white'
              }`}
            >
              FULL MARS (4,200m)
            </button>
          </div>
        </div>
        <div className="relative aspect-square w-full max-w-[480px] rounded-xl overflow-hidden border border-white/15 bg-zinc-950">
          <canvas
            ref={canvasRef}
            width={520}
            height={520}
            onClick={handleCanvasClick}
            className="h-full w-full cursor-crosshair"
          />
        </div>
        <span className="text-[10px] text-zinc-400 mt-2 font-mono">
          Click any location on Mars map to establish GPS nav waypoint
        </span>
      </div>

      {/* Sat-Nav Telemetry & Waypoints */}
      <div className="flex flex-col gap-4 font-mono text-xs">
        {/* Mother Ship Proximity Card */}
        <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 tracking-wider">
              MOTHER SHIP (MAV) STATUS
            </span>
            <span className="text-[10px] rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-300 font-bold border border-amber-400/30">
              STANDBY
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-300">Distance to Lander:</span>
            <span className="font-bold text-white">{distToMotherShip.toFixed(1)} m</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400">Launch Coordinates:</span>
            <span className="text-zinc-300">0.0 E, -25.0 N</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 space-y-3">
          <span className="text-[10px] font-bold text-cyan-400 tracking-wider">CURRENT ROVER GPS</span>
          <div className="grid grid-cols-2 gap-2 text-zinc-200">
            <div>
              <span className="text-[10px] text-zinc-500">X-COORD</span>
              <p className="font-bold">{rover.position[0].toFixed(1)} m</p>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500">Z-COORD</span>
              <p className="font-bold">{rover.position[2].toFixed(1)} m</p>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500">HEADING</span>
              <p className="font-bold">{(((rover.rotation * 180) / Math.PI + 360) % 360).toFixed(0)}°</p>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500">ELEVATION</span>
              <p className="font-bold">{rover.position[1].toFixed(1)} m</p>
            </div>
          </div>
        </div>

        {/* Active Waypoint Panel */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 tracking-wider">ACTIVE WAYPOINT</span>
            {activeWaypoint && (
              <button
                onClick={() => onSetWaypoint(null)}
                className="text-[10px] text-red-400 hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          {activeWaypoint ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-zinc-200">
                <span>TARGET:</span>
                <span className="font-bold text-cyan-300">
                  [{activeWaypoint[0]}m, {activeWaypoint[1]}m]
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-200">
                <span>DISTANCE:</span>
                <span className="font-bold text-white">
                  {Math.sqrt(
                    (rover.position[0] - activeWaypoint[0]) ** 2 +
                      (rover.position[2] - activeWaypoint[1]) ** 2
                  ).toFixed(1)}{' '}
                  meters
                </span>
              </div>
            </div>
          ) : (
            <p className="text-zinc-500 text-[11px]">Click anywhere on the radar map to set a navigation target.</p>
          )}
        </div>

        {/* POI Proximity List */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 space-y-2 flex-1">
          <span className="text-[10px] font-bold text-zinc-400 tracking-wider">GEOLOGICAL OUTPOSTS</span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {pois.map((poi) => {
              const dx = rover.position[0] - poi.position[0];
              const dz = rover.position[2] - poi.position[2];
              const dist = Math.sqrt(dx * dx + dz * dz);
              return (
                <div
                  key={poi.id}
                  onClick={() => onSetWaypoint([poi.position[0], poi.position[2]])}
                  className="flex items-center justify-between rounded-lg bg-zinc-950/80 px-2.5 py-1.5 hover:bg-cyan-950/40 cursor-pointer border border-transparent hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        poi.sampleCollected ? 'bg-emerald-400' : poi.discovered ? 'bg-cyan-400' : 'bg-amber-400'
                      }`}
                    />
                    <span className="text-[11px] font-bold text-zinc-200 truncate max-w-[130px]">
                      {poi.code} - {poi.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400">{dist.toFixed(0)}m</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= 2. PLANETARY ENCYCLOPEDIA TAB ================= */
interface EncyclopediaTabProps {
  pois: GeologicalPOI[];
  filter: ScienceCategory | 'All';
  onFilterChange: (f: ScienceCategory | 'All') => void;
  search: string;
  onSearchChange: (s: string) => void;
  onSelectPOI: (poi: GeologicalPOI) => void;
}

const EncyclopediaTab: React.FC<EncyclopediaTabProps> = ({
  pois,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  onSelectPOI,
}) => {
  const categories: (ScienceCategory | 'All')[] = [
    'All',
    'Astrobiology',
    'Volcanology',
    'Hydrology',
    'Atmospheric',
    'Mineralogy',
  ];

  const filtered = pois.filter((poi) => {
    const matchesFilter = filter === 'All' || poi.category === filter;
    const matchesSearch =
      poi.name.toLowerCase().includes(search.toLowerCase()) ||
      poi.code.toLowerCase().includes(search.toLowerCase()) ||
      poi.biome.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onFilterChange(cat)}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition-colors cursor-pointer ${
                filter === cat
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search minerals, biomes, codes..."
            className="bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none w-48 font-mono"
          />
        </div>
      </div>

      {/* POI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((poi) => (
          <div
            key={poi.id}
            onClick={() => onSelectPOI(poi)}
            className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-zinc-900/60 p-4 backdrop-blur-md transition-all hover:border-cyan-400/60 hover:bg-zinc-900/90 hover:scale-[1.01] cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-cyan-400">{poi.code}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                  {poi.biome}
                </span>
              </div>
              <h4 className="text-base font-bold text-white group-hover:text-cyan-200 transition-colors">
                {poi.name}
              </h4>
              <p className="mt-1 font-mono text-xs text-zinc-400">{poi.geologicalEra}</p>
              <p className="mt-2 text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                {poi.astrobiologyRelevance}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between font-mono text-xs">
              <span className="text-emerald-400 font-bold">+{poi.sciencePoints} SP</span>
              <span className="text-zinc-400 text-[11px] group-hover:text-cyan-300 transition-colors">
                View Dossier →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ================= 3. SUBSYSTEM DIAGNOSTICS TAB ================= */
interface SubsystemsTabProps {
  rover: { battery: number; solarWatts: number; consumptionWatts: number; motorTemp: number };
  env: { dustTau: number };
  subsystems: {
    mastcam: boolean;
    supercam: boolean;
    rimfax: boolean;
    hazcams: boolean;
    solarDustCleanProgress: number;
  };
  onToggleSubsystem: (key: 'mastcam' | 'supercam' | 'rimfax' | 'hazcams') => void;
  onTriggerDustCleaning: () => void;
}

const SubsystemsTab: React.FC<SubsystemsTabProps> = ({
  rover,
  env,
  subsystems,
  onToggleSubsystem,
  onTriggerDustCleaning,
}) => {
  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Power Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4 space-y-1">
          <span className="text-[10px] text-zinc-400 tracking-wider">SOLAR IRRADIANCE</span>
          <p className="text-2xl font-black text-yellow-400">{rover.solarWatts} W</p>
          <span className="text-[10px] text-zinc-500">Solar Cells Peak Capacity: 580W</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4 space-y-1">
          <span className="text-[10px] text-zinc-400 tracking-wider">SYSTEM ACTIVE LOAD</span>
          <p className="text-2xl font-black text-cyan-400">{rover.consumptionWatts} W</p>
          <span className="text-[10px] text-zinc-500">Avionics + Motor + Instruments</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4 space-y-1">
          <span className="text-[10px] text-zinc-400 tracking-wider">NET POWER CHARGE</span>
          <p
            className={`text-2xl font-black ${
              rover.solarWatts >= rover.consumptionWatts ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {rover.solarWatts >= rover.consumptionWatts ? '+' : ''}
            {rover.solarWatts - rover.consumptionWatts} W
          </p>
          <span className="text-[10px] text-zinc-500">Net Battery Inflow / Drain</span>
        </div>
      </div>

      {/* Solar Panel Dust Clean Mechanism */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">Photovoltaic Dust Clearing Sequence</h4>
          </div>
          <p className="text-xs text-zinc-400 font-sans max-w-xl">
            Atmospheric dust accumulation reduces solar panel conversion efficiency. Activate electrostatic wiper vibration
            to shake loose ferric oxide dust grains.
          </p>
        </div>

        <button
          onClick={onTriggerDustCleaning}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 font-bold text-black shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>VIBRATE / TILT PANELS</span>
        </button>
      </div>

      {/* Payload Instruments Switchboard */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h4 className="text-sm font-bold text-white">Payload Sensor Power Switchboard</h4>
          <span className="text-zinc-400 text-[11px]">Toggle non-essential sensors to reduce power drain</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PayloadToggleCard
            name="Mastcam-Z Stereo"
            active={subsystems.mastcam}
            powerDraw="25 W"
            onToggle={() => onToggleSubsystem('mastcam')}
          />
          <PayloadToggleCard
            name="SuperCam LIBS Laser"
            active={subsystems.supercam}
            powerDraw="35 W"
            onToggle={() => onToggleSubsystem('supercam')}
          />
          <PayloadToggleCard
            name="RIMFAX Subsurface Radar"
            active={subsystems.rimfax}
            powerDraw="30 W"
            onToggle={() => onToggleSubsystem('rimfax')}
          />
          <PayloadToggleCard
            name="Hazcams Vision Suite"
            active={subsystems.hazcams}
            powerDraw="15 W"
            onToggle={() => onToggleSubsystem('hazcams')}
          />
        </div>
      </div>
    </div>
  );
};

interface PayloadToggleCardProps {
  name: string;
  active: boolean;
  powerDraw: string;
  onToggle: () => void;
}

const PayloadToggleCard: React.FC<PayloadToggleCardProps> = ({ name, active, powerDraw, onToggle }) => (
  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950 p-3.5">
    <div className="space-y-0.5">
      <span className="font-bold text-white text-xs">{name}</span>
      <p className="text-[10px] text-zinc-500">Draw: {powerDraw}</p>
    </div>
    <button
      onClick={onToggle}
      className={`h-6 w-11 rounded-full p-1 transition-colors cursor-pointer ${
        active ? 'bg-cyan-500' : 'bg-zinc-800'
      }`}
    >
      <div
        className={`h-4 w-4 rounded-full bg-white transition-transform ${
          active ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

/* ================= 4. MISSION OBJECTIVES TAB ================= */
interface MissionsTabProps {
  objectives: {
    id: string;
    title: string;
    description: string;
    category: string;
    targetCount: number;
    currentCount: number;
    completed: boolean;
    rewardPoints: number;
  }[];
  pois: GeologicalPOI[];
  sciencePoints: number;
  onDownlinkAll: () => void;
}

const MissionsTab: React.FC<MissionsTabProps> = ({
  objectives,
  pois,
  sciencePoints,
  onDownlinkAll,
}) => {
  const pendingDownlink = pois.filter((p) => p.sampleCollected && !p.downlinked);
  const pendingReward = pendingDownlink.reduce((sum, p) => sum + p.sciencePoints, 0);

  return (
    <div className="space-y-6">
      {/* Downlink Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-black p-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-cyan-400" />
            <h4 className="text-base font-bold text-white">Deep Space Network (DSN) Telemetry Downlink</h4>
          </div>
          <p className="text-xs text-zinc-300 font-sans max-w-xl">
            You have {pendingDownlink.length} scientific samples cached on the rover ready for Earth transmission via Madrid/Goldstone ground stations.
          </p>
        </div>

        <button
          onClick={onDownlinkAll}
          disabled={pendingDownlink.length === 0}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-6 py-2.5 font-mono text-xs font-bold text-white shadow-lg hover:scale-105 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          <span>DOWNLINK ALL CACHED TELEMETRY (+{pendingReward} SP)</span>
        </button>
      </div>

      {/* Objectives List */}
      <div className="space-y-3">
        {objectives.map((obj) => (
          <div
            key={obj.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4.5 transition-all ${
              obj.completed
                ? 'border-emerald-500/40 bg-emerald-950/20'
                : 'border-white/10 bg-zinc-900/60'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${
                    obj.category === 'Primary'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {obj.category}
                </span>
                <h4 className="font-bold text-white text-sm">{obj.title}</h4>
              </div>
              <p className="text-xs text-zinc-300 font-sans">{obj.description}</p>
            </div>

            <div className="flex items-center gap-4 self-end sm:self-center font-mono text-xs">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-zinc-400">PROGRESS</span>
                <span className="font-bold text-white">
                  {obj.currentCount} / {obj.targetCount}
                </span>
              </div>

              <div
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                  obj.completed
                    ? 'border border-emerald-400/50 bg-emerald-900/50 text-emerald-300'
                    : 'border border-white/10 bg-zinc-800 text-zinc-400'
                }`}
              >
                {obj.completed ? <CheckCircle2 className="h-4 w-4" /> : null}
                <span>{obj.completed ? 'COMPLETED' : `+${obj.rewardPoints} SP`}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ================= 5. NASA MEDA METEOROLOGICAL TELEMETRY TAB =================
interface MedaWeatherTabProps {
  env: EnvironmentState;
  onSelectSolProfile: (profileId: string) => void;
}

const MedaWeatherTab: React.FC<MedaWeatherTabProps> = ({ env, onSelectSolProfile }) => {
  const currentProfile = REAL_NASA_SOL_DATASETS[env.selectedSolProfile] || REAL_NASA_SOL_DATASETS.sol412;

  // Format Sol time (e.g. 14.2 -> "14:12 LST")
  const solHours = Math.floor(env.timeOfDay);
  const solMinutes = Math.floor((env.timeOfDay - solHours) * 60);
  const timeFormatted = `${String(solHours).padStart(2, '0')}:${String(solMinutes).padStart(2, '0')} LST`;

  // Diurnal Curve SVG Generation: 24 points (one for each hour)
  const curvePoints = React.useMemo(() => {
    const pts = [];
    for (let h = 0; h <= 24; h += 0.5) {
      const tele = calculateMedaAtmosphericTelemetry(currentProfile, h);
      pts.push({
        hour: h,
        air: tele.airTemp,
        ground: tele.groundTemp,
        pressure: tele.pressurePa,
        sun: tele.solarInsolationWatts,
      });
    }
    return pts;
  }, [currentProfile]);

  // SVG coordinate mapping: W = 600, H = 160
  // Temp range: -95 to +10 -> range = 105
  const mapY = (temp: number) => {
    const norm = (temp - -95) / (10 - -95);
    return 145 - norm * 125;
  };
  const mapX = (hour: number) => (hour / 24) * 560 + 20;

  const airPath = curvePoints.reduce(
    (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${mapX(p.hour).toFixed(1)} ${mapY(p.air).toFixed(1)}`,
    ''
  );
  const groundPath = curvePoints.reduce(
    (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${mapX(p.hour).toFixed(1)} ${mapY(p.ground).toFixed(1)}`,
    ''
  );

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* 1. Header Banner */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-zinc-900/60 to-black p-5 backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[10px] font-black tracking-widest text-cyan-400">
                NASA MARS 2020 PERSEVERANCE • MEDA METEOROLOGICAL STATION
              </span>
            </div>
            <h3 className="text-xl font-black text-white mt-1">
              Jezero Crater Atmospheric Dynamics
            </h3>
            <p className="text-xs text-zinc-300 font-sans mt-0.5">
              Live in-situ meteorological measurements from the floor of Jezero Crater (-2,560m MOLA datum).
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex flex-col items-end rounded-xl border border-cyan-500/40 bg-black/60 px-4 py-2">
              <span className="text-[10px] text-zinc-400">MISSION CLOCK</span>
              <span className="text-sm font-black text-cyan-300">
                SOL {env.solNumber || 412} • {timeFormatted}
              </span>
              <span className="text-[10px] text-zinc-400">
                Ls {env.solarLongitudeLs?.toFixed(1) || '18.4'}° ({env.seasonName})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Real NASA Sol Historical Datasets Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
            Select Real NASA MEDA Historical Sol Telemetry Profile
          </span>
          <span className="text-[10px] text-cyan-400 font-semibold">
            Active: {currentProfile.solName}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.values(REAL_NASA_SOL_DATASETS).map((p) => {
            const isSelected = env.selectedSolProfile === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectSolProfile(p.id)}
                className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                    : 'border-white/10 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white">SOL {p.sol}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      p.weatherClassification === 'Clear'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : p.weatherClassification === 'Dust Haze'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {p.weatherClassification}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-cyan-300 mt-1 line-clamp-1">
                  {p.seasonName} (Ls {p.seasonLs}°)
                </span>
                <span className="text-[10px] text-zinc-400 font-sans mt-1 line-clamp-2 leading-relaxed">
                  {p.description}
                </span>
                <div className="mt-2.5 flex items-center justify-between text-[10px] text-zinc-400 border-t border-white/5 pt-2">
                  <span>Air: {p.tempAirMin}° / {p.tempAirMax}°</span>
                  <span>τ {p.baseTau}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 6-Sensor Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Sensor 1: ATS Air Temperature */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4 space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 tracking-wider">ATS-1 & ATS-2 (AIR TEMP)</span>
            <Thermometer className="h-4 w-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-white">{env.ambientTemp}°C</p>
            <span className="text-xs text-zinc-400">at 1.5m Mast</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-400 border-t border-white/5 pt-1.5">
            <span>Diurnal: {currentProfile.tempAirMin}°C to {currentProfile.tempAirMax}°C</span>
            <span className="text-emerald-400 font-bold">5x Platinum RTD</span>
          </div>
        </div>

        {/* Sensor 2: TIR Ground Surface Radiometer */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4 space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 tracking-wider">TIR (GROUND SURFACE TEMP)</span>
            <Thermometer className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-black ${env.groundTemp > 0 ? 'text-amber-400' : 'text-sky-300'}`}>
              {env.groundTemp > 0 ? `+${env.groundTemp}` : env.groundTemp}°C
            </p>
            <span className="text-xs text-zinc-400">Boundary Layer</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-400 border-t border-white/5 pt-1.5">
            <span>Range: {currentProfile.tempGroundMin}°C to {currentProfile.tempGroundMax}°C</span>
            <span className="text-amber-300">ΔT: {(env.groundTemp - env.ambientTemp).toFixed(1)}°C</span>
          </div>
        </div>

        {/* Sensor 3: PS Barometric Pressure */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4 space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 tracking-wider">PS (BAROMETRIC PRESSURE)</span>
            <Gauge className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-white">{env.pressurePa} Pa</p>
            <span className="text-xs text-zinc-400">({env.pressureHpa} hPa)</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-400 border-t border-white/5 pt-1.5">
            <span>Tide Trend: <strong className="text-cyan-300">{env.pressureTrend}</strong></span>
            <span>-2,560m Datum</span>
          </div>
        </div>

        {/* Sensor 4: WS Wind Sensor Booms */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4 space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 tracking-wider">WS1 & WS2 (WIND SENSORS)</span>
            <Wind className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-cyan-200">{env.windSpeedMs} m/s</p>
            <span className="text-xs text-zinc-400">({(env.windSpeedMs * 3.6).toFixed(1)} km/h)</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-400 border-t border-white/5 pt-1.5">
            <span>Vector: <strong className="text-white">{env.windCompass} ({env.windDirectionDeg}°)</strong></span>
            <span>Gusts: {env.windGustMs} m/s</span>
          </div>
        </div>

        {/* Sensor 5: RDS Optical Dust Depth */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4 space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 tracking-wider">RDS (OPTICAL DUST TAU)</span>
            <Sun className="h-4 w-4 text-yellow-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-amber-300">τ {env.dustTau?.toFixed(2)}</p>
            <span className="text-xs text-zinc-400">880nm Channel</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-400 border-t border-white/5 pt-1.5">
            <span>Flux: {env.solarInsolationWatts} W/m²</span>
            <span>UV Index: {env.uvIndex}</span>
          </div>
        </div>

        {/* Sensor 6: HS Relative Humidity */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4 space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 tracking-wider">HS (RELATIVE HUMIDITY)</span>
            <CloudSun className="h-4 w-4 text-sky-300" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-sky-200">{env.relativeHumidityPct}% RH</p>
            <span className="text-xs text-zinc-400">Water Vapor</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-400 border-t border-white/5 pt-1.5">
            <span>Pre-dawn Frost Point: -80°C</span>
            <span>Capacitive Chip</span>
          </div>
        </div>
      </div>

      {/* 4. Interactive 24-Hour Sol Diurnal Weather Chart */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <h4 className="text-sm font-bold text-white">24-Hour Diurnal Sol Meteorological Curve</h4>
            <span className="text-[10px] text-zinc-400">
              Asymmetric thermal hysteresis and barometric tidal oscillation modeled on MEDA telemetry
            </span>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-zinc-300">Ground Temp</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              <span className="text-zinc-300">Air Temp</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span className="text-zinc-300">Current Time</span>
            </div>
          </div>
        </div>

        {/* SVG Plot */}
        <div className="relative w-full h-44 bg-black/60 rounded-xl border border-white/5 p-2 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 600 160" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 6, 12, 18, 24].map((hr) => (
              <line
                key={hr}
                x1={mapX(hr)}
                y1={10}
                x2={mapX(hr)}
                y2={150}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="3 3"
              />
            ))}
            {/* Freezing 0°C line */}
            <line
              x1={20}
              y1={mapY(0)}
              x2={580}
              y2={mapY(0)}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="2 2"
            />
            <text x={25} y={mapY(0) - 4} fill="rgba(255,255,255,0.4)" fontSize="9">
              0°C (Freezing Point)
            </text>

            {/* Ground temp curve */}
            <path d={groundPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
            {/* Air temp curve */}
            <path d={airPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />

            {/* Current Sol time vertical cursor */}
            <line
              x1={mapX(env.timeOfDay)}
              y1={10}
              x2={mapX(env.timeOfDay)}
              y2={150}
              stroke="#06b6d4"
              strokeWidth="2"
            />
            <circle
              cx={mapX(env.timeOfDay)}
              cy={mapY(env.ambientTemp)}
              r="4.5"
              fill="#06b6d4"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          </svg>

          {/* Time axis labels */}
          <div className="absolute bottom-1 inset-x-5 flex justify-between text-[9px] text-zinc-500 font-mono">
            <span>00:00 (Midnight)</span>
            <span>06:00 (Sunrise)</span>
            <span>12:00 (Noon)</span>
            <span>18:00 (Sunset)</span>
            <span>24:00 (Midnight)</span>
          </div>
        </div>
      </div>

      {/* 5. Martian Celestial Astrometry: Phobos & Deimos Ephemeris */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-purple-400" />
            <div>
              <h4 className="text-sm font-bold text-white">Martian Natural Moons Astrometry & Ephemeris</h4>
              <p className="text-[10px] text-zinc-400">
                Modeled on NASA JPL Horizons Astrometry & Curiosity/Perseverance Mastcam solar transit observations
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <Orbit className="h-3 w-3" />
            TIDALLY LOCKED NATURAL SATELLITES
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phobos Card */}
          <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-3 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-purple-200">PHOBOS (Fear)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                    7h 39m Orbit
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">26.8 x 22.4 x 18.4 km • Triaxial Carbonaceous Body</p>
              </div>
              <div className="text-right">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    env.moons?.phobos.isTransitingSun
                      ? 'bg-amber-500 text-black animate-pulse font-black'
                      : env.moons?.phobos.isVisible
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {env.moons?.phobos.isTransitingSun
                    ? 'SOLAR TRANSIT'
                    : env.moons?.phobos.isVisible
                    ? 'VISIBLE'
                    : 'BELOW HORIZON'}
                </span>
              </div>
            </div>

            {/* Key Physical Phenomenon */}
            <div className="rounded-lg bg-black/40 border border-purple-500/20 p-2.5 text-[10px] text-purple-200/90 leading-relaxed font-mono">
              <span className="text-purple-400 font-bold">Orbital Paradox: </span>
              Orbits at only ~6,000 km altitude—closer to its primary than any other moon in the solar system. Revolves faster than Mars rotates, causing it to{' '}
              <strong className="text-amber-300">RISE IN THE WEST</strong> and <strong className="text-amber-300">SET IN THE EAST</strong> in just ~4.3 hours!
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono pt-1">
              <div className="rounded bg-black/30 p-1.5 border border-white/5">
                <span className="text-zinc-500 block">ALT / AZ</span>
                <span className="text-white font-bold">
                  {env.moons?.phobos.altitudeDeg ?? 0}° / {env.moons?.phobos.azimuthDeg ?? 0}°
                </span>
              </div>
              <div className="rounded bg-black/30 p-1.5 border border-white/5">
                <span className="text-zinc-500 block">ILLUMINATION</span>
                <span className="text-purple-300 font-bold">{env.moons?.phobos.illuminationPct ?? 0}%</span>
              </div>
              <div className="rounded bg-black/30 p-1.5 border border-white/5">
                <span className="text-zinc-500 block">IMPACT CRATER</span>
                <span className="text-amber-300 font-bold">Stickney (9 km)</span>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 italic font-mono pt-1 border-t border-white/5">
              Event: {env.moons?.phobos.nextEventDescription ?? 'Tracking orbit...'}
            </p>
          </div>

          {/* Deimos Card */}
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-3 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-indigo-200">DEIMOS (Dread)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                    30h 21m Orbit
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">15.0 x 12.2 x 10.4 km • Smooth Regolith Body</p>
              </div>
              <div className="text-right">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    env.moons?.deimos.isVisible ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {env.moons?.deimos.isVisible ? 'VISIBLE' : 'BELOW HORIZON'}
                </span>
              </div>
            </div>

            {/* Key Physical Phenomenon */}
            <div className="rounded-lg bg-black/40 border border-indigo-500/20 p-2.5 text-[10px] text-indigo-200/90 leading-relaxed font-mono">
              <span className="text-indigo-400 font-bold">High Orbit Drift: </span>
              Orbits at 20,060 km altitude. Moves slower than Mars rotates, taking{' '}
              <strong className="text-cyan-300">~65 hours (2.7 Sols)</strong> to cross the sky from{' '}
              <strong className="text-cyan-300">EAST TO WEST</strong>, appearing as a bright shining celestial jewel.
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono pt-1">
              <div className="rounded bg-black/30 p-1.5 border border-white/5">
                <span className="text-zinc-500 block">ALT / AZ</span>
                <span className="text-white font-bold">
                  {env.moons?.deimos.altitudeDeg ?? 0}° / {env.moons?.deimos.azimuthDeg ?? 0}°
                </span>
              </div>
              <div className="rounded bg-black/30 p-1.5 border border-white/5">
                <span className="text-zinc-500 block">ILLUMINATION</span>
                <span className="text-indigo-300 font-bold">{env.moons?.deimos.illuminationPct ?? 0}%</span>
              </div>
              <div className="rounded bg-black/30 p-1.5 border border-white/5">
                <span className="text-zinc-500 block">SURFACE</span>
                <span className="text-cyan-300 font-bold">Regolith Blanket</span>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 italic font-mono pt-1 border-t border-white/5">
              Event: {env.moons?.deimos.nextEventDescription ?? 'Tracking orbit...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

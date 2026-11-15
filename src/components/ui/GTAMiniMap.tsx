'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useMissionStore } from '@/lib/store/useMissionStore';
import { ZoomIn, ZoomOut, Maximize2, AlertTriangle } from 'lucide-react';

export const GTAMiniMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sweepAngleRef = useRef<number>(0);
  const rover = useMissionStore((s) => s.rover);
  const pois = useMissionStore((s) => s.pois);
  const activeWaypoint = useMissionStore((s) => s.activeWaypoint);
  const env = useMissionStore((s) => s.env);
  const openModal = useMissionStore((s) => s.openModal);
  const isScanning = useMissionStore((s) => s.isScanning);
  const scanProgress = useMissionStore((s) => s.scanProgress);
  const sciencePoints = useMissionStore((s) => s.sciencePoints);

  // Radar zoom: 85m radius (tactical) vs 210m radius (panoramic)
  const [zoomRange, setZoomRange] = useState<number>(95);

  const toggleZoom = () => {
    setZoomRange((prev) => (prev === 95 ? 210 : 95));
  };

  // Distance from crater center
  const distFromCenter = Math.sqrt(
    rover.position[0] * rover.position[0] + rover.position[2] * rover.position[2]
  );
  const isNearRim = distFromCenter > 210;

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use internal high-DPI resolution for crisp vector lines
    const size = canvas.width; // 380px internal
    const center = size / 2;
    const radius = center - 14; // radar radius inside frame

    const render = () => {
      sweepAngleRef.current = (sweepAngleRef.current + 0.035) % (Math.PI * 2);

      ctx.clearRect(0, 0, size, size);

      // Save for circular radar clipping
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.clip();

      // 1. Dark Martian Satellite Radar Background
      ctx.fillStyle = '#0a0d16';
      ctx.fillRect(0, 0, size, size);

      // Mathematical World-To-Radar Transformation:
      // Rover is at [rover.x, rover.z] with heading yaw (rover.rotation).
      // On radar: player arrow at [center, center] always points straight UP (towards -Y on screen).
      // Right is +X on screen.
      const yaw = rover.rotation;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const scale = radius / zoomRange;

      const worldToRadar = (wx: number, wz: number): [number, number] => {
        const dx = wx - rover.position[0];
        const dz = wz - rover.position[2];
        const distRight = (dx * cosY - dz * sinY) * scale;
        const distForward = (dx * sinY + dz * cosY) * scale;
        return [center + distRight, center - distForward];
      };

      // Helper to fill a convex polygon given world vertices
      const fillWorldPolygon = (vertices: [number, number][], fillStyle: string) => {
        if (vertices.length === 0) return;
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        const [x0, y0] = worldToRadar(vertices[0][0], vertices[0][1]);
        ctx.moveTo(x0, y0);
        for (let i = 1; i < vertices.length; i++) {
          const [xi, yi] = worldToRadar(vertices[i][0], vertices[i][1]);
          ctx.lineTo(xi, yi);
        }
        ctx.closePath();
        ctx.fill();
      };

      // Helper to draw a circle given center in world coords
      const drawWorldCircle = (
        cx: number,
        cz: number,
        r: number,
        fillStyle?: string,
        strokeStyle?: string,
        lineWidth = 1
      ) => {
        ctx.beginPath();
        const segments = 36;
        for (let i = 0; i <= segments; i++) {
          const a = (i / segments) * Math.PI * 2;
          const wx = cx + Math.cos(a) * r;
          const wz = cz + Math.sin(a) * r;
          const [rx, ry] = worldToRadar(wx, wz);
          if (i === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        if (fillStyle) {
          ctx.fillStyle = fillStyle;
          ctx.fill();
        }
        if (strokeStyle) {
          ctx.strokeStyle = strokeStyle;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      };

      // 2. Biome Terrain Patches on Mini-Map
      // Dunes (X < -10, Z > -15) - Dark Basalt Navy
      fillWorldPolygon(
        [
          [-260, -15],
          [-10, -15],
          [-10, 260],
          [-260, 260],
        ],
        '#161c2b'
      );

      // Escarpment (X > 28) - Stratified Terracotta
      fillWorldPolygon(
        [
          [28, -260],
          [260, -260],
          [260, 260],
          [28, 260],
        ],
        '#341f16'
      );

      // Ancient Riverbed Delta (X > 5, Z > 0) - Ochre fan sediment
      fillWorldPolygon(
        [
          [5, 0],
          [130, 0],
          [130, 260],
          [5, 260],
        ],
        '#3b1d16'
      );

      // Belva Crater (center [0, -55], radius 38m)
      drawWorldCircle(0, -55, 38, '#221c1a', '#6e5d5088', 2.5);

      // Outer Jezero Crater Rim Contour (R = 220m)
      drawWorldCircle(0, 0, 220, undefined, '#ef444455', 2);

      // 3. World Grid Coordinate Lines
      ctx.strokeStyle = '#ffffff08';
      ctx.lineWidth = 1;
      for (let gx = -240; gx <= 240; gx += 60) {
        const [x1, y1] = worldToRadar(gx, -260);
        const [x2, y2] = worldToRadar(gx, 260);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      for (let gz = -240; gz <= 240; gz += 60) {
        const [x1, y1] = worldToRadar(-260, gz);
        const [x2, y2] = worldToRadar(260, gz);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // 4. Navigation GPS Guide Line to Active Waypoint
      if (activeWaypoint) {
        const [wpx, wpy] = worldToRadar(activeWaypoint[0], activeWaypoint[1]);

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(center, center); // starts at player arrow
        ctx.lineTo(wpx, wpy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Waypoint Destination Marker
        const distToWp = Math.hypot(wpx - center, wpy - center);
        let destX = wpx;
        let destY = wpy;
        // Clamp to radar perimeter if off-screen (GTA V style)
        if (distToWp > radius - 10) {
          destX = center + ((wpx - center) / distToWp) * (radius - 12);
          destY = center + ((wpy - center) / distToWp) * (radius - 12);
        }

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(destX, destY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 5. POI Blips on Radar
      pois.forEach((poi) => {
        const [px, py] = worldToRadar(poi.position[0], poi.position[2]);
        const distFromPlayer = Math.hypot(px - center, py - center);

        let drawX = px;
        let drawY = py;
        const isOffScreen = distFromPlayer > radius - 10;

        if (isOffScreen) {
          // Clamp blip to radar edge with small indicator (GTA V style)
          drawX = center + ((px - center) / distFromPlayer) * (radius - 10);
          drawY = center + ((py - center) / distFromPlayer) * (radius - 10);
        }

        if (poi.sampleCollected) {
          // Collected: Green circular check blip
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(drawX, drawY, isOffScreen ? 5 : 6.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (poi.discovered) {
          // Discovered: Cyan target blip
          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.arc(drawX, drawY, isOffScreen ? 5.5 : 7.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          // Unexplored: Orange diamond blip with pulsing aura
          if (!isOffScreen) {
            ctx.fillStyle = '#f9731633';
            ctx.beginPath();
            ctx.arc(drawX, drawY, 13, 0, Math.PI * 2);
            ctx.fill();
          }

          const dSize = isOffScreen ? 5 : 7.5;
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(drawX, drawY - dSize);
          ctx.lineTo(drawX + dSize, drawY);
          ctx.lineTo(drawX, drawY + dSize);
          ctx.lineTo(drawX - dSize, drawY);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // 5b. Mother Ship / Mars Ascent Vehicle (MAV) Landmark Blip
      const [mavPx, mavPy] = worldToRadar(0, -25);
      const dxMav = mavPx - center;
      const dyMav = mavPy - center;
      const distMav = Math.sqrt(dxMav * dxMav + dyMav * dyMav);
      let mavDrawX = mavPx;
      let mavDrawY = mavPy;
      const isMavOffScreen = distMav > radius - 12;

      if (isMavOffScreen) {
        mavDrawX = center + (dxMav / distMav) * (radius - 12);
        mavDrawY = center + (dyMav / distMav) * (radius - 12);
      } else {
        // Pulsing Gold Guidance Aura
        const pulseR = 14 + Math.sin(sweepAngleRef.current * 3) * 4;
        ctx.fillStyle = '#f59e0b25';
        ctx.beginPath();
        ctx.arc(mavDrawX, mavDrawY, pulseR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Golden Lander Blip
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(mavDrawX, mavDrawY, isMavOffScreen ? 6 : 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // MAV Label
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('MAV', mavDrawX + 9, mavDrawY + 3);

      // 5c. Active Convective Martian Dust Devil / Vortex Radar Blip
      if (env.dustDevilActive && env.dustDevilPos) {
        const [vx, vy] = worldToRadar(env.dustDevilPos[0], env.dustDevilPos[2]);
        const dxV = vx - center;
        const dyV = vy - center;
        const distV = Math.sqrt(dxV * dxV + dyV * dyV);
        const isVortexOffScreen = distV > radius - 14;

        let vDrawX = vx;
        let vDrawY = vy;

        if (isVortexOffScreen) {
          // Edge-pinned indicator (GTA V style)
          vDrawX = center + (dxV / distV) * (radius - 12);
          vDrawY = center + (dyV / distV) * (radius - 12);

          // Pulsating warning beacon pointing towards vortex
          const pulse = (Math.sin(sweepAngleRef.current * 6) + 1) * 0.5;
          ctx.fillStyle = `rgba(249, 115, 22, ${0.6 + pulse * 0.4})`;
          ctx.beginPath();
          ctx.arc(vDrawX, vDrawY, 7.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Distance label next to edge pin
          ctx.fillStyle = '#f97316';
          ctx.font = 'bold 8px monospace';
          ctx.fillText(`${Math.round(env.dustDevilDist)}m`, vDrawX + 9, vDrawY + 3);
        } else {
          // 25m Danger Perimeter Circle in world space
          drawWorldCircle(
            env.dustDevilPos[0],
            env.dustDevilPos[2],
            25,
            'rgba(249, 115, 22, 0.12)',
            'rgba(249, 115, 22, 0.7)',
            1.5
          );

          // Inner 12m violent buffeting zone
          drawWorldCircle(
            env.dustDevilPos[0],
            env.dustDevilPos[2],
            12,
            'rgba(239, 68, 68, 0.18)',
            'rgba(239, 68, 68, 0.85)',
            1.5
          );

          // Animated cyclonic spiral arms
          ctx.save();
          ctx.translate(vDrawX, vDrawY);
          ctx.rotate(sweepAngleRef.current * 3.5);

          for (let arm = 0; arm < 3; arm++) {
            ctx.rotate((Math.PI * 2) / 3);
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, 9, 0, Math.PI * 0.65);
            ctx.stroke();
          }

          // Central convective eye
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();

          // Vortex warning tag
          ctx.fillStyle = '#f97316';
          ctx.font = 'bold 8px monospace';
          ctx.fillText(`VORTEX ${Math.round(env.dustDevilDist)}m`, vDrawX + 11, vDrawY + 3);
        }
      }

      // 6. Radar Sweep Effect (Rotating scan line like real radar)
      const sweepEnd = sweepAngleRef.current;
      const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.0)');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0.08)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, sweepEnd - 0.45, sweepEnd);
      ctx.closePath();
      ctx.fill();

      // 7. Fixed Screen Overlays: Concentric Range Rings & Crosshairs
      ctx.strokeStyle = '#06b6d418';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(center, center, radius * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(center, center, radius * 0.85, 0, Math.PI * 2);
      ctx.stroke();

      // Thin crosshairs
      ctx.strokeStyle = '#06b6d415';
      ctx.beginPath();
      ctx.moveTo(center, center - radius);
      ctx.lineTo(center, center + radius);
      ctx.moveTo(center - radius, center);
      ctx.lineTo(center + radius, center);
      ctx.stroke();

      // 8. Center Player Arrow (GTA V Iconic Directional Blip)
      // Fixed at center pointing straight UP (towards 12 o'clock)
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(center, center - 13); // forward tip
      ctx.lineTo(center - 9, center + 9); // back left
      ctx.lineTo(center, center + 4); // back notch
      ctx.lineTo(center + 9, center + 9); // back right
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Center cyan core
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(center, center - 9);
      ctx.lineTo(center - 5, center + 6);
      ctx.lineTo(center, center + 2.5);
      ctx.lineTo(center + 5, center + 6);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.restore(); // Restore circular radar clip

      // 9. Heavy GTA V Outer Metallic Bezel Ring
      ctx.strokeStyle = '#1e2029';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(center, center, radius + 4, 0, Math.PI * 2);
      ctx.stroke();

      // Inner thin highlight bevel
      ctx.strokeStyle = '#38bdf833';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(center, center, radius + 1, 0, Math.PI * 2);
      ctx.stroke();

      // Bezel Tick Marks every 30 degrees
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        const x1 = center + Math.cos(a) * (radius + 2);
        const y1 = center + Math.sin(a) * (radius + 2);
        const x2 = center + Math.cos(a) * (radius + 7);
        const y2 = center + Math.sin(a) * (radius + 7);
        ctx.strokeStyle = '#52525b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // 10. Rotating Cardinal North 'N' Needle on Outer Rim
      // North is along +Z in world space.
      // When heading = 0 (facing North), North is at 12 o'clock (TOP).
      // When turning Right (yaw increases), North swings to the LEFT (9 o'clock).
      const nx = center - sinY * (radius - 5);
      const ny = center - cosY * (radius - 5);

      // Red needle diamond / circle
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(nx, ny, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', nx, ny);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [rover, pois, activeWaypoint, zoomRange, env]);

  // Compass heading (0 to 360 deg)
  // 0° = North, 90° = East, 180° = South, 270° = West
  const deg = Math.round((((rover.rotation * 180) / Math.PI + 360) % 360));
  const cardinal =
    deg >= 337.5 || deg < 22.5
      ? 'N'
      : deg < 67.5
      ? 'NE'
      : deg < 112.5
      ? 'E'
      : deg < 157.5
      ? 'SE'
      : deg < 202.5
      ? 'S'
      : deg < 247.5
      ? 'SW'
      : deg < 292.5
      ? 'W'
      : 'NW';

  return (
    <div className="pointer-events-auto flex flex-col font-mono select-none drop-shadow-2xl">
      {/* GTA V Circular Mini-Map Radar Housing */}
      <div className="relative h-48 w-48 rounded-full bg-black/85 p-1 shadow-[0_0_30px_rgba(0,0,0,0.95)] border border-white/10 backdrop-blur-md">
        <canvas
          ref={canvasRef}
          width={380}
          height={380}
          onClick={() => {
            useMissionStore.getState().setTabletTab('satnav');
            openModal('tablet');
          }}
          className="h-full w-full cursor-pointer rounded-full transition-transform active:scale-95 hover:brightness-110"
          title="Click to Open Full Topographic Mars Map [Tab]"
        />

        {/* Hover Hint Overlay */}
        <div
          onClick={() => {
            useMissionStore.getState().setTabletTab('satnav');
            openModal('tablet');
          }}
          className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-cyan-950/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none cursor-pointer"
        >
          <span className="bg-black/90 text-cyan-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-cyan-500/40 shadow-lg tracking-wider">
            MARS MAP ↗
          </span>
        </div>

        {/* Top-Right Mini Zoom Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleZoom();
          }}
          className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-cyan-400 hover:text-white border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer shadow-md z-10"
          title={`Zoom: ${zoomRange === 95 ? 'Close (95m)' : 'Wide (210m)'}`}
        >
          {zoomRange === 95 ? <ZoomIn className="h-3.5 w-3.5" /> : <ZoomOut className="h-3.5 w-3.5" />}
        </button>

        {/* Bottom-Right Ops Tablet Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            useMissionStore.getState().setTabletTab('satnav');
            openModal('tablet');
          }}
          className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-zinc-300 hover:text-white border border-white/20 hover:border-cyan-400 transition-all cursor-pointer shadow-md z-10"
          title="Open Full Topographic Mars Map [Tab]"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>

        {/* Warning Badge if near Jezero Rim */}
        {isNearRim && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none mt-8 flex items-center gap-1 bg-red-950/90 text-red-300 text-[9px] font-bold px-2 py-0.5 rounded border border-red-500/50 animate-pulse">
            <AlertTriangle className="h-2.5 w-2.5 text-red-400" />
            <span>RIM SLOPE</span>
          </div>
        )}
      </div>

      {/* ================= GTA V ICONIC HORIZONTAL STATUS GAUGES ================= */}
      {/* 3 Segmented Bars: Health/Battery (Green) | Armor/Power (Blue) | Special (Yellow) */}
      <div className="mt-2 flex w-48 items-center gap-1 px-1">
        {/* 1. HEALTH / BATTERY BAR (Green) */}
        <div
          className="h-2 flex-1 rounded-sm bg-zinc-900 border border-zinc-700/60 overflow-hidden shadow-inner relative"
          title={`Battery Charge: ${rover.battery.toFixed(0)}%`}
        >
          <div
            className={`h-full transition-all duration-300 ${
              rover.battery > 40
                ? 'bg-emerald-500'
                : rover.battery > 20
                ? 'bg-amber-500'
                : 'bg-red-500 animate-pulse'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, rover.battery))}%` }}
          />
        </div>

        {/* 2. ARMOR / SOLAR POWER BAR (Blue) */}
        <div
          className="h-2 flex-1 rounded-sm bg-zinc-900 border border-zinc-700/60 overflow-hidden shadow-inner relative"
          title={`Power Output: ${rover.solarWatts} Watts`}
        >
          <div
            className="h-full bg-sky-400 transition-all duration-300"
            style={{ width: `${Math.min(100, (rover.solarWatts / 580) * 100)}%` }}
          />
        </div>

        {/* 3. SPECIAL / SPECTROMETER CHARGE BAR (Yellow) */}
        <div
          className="h-2 flex-1 rounded-sm bg-zinc-900 border border-zinc-700/60 overflow-hidden shadow-inner relative"
          title={isScanning ? `Scan Sweep: ${scanProgress.toFixed(0)}%` : `Science SP: ${sciencePoints}`}
        >
          <div
            className={`h-full transition-all duration-150 ${
              isScanning ? 'bg-amber-400 animate-pulse' : 'bg-yellow-500'
            }`}
            style={{ width: isScanning ? `${scanProgress}%` : `${Math.min(100, (sciencePoints / 200) * 100)}%` }}
          />
        </div>
      </div>

      {/* ================= GTA V STREET & DISTRICT NAME READOUT ================= */}
      <div className="mt-1 flex w-48 items-center justify-between px-1.5 py-1 rounded bg-black/80 border border-white/10 backdrop-blur-md text-[10px]">
        <div className="flex flex-col overflow-hidden mr-1">
          <span className="font-extrabold tracking-wider text-cyan-300 uppercase truncate">
            JEZERO // {env.currentBiome}
          </span>
          <div className="flex items-center gap-1.5 text-[9px] text-zinc-400 font-mono">
            <span>{(Math.abs(rover.speed) * 3.6).toFixed(1)} km/h</span>
            <span>•</span>
            <span className="text-amber-400" title="NASA MEDA Wind Speed">
              💨 {env.windSpeedMs.toFixed(1)}m/s
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 font-bold text-white shrink-0">
          <span className="text-zinc-400 font-normal">{cardinal}</span>
          <span>{deg}°</span>
        </div>
      </div>
    </div>
  );
};

import * as THREE from 'three';

// Cache generated textures so canvas generation only runs once
const textureCache: Record<string, THREE.CanvasTexture> = {};

function createFallback(): THREE.CanvasTexture {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    const dummy = { width: 1, height: 1, getContext: () => null } as unknown as HTMLCanvasElement;
    return new THREE.CanvasTexture(dummy);
  }
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;
  return new THREE.CanvasTexture(canvas);
}

/**
 * 1. Rocket Fuselage PBR Textures
 * - Aerospace white polyurethane coating with panel rivets and weld seams
 * - NASA Meatball & USA flag livery
 * - Black/White optical spin calibration roll patterns
 * - Cryogenic LOX tank frost condensation line
 */
export function getRocketFuselageTexture(): THREE.CanvasTexture {
  if (textureCache['rocket_fuselage']) return textureCache['rocket_fuselage'];
  if (typeof window === 'undefined' || typeof document === 'undefined') return createFallback();

  const width = 1024;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Base off-white aerospace thermal coat
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // Subtle metallic panel shading & weld seams
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  for (let y = 64; y < height; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    // Rivet dots along horizontal seams
    ctx.fillStyle = '#94a3b8';
    for (let x = 8; x < width; x += 16) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Vertical panel seams
  for (let x = 128; x < width; x += 256) {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Black & White optical roll tracking markings (checkerboard blocks)
  ctx.fillStyle = '#0f172a';
  const blockW = 64;
  const blockH = 64;
  for (let i = 0; i < 4; i++) {
    const y = 200 + i * blockH;
    ctx.fillRect(i % 2 === 0 ? 0 : blockW, y, blockW, blockH);
    ctx.fillRect(i % 2 === 0 ? 512 : 512 + blockW, y, blockW, blockH);
  }

  // Red NASA / Project Cradle livery stripe
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 480, width, 18);
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(0, 502, width, 8);

  // NASA Meatball Emblem Simulation
  ctx.save();
  ctx.translate(256, 360);
  ctx.fillStyle = '#1d4ed8'; // Blue sphere
  ctx.beginPath();
  ctx.arc(0, 0, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-52, 24);
  ctx.lineTo(0, -32);
  ctx.lineTo(52, 24);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NASA', 0, 0);
  ctx.restore();

  // USA Flag
  ctx.save();
  ctx.translate(768, 360);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-45, -28, 90, 56);
  ctx.fillStyle = '#dc2626';
  for (let s = 0; s < 7; s++) {
    ctx.fillRect(-45, -28 + s * 8, 90, 4);
  }
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(-45, -28, 40, 30);
  ctx.restore();

  // Cryogenic LOX Tank Frost Banding (icy condensation rings near lower third)
  const frostGrad = ctx.createLinearGradient(0, 680, 0, 840);
  frostGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  frostGrad.addColorStop(0.3, 'rgba(240, 249, 255, 0.6)');
  frostGrad.addColorStop(0.5, 'rgba(224, 242, 254, 0.85)');
  frostGrad.addColorStop(0.7, 'rgba(240, 249, 255, 0.6)');
  frostGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = frostGrad;
  ctx.fillRect(0, 680, width, 160);

  // Aft Engine Skirt Carbon Heat Shielding
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 940, width, 84);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  textureCache['rocket_fuselage'] = tex;
  return tex;
}

/**
 * NASA Space Launch System (SLS / Artemis) Core Stage Texture (Photorealistic 2048x1024)
 * - Authentic Spray-On Foam Insulation (SOFI) cellular noise & orange gradient
 * - Forward skirt with black optical roll targets, access doors & rivet lines
 * - Ribbed intertank section with 3D stringers
 * - Large red retro NASA "worm" logo and NASA meatball
 * - Cryogenic LOX tank frost banding and weld seams
 */
export function getSLSCoreStageTexture(): THREE.CanvasTexture {
  if (textureCache['sls_core_stage']) return textureCache['sls_core_stage'];
  if (typeof window === 'undefined' || typeof document === 'undefined') return createFallback();

  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Base Orange-Terracotta Spray-On Foam Insulation (SOFI)
  const foamGrad = ctx.createLinearGradient(0, 0, width, 0);
  foamGrad.addColorStop(0.0, '#b85426');
  foamGrad.addColorStop(0.2, '#d46e32');
  foamGrad.addColorStop(0.5, '#ea8544');
  foamGrad.addColorStop(0.8, '#d46e32');
  foamGrad.addColorStop(1.0, '#b85426');
  ctx.fillStyle = foamGrad;
  ctx.fillRect(0, 0, width, height);

  // High-frequency cellular foam grain noise
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 18;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.8));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.5));
  }
  ctx.putImageData(imgData, 0, 0);

  // Circumferential foam ring weld seams with highlight and shadow
  for (let y = 140; y < 920; y += 95) {
    // Shadow line
    ctx.strokeStyle = 'rgba(120, 45, 18, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    // Foam bead highlight
    ctx.strokeStyle = 'rgba(255, 175, 120, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y - 2);
    ctx.lineTo(width, y - 2);
    ctx.stroke();
  }

  // 2. White Forward Skirt / Interstage at Top (0 to 110px)
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, 110);

  // Forward skirt bottom joint band
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 106, width, 4);

  // Fine panel lines & rivets on forward skirt
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  for (let x = 0; x < width; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 106);
    ctx.stroke();
    // Rivet dots
    ctx.fillStyle = '#94a3b8';
    for (let py = 12; py < 100; py += 16) {
      ctx.beginPath();
      ctx.arc(x + 6, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Black optical tracking roll markings on forward skirt
  ctx.fillStyle = '#0f172a';
  const markW = 90;
  const markH = 55;
  for (let q = 0; q < 4; q++) {
    const qx = q * (width / 4);
    ctx.fillRect(qx, 25, markW, markH);
    ctx.fillRect(qx + markW, 25 + markH, markW, 25);
  }

  // 3. Ribbed Intertank Section (darker corrugated stringers around 240px to 360px)
  ctx.fillStyle = '#a84218';
  ctx.fillRect(0, 240, width, 120);

  // Intertank longitudinal stringers (fluted corrugations)
  for (let x = 0; x < width; x += 12) {
    ctx.fillStyle = 'rgba(60, 20, 8, 0.45)';
    ctx.fillRect(x, 240, 5, 120);
    ctx.fillStyle = 'rgba(255, 160, 110, 0.35)';
    ctx.fillRect(x + 5, 240, 4, 120);
  }

  // 4. Large Red NASA "Worm" Logo on Core Stage (vector-crisp)
  ctx.save();
  ctx.translate(width * 0.5, 580);
  ctx.fillStyle = '#e11d48';
  ctx.font = '900 96px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '18px';
  ctx.fillText('NASA', 0, 0);

  // Subtitle: PROJECT CRADLE / ARTEMIS // UNITED STATES
  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.letterSpacing = '4px';
  ctx.fillText('PROJECT CRADLE // ARTEMIS MARS', 0, 68);
  ctx.fillText('UNITED STATES', 0, 96);
  ctx.restore();

  // 5. NASA Blue Meatball on Opposite Quadrant
  ctx.save();
  ctx.translate(width * 0.18, 580);
  ctx.fillStyle = '#1d4ed8'; // Blue sphere
  ctx.beginPath();
  ctx.arc(0, 0, 72, 0, Math.PI * 2);
  ctx.fill();
  // Red chevron
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(-78, 36);
  ctx.lineTo(0, -48);
  ctx.lineTo(78, 36);
  ctx.stroke();
  // White NASA text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '2px';
  ctx.fillText('NASA', 0, 0);
  ctx.restore();

  // 6. USA Flag decal on another quadrant
  ctx.save();
  ctx.translate(width * 0.82, 580);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-70, -42, 140, 84);
  ctx.fillStyle = '#dc2626';
  for (let s = 0; s < 7; s++) {
    ctx.fillRect(-70, -42 + s * 12, 140, 6);
  }
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(-70, -42, 60, 48);
  ctx.restore();

  // 7. Cryogenic LOX Tank Frost Condensation Banding
  const frostGrad = ctx.createLinearGradient(0, 700, 0, 860);
  frostGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  frostGrad.addColorStop(0.3, 'rgba(240, 249, 255, 0.45)');
  frostGrad.addColorStop(0.5, 'rgba(224, 242, 254, 0.7)');
  frostGrad.addColorStop(0.7, 'rgba(240, 249, 255, 0.45)');
  frostGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = frostGrad;
  ctx.fillRect(0, 700, width, 160);

  // 8. Systems Tunnel Raceway Cover (vertical white conduit)
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(width * 0.35, 110, 24, 820);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(width * 0.35 + 24, 110, 6, 820);

  // 9. Aft Engine Section Heat Shield (Dark Graphite thermal blanket)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 930, width, 94);
  // Graphite blanket weave texture
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.25)';
  ctx.lineWidth = 1;
  for (let y = 930; y < height; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 8;
  textureCache['sls_core_stage'] = tex;
  return tex;
}

/**
 * Normal / Bump Map for SLS Core Stage Foam, Ribs, and Rivets
 */
export function getSLSCoreStageBumpTexture(): THREE.CanvasTexture {
  if (textureCache['sls_core_bump']) return textureCache['sls_core_bump'];
  if (typeof window === 'undefined' || typeof document === 'undefined') return createFallback();

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Neutral grey baseline (height = 0)
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, width, height);

  // Intertank stringer corrugations (height relief)
  for (let x = 0; x < width; x += 6) {
    ctx.fillStyle = '#555555';
    ctx.fillRect(x, 120, 2, 60);
    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(x + 2, 120, 2, 60);
  }

  // Circumferential foam ring weld beads
  for (let y = 70; y < 460; y += 48) {
    ctx.fillStyle = '#555555';
    ctx.fillRect(0, y, width, 2);
    ctx.fillStyle = '#b0b0b0';
    ctx.fillRect(0, y - 2, width, 2);
  }

  // High-frequency cellular foam bump noise
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const bump = (Math.random() - 0.5) * 22;
    const val = Math.min(255, Math.max(0, data[i] + bump));
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  textureCache['sls_core_bump'] = tex;
  return tex;
}

/**
 * NASA SLS 5-Segment Solid Rocket Booster (SRB) Texture
 * - Clean aerospace white casing with 5 field joint casing rings
 * - Detailed avionics cable raceways, factory stenciling & segment joint pins
 */
export function getSLSSRBTexture(): THREE.CanvasTexture {
  if (textureCache['sls_srb']) return textureCache['sls_srb'];
  if (typeof window === 'undefined' || typeof document === 'undefined') return createFallback();

  const width = 512;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Pure white thermal coating
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // Black Forward Skirt band
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, 75);

  // 5 Black Field Joint Casing Rings
  for (let s = 1; s <= 5; s++) {
    const y = 80 + s * 160;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, y, width, 14);

    // Circumferential joint bolts
    ctx.fillStyle = '#94a3b8';
    for (let x = 8; x < width; x += 16) {
      ctx.beginPath();
      ctx.arc(x, y + 7, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Vertical avionics wiring tunnel
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(240, 80, 16, 880);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(256, 80, 4, 880);

  // Red NASA / USA markings
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NASA', 128, 320);
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('UNITED STATES', 128, 348);

  // Aft Skirt (Hold-down post brackets)
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 960, width, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  textureCache['sls_srb'] = tex;
  return tex;
}

/**
 * 2. Photorealistic Gold & Amber Kapton Multi-Layer Insulation (MLI) Texture
 * - Crinkled aerospace thermal blanket with high specular glint
 * - Diamond quilt stitching, tape seams, and button anchors
 */
export function getGoldKaptonTexture(): THREE.CanvasTexture {
  if (textureCache['gold_kapton']) return textureCache['gold_kapton'];
  if (typeof window === 'undefined' || typeof document === 'undefined') return createFallback();

  const width = 512;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Base metallic amber gold
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, width, height);

  // Procedural quilt wrinkles, micro-crinkles and specular glints
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Diamond / square quilt seams (every 32px)
      const gx = x % 32;
      const gy = y % 32;
      const isSeam = gx < 2 || gy < 2;

      // Multi-frequency organic wrinkle folds
      const n1 = Math.sin(x * 0.15 + Math.cos(y * 0.1) * 3.0);
      const n2 = Math.cos(y * 0.18 + Math.sin(x * 0.12) * 2.5);
      const n3 = Math.sin((x + y) * 0.28) * 0.6;
      const wrinkle = (n1 + n2 + n3) * 0.33;

      let r = 245 + wrinkle * 40;
      let g = 175 + wrinkle * 35;
      let b = 25 + wrinkle * 18;

      if (isSeam) {
        r *= 0.62;
        g *= 0.62;
        b *= 0.62;
      }

      // Button anchors at quilt corners
      if ((gx <= 1 && gy <= 1) || (gx >= 30 && gy >= 30)) {
        r = 255;
        g = 240;
        b = 180;
      }

      data[idx] = Math.min(255, Math.max(0, r));
      data[idx + 1] = Math.min(255, Math.max(0, g));
      data[idx + 2] = Math.min(255, Math.max(0, b));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  textureCache['gold_kapton'] = tex;
  return tex;
}

/**
 * 3. Heat Shield PICA Ablation Tiles & Incandescent Hot Spot Texture
 * - Carbon-phenolic dark charred hexagonal tiles with fine seam gaps
 * - MEDLI2 instrumentation plug ports (authentic white & yellow dots)
 * - Stagnation point incandescent thermal glow (white/orange to charred black)
 */
export function getHeatShieldTexture(isGlowingHot: boolean = false): THREE.CanvasTexture {
  const key = `heat_shield_${isGlowingHot}`;
  if (textureCache[key]) return textureCache[key];
  if (typeof window === 'undefined' || typeof document === 'undefined') return createFallback();

  const width = 1024;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Deep charred carbon-phenolic black baseline
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, width, height);

  // Carbon weave micro-texture
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 16;
    data[i] = Math.min(255, Math.max(0, 24 + grain));
    data[i + 1] = Math.min(255, Math.max(0, 24 + grain));
    data[i + 2] = Math.min(255, Math.max(0, 27 + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  // Hexagonal TPS tile grid pattern
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 2;
  const hexSize = 36;
  const hW = hexSize * Math.sqrt(3);
  for (let y = 0; y < height + hexSize; y += hexSize * 1.5) {
    for (let x = 0; x < width + hW; x += hW) {
      const offsetX = (Math.floor(y / (hexSize * 1.5)) % 2) * (hW / 2);
      ctx.beginPath();
      for (let a = 0; a < 6; a++) {
        const rad = (Math.PI / 3) * a;
        const px = x + offsetX + Math.cos(rad) * (hexSize - 1.5);
        const py = y + Math.sin(rad) * (hexSize - 1.5);
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  // Authentic NASA MEDLI2 sensor plugs (pressure & temperature sensor transducers)
  const medliLocations = [
    [512, 512], [460, 480], [560, 480], [512, 420], [420, 540], [600, 540],
    [512, 620], [380, 460], [640, 460], [460, 680], [560, 680]
  ];
  for (const [mx, my] of medliLocations) {
    ctx.fillStyle = '#f59e0b'; // Amber ring
    ctx.beginPath();
    ctx.arc(mx, my, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff'; // White sensor plug center
    ctx.beginPath();
    ctx.arc(mx, my, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Incandescent thermal compression stagnation glow
  if (isGlowingHot) {
    const radial = ctx.createRadialGradient(512, 512, 20, 512, 512, 480);
    radial.addColorStop(0, 'rgba(255, 255, 255, 0.98)'); // White hot stagnation point
    radial.addColorStop(0.2, 'rgba(254, 215, 170, 0.92)'); // Yellow hot
    radial.addColorStop(0.5, 'rgba(249, 115, 22, 0.75)'); // Orange plasma
    radial.addColorStop(0.78, 'rgba(185, 28, 28, 0.45)'); // Deep red
    radial.addColorStop(1, 'rgba(24, 24, 27, 0)'); // Charred cold boundary
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
  }

  const tex = new THREE.CanvasTexture(canvas);
  textureCache[key] = tex;
  return tex;
}

/**
 * Dedicated Aeroshell Backshell SLA-561V Ablative Thermal Tile Texture
 * - Clean off-white ablative tiles with fine circumferential & radial seams
 * - Umbilical interface doors, RCS thruster cutouts, and alignment marks
 */
export function getBackshellTexture(): THREE.CanvasTexture {
  if (textureCache['backshell_sla']) return textureCache['backshell_sla'];
  if (typeof window === 'undefined' || typeof document === 'undefined') return createFallback();

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Warm off-white SLA-561V baseline
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // Horizontal circumferential tile seams
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  for (let y = 32; y < height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Vertical radial seams
  for (let x = 0; x < width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Umbilical Interface Plates (gold/titanium rectangular plates)
  for (let i = 0; i < 4; i++) {
    const px = 120 + i * 250;
    ctx.fillStyle = '#b45309';
    ctx.fillRect(px, 180, 55, 35);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px + 4, 184, 47, 27);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  textureCache['backshell_sla'] = tex;
  return tex;
}

/**
 * Photorealistic Gallium-Arsenide (GaAs) Space Solar Array Texture
 * - Midnight deep blue/indigo silicon cells
 * - Ultra-fine silver contact finger grid lines & gold busbars
 */
export function getSolarCellTexture(): THREE.CanvasTexture {
  if (textureCache['solar_cell_gaas']) return textureCache['solar_cell_gaas'];
  if (typeof window === 'undefined' || typeof document === 'undefined') return createFallback();

  const width = 512;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Deep indigo space solar cell baseline
  ctx.fillStyle = '#09152e';
  ctx.fillRect(0, 0, width, height);

  // Cell grid boundaries (each 64x64px cell)
  const cellSize = 64;
  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      // Cell interior with subtle anti-reflective blue-purple gradient
      const grad = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
      grad.addColorStop(0, '#0c1e3d');
      grad.addColorStop(0.5, '#081226');
      grad.addColorStop(1, '#050c1c');
      ctx.fillStyle = grad;
      ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);

      // Fine silver contact fingers
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 1;
      for (let fy = y + 8; fy < y + cellSize - 4; fy += 8) {
        ctx.beginPath();
        ctx.moveTo(x + 3, fy);
        ctx.lineTo(x + cellSize - 3, fy);
        ctx.stroke();
      }

      // Golden main busbars
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x + 18, y + 2, 3, cellSize - 4);
      ctx.fillRect(x + 42, y + 2, 3, cellSize - 4);
    }
  }

  // Inter-cell gap lines
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  for (let x = 0; x <= width; x += cellSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += cellSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  textureCache['solar_cell_gaas'] = tex;
  return tex;
}

/**
 * High-Gain Parabolic Antenna Gold Mesh Reflector Texture
 */
export function getAntennaMeshTexture(): THREE.CanvasTexture {
  if (textureCache['antenna_mesh']) return textureCache['antenna_mesh'];
  if (typeof window === 'undefined' || typeof document === 'undefined') return createFallback();

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d97706';
  ctx.fillRect(0, 0, size, size);

  // Gold molybdenum woven mesh grid
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  textureCache['antenna_mesh'] = tex;
  return tex;
}

/**
 * 4. Authentic NASA JPL "DARE MIGHTY THINGS" Binary Parachute Texture
 */
export function getSupersonicParachuteTexture(): THREE.CanvasTexture {
  if (textureCache['chute_jpl']) return textureCache['chute_jpl'];
  if (typeof window === 'undefined' || typeof document === 'undefined') return createFallback();

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const numGores = 80;
  const goreWidth = width / numGores;

  // NASA JPL Mars 2020 Parachute pattern: Binary concentric rings
  for (let i = 0; i < numGores; i++) {
    const isOrange = (i % 2 === 0 && (i % 6 !== 0)) || (i % 5 === 0);
    ctx.fillStyle = isOrange ? '#ea580c' : '#f8fafc';
    ctx.fillRect(i * goreWidth, 0, goreWidth + 0.5, height);

    ctx.strokeStyle = '#c2410c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(i * goreWidth, 0);
    ctx.lineTo(i * goreWidth, height);
    ctx.stroke();
  }

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.35);
  ctx.lineTo(width, height * 0.35);
  ctx.moveTo(0, height * 0.7);
  ctx.lineTo(width, height * 0.7);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  textureCache['chute_jpl'] = tex;
  return tex;
}

/**
 * 5. High-Resolution Photorealistic Earth Planet Texture
 */
export function getEarthPlanetTexture(): THREE.CanvasTexture {
  if (textureCache['earth_globe']) return textureCache['earth_globe'];
  if (typeof window === 'undefined' || typeof document === 'undefined') return createFallback();

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#0c4a6e');
  oceanGrad.addColorStop(0.5, '#0369a1');
  oceanGrad.addColorStop(1, '#0c4a6e');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.ellipse(280, 220, 95, 140, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.ellipse(250, 190, 45, 35, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#166534';
  ctx.beginPath();
  ctx.ellipse(640, 180, 150, 90, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.ellipse(590, 240, 80, 45, -0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  for (let c = 0; c < 18; c++) {
    const cx = (c * 62) % width;
    const cy = 100 + Math.sin(c * 1.5) * 150;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 65 + (c % 4) * 20, 22 + (c % 3) * 12, (c % 5) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, 25);
  ctx.fillRect(0, height - 35, width, 35);

  const tex = new THREE.CanvasTexture(canvas);
  textureCache['earth_globe'] = tex;
  return tex;
}

/**
 * 6. High-Resolution Photorealistic Mars Planet Texture
 */
export function getMarsGlobeTexture(): THREE.CanvasTexture {
  if (textureCache['mars_globe']) return textureCache['mars_globe'];
  if (typeof window === 'undefined' || typeof document === 'undefined') return createFallback();

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const baseGrad = ctx.createLinearGradient(0, 0, 0, height);
  baseGrad.addColorStop(0, '#991b1b');
  baseGrad.addColorStop(0.5, '#c2410c');
  baseGrad.addColorStop(1, '#7f1d1d');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#431407';
  ctx.beginPath();
  ctx.ellipse(360, 240, 110, 65, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(720, 280, 140, 80, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(220, 260);
  ctx.bezierCurveTo(320, 250, 420, 280, 520, 265);
  ctx.stroke();

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(580, 210, 14, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(width / 2, 12, 180, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  textureCache['mars_globe'] = tex;
  return tex;
}

/**
 * 7. Photorealistic RS-25 Hydrolox (LOX/LH2) Supersonic Exhaust Texture
 * - Blinding pure white-hot throat exit disc
 * - Radiant electric azure & deep cerulean blue translucent shock envelope
 * - Periodic supersonic Mach shock diamonds with radiant halos
 * - Smooth Gaussian radial falloff (NO flat paper edges!)
 */
export function getRS25PlumeTexture(): THREE.CanvasTexture {
  if (textureCache['rs25_plume_hd']) return textureCache['rs25_plume_hd'];
  if (typeof window === 'undefined' || typeof document === 'undefined') return createFallback();

  const width = 256;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  // Soft Gaussian horizontal falloff from center to edges
  for (let x = 0; x < width; x++) {
    const normX = (x - width / 2) / (width / 2);
    const alphaX = Math.exp(-normX * normX * 3.5); // Gaussian bell curve

    const grad = ctx.createLinearGradient(x, 0, x, height);
    // RS-25 Hydrolox Colors: White throat -> Bright cyan -> Azure -> Deep Violet
    grad.addColorStop(0.0, `rgba(255, 255, 255, ${0.98 * alphaX})`);
    grad.addColorStop(0.08, `rgba(224, 242, 254, ${0.95 * alphaX})`);
    grad.addColorStop(0.25, `rgba(56, 189, 248, ${0.82 * alphaX})`);
    grad.addColorStop(0.55, `rgba(14, 165, 233, ${0.55 * alphaX})`);
    grad.addColorStop(0.85, `rgba(99, 102, 241, ${0.25 * alphaX})`);
    grad.addColorStop(1.0, `rgba(15, 23, 42, 0)`);

    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, 1, height);
  }

  // 6 Luminous Mach Shock Diamonds with glowing halos
  for (let d = 0; d < 6; d++) {
    const y = 90 + d * 140;
    const size = 30 - d * 3.2;

    // Glowing halo
    const halo = ctx.createRadialGradient(width / 2, y, 0, width / 2, y, size * 1.8);
    halo.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    halo.addColorStop(0.4, 'rgba(56, 189, 248, 0.6)');
    halo.addColorStop(1, 'rgba(14, 165, 233, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(width / 2, y, size * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Diamond focal node
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(width / 2, y - size);
    ctx.lineTo(width / 2 + size * 0.6, y);
    ctx.lineTo(width / 2, y + size);
    ctx.lineTo(width / 2 - size * 0.6, y);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  textureCache['rs25_plume_hd'] = tex;
  return tex;
}

/**
 * 8. Photorealistic Hydrazine Monopropellant Exhaust Texture (Sky Crane MLE)
 * - Ultra-high-velocity amber/peach/pale-violet supersonic plume
 * - Smooth Gaussian radial falloff with Mach shock diamonds
 */
export function getHydrazinePlumeTexture(): THREE.CanvasTexture {
  if (textureCache['hydrazine_plume_hd']) return textureCache['hydrazine_plume_hd'];
  if (typeof window === 'undefined' || typeof document === 'undefined') return createFallback();

  const width = 256;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  // Soft Gaussian horizontal falloff
  for (let x = 0; x < width; x++) {
    const normX = (x - width / 2) / (width / 2);
    const alphaX = Math.exp(-normX * normX * 3.2);

    const grad = ctx.createLinearGradient(x, 0, x, height);
    // Hydrazine MLE Colors: Blinding white throat -> Golden peach -> Amber -> Pale violet
    grad.addColorStop(0.0, `rgba(255, 255, 255, ${0.98 * alphaX})`);
    grad.addColorStop(0.12, `rgba(254, 240, 138, ${0.92 * alphaX})`);
    grad.addColorStop(0.35, `rgba(251, 146, 60, ${0.75 * alphaX})`);
    grad.addColorStop(0.68, `rgba(234, 88, 12, ${0.45 * alphaX})`);
    grad.addColorStop(0.9, `rgba(192, 132, 252, ${0.18 * alphaX})`);
    grad.addColorStop(1.0, `rgba(0, 0, 0, 0)`);

    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, 1, height);
  }

  // 5 Supersonic Mach Shock Diamonds
  for (let d = 0; d < 5; d++) {
    const y = 80 + d * 150;
    const size = 26 - d * 3.5;

    const halo = ctx.createRadialGradient(width / 2, y, 0, width / 2, y, size * 2.0);
    halo.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    halo.addColorStop(0.35, 'rgba(251, 191, 36, 0.65)');
    halo.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(width / 2, y, size * 2.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(width / 2, y - size);
    ctx.lineTo(width / 2 + size * 0.65, y);
    ctx.lineTo(width / 2, y + size);
    ctx.lineTo(width / 2 - size * 0.65, y);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  textureCache['hydrazine_plume_hd'] = tex;
  return tex;
}

/**
 * 9. Legacy / Generic Supersonic Rocket Exhaust Plume Texture
 */
export function getPlumeShockTexture(): THREE.CanvasTexture {
  return getHydrazinePlumeTexture();
}

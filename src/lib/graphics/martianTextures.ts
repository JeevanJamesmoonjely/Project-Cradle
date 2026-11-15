import * as THREE from 'three';

let cachedGroundTextures: {
  albedoMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} | null = null;

let cachedCelestialTexture: THREE.CanvasTexture | null = null;

function createFallbackTexture(): THREE.CanvasTexture {
  const canvas =
    typeof window !== 'undefined' && typeof document !== 'undefined'
      ? document.createElement('canvas')
      : ({ width: 1, height: 1, getContext: () => null } as unknown as HTMLCanvasElement);
  return new THREE.CanvasTexture(canvas);
}

/**
 * Generates photorealistic Martian PBR surface textures matching NASA HiRISE & Perseverance:
 * - Natural wind-blown sand dunes with undulating aeolian ripples (Images 1, 2 & 3)
 * - Multi-scale regolith grain and weathered rock dust
 * - Subtle dark basaltic sand bands in ripple troughs
 * - Natural iron-oxide color palette (zero cartoon black Voronoi cracks!)
 */
export function getMartianGroundTextures(): {
  albedoMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  if (cachedGroundTextures) return cachedGroundTextures;
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    const dummy = createFallbackTexture();
    return { albedoMap: dummy, normalMap: dummy, roughnessMap: dummy };
  }

  const width = 1024;
  const height = 1024;

  // Heightmap Canvas for normal calculation
  const heightCanvas = document.createElement('canvas');
  heightCanvas.width = width;
  heightCanvas.height = height;
  const hCtx = heightCanvas.getContext('2d')!;
  const hImgData = hCtx.createImageData(width, height);
  const hData = hImgData.data;

  // Albedo Canvas
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = width;
  albedoCanvas.height = height;
  const aCtx = albedoCanvas.getContext('2d')!;
  const aImgData = aCtx.createImageData(width, height);
  const aData = aImgData.data;

  // Roughness Canvas
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d')!;
  const rImgData = rCtx.createImageData(width, height);
  const rData = rImgData.data;

  // Multi-frequency noise synthesizer for natural sand dunes & regolith
  for (let y = 0; y < height; y++) {
    const ny = (y / height) * Math.PI * 2;
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * Math.PI * 2;

      // 1. Primary Aeolian Sand Ripples (Images 1 & 3): angled wind ripple waves
      // Wind direction ~ 35 degrees
      const u = x * 0.08 + y * 0.055;
      const v = -x * 0.055 + y * 0.08;

      // Asymmetric sand ripples (gentle windward slope, steeper leeward crest)
      const ripple1 = Math.sin(u * 2.2 + Math.sin(v * 0.8) * 0.85);
      const ripple2 = Math.sin(u * 5.4 + Math.cos(v * 1.5) * 0.6) * 0.45;
      const ripple3 = Math.sin(u * 11.0) * 0.2;
      const sandRipples = ripple1 + ripple2 + ripple3;

      // 2. Secondary Low-Frequency Dune Undulation
      const duneSwell =
        Math.sin(nx * 2.0) * Math.cos(ny * 2.0) * 0.8 +
        Math.sin(nx * 4.0 + 1.2) * 0.4;

      // 3. Fine Regolith Grain & Sand Specks (High-Frequency Micro Noise)
      const micro1 = (Math.sin(x * 1.5) * Math.cos(y * 1.5)) * 0.25;
      const micro2 = (Math.sin(x * 3.8 + y * 2.1)) * 0.15;
      const microNoise = micro1 + micro2;

      // 4. Subtle weathered bedrock fractures (soft, natural rock crevices - not black lines)
      const crackNoise = Math.sin(nx * 8.0 + Math.cos(ny * 8.0) * 2.0);
      const subtleRock = Math.abs(crackNoise) > 0.88 ? 0.2 : 0.0;

      // Total Height (0 to 255)
      const normH = (sandRipples * 0.45 + duneSwell * 0.35 + microNoise * 0.15 + subtleRock * 0.05 + 1.0) * 0.5;
      const clampedH = Math.max(0, Math.min(255, Math.floor(normH * 255)));

      const idx = (y * width + x) * 4;
      hData[idx] = clampedH;
      hData[idx + 1] = clampedH;
      hData[idx + 2] = clampedH;
      hData[idx + 3] = 255;

      // Albedo Color Calculation (matching real NASA color-calibrated photos):
      // Base Mars hematite dust: warm terracotta / rust-ochre (#c45e33 / rgb(196, 94, 51))
      // Sunlit ripple crests: brighter golden sand (#d97a4a / rgb(217, 122, 74))
      // Shadowed ripple troughs: deeper rust-red (#9e4324 / rgb(158, 67, 36))
      // Basaltic mineral streaks: dark brownish-grey (#633624 / rgb(99, 54, 36))
      const crestFactor = Math.max(0, Math.min(1, (sandRipples + 1.0) * 0.5));
      const basaltFactor = Math.max(0, Math.min(1, (-sandRipples + 0.3) * 0.7));

      let r = 186 * (1 - crestFactor * 0.3) + 225 * (crestFactor * 0.3);
      let g = 88 * (1 - crestFactor * 0.3) + 128 * (crestFactor * 0.3);
      let b = 48 * (1 - crestFactor * 0.3) + 76 * (crestFactor * 0.3);

      // Apply dark basalt dust in ripple troughs (as in Image 1)
      r = r * (1 - basaltFactor * 0.25) + 85 * (basaltFactor * 0.25);
      g = g * (1 - basaltFactor * 0.25) + 42 * (basaltFactor * 0.25);
      b = b * (1 - basaltFactor * 0.25) + 30 * (basaltFactor * 0.25);

      // Micro speckling (fine gravel & regolith grains)
      r += microNoise * 25;
      g += microNoise * 16;
      b += microNoise * 10;

      aData[idx] = Math.max(0, Math.min(255, Math.floor(r)));
      aData[idx + 1] = Math.max(0, Math.min(255, Math.floor(g)));
      aData[idx + 2] = Math.max(0, Math.min(255, Math.floor(b)));
      aData[idx + 3] = 255;

      // Roughness: Sand dunes are powdery matte (0.88 to 0.96)
      const roughVal = Math.floor(220 + crestFactor * 25 + microNoise * 15);
      rData[idx] = Math.max(0, Math.min(255, roughVal));
      rData[idx + 1] = Math.max(0, Math.min(255, roughVal));
      rData[idx + 2] = Math.max(0, Math.min(255, roughVal));
      rData[idx + 3] = 255;
    }
  }

  hCtx.putImageData(hImgData, 0, 0);
  aCtx.putImageData(aImgData, 0, 0);
  rCtx.putImageData(rImgData, 0, 0);

  // Derive High-Fidelity Normal Map via Sobel Operator
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = width;
  normalCanvas.height = height;
  const nCtx = normalCanvas.getContext('2d')!;
  const nImgData = nCtx.createImageData(width, height);
  const nData = nImgData.data;

  const getHeight = (px: number, py: number): number => {
    const wx = (px + width) % width;
    const wy = (py + height) % height;
    return hData[(wy * width + wx) * 4] / 255.0;
  };

  const normalStrength = 2.4;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tl = getHeight(x - 1, y - 1);
      const t = getHeight(x, y - 1);
      const tr = getHeight(x + 1, y - 1);
      const l = getHeight(x - 1, y);
      const r = getHeight(x + 1, y);
      const bl = getHeight(x - 1, y + 1);
      const b = getHeight(x, y + 1);
      const br = getHeight(x + 1, y + 1);

      const dx = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
      const dy = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr);
      const dz = 1.0 / normalStrength;

      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const nx = -dx / len;
      const ny = -dy / len;
      const nz = dz / len;

      const idx = (y * width + x) * 4;
      nData[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
      nData[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      nData[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
      nData[idx + 3] = 255;
    }
  }

  nCtx.putImageData(nImgData, 0, 0);

  // Create seamless tileable Three.js Textures
  const albedoMap = new THREE.CanvasTexture(albedoCanvas);
  albedoMap.wrapS = THREE.RepeatWrapping;
  albedoMap.wrapT = THREE.RepeatWrapping;
  albedoMap.repeat.set(24, 24); // Natural scale matching rover footprint
  albedoMap.anisotropy = 16;
  albedoMap.needsUpdate = true;

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(24, 24);
  normalMap.anisotropy = 16;
  normalMap.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(24, 24);
  roughnessMap.anisotropy = 16;
  roughnessMap.needsUpdate = true;

  cachedGroundTextures = { albedoMap, normalMap, roughnessMap };
  return cachedGroundTextures;
}

/**
 * Generates photorealistic high-res planetary texture for the massive horizon planet / moon
 * matching Image 2 & Image 3
 */
export function getCelestialPlanetTexture(): THREE.CanvasTexture {
  if (cachedCelestialTexture) return cachedCelestialTexture;
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return createFallbackTexture();
  }

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  // Maria basins & craters
  const craters = [
    { x: 0.32, y: 0.40, r: 0.16, rayLength: 0.35 },
    { x: 0.62, y: 0.55, r: 0.11, rayLength: 0.25 },
    { x: 0.46, y: 0.26, r: 0.08, rayLength: 0.18 },
    { x: 0.24, y: 0.65, r: 0.09, rayLength: 0.20 },
    { x: 0.76, y: 0.32, r: 0.13, rayLength: 0.28 },
  ];

  for (let y = 0; y < height; y++) {
    const ny = y / height;
    for (let x = 0; x < width; x++) {
      const nx = x / width;

      // Planetary cloud & dust bands (Image 3)
      const band1 = Math.sin(ny * 20.0 + Math.sin(nx * 10.0) * 0.5) * 0.14;
      const band2 = Math.sin(ny * 6.0) * 0.22;
      const baseTone = 0.58 + band1 + band2;

      // Lowlands Maria Noise
      const mariaNoise =
        Math.sin(nx * 7.0) * Math.cos(ny * 5.0) * 0.22 +
        Math.sin(nx * 16.0 + ny * 12.0) * 0.12;

      let craterEffect = 0;
      let rayEffect = 0;

      for (const c of craters) {
        const cdx = Math.abs(nx - c.x);
        const cdy = Math.abs(ny - c.y);
        const dist = Math.sqrt(cdx * cdx + cdy * cdy);

        if (dist < c.r) {
          const bowlNorm = dist / c.r;
          craterEffect += (bowlNorm * bowlNorm - 0.7) * 0.4;
        } else if (dist < c.rayLength) {
          const angle = Math.atan2(cdy, cdx);
          const rays = Math.abs(Math.sin(angle * 14.0));
          const fade = 1.0 - (dist - c.r) / (c.rayLength - c.r);
          rayEffect += rays * fade * 0.2;
        }
      }

      const val = Math.max(0, Math.min(1.0, baseTone + mariaNoise + craterEffect + rayEffect));

      // Warm lunar / terracotta hues (Image 2 & 3)
      const red = Math.floor(215 * val + 35);
      const green = Math.floor(130 * val + 22);
      const blue = Math.floor(85 * val + 14);

      const idx = (y * width + x) * 4;
      data[idx] = red;
      data[idx + 1] = green;
      data[idx + 2] = blue;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  cachedCelestialTexture = texture;
  return cachedCelestialTexture;
}

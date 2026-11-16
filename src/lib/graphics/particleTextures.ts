import * as THREE from 'three';

let cachedDustTexture: THREE.CanvasTexture | null = null;
let cachedStarTexture: THREE.CanvasTexture | null = null;
let cachedSparkTexture: THREE.CanvasTexture | null = null;

/**
 * Creates a soft-edged, photorealistic circular particle texture for Mars atmospheric dust motes.
 * Uses a multi-stop Gaussian-like radial gradient to completely eliminate square/cubic billboard artifacts.
 */
export function getDustParticleTexture(): THREE.CanvasTexture {
  if (cachedDustTexture) return cachedDustTexture;
  if (typeof document === 'undefined') {
    return new THREE.Texture() as THREE.CanvasTexture;
  }

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture() as THREE.CanvasTexture;

  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);

  // Warm Martian ferric oxide & silicate dust grain with soft feathered atmospheric rim
  gradient.addColorStop(0.0, 'rgba(255, 235, 210, 1.0)'); // luminous core
  gradient.addColorStop(0.2, 'rgba(235, 145, 80, 0.92)');  // warm hematite amber
  gradient.addColorStop(0.45, 'rgba(200, 95, 45, 0.65)');  // terracotta dust body
  gradient.addColorStop(0.72, 'rgba(150, 60, 25, 0.28)');  // diffuse outer haze
  gradient.addColorStop(0.92, 'rgba(110, 40, 15, 0.08)');  // soft edge
  gradient.addColorStop(1.0, 'rgba(80, 25, 10, 0.0)');     // completely transparent border

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  cachedDustTexture = texture;
  return texture;
}

/**
 * Creates a soft, earthy volumetric dust puff texture for dust storm vortices and devils.
 * Has no bright white core, using pure ferric terracotta and iron oxide pigments with
 * an ultra-smooth Gaussian edge falloff to ensure volumetric smoke-like blending.
 */
let cachedVolumetricDustTexture: THREE.CanvasTexture | null = null;
export function getVolumetricDustPuffTexture(): THREE.CanvasTexture {
  if (cachedVolumetricDustTexture) return cachedVolumetricDustTexture;
  if (typeof document === 'undefined') {
    return new THREE.Texture() as THREE.CanvasTexture;
  }

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture() as THREE.CanvasTexture;

  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);

  // Pure high-fidelity Gaussian density distribution for realistic billowing dust plumes
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 0.88)'); // Dense core
  gradient.addColorStop(0.18, 'rgba(250, 242, 236, 0.72)'); // Mid billowing cloud
  gradient.addColorStop(0.48, 'rgba(242, 228, 218, 0.44)'); // Expanding plume
  gradient.addColorStop(0.75, 'rgba(230, 212, 198, 0.16)'); // Feathered boundary
  gradient.addColorStop(1.0, 'rgba(200, 180, 160, 0.0)'); // Seamless transparent edge

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  cachedVolumetricDustTexture = texture;
  return texture;
}

/**
 * Creates a pinpoint circular star texture with soft corona for the Martian celestial sky dome.
 */
export function getStarParticleTexture(): THREE.CanvasTexture {
  if (cachedStarTexture) return cachedStarTexture;
  if (typeof document === 'undefined') {
    return new THREE.Texture() as THREE.CanvasTexture;
  }

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture() as THREE.CanvasTexture;

  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);

  // Intense star nucleus with soft celestial diffraction falloff
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.18, 'rgba(240, 245, 255, 0.88)');
  gradient.addColorStop(0.42, 'rgba(200, 220, 255, 0.38)');
  gradient.addColorStop(0.75, 'rgba(160, 190, 255, 0.1)');
  gradient.addColorStop(1.0, 'rgba(120, 160, 255, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  cachedStarTexture = texture;
  return texture;
}

/**
 * Creates a high-energy plasma spark texture for the SuperCam LIBS laser ablation sparks.
 */
export function getSparkParticleTexture(): THREE.CanvasTexture {
  if (cachedSparkTexture) return cachedSparkTexture;
  if (typeof document === 'undefined') {
    return new THREE.Texture() as THREE.CanvasTexture;
  }

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture() as THREE.CanvasTexture;

  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);

  // Cyan-electric laser ablation plasma spark
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.25, 'rgba(56, 189, 248, 0.95)');
  gradient.addColorStop(0.55, 'rgba(14, 165, 233, 0.45)');
  gradient.addColorStop(1.0, 'rgba(2, 132, 199, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  cachedSparkTexture = texture;
  return texture;
}

/**
 * Creates an ultra-soft billowy steam condensation particle texture for the launchpad water deluge.
 */
let cachedSteamTexture: THREE.CanvasTexture | null = null;
export function getSteamParticleTexture(): THREE.CanvasTexture {
  if (cachedSteamTexture) return cachedSteamTexture;
  if (typeof document === 'undefined') {
    return new THREE.Texture() as THREE.CanvasTexture;
  }
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture() as THREE.CanvasTexture;

  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 0.85)');
  gradient.addColorStop(0.25, 'rgba(241, 245, 249, 0.7)');
  gradient.addColorStop(0.55, 'rgba(226, 232, 240, 0.35)');
  gradient.addColorStop(0.82, 'rgba(203, 213, 225, 0.1)');
  gradient.addColorStop(1.0, 'rgba(148, 163, 184, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  cachedSteamTexture = texture;
  return texture;
}

/**
 * Creates an incandescent rocket flame and re-entry plasma fire particle texture.
 */
let cachedFireTexture: THREE.CanvasTexture | null = null;
export function getFireParticleTexture(): THREE.CanvasTexture {
  if (cachedFireTexture) return cachedFireTexture;
  if (typeof document === 'undefined') {
    return new THREE.Texture() as THREE.CanvasTexture;
  }
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture() as THREE.CanvasTexture;

  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)'); // White hot
  gradient.addColorStop(0.2, 'rgba(254, 240, 138, 0.95)'); // Yellow hot
  gradient.addColorStop(0.45, 'rgba(249, 115, 22, 0.75)'); // Orange flame
  gradient.addColorStop(0.75, 'rgba(220, 38, 38, 0.25)'); // Red plasma fringe
  gradient.addColorStop(1.0, 'rgba(185, 28, 28, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  cachedFireTexture = texture;
  return texture;
}

/**
 * Creates a dense, billowing, photorealistic rocket exhaust smoke texture.
 * Catches directional and ambient light, with turbulent feathered edges.
 */
let cachedSmokeTexture: THREE.CanvasTexture | null = null;
export function getExhaustSmokeParticleTexture(): THREE.CanvasTexture {
  if (cachedSmokeTexture) return cachedSmokeTexture;
  if (typeof document === 'undefined') {
    return new THREE.Texture() as THREE.CanvasTexture;
  }
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture() as THREE.CanvasTexture;

  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  // Dense billowing white/silver smoke with subtle warm ambient core
  gradient.addColorStop(0.0, 'rgba(255, 250, 245, 0.92)');
  gradient.addColorStop(0.28, 'rgba(240, 235, 230, 0.78)');
  gradient.addColorStop(0.55, 'rgba(215, 210, 205, 0.45)');
  gradient.addColorStop(0.80, 'rgba(180, 175, 170, 0.15)');
  gradient.addColorStop(1.0, 'rgba(140, 135, 130, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  cachedSmokeTexture = texture;
  return texture;
}

/**
 * Creates an ultra-bright, incandescent SRB solid motor flame core texture with Mach shock diamonds.
 */
let cachedSRBCoreTexture: THREE.CanvasTexture | null = null;
export function getSRBFlameCoreTexture(): THREE.CanvasTexture {
  if (cachedSRBCoreTexture) return cachedSRBCoreTexture;
  if (typeof document === 'undefined') {
    return new THREE.Texture() as THREE.CanvasTexture;
  }
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture() as THREE.CanvasTexture;

  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');     // Pure white blinding nucleus
  gradient.addColorStop(0.15, 'rgba(255, 250, 200, 1.0)');    // 6000K incandescent white-gold
  gradient.addColorStop(0.35, 'rgba(255, 200, 80, 0.95)');    // Blazing SRB yellow
  gradient.addColorStop(0.60, 'rgba(255, 120, 20, 0.75)');    // Aluminum oxide orange flare
  gradient.addColorStop(0.85, 'rgba(220, 50, 10, 0.25)');     // Turbulent boundary
  gradient.addColorStop(1.0, 'rgba(180, 30, 10, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  cachedSRBCoreTexture = texture;
  return texture;
}

/**
 * Creates a wispy cryogenic boiloff vapor texture for launchpad umbilical venting.
 */
let cachedVaporTexture: THREE.CanvasTexture | null = null;
export function getBoiloffVaporTexture(): THREE.CanvasTexture {
  if (cachedVaporTexture) return cachedVaporTexture;
  if (typeof document === 'undefined') {
    return new THREE.Texture() as THREE.CanvasTexture;
  }
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture() as THREE.CanvasTexture;

  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 0.55)');
  gradient.addColorStop(0.35, 'rgba(240, 245, 255, 0.35)');
  gradient.addColorStop(0.7, 'rgba(220, 230, 250, 0.12)');
  gradient.addColorStop(1.0, 'rgba(200, 215, 245, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  cachedVaporTexture = texture;
  return texture;
}

/**
 * Creates a continuous vertical scrolling striation texture for the towering dust devil funnel column.
 * Seamless horizontally for cylinder wrapping.
 */
let cachedVortexColumnTexture: THREE.CanvasTexture | null = null;
export function getVortexColumnTexture(): THREE.CanvasTexture {
  if (cachedVortexColumnTexture) return cachedVortexColumnTexture;
  if (typeof document === 'undefined') {
    return new THREE.Texture() as THREE.CanvasTexture;
  }

  const width = 256;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture() as THREE.CanvasTexture;

  // Transparent base
  ctx.clearRect(0, 0, width, height);

  // Vertical bands of swirling ochre and ferric sand
  for (let x = 0; x < width; x += 3) {
    const bandPhase = Math.sin((x / width) * Math.PI * 8.0) * 0.5 + 0.5;
    const bandPhase2 = Math.cos((x / width) * Math.PI * 14.0) * 0.5 + 0.5;
    const alpha = (0.2 + bandPhase * 0.45 + bandPhase2 * 0.25);

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    // Base is very dense (debris foot)
    grad.addColorStop(0.0, `rgba(184, 80, 37, ${alpha * 0.95})`);
    grad.addColorStop(0.15, `rgba(217, 122, 56, ${alpha * 0.85})`);
    grad.addColorStop(0.5, `rgba(194, 94, 46, ${alpha * 0.65})`);
    grad.addColorStop(0.85, `rgba(158, 72, 43, ${alpha * 0.45})`);
    grad.addColorStop(1.0, `rgba(120, 50, 25, 0.0)`); // fades out at top crown

    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, 3, height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  cachedVortexColumnTexture = texture;
  return texture;
}

/**
 * Custom GLSL modifier to attach to any Three.js PointsMaterial via onBeforeCompile.
 * Discards all pixel coordinates outside of the circle radius r = 0.5 (gl_PointCoord)
 * and applies smooth anti-aliased edge falloff.
 * This guarantees 100% spherical/circular particle rendering on ALL hardware with ZERO cubic corners!
 */
export function applyCircularPointShader(material: THREE.PointsMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = `
      // Anti-aliased circular particle alpha discard
      ${shader.fragmentShader}
    `.replace(
      'void main() {',
      `void main() {
        vec2 pCoord = gl_PointCoord - vec2(0.5);
        float pDist = length(pCoord);
        if (pDist > 0.5) discard;
        float pAlpha = smoothstep(0.5, 0.18, pDist);
      `
    ).replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>
        gl_FragColor.a *= pAlpha;
      `
    );
  };
}

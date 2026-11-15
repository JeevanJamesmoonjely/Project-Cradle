import * as THREE from 'three';

let cachedPerseveranceDecal: THREE.CanvasTexture | null = null;
let cachedMars2020Decal: THREE.CanvasTexture | null = null;

/**
 * Creates the authentic NASA "PERSEVERANCE" lettering decal for the rover's robotic forearm.
 */
export function getPerseveranceArmDecal(): THREE.CanvasTexture {
  if (cachedPerseveranceDecal) return cachedPerseveranceDecal;
  if (typeof document === 'undefined') {
    return new THREE.Texture() as THREE.CanvasTexture;
  }

  const width = 512;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture() as THREE.CanvasTexture;

  // Thermal white composite panel background
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, width, height);

  // Aerospace orange trim borders (Kapton thermal tape insulation)
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(0, 0, 16, height);
  ctx.fillRect(width - 16, 0, 16, height);
  ctx.fillRect(0, 0, width, 10);
  ctx.fillRect(0, height - 10, width, 10);

  // Black carbon fiber accent line
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(16, 10, width - 32, 4);

  // Bold NASA "PERSEVERANCE" typography
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 44px "Arial Black", "Impact", "Segoe UI Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '12px';
  ctx.fillText('PERSEVERANCE', width / 2 + 6, height / 2 + 4);

  // NASA Flight Hardware Serial Stamp
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 13px monospace';
  ctx.letterSpacing = '2px';
  ctx.fillText('NASA / JPL-CALTECH • MARS 2020', width / 2, height - 22);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  cachedPerseveranceDecal = texture;
  return texture;
}

/**
 * Creates the authentic "MARS 2020" chevron insignia decal for the robotic upper arm.
 */
export function getMars2020ArmDecal(): THREE.CanvasTexture {
  if (cachedMars2020Decal) return cachedMars2020Decal;
  if (typeof document === 'undefined') {
    return new THREE.Texture() as THREE.CanvasTexture;
  }

  const width = 256;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture() as THREE.CanvasTexture;

  // Dark aerospace carbon background with orange Kapton boot
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, width, height);

  // Kapton Gold border
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(0, 0, width, 12);
  ctx.fillRect(0, height - 12, width, 12);

  // Red NASA Chevron / Vector Logo
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(35, height / 2 + 18);
  ctx.lineTo(55, height / 2 - 20);
  ctx.lineTo(75, height / 2 + 18);
  ctx.lineTo(55, height / 2 + 6);
  ctx.closePath();
  ctx.fill();

  // White "MARS 2020" Text
  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 28px "Arial Black", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('MARS 2020', 88, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  cachedMars2020Decal = texture;
  return texture;
}

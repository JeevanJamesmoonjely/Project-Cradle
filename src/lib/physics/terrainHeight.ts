// Analytical procedural heightmap for Project Cradle's Martian terrain
export function getTerrainHeight(x: number, z: number): number {
  // Low-frequency rolling Jezero crater floor
  const baseRoll = Math.sin(x * 0.015) * Math.cos(z * 0.015) * 2.2;

  // Biome 1: Ancient Riverbed Delta (x > 10, z > 10) - terraced steps
  let deltaElevation = 0;
  if (x > 5 && z > 0) {
    const deltaFactor = Math.min(1.0, (x - 5) * 0.03 + z * 0.02);
    const terrace = Math.floor(Math.sin(x * 0.08 + z * 0.06) * 3) * 0.6;
    deltaElevation = deltaFactor * (1.8 + terrace);
  }

  // Biome 2: Basaltic Dune Fields (x < -15, z > 0) - high-frequency aeolian ripples
  let duneElevation = 0;
  if (x < -10 && z > -10) {
    const duneFactor = Math.min(1.0, Math.abs(x + 10) * 0.035);
    const ripples = Math.sin(x * 0.22 + z * 0.12) * 0.85 + Math.sin(z * 0.18) * 0.45;
    duneElevation = duneFactor * ripples;
  }

  // Biome 3: Belva Impact Crater Rim - smooth, continuous Gaussian depression
  let craterElevation = 0;
  const craterCenterX = 0;
  const craterCenterZ = -55;
  const distFromCrater = Math.sqrt((x - craterCenterX) ** 2 + (z - craterCenterZ) ** 2);
  const craterRadius = 42;
  if (distFromCrater < craterRadius * 2.2) {
    const u = distFromCrater / craterRadius;
    // Continuous smooth bowl (-3.2m center) and subtle raised rim (+0.8m)
    craterElevation = -3.2 * Math.exp(-u * u * 2.0) + 1.1 * u * u * Math.exp(-u * u * 1.5);
  }

  // Biome 4: Exposed Escarpment (x > 35) - steep cliff face rising to high plateau
  let escarpmentElevation = 0;
  if (x > 28) {
    const cliffFactor = Math.min(1.0, (x - 28) * 0.05);
    const cliffBands = Math.sin(z * 0.05) * 1.5;
    escarpmentElevation = cliffFactor * (6.5 + cliffBands);
  }

  // Biome 5: Jezero Crater Rim & Continental Martian Vista (R > 200m to 4200m)
  let rimElevation = 0;
  const distFromCenter = Math.sqrt(x * x + z * z);
  if (distFromCenter > 200) {
    const theta = Math.atan2(z, x);
    // Multi-harmonic crater rim peaks and saddles
    const rimPeaks =
      Math.sin(theta * 6) * 18 +
      Math.cos(theta * 11) * 12 +
      Math.sin(theta * 19 + 1.2) * 6 +
      Math.cos(theta * 37) * 4 +
      54;

    if (distFromCenter <= 750) {
      // Smooth continuous rise from crater floor to mountain peaks
      const t = (distFromCenter - 200) / (750 - 200);
      rimElevation = (t ** 1.6) * rimPeaks;
    } else {
      // Outer rim slope down to Martian continental plateaus (750m to 4200m)
      const t = Math.min(1.0, (distFromCenter - 750) / (4200 - 750));
      const rollingHills =
        Math.sin(x * 0.0035 + 1.2) * Math.cos(z * 0.0035) * 35 +
        Math.sin(theta * 8) * 18;
      const marsCurvature = -(distFromCenter * distFromCenter) / (2 * 3389000);
      rimElevation = (1.0 - t * 0.75) * rimPeaks + (1.0 - t * 0.5) * rollingHills + marsCurvature;
    }
  }

  return baseRoll + deltaElevation + duneElevation + craterElevation + escarpmentElevation + rimElevation;
}

// Compute surface normal analytically using central differences
export function getTerrainNormal(x: number, z: number): [number, number, number] {
  const eps = 0.5;
  const hL = getTerrainHeight(x - eps, z);
  const hR = getTerrainHeight(x + eps, z);
  const hD = getTerrainHeight(x, z - eps);
  const hU = getTerrainHeight(x, z + eps);

  // Cross product of tangent vectors
  const nx = (hL - hR) / (2 * eps);
  const ny = 1.0;
  const nz = (hD - hU) / (2 * eps);

  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  return [nx / len, ny / len, nz / len];
}

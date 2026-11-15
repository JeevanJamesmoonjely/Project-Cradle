export type BiomeType = 'Delta' | 'Dunes' | 'Crater' | 'Escarpment';

export type ScienceCategory =
  | 'Astrobiology'
  | 'Volcanology'
  | 'Hydrology'
  | 'Atmospheric'
  | 'Mineralogy';

export interface MineralComponent {
  mineral: string;
  percentage: number;
  formula: string;
  color: string;
}

export interface SpectrogramPoint {
  wavelength: number; // in nanometers or Raman shift cm^-1
  intensity: number; // 0 to 100
  label?: string;
}

export interface GeologicalPOI {
  id: string;
  name: string;
  code: string;
  category: ScienceCategory;
  biome: BiomeType;
  position: [number, number, number];
  scale?: [number, number, number];
  color: string;
  shape: 'slab' | 'monolith' | 'boulder_cluster' | 'mesa' | 'crater_rock' | 'vent' | 'nodules';
  geologicalEra: string;
  estimatedAge: string;
  composition: MineralComponent[];
  astrobiologyRelevance: string;
  historicalContext: string;
  nasaMissionCitation: string;
  sensorRequirement: string;
  sensorAcronym: string;
  sciencePoints: number;
  spectrogramData: SpectrogramPoint[];
  biosignaturePotential: 'Low' | 'Moderate' | 'High' | 'Biosignature Candidate';
  sampleCollected: boolean;
  discovered: boolean;
  downlinked: boolean;
  discoveredAtSol?: number;
}

export interface MissionObjective {
  id: string;
  title: string;
  description: string;
  category: 'Primary' | 'Secondary' | 'Engineering';
  targetCount: number;
  currentCount: number;
  completed: boolean;
  rewardPoints: number;
  iconName: string;
}

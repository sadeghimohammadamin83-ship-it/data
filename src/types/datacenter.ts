export type Language = 'fa' | 'en';

export type ViewMode = 'exterior' | 'interior' | 'racks';

export type CameraPreset = 'perspective' | 'front' | 'side' | 'top' | 'hero' | 'cutaway' | 'racks';

export type LightingPreset = 'studio' | 'daylight' | 'technical';

export type FacadeMaterialType = 'aluminum' | 'precast' | 'steel' | 'corten';

export interface RackInfo {
  rackId: string;
  rowNumber: number;
  rackNumber: number;
  dimensions: string;
  uHeight: string;
  zone: string;
}

export interface ProjectState {
  lang: Language;
  viewMode: ViewMode;
  cameraPreset: CameraPreset;
  lightingPreset: LightingPreset;

  // Building envelope
  length: number; // 24 - 84 m
  width: number; // 18 - 60 m
  height: number; // 6 - 22 m
  floors: number; // 1 - 3
  facadeMaterial: FacadeMaterialType;
  facadeColor: string;
  glazingRatio: number; // 5 - 55%
  showAnnexVolumes: boolean;

  // Interior & Cutaway
  showRoof: boolean;
  showFrontFacade: boolean;
  showInteriorWalls: boolean;
  showCableTrays: boolean;

  // Server rack layout
  rackRows: number; // 1 - 10
  racksPerRow: number; // 2 - 28
  aisleWidth: number; // 1.2 - 4.0 m
  rackHeight: number; // 1.8 - 2.4 m
  rackWidth: number; // 0.6 - 0.9 m
  rackDepth: number; // 1.0 - 1.4 m
  rackGap: number; // 0.02 - 0.50 m
  showRackLabels: boolean;

  // Studio guides
  showGrid: boolean;
  showDimensions: boolean;
  showTechOverlay: boolean;

  // Selection
  selectedRackId: string | null;
  selectedRackData: RackInfo | null;
}

export interface DataCenterMetrics {
  footprintArea: number; // m²
  hallArea: number; // m²
  hallLength: number;
  hallWidth: number;
  corridorWidth: number;
  hallCenterX: number;
  effectiveRackRows: number;
  effectiveRacksPerRow: number;
  maxRackRows: number;
  maxRacksPerRow: number;
  totalRacks: number;
  floorUtilizationPercent: number;
  isClamped: boolean;
}

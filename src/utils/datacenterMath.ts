import type { ProjectState, DataCenterMetrics } from '../types/datacenter';

export const DEFAULT_PROJECT_STATE: ProjectState = {
  lang: 'fa',
  viewMode: 'exterior',
  cameraPreset: 'perspective',
  lightingPreset: 'studio',

  length: 48,
  width: 32,
  height: 9.5,
  floors: 2,
  facadeMaterial: 'aluminum',
  facadeColor: '#2a323d',
  glazingRatio: 25,
  showAnnexVolumes: true,

  showRoof: true,
  showFrontFacade: true,
  showInteriorWalls: true,
  showCableTrays: true,

  rackRows: 4,
  racksPerRow: 12,
  aisleWidth: 2.2,
  rackHeight: 2.1,
  rackWidth: 0.6,
  rackDepth: 1.1,
  rackGap: 0.06,
  showRackLabels: true,

  showGrid: true,
  showDimensions: true,
  showTechOverlay: false,

  selectedRackId: null,
  selectedRackData: null,
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function computeDataCenterMetrics(state: {
  length: number;
  width: number;
  rackRows: number;
  racksPerRow: number;
  aisleWidth: number;
  rackWidth: number;
  rackDepth: number;
  rackGap: number;
}): DataCenterMetrics {
  const L = clamp(Number(state.length) || 48, 24, 84);
  const W = clamp(Number(state.width) || 32, 18, 60);

  // Structural perimeter margins and dedicated mechanical/electrical service corridor
  const corridorWidth = Math.min(6.0, L * 0.18);
  const hallMarginZ = 3.2; // North and South perimeter clearances
  const hallMarginX = 2.8; // East perimeter clearance

  const hallLength = Math.max(8, L - corridorWidth - hallMarginX * 2);
  const hallWidth = Math.max(8, W - hallMarginZ * 2);
  const hallCenterX = corridorWidth * 0.5;

  const rW = clamp(Number(state.rackWidth) || 0.6, 0.6, 0.9);
  const rD = clamp(Number(state.rackDepth) || 1.1, 1.0, 1.4);
  const rGap = clamp(Number(state.rackGap) || 0.06, 0.02, 0.5);
  const aisleW = clamp(Number(state.aisleWidth) || 2.2, 1.2, 4.0);

  const requestedRows = clamp(Math.round(Number(state.rackRows) || 4), 1, 10);
  const requestedPerRow = clamp(Math.round(Number(state.racksPerRow) || 12), 2, 28);

  // Maximum racks per row that fit inside hallLength with 1.6m safe perimeter end clearance
  const maxRacksPerRow = Math.max(1, Math.floor((hallLength - 1.6 + rGap) / (rW + rGap)));

  // Pitch between rows includes rack depth plus hot/cold aisle
  const pitchZ = rD + aisleW;
  const maxRackRows = Math.max(1, Math.floor((hallWidth - 1.4 + aisleW) / pitchZ));

  const effectiveRacksPerRow = Math.min(requestedPerRow, maxRacksPerRow);
  const effectiveRackRows = Math.min(requestedRows, maxRackRows);
  const totalRacks = effectiveRackRows * effectiveRacksPerRow;

  const footprintArea = Math.round(L * W);
  const hallArea = Math.round(hallLength * hallWidth);

  // Total floor area occupied by racks and containment zone (~2.2x cabinet footprint)
  const racksFootprint = totalRacks * (rW * rD * 2.2);
  const floorUtilizationPercent = Math.min(95, Math.round((racksFootprint / Math.max(1, hallArea)) * 100));

  const isClamped = (effectiveRacksPerRow < requestedPerRow) || (effectiveRackRows < requestedRows);

  return {
    footprintArea,
    hallArea,
    hallLength: Number(hallLength.toFixed(1)),
    hallWidth: Number(hallWidth.toFixed(1)),
    corridorWidth: Number(corridorWidth.toFixed(1)),
    hallCenterX: Number(hallCenterX.toFixed(2)),
    effectiveRackRows,
    effectiveRacksPerRow,
    maxRackRows,
    maxRacksPerRow,
    totalRacks,
    floorUtilizationPercent,
    isClamped,
  };
}

import React from 'react';
import type { CameraPreset, LightingPreset, Language } from '../types/datacenter';
import { TRANSLATIONS } from '../i18n/translations';
import {
  Compass,
  Sun,
  Grid,
  Ruler,
  Maximize2,
  Box,
} from 'lucide-react';

interface ViewportToolbarProps {
  lang: Language;
  cameraPreset: CameraPreset;
  lightingPreset: LightingPreset;
  showGrid: boolean;
  showDimensions: boolean;
  showTechOverlay: boolean;
  onCameraPresetChange: (preset: CameraPreset) => void;
  onLightingPresetChange: (preset: LightingPreset) => void;
  onToggleGrid: () => void;
  onToggleDimensions: () => void;
  onToggleTechOverlay: () => void;
}

export const ViewportToolbar: React.FC<ViewportToolbarProps> = ({
  lang,
  cameraPreset,
  lightingPreset,
  showGrid,
  showDimensions,
  showTechOverlay,
  onCameraPresetChange,
  onLightingPresetChange,
  onToggleGrid,
  onToggleDimensions,
  onToggleTechOverlay,
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <footer
      className="fixed bottom-3.5 left-1/2 -translate-x-1/2 z-18 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-2xl px-3 py-2 shadow-2xl flex items-center gap-2 max-w-[calc(100vw-24px)] overflow-x-auto"
      aria-label="Camera & Lighting Studio Toolbar"
    >
      {/* Camera Presets Group */}
      <div className="flex items-center gap-1 pe-2 border-inline-end border-slate-800">
        <span className="text-[11px] font-medium text-slate-400 me-1 hidden sm:inline flex items-center gap-1">
          <Compass className="w-3 h-3 text-sky-400" />
          {t.lblCameraPresets}
        </span>

        <button
          type="button"
          onClick={() => onCameraPresetChange('perspective')}
          className={`px-2.5 py-1 text-xs rounded-md transition-all whitespace-nowrap ${
            cameraPreset === 'perspective'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          {t.camThreeQuarter}
        </button>

        <button
          type="button"
          onClick={() => onCameraPresetChange('front')}
          className={`px-2.5 py-1 text-xs rounded-md transition-all whitespace-nowrap ${
            cameraPreset === 'front'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          {t.camFront}
        </button>

        <button
          type="button"
          onClick={() => onCameraPresetChange('side')}
          className={`px-2.5 py-1 text-xs rounded-md transition-all whitespace-nowrap ${
            cameraPreset === 'side'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          {t.camSide}
        </button>

        <button
          type="button"
          onClick={() => onCameraPresetChange('top')}
          className={`px-2.5 py-1 text-xs rounded-md transition-all whitespace-nowrap ${
            cameraPreset === 'top'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          {t.camTop}
        </button>

        <button
          type="button"
          onClick={() => onCameraPresetChange('hero')}
          className={`px-2.5 py-1 text-xs rounded-md transition-all whitespace-nowrap ${
            cameraPreset === 'hero'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          {t.camPresentation}
        </button>

        <button
          type="button"
          onClick={() => onCameraPresetChange('perspective')}
          title={t.camReset}
          className="p-1.5 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded-md transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Lighting Presets Group */}
      <div className="flex items-center gap-1 pe-2 border-inline-end border-slate-800">
        <span className="text-[11px] font-medium text-slate-400 me-1 hidden md:inline flex items-center gap-1">
          <Sun className="w-3 h-3 text-amber-400" />
          {t.lblLightingPreset}
        </span>

        <button
          type="button"
          onClick={() => onLightingPresetChange('studio')}
          className={`px-2.5 py-1 text-xs rounded-md transition-all whitespace-nowrap ${
            lightingPreset === 'studio'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          {t.lightStudio}
        </button>

        <button
          type="button"
          onClick={() => onLightingPresetChange('daylight')}
          className={`px-2.5 py-1 text-xs rounded-md transition-all whitespace-nowrap ${
            lightingPreset === 'daylight'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          {t.lightDay}
        </button>

        <button
          type="button"
          onClick={() => onLightingPresetChange('technical')}
          className={`px-2.5 py-1 text-xs rounded-md transition-all whitespace-nowrap ${
            lightingPreset === 'technical'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          {t.lightTech}
        </button>
      </div>

      {/* Overlay Toggles */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleGrid}
          title={t.lblShowGrid}
          className={`p-1.5 px-2 text-xs rounded-md flex items-center gap-1 transition-all ${
            showGrid
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.btnGridShort}</span>
        </button>

        <button
          type="button"
          onClick={onToggleDimensions}
          title={t.lblShowDimGuides}
          className={`p-1.5 px-2 text-xs rounded-md flex items-center gap-1 transition-all ${
            showDimensions
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Ruler className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.btnDimsShort}</span>
        </button>

        <button
          type="button"
          onClick={onToggleTechOverlay}
          title={t.lblShowTechWire}
          className={`p-1.5 px-2 text-xs rounded-md flex items-center gap-1 transition-all ${
            showTechOverlay
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.btnTechShort}</span>
        </button>
      </div>
    </footer>
  );
};

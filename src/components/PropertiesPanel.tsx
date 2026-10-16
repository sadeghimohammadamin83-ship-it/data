import React from 'react';
import type { ProjectState, FacadeMaterialType } from '../types/datacenter';
import { TRANSLATIONS } from '../i18n/translations';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';

interface PropertiesPanelProps {
  state: ProjectState;
  onChange: <K extends keyof ProjectState>(key: K, value: ProjectState[K]) => void;
  isOpenMobile: boolean;
  onToggleMobile: () => void;
}

const COLOR_SWATCHES = [
  { hex: '#2a323d', label: 'Graphite Steel' },
  { hex: '#475569', label: 'Anodized Slate' },
  { hex: '#78828c', label: 'Precast Concrete' },
  { hex: '#1e293b', label: 'Midnight Navy' },
  { hex: '#5c3a28', label: 'Corten Bronze' },
  { hex: '#181e28', label: 'Obsidian Black' },
];

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  state,
  onChange,
  isOpenMobile,
  onToggleMobile,
}) => {
  const t = TRANSLATIONS[state.lang];

  const getPanelTitle = () => {
    switch (state.viewMode) {
      case 'interior':
        return t.panelTitleInterior;
      case 'racks':
        return t.panelTitleRacks;
      case 'exterior':
      default:
        return t.panelTitleExterior;
    }
  };

  const getModeBadge = () => {
    switch (state.viewMode) {
      case 'interior':
        return t.modeInterior;
      case 'racks':
        return t.modeRacks;
      case 'exterior':
      default:
        return t.modeExterior;
    }
  };

  return (
    <aside
      className={`fixed top-18 bottom-20 inset-inline-end-4 w-80 sm:w-92 z-18 bg-slate-950/90 backdrop-blur-md border border-slate-800/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
        isOpenMobile ? 'translate-y-0 opacity-100' : 'max-lg:translate-y-[110%] max-lg:opacity-0 max-lg:pointer-events-none'
      }`}
      aria-label="Parametric Properties Panel"
    >
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-semibold text-slate-100">{getPanelTitle()}</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-sky-950 border border-sky-500/30 text-sky-300">
            {getModeBadge()}
          </span>
          <button
            type="button"
            onClick={onToggleMobile}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-100"
            title={isOpenMobile ? t.collapseControls : t.expandControls}
          >
            {isOpenMobile ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 text-xs text-slate-200">
        {/* SECTION: BUILDING ENVELOPE (Exterior & Interior modes) */}
        {(state.viewMode === 'exterior' || state.viewMode === 'interior') && (
          <div className="flex flex-col gap-3 pb-4 border-b border-slate-800/70">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t.secBuildingDims}
            </span>

            {/* Length */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="length-input" className="text-slate-300">{t.lblLength}</label>
                <span className="text-slate-400 text-[11px]">
                  <span className="font-mono text-slate-200">{state.length}</span> {t.unitMeter}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_64px] gap-2 items-center">
                <input
                  type="range"
                  min="24"
                  max="84"
                  step="2"
                  value={state.length}
                  onChange={(e) => onChange('length', Number(e.target.value))}
                  className="accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <input
                  id="length-input"
                  type="number"
                  min="24"
                  max="84"
                  step="2"
                  value={state.length}
                  onChange={(e) => onChange('length', Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-white"
                />
              </div>
            </div>

            {/* Width */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="width-input" className="text-slate-300">{t.lblWidth}</label>
                <span className="text-slate-400 text-[11px]">
                  <span className="font-mono text-slate-200">{state.width}</span> {t.unitMeter}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_64px] gap-2 items-center">
                <input
                  type="range"
                  min="18"
                  max="60"
                  step="2"
                  value={state.width}
                  onChange={(e) => onChange('width', Number(e.target.value))}
                  className="accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <input
                  id="width-input"
                  type="number"
                  min="18"
                  max="60"
                  step="2"
                  value={state.width}
                  onChange={(e) => onChange('width', Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-white"
                />
              </div>
            </div>

            {/* Height */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="height-input" className="text-slate-300">{t.lblHeight}</label>
                <span className="text-slate-400 text-[11px]">
                  <span className="font-mono text-slate-200">{state.height}</span> {t.unitMeter}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_64px] gap-2 items-center">
                <input
                  type="range"
                  min="6"
                  max="22"
                  step="0.5"
                  value={state.height}
                  onChange={(e) => onChange('height', Number(e.target.value))}
                  className="accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <input
                  id="height-input"
                  type="number"
                  min="6"
                  max="22"
                  step="0.5"
                  value={state.height}
                  onChange={(e) => onChange('height', Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-white"
                />
              </div>
            </div>

            {/* Floors */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="floors-input" className="text-slate-300">{t.lblFloors}</label>
                <span className="font-mono text-slate-200 text-[11px]">{state.floors}</span>
              </div>
              <div className="grid grid-cols-[1fr_64px] gap-2 items-center">
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="1"
                  value={state.floors}
                  onChange={(e) => onChange('floors', Number(e.target.value))}
                  className="accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <input
                  id="floors-input"
                  type="number"
                  min="1"
                  max="3"
                  step="1"
                  value={state.floors}
                  onChange={(e) => onChange('floors', Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION: FACADE & FINISHES (Exterior mode only) */}
        {state.viewMode === 'exterior' && (
          <div className="flex flex-col gap-3 pb-4 border-b border-slate-800/70">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t.secFacadeMaterial}
            </span>

            {/* Material select */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="material-select" className="text-slate-300">{t.lblFacadeMat}</label>
              <select
                id="material-select"
                value={state.facadeMaterial}
                onChange={(e) => onChange('facadeMaterial', e.target.value as FacadeMaterialType)}
                className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 cursor-pointer"
              >
                <option value="aluminum">{t.matAluminum}</option>
                <option value="precast">{t.matPrecast}</option>
                <option value="steel">{t.matSteel}</option>
                <option value="corten">{t.matCorten}</option>
              </select>
            </div>

            {/* Facade Color */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">{t.lblFacadeColor}</span>
                <span className="font-mono text-slate-400 text-[11px]" dir="ltr">{state.facadeColor.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => onChange('facadeColor', swatch.hex)}
                    style={{ backgroundColor: swatch.hex }}
                    className={`w-7 h-7 rounded-md border-2 transition-transform hover:scale-110 ${
                      state.facadeColor.toLowerCase() === swatch.hex.toLowerCase()
                        ? 'border-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                        : 'border-slate-700'
                    }`}
                    title={swatch.label}
                  />
                ))}
                <input
                  type="color"
                  value={state.facadeColor}
                  onChange={(e) => onChange('facadeColor', e.target.value)}
                  className="w-8 h-7 p-0 bg-transparent rounded border border-slate-700 cursor-pointer"
                  title="Custom Color"
                />
              </div>
            </div>

            {/* Glazing / Louver % */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="glazing-input" className="text-slate-300">{t.lblGlazing}</label>
                <span className="text-slate-400 text-[11px]">
                  <span className="font-mono text-slate-200">{state.glazingRatio}</span> {t.unitPercent}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_64px] gap-2 items-center">
                <input
                  type="range"
                  min="5"
                  max="55"
                  step="5"
                  value={state.glazingRatio}
                  onChange={(e) => onChange('glazingRatio', Number(e.target.value))}
                  className="accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <input
                  id="glazing-input"
                  type="number"
                  min="5"
                  max="55"
                  step="5"
                  value={state.glazingRatio}
                  onChange={(e) => onChange('glazingRatio', Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-white"
                />
              </div>
            </div>

            {/* Annex volumes */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
              <span className="text-slate-300">{t.lblAnnexVolumes}</span>
              <input
                type="checkbox"
                checked={state.showAnnexVolumes}
                onChange={(e) => onChange('showAnnexVolumes', e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </label>
          </div>
        )}

        {/* SECTION: CUTAWAY & COMPONENT VISIBILITY */}
        <div className="flex flex-col gap-2.5 pb-4 border-b border-slate-800/70">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {t.secVisibility}
          </span>

          <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
            <span className="text-slate-300">{t.lblShowRoof}</span>
            <input
              type="checkbox"
              checked={state.showRoof}
              onChange={(e) => onChange('showRoof', e.target.checked)}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
            <span className="text-slate-300">{t.lblShowFrontFacade}</span>
            <input
              type="checkbox"
              checked={state.showFrontFacade}
              onChange={(e) => onChange('showFrontFacade', e.target.checked)}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
            <span className="text-slate-300">{t.lblShowInteriorWalls}</span>
            <input
              type="checkbox"
              checked={state.showInteriorWalls}
              onChange={(e) => onChange('showInteriorWalls', e.target.checked)}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
            <span className="text-slate-300">{t.lblShowOverheadTrays}</span>
            <input
              type="checkbox"
              checked={state.showCableTrays}
              onChange={(e) => onChange('showCableTrays', e.target.checked)}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </label>
        </div>

        {/* SECTION: SERVER RACK LAYOUT (Available in Racks & Interior modes) */}
        {(state.viewMode === 'racks' || state.viewMode === 'interior') && (
          <div className="flex flex-col gap-3 pb-4 border-b border-slate-800/70">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t.secRackLayout}
            </span>

            {/* Rack Rows */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="rows-input" className="text-slate-300">{t.lblRackRows}</label>
                <span className="font-mono text-slate-200 text-[11px]">{state.rackRows}</span>
              </div>
              <div className="grid grid-cols-[1fr_64px] gap-2 items-center">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={state.rackRows}
                  onChange={(e) => onChange('rackRows', Number(e.target.value))}
                  className="accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <input
                  id="rows-input"
                  type="number"
                  min="1"
                  max="10"
                  step="1"
                  value={state.rackRows}
                  onChange={(e) => onChange('rackRows', Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-white"
                />
              </div>
            </div>

            {/* Racks per Row */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="per-row-input" className="text-slate-300">{t.lblRacksPerRow}</label>
                <span className="font-mono text-slate-200 text-[11px]">{state.racksPerRow}</span>
              </div>
              <div className="grid grid-cols-[1fr_64px] gap-2 items-center">
                <input
                  type="range"
                  min="2"
                  max="28"
                  step="1"
                  value={state.racksPerRow}
                  onChange={(e) => onChange('racksPerRow', Number(e.target.value))}
                  className="accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <input
                  id="per-row-input"
                  type="number"
                  min="2"
                  max="28"
                  step="1"
                  value={state.racksPerRow}
                  onChange={(e) => onChange('racksPerRow', Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-white"
                />
              </div>
            </div>

            {/* Aisle Width */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="aisle-input" className="text-slate-300">{t.lblAisleWidth}</label>
                <span className="text-slate-400 text-[11px]">
                  <span className="font-mono text-slate-200">{state.aisleWidth}</span> {t.unitMeter}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_64px] gap-2 items-center">
                <input
                  type="range"
                  min="1.2"
                  max="4.0"
                  step="0.2"
                  value={state.aisleWidth}
                  onChange={(e) => onChange('aisleWidth', Number(e.target.value))}
                  className="accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <input
                  id="aisle-input"
                  type="number"
                  min="1.2"
                  max="4.0"
                  step="0.2"
                  value={state.aisleWidth}
                  onChange={(e) => onChange('aisleWidth', Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-white"
                />
              </div>
            </div>

            {/* Rack Height */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="rack-height-input" className="text-slate-300">{t.lblRackHeight}</label>
                <span className="text-slate-400 text-[11px]">
                  <span className="font-mono text-slate-200">{state.rackHeight}</span> {t.unitMeter}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_64px] gap-2 items-center">
                <input
                  type="range"
                  min="1.8"
                  max="2.4"
                  step="0.1"
                  value={state.rackHeight}
                  onChange={(e) => onChange('rackHeight', Number(e.target.value))}
                  className="accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <input
                  id="rack-height-input"
                  type="number"
                  min="1.8"
                  max="2.4"
                  step="0.1"
                  value={state.rackHeight}
                  onChange={(e) => onChange('rackHeight', Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-white"
                />
              </div>
            </div>

            {/* Rack Width */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="rack-width-input" className="text-slate-300">{t.lblRackWidth}</label>
                <span className="text-slate-400 text-[11px]">
                  <span className="font-mono text-slate-200">{state.rackWidth}</span> {t.unitMeter}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_64px] gap-2 items-center">
                <input
                  type="range"
                  min="0.6"
                  max="0.9"
                  step="0.05"
                  value={state.rackWidth}
                  onChange={(e) => onChange('rackWidth', Number(e.target.value))}
                  className="accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <input
                  id="rack-width-input"
                  type="number"
                  min="0.6"
                  max="0.9"
                  step="0.05"
                  value={state.rackWidth}
                  onChange={(e) => onChange('rackWidth', Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-white"
                />
              </div>
            </div>

            {/* Rack Depth */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="rack-depth-input" className="text-slate-300">{t.lblRackDepth}</label>
                <span className="text-slate-400 text-[11px]">
                  <span className="font-mono text-slate-200">{state.rackDepth}</span> {t.unitMeter}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_64px] gap-2 items-center">
                <input
                  type="range"
                  min="1.0"
                  max="1.4"
                  step="0.05"
                  value={state.rackDepth}
                  onChange={(e) => onChange('rackDepth', Number(e.target.value))}
                  className="accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <input
                  id="rack-depth-input"
                  type="number"
                  min="1.0"
                  max="1.4"
                  step="0.05"
                  value={state.rackDepth}
                  onChange={(e) => onChange('rackDepth', Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-white"
                />
              </div>
            </div>

            {/* Inter-rack gap */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="rack-gap-input" className="text-slate-300">{t.lblRackGap}</label>
                <span className="text-slate-400 text-[11px]">
                  <span className="font-mono text-slate-200">{state.rackGap}</span> {t.unitMeter}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_64px] gap-2 items-center">
                <input
                  type="range"
                  min="0.02"
                  max="0.5"
                  step="0.02"
                  value={state.rackGap}
                  onChange={(e) => onChange('rackGap', Number(e.target.value))}
                  className="accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <input
                  id="rack-gap-input"
                  type="number"
                  min="0.02"
                  max="0.5"
                  step="0.02"
                  value={state.rackGap}
                  onChange={(e) => onChange('rackGap', Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-white"
                />
              </div>
            </div>

            {/* Show Rack Labels */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
              <span className="text-slate-300">{t.lblShowRackLabels}</span>
              <input
                type="checkbox"
                checked={state.showRackLabels}
                onChange={(e) => onChange('showRackLabels', e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </label>
          </div>
        )}

        {/* SECTION: STUDIO GUIDES */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {t.secStudioGuides}
          </span>

          <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
            <span className="text-slate-300">{t.lblShowGrid}</span>
            <input
              type="checkbox"
              checked={state.showGrid}
              onChange={(e) => onChange('showGrid', e.target.checked)}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
            <span className="text-slate-300">{t.lblShowDimGuides}</span>
            <input
              type="checkbox"
              checked={state.showDimensions}
              onChange={(e) => onChange('showDimensions', e.target.checked)}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
            <span className="text-slate-300">{t.lblShowTechWire}</span>
            <input
              type="checkbox"
              checked={state.showTechOverlay}
              onChange={(e) => onChange('showTechOverlay', e.target.checked)}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>
    </aside>
  );
};

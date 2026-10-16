import React from 'react';
import type { Language, DataCenterMetrics, RackInfo } from '../types/datacenter';
import { TRANSLATIONS } from '../i18n/translations';
import { AlertTriangle, X, CheckCircle2, Cpu } from 'lucide-react';

interface HUDTelemetryProps {
  lang: Language;
  metrics: DataCenterMetrics;
  selectedRack: RackInfo | null;
  onClearSelectedRack: () => void;
}

export const HUDTelemetry: React.FC<HUDTelemetryProps> = ({
  lang,
  metrics,
  selectedRack,
  onClearSelectedRack,
}) => {
  const t = TRANSLATIONS[lang];
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(false);

  return (
    <aside className="fixed top-16 md:top-18 inset-inline-start-3 md:inset-inline-start-4 z-15 flex flex-col gap-2.5 w-[calc(100vw-24px)] max-w-72 sm:max-w-80 pointer-events-none">
      {/* Metrics Card */}
      <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-xl p-3 md:p-3.5 shadow-2xl pointer-events-auto">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/70">
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="text-xs font-semibold text-sky-400 tracking-wide uppercase flex items-center gap-1.5 hover:text-sky-300 transition-colors"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{t.hudTitle}</span>
            <span className="text-[10px] text-slate-500 font-normal">
              {isCollapsed ? '▾' : '▴'}
            </span>
          </button>
          <span
            className={`text-[11px] px-2 py-0.5 rounded border flex items-center gap-1 ${
              metrics.isClamped
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {metrics.isClamped ? (
              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            )}
            <span className="truncate">{metrics.isClamped ? t.statusClamped : t.statusValid}</span>
          </span>
        </div>

        {!isCollapsed && (
          <>
            <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2">
            <span className="text-[11px] text-slate-400 block mb-0.5">{t.lblFootprint}</span>
            <span className="font-mono text-sm font-semibold text-slate-100" dir="ltr">
              {metrics.footprintArea.toLocaleString('en-US')} m²
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2">
            <span className="text-[11px] text-slate-400 block mb-0.5">{t.lblHallArea}</span>
            <span className="font-mono text-sm font-semibold text-slate-100" dir="ltr">
              {metrics.hallArea.toLocaleString('en-US')} m²
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2">
            <span className="text-[11px] text-slate-400 block mb-0.5">{t.lblTotalRacks}</span>
            <span className="font-mono text-sm font-semibold text-sky-300" dir="ltr">
              {metrics.totalRacks} Racks
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2">
            <span className="text-[11px] text-slate-400 block mb-0.5">{t.lblUtilization}</span>
            <span className="font-mono text-sm font-semibold text-slate-100" dir="ltr">
              {metrics.floorUtilizationPercent}%
            </span>
          </div>
        </div>

        <p className="mt-2.5 text-[10.5px] text-slate-500 leading-relaxed">
          {t.conceptualDisclaimer}
        </p>
          </>
        )}
      </div>

      {/* Spatial Limit Overflow Banner */}
      {metrics.isClamped && (
        <div
          role="alert"
          className="bg-amber-950/90 border border-amber-500/60 rounded-xl p-3 shadow-2xl flex items-start gap-2.5 text-xs text-amber-100 pointer-events-auto"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="block font-semibold mb-0.5 text-amber-200">{t.warnTitle}</strong>
            <p className="leading-snug text-amber-200/90 text-[11.5px]">
              {t.warnSpatialOverflow}
            </p>
          </div>
        </div>
      )}

      {/* Selected Rack Inspector */}
      {selectedRack && (
        <div className="bg-slate-950/90 backdrop-blur-md border border-sky-500/40 rounded-xl p-3.5 shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wide">
              {t.inspectorTitle}
            </span>
            <button
              type="button"
              onClick={onClearSelectedRack}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
              title={t.btnClose}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
              <span className="text-slate-400">{t.inspRackId}</span>
              <span className="font-mono font-medium text-sky-300" dir="ltr">{selectedRack.rackId}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
              <span className="text-slate-400">{t.inspRowPos}</span>
              <span className="font-mono text-slate-200" dir="ltr">
                Row {selectedRack.rowNumber} / #{selectedRack.rackNumber}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
              <span className="text-slate-400">{t.inspDims}</span>
              <span className="font-mono text-slate-200" dir="ltr">{selectedRack.dimensions}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
              <span className="text-slate-400">{t.inspCapacity}</span>
              <span className="font-mono text-slate-200" dir="ltr">{selectedRack.uHeight}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">{t.inspZone}</span>
              <span className="font-mono text-slate-200" dir="ltr">{selectedRack.zone}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

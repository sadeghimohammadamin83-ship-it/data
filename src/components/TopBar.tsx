import React from 'react';
import type { ViewMode, Language } from '../types/datacenter';
import { TRANSLATIONS } from '../i18n/translations';
import { Building2, Layers, Server, RotateCcw, Globe, SlidersHorizontal } from 'lucide-react';

interface TopBarProps {
  lang: Language;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onLangToggle: () => void;
  onResetProject: () => void;
  onToggleMobilePanel: () => void;
  isMobilePanelOpen: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  lang,
  viewMode,
  onViewModeChange,
  onLangToggle,
  onResetProject,
  onToggleMobilePanel,
  isMobilePanelOpen,
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <header className="fixed top-0 left-0 right-0 h-14 z-20 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-3 md:px-5 gap-3">
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-sky-950/60 border border-sky-500/30 rounded-md text-white font-mono font-bold text-xs tracking-wider shrink-0">
          <span className="w-2 h-2 rounded-xs bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
          <span className="hidden sm:inline">{t.brandName}</span>
        </div>
        <div className="hidden md:flex flex-col min-w-0">
          <span className="font-semibold text-xs text-slate-100 truncate">
            {t.projectName}
          </span>
          <span className="text-[11px] text-slate-400 truncate">
            {t.projectSubtitle}
          </span>
        </div>
      </div>

      {/* Primary View Modes */}
      <nav className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-800 gap-1 shrink-0" aria-label="View Modes">
        <button
          type="button"
          data-mode="exterior"
          onClick={() => onViewModeChange('exterior')}
          className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            viewMode === 'exterior'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">{t.modeExterior}</span>
          <span className="md:hidden">{lang === 'fa' ? 'بیرونی' : 'Exterior'}</span>
        </button>

        <button
          type="button"
          data-mode="interior"
          onClick={() => onViewModeChange('interior')}
          className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            viewMode === 'interior'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">{t.modeInterior}</span>
          <span className="md:hidden">{lang === 'fa' ? 'برش داخلی' : 'Cutaway'}</span>
        </button>

        <button
          type="button"
          data-mode="racks"
          onClick={() => onViewModeChange('racks')}
          className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            viewMode === 'racks'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          <Server className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">{t.modeRacks}</span>
          <span className="md:hidden">{lang === 'fa' ? 'چیدمان رک' : 'Racks'}</span>
        </button>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleMobilePanel}
          className={`lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            isMobilePanelOpen
              ? 'bg-sky-950 border-sky-500/40 text-sky-300'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">{t.btnParameters}</span>
        </button>

        <button
          type="button"
          onClick={onLangToggle}
          title={lang === 'fa' ? 'Switch to English' : 'تغییر به فارسی'}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-semibold rounded-md bg-sky-950/40 border border-sky-500/30 text-sky-300 hover:bg-sky-900/40 hover:border-sky-500/50 transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{lang === 'fa' ? 'EN' : 'فا'}</span>
        </button>

        <button
          type="button"
          onClick={onResetProject}
          title={t.resetTooltip}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-900 border border-slate-700 text-slate-300 hover:text-red-300 hover:border-red-500/40 hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.btnReset}</span>
        </button>
      </div>
    </header>
  );
};

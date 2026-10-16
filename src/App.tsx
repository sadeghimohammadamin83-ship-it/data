/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { ProjectState, ViewMode, CameraPreset, LightingPreset, RackInfo } from './types/datacenter';
import { DEFAULT_PROJECT_STATE, computeDataCenterMetrics } from './utils/datacenterMath';
import { TRANSLATIONS } from './i18n/translations';
import { TopBar } from './components/TopBar';
import { HUDTelemetry } from './components/HUDTelemetry';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ViewportToolbar } from './components/ViewportToolbar';
import { WebGLCanvas } from './components/WebGLCanvas';

export default function App() {
  const [state, setState] = useState<ProjectState>(() => {
    let initialLang: 'fa' | 'en' = 'fa';
    try {
      const savedLang = localStorage.getItem('dc_studio_lang');
      if (savedLang === 'fa' || savedLang === 'en') {
        initialLang = savedLang;
      }
    } catch (_) {}
    return { ...DEFAULT_PROJECT_STATE, lang: initialLang };
  });

  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState<boolean>(false);

  // Sync document language, direction, and title
  useEffect(() => {
    const htmlEl = document.documentElement;
    htmlEl.lang = state.lang;
    htmlEl.dir = state.lang === 'fa' ? 'rtl' : 'ltr';

    const t = TRANSLATIONS[state.lang];
    document.title = `${t.brandName} — ${t.projectName} | ${t.projectSubtitle}`;

    try {
      localStorage.setItem('dc_studio_lang', state.lang);
    } catch (_) {}
  }, [state.lang]);

  // Generic state updater
  const handleStateChange = useCallback(<K extends keyof ProjectState>(key: K, value: ProjectState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // View Mode Switching
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setState((prev) => {
      if (mode === 'exterior') {
        return {
          ...prev,
          viewMode: 'exterior',
          showRoof: true,
          showFrontFacade: true,
          cameraPreset: 'perspective',
        };
      } else if (mode === 'interior') {
        return {
          ...prev,
          viewMode: 'interior',
          showRoof: false,
          showFrontFacade: false,
          cameraPreset: 'cutaway',
        };
      } else {
        return {
          ...prev,
          viewMode: 'racks',
          showRoof: false,
          showFrontFacade: false,
          showRackLabels: true,
          cameraPreset: 'racks',
        };
      }
    });
  }, []);

  // Language Toggle
  const handleLangToggle = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lang: prev.lang === 'fa' ? 'en' : 'fa',
    }));
  }, []);

  // Reset to default
  const handleResetProject = useCallback(() => {
    setState((prev) => ({
      ...DEFAULT_PROJECT_STATE,
      lang: prev.lang,
    }));
  }, []);

  // Camera preset change
  const handleCameraPresetChange = useCallback((preset: CameraPreset) => {
    handleStateChange('cameraPreset', preset);
  }, [handleStateChange]);

  // Lighting preset change
  const handleLightingPresetChange = useCallback((preset: LightingPreset) => {
    handleStateChange('lightingPreset', preset);
  }, [handleStateChange]);

  // Studio guide toggles
  const handleToggleGrid = useCallback(() => {
    setState((prev) => ({ ...prev, showGrid: !prev.showGrid }));
  }, []);

  const handleToggleDimensions = useCallback(() => {
    setState((prev) => ({ ...prev, showDimensions: !prev.showDimensions }));
  }, []);

  const handleToggleTechOverlay = useCallback(() => {
    setState((prev) => ({ ...prev, showTechOverlay: !prev.showTechOverlay }));
  }, []);

  // Rack selection
  const handleSelectRack = useCallback((rackInfo: RackInfo | null) => {
    setState((prev) => ({
      ...prev,
      selectedRackId: rackInfo ? rackInfo.rackId : null,
      selectedRackData: rackInfo,
    }));
  }, []);

  const handleClearSelectedRack = useCallback(() => {
    handleSelectRack(null);
  }, [handleSelectRack]);

  // Computed spatial metrics
  const metrics = useMemo(() => {
    return computeDataCenterMetrics(state);
  }, [
    state.length,
    state.width,
    state.rackRows,
    state.racksPerRow,
    state.aisleWidth,
    state.rackWidth,
    state.rackDepth,
    state.rackGap,
  ]);

  return (
    <div
      className={`min-h-screen w-full bg-[#080a0f] text-slate-100 overflow-hidden select-none ${
        state.lang === 'fa' ? 'font-vazir' : 'font-sans'
      }`}
    >
      {/* 3D WebGL Studio Viewport */}
      <WebGLCanvas state={state} onSelectRack={handleSelectRack} />

      {/* Top Application Bar */}
      <TopBar
        lang={state.lang}
        viewMode={state.viewMode}
        onViewModeChange={handleViewModeChange}
        onLangToggle={handleLangToggle}
        onResetProject={handleResetProject}
        onToggleMobilePanel={() => setIsMobilePanelOpen((prev) => !prev)}
        isMobilePanelOpen={isMobilePanelOpen}
      />

      {/* Real-time Project Telemetry & Selected Rack HUD */}
      <HUDTelemetry
        lang={state.lang}
        metrics={metrics}
        selectedRack={state.selectedRackData}
        onClearSelectedRack={handleClearSelectedRack}
      />

      {/* Parametric Properties Panel */}
      <PropertiesPanel
        state={state}
        onChange={handleStateChange}
        isOpenMobile={isMobilePanelOpen}
        onToggleMobile={() => setIsMobilePanelOpen((prev) => !prev)}
      />

      {/* Floating Studio Viewport Toolbar */}
      <ViewportToolbar
        lang={state.lang}
        cameraPreset={state.cameraPreset}
        lightingPreset={state.lightingPreset}
        showGrid={state.showGrid}
        showDimensions={state.showDimensions}
        showTechOverlay={state.showTechOverlay}
        onCameraPresetChange={handleCameraPresetChange}
        onLightingPresetChange={handleLightingPresetChange}
        onToggleGrid={handleToggleGrid}
        onToggleDimensions={handleToggleDimensions}
        onToggleTechOverlay={handleToggleTechOverlay}
      />
    </div>
  );
}

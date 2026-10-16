import React, { useEffect, useRef, useState } from 'react';
import type { ProjectState, RackInfo } from '../types/datacenter';
import { DataCenterRenderer } from '../three/DataCenterRenderer';
import { TRANSLATIONS } from '../i18n/translations';
import { MousePointerClick } from 'lucide-react';

interface WebGLCanvasProps {
  state: ProjectState;
  onSelectRack: (info: RackInfo | null) => void;
}

export const WebGLCanvas: React.FC<WebGLCanvasProps> = ({ state, onSelectRack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererInstanceRef = useRef<DataCenterRenderer | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  const t = TRANSLATIONS[state.lang];

  // Initialize Three.js scene once
  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new DataCenterRenderer(canvasRef.current, (rackInfo) => {
      onSelectRack(rackInfo);
    });

    const success = renderer.init();
    if (!success) {
      setWebglSupported(false);
      return;
    }

    rendererInstanceRef.current = renderer;
    renderer.rebuildModel(state);
    renderer.setCameraPreset(state.cameraPreset, state);
    renderer.setLightingPreset(state.lightingPreset);

    const handleResize = () => {
      if (!containerRef.current || !rendererInstanceRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      rendererInstanceRef.current.handleResize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      rendererInstanceRef.current = null;
    };
  }, []);

  // Update model when parameters change
  useEffect(() => {
    if (!rendererInstanceRef.current) return;
    rendererInstanceRef.current.rebuildModel(state);
  }, [
    state.length,
    state.width,
    state.height,
    state.floors,
    state.facadeMaterial,
    state.facadeColor,
    state.glazingRatio,
    state.showAnnexVolumes,
    state.showRoof,
    state.showFrontFacade,
    state.showInteriorWalls,
    state.showCableTrays,
    state.rackRows,
    state.racksPerRow,
    state.aisleWidth,
    state.rackHeight,
    state.rackWidth,
    state.rackDepth,
    state.rackGap,
    state.showRackLabels,
    state.showGrid,
    state.showDimensions,
    state.showTechOverlay,
    state.selectedRackId,
  ]);

  // Update lighting preset
  useEffect(() => {
    if (!rendererInstanceRef.current) return;
    rendererInstanceRef.current.setLightingPreset(state.lightingPreset);
  }, [state.lightingPreset]);

  // Update camera preset
  useEffect(() => {
    if (!rendererInstanceRef.current) return;
    rendererInstanceRef.current.setCameraPreset(state.cameraPreset, state);
  }, [state.cameraPreset]);

  // Update view mode camera behavior
  useEffect(() => {
    if (!rendererInstanceRef.current) return;
    if (state.viewMode === 'exterior') {
      rendererInstanceRef.current.setCameraPreset('perspective', state);
    } else if (state.viewMode === 'interior') {
      rendererInstanceRef.current.setCameraPreset('cutaway', state);
    } else if (state.viewMode === 'racks') {
      rendererInstanceRef.current.setCameraPreset('racks', state);
    }
  }, [state.viewMode]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full bg-radial from-[#131924] via-[#090c12] to-[#05070b] overflow-hidden"
      data-testid="threejs-datacenter-viewport"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block outline-none cursor-grab active:cursor-grabbing"
        aria-label="3D Parametric Data Center Architectural Viewport"
      />

      {/* Frame Vignette */}
      <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.8)] border border-white/5" />

      {/* Interaction Hint */}
      <div className="fixed bottom-16 inset-inline-start-4 z-14 hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-950/70 border border-slate-800 rounded-full text-[11px] text-slate-400 pointer-events-none backdrop-blur-sm">
        <MousePointerClick className="w-3.5 h-3.5 text-sky-400" />
        <span>{t.viewportHint}</span>
      </div>

      {/* WebGL Fallback screen */}
      {!webglSupported && (
        <div
          role="alert"
          className="fixed inset-0 top-14 z-30 bg-slate-950/95 flex items-center justify-center p-6 text-center"
        >
          <div className="max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <h2 className="text-base font-semibold text-sky-400 mb-2">{t.fallbackTitle}</h2>
            <p className="text-xs text-slate-300 leading-relaxed">{t.fallbackDesc}</p>
          </div>
        </div>
      )}
    </div>
  );
};

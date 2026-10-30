import {
  Camera,
  ChevronDown,
  ChevronUp,
  Eye,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  CameraPresetId,
  CAMERA_PRESETS,
  FinishId,
  FINISH_PALETTES,
  KinematicTelemetry,
  LightingPresetId,
  LIGHTING_PRESETS,
  SubsystemId,
  SUBSYSTEM_CATALOG,
} from '../utils/kinematics';

export type DockTabId = 'kinematics' | 'finishes' | 'inspector';

export interface ControlDockProps {
  telemetry: KinematicTelemetry;
  bloom: number;
  onChangeBloom: (val: number) => void;
  exploded: number;
  onChangeExploded: (val: number) => void;
  autoCycle: boolean;
  onToggleAutoCycle: () => void;
  speedMultiplier: number;
  onChangeSpeed: (val: number) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  showCloche: boolean;
  onToggleCloche: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  finishId: FinishId;
  onSelectFinish: (id: FinishId) => void;
  lightingId: LightingPresetId;
  onSelectLighting: (id: LightingPresetId) => void;
  cameraPresetId: CameraPresetId;
  onSelectCameraPreset: (id: CameraPresetId) => void;
  selectedSubsystem: SubsystemId | null;
  onSelectSubsystem: (id: SubsystemId | null) => void;
  activeTab: DockTabId;
  onChangeTab: (tab: DockTabId) => void;
  dockCollapsed: boolean;
  onToggleDockCollapsed: () => void;
  onResetAll: () => void;
}

export function ControlDock({
  telemetry,
  bloom,
  onChangeBloom,
  exploded,
  onChangeExploded,
  autoCycle,
  onToggleAutoCycle,
  speedMultiplier,
  onChangeSpeed,
  autoRotate,
  onToggleAutoRotate,
  showCloche,
  onToggleCloche,
  soundEnabled,
  onToggleSound,
  finishId,
  onSelectFinish,
  lightingId,
  onSelectLighting,
  cameraPresetId,
  onSelectCameraPreset,
  selectedSubsystem,
  onSelectSubsystem,
  activeTab,
  onChangeTab,
  dockCollapsed,
  onToggleDockCollapsed,
  onResetAll,
}: ControlDockProps) {
  const activeSubsystemSpec = selectedSubsystem
    ? SUBSYSTEM_CATALOG.find((s) => s.id === selectedSubsystem) ?? null
    : null;

  return (
    <>
      {/* Top Bar: Minimal Brand Title + Horological Telemetry Readout + Quick Actions */}
      <header className="fixed top-0 left-0 right-0 z-10 pointer-events-none px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-start justify-between gap-2 sm:gap-6">
        {/* Zone 1: Brand Title & Unboxed Horological Spec Metadata */}
        <div className="pointer-events-auto bg-[#0c0e13]/92 border border-[#d4a359]/25 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 shadow-lg min-w-0">
          <div className="flex items-baseline gap-2 sm:gap-3">
            <h1 className="font-display text-lg sm:text-2xl font-semibold tracking-tight text-[#f5efe6] whitespace-nowrap">
              Valkenburg No. IV
            </h1>
            <span className="text-[11px] sm:text-xs font-mono text-[#d4a359] whitespace-nowrap">
              Cal. 1784-T
            </span>
          </div>
          <div className="hidden sm:flex mt-0.5 flex-wrap items-center gap-1.5 text-xs text-[#a39e93]">
            <span>Chronometric Botanical Automaton</span>
            <span aria-hidden="true">·</span>
            <span>6-Fold Four-Bar Corolla</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[#e2dacb]">
              {telemetry.escapementVph.toLocaleString()} vph
            </span>
          </div>
        </div>

        {/* Zone 2: Live Mechanical Telemetry Strip (Hidden on narrow mobile, visible on tablet/desktop) */}
        <div
          className="hidden lg:flex items-center gap-5 pointer-events-auto bg-[#0c0e13]/92 border border-[#d4a359]/25 rounded-lg px-4 py-2.5 shadow-lg"
          aria-label="Live Mechanical Telemetry"
        >
          <div>
            <div className="text-[11px] text-[#8e887d]">Corolla Aperture</div>
            <div className="text-sm font-mono font-medium text-[#f5efe6]" data-testid="telemetry-aperture">
              {telemetry.outerPetalAngleDeg.toFixed(1)}° / {telemetry.innerPetalAngleDeg.toFixed(1)}°
            </div>
          </div>
          <div className="h-6 w-px bg-[#d4a359]/20" />
          <div>
            <div className="text-[11px] text-[#8e887d]">Collar Stroke</div>
            <div className="text-sm font-mono font-medium text-[#f5efe6]" data-testid="telemetry-stroke">
              {telemetry.collarTravelMm.toFixed(1)} mm
            </div>
          </div>
          <div className="h-6 w-px bg-[#d4a359]/20" />
          <div>
            <div className="text-[11px] text-[#8e887d]">Barrel Torque</div>
            <div className="text-sm font-mono font-medium text-[#d4a359]" data-testid="telemetry-torque">
              {telemetry.mainspringTorqueMnm.toFixed(1)} mN·m
            </div>
          </div>
          <div className="h-6 w-px bg-[#d4a359]/20" />
          <div>
            <div className="text-[11px] text-[#8e887d]">Lead Screw</div>
            <div className="text-sm font-mono font-medium text-[#f5efe6]">
              {telemetry.leadScrewTurns.toFixed(2)} rev
            </div>
          </div>
        </div>

        {/* Zone 3: Primary Action & Acoustic Escapement Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
          <button
            type="button"
            onClick={onToggleSound}
            className={`px-2.5 sm:px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              soundEnabled
                ? 'bg-[#d4a359] text-[#0b0d11] border-[#d4a359]'
                : 'bg-[#0c0e13]/92 text-[#dfd9cc] border-[#d4a359]/30 hover:border-[#d4a359]/70'
            }`}
            aria-label={soundEnabled ? 'Mute Horological Audio' : 'Enable Horological Audio'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {soundEnabled ? 'Escapement Audio On' : 'Escapement Audio'}
            </span>
            <span className="sm:hidden">{soundEnabled ? 'Audio On' : 'Audio'}</span>
          </button>

          <button
            type="button"
            onClick={onResetAll}
            className="px-2.5 sm:px-3.5 py-2 rounded-lg text-xs font-medium bg-[#0c0e13]/92 text-[#dfd9cc] border border-[#d4a359]/30 hover:border-[#d4a359]/70 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            aria-label="Reset Automaton State"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#d4a359]" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* Active Subsystem Callout Card (Top-Right below header, only when a part is selected) */}
      {activeSubsystemSpec && (
        <aside
          aria-label="Selected Subsystem Engineering Callout"
          className="fixed top-14 sm:top-20 right-3 sm:right-5 z-10 w-80 max-w-[calc(100vw-1.5rem)] bg-[#0c0e13]/95 border border-[#d4a359]/45 rounded-lg p-3.5 sm:p-4 shadow-xl pointer-events-auto"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-mono text-[#d4a359]">
                {activeSubsystemSpec.code} · {activeSubsystemSpec.category}
              </div>
              <h2 className="font-display text-lg font-semibold text-[#f5efe6] leading-snug mt-0.5">
                {activeSubsystemSpec.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onSelectSubsystem(null)}
              className="p-1 text-[#9e978b] hover:text-[#f5efe6] rounded transition-colors cursor-pointer"
              aria-label="Close Subsystem Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-2 text-xs text-[#cfc8b8] leading-relaxed">
            {activeSubsystemSpec.kinematicRole}
          </p>

          <div className="mt-3 pt-2.5 border-t border-[#d4a359]/20 space-y-1 text-xs">
            <div className="flex justify-between gap-2">
              <span className="text-[#8e887d]">Metallurgy:</span>
              <span className="text-[#ebe5d8] text-right font-medium">
                {activeSubsystemSpec.materialSpec}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[#8e887d]">Tolerance / Ratio:</span>
              <span className="font-mono text-[#d4a359] text-right">
                {activeSubsystemSpec.ratioOrTolerance}
              </span>
            </div>
          </div>
        </aside>
      )}

      {/* Unified Collapsible Bottom Control Dock (Zero Viewport Occlusion in Center) */}
      <section
        aria-label="Automaton Control Dock"
        className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10 w-[min(940px,95vw)] pointer-events-none flex flex-col items-center"
      >
        {/* Collapse / Expand Toggle Handle */}
        <div className="pointer-events-auto mb-1.5 flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleDockCollapsed}
            className="px-3.5 py-1 rounded-md bg-[#0c0e13]/95 border border-[#d4a359]/35 text-xs font-medium text-[#e4decfe6] hover:text-[#ffffff] hover:border-[#d4a359] transition-colors flex items-center gap-1.5 shadow-md whitespace-nowrap shrink-0 cursor-pointer"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-[#d4a359]" />
                <span>Show Controls (H)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[#d4a359]" />
                <span>Hide Controls (H)</span>
              </>
            )}
          </button>
        </div>

        {/* Main Bottom Dock Surface (Solid/RGBA dark slate — zero backdrop-filter over WebGL) */}
        {!dockCollapsed && (
          <div className="pointer-events-auto w-full bg-[#0c0e13]/95 border border-[#d4a359]/35 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-2xl">
            {/* Top Row: Segmented Mode Tabs + Quick Camera Angle Presets */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2.5 border-b border-[#d4a359]/20">
              {/* Mode Tabs */}
              <div className="flex items-center gap-1 bg-[#141821] p-1 rounded-lg border border-white/5 overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => onChangeTab('kinematics')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-colors flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'kinematics'
                      ? 'bg-[#d4a359] text-[#0b0d11] font-semibold'
                      : 'text-[#c5bfb3] hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 shrink-0" />
                  <span>Kinematics & Assembly</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTab('finishes')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-colors flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'finishes'
                      ? 'bg-[#d4a359] text-[#0b0d11] font-semibold'
                      : 'text-[#c5bfb3] hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Horological Finishes</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTab('inspector')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-colors flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'inspector'
                      ? 'bg-[#d4a359] text-[#0b0d11] font-semibold'
                      : 'text-[#c5bfb3] hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span>Subsystem Catalog (11)</span>
                </button>
              </div>

              {/* Camera Angle Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[11px] text-[#8e887d] flex items-center gap-1 mr-1 whitespace-nowrap">
                  <Camera className="w-3 h-3 text-[#d4a359]" />
                  <span>View:</span>
                </span>
                {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((presetKey) => {
                  const preset = CAMERA_PRESETS[presetKey];
                  const isActive = cameraPresetId === presetKey;
                  return (
                    <button
                      key={presetKey}
                      type="button"
                      onClick={() => onSelectCameraPreset(presetKey)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-[#d4a359]/25 text-[#f7d794] border border-[#d4a359]/60'
                          : 'bg-[#141821] text-[#b8b2a6] border border-transparent hover:border-[#d4a359]/30 hover:text-white'
                      }`}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab 1: Kinematics, Bloom Aperture & Exploded View Sliders */}
            {activeTab === 'kinematics' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Bloom Aperture Slider (5 cols) */}
                <div className="md:col-span-5 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="bloom-slider" className="font-medium text-[#ebe5d8]">
                      Corolla Bloom Aperture
                    </label>
                    <span className="font-mono text-[#d4a359]" data-testid="bloom-percentage">
                      {Math.round(bloom * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onChangeBloom(0)}
                      className="text-[11px] font-mono text-[#9e978b] hover:text-[#f5efe6] whitespace-nowrap cursor-pointer"
                    >
                      Bud
                    </button>
                    <input
                      id="bloom-slider"
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={bloom}
                      onChange={(e) => onChangeBloom(parseFloat(e.target.value))}
                      className="w-full horology-slider"
                      aria-label="Corolla Bloom Aperture"
                    />
                    <button
                      type="button"
                      onClick={() => onChangeBloom(1)}
                      className="text-[11px] font-mono text-[#9e978b] hover:text-[#f5efe6] whitespace-nowrap cursor-pointer"
                    >
                      Full Bloom
                    </button>
                  </div>
                </div>

                {/* Exploded Assembly Slider (4 cols) */}
                <div className="md:col-span-4 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="exploded-slider" className="font-medium text-[#ebe5d8]">
                      Exploded Horological View
                    </label>
                    <span className="font-mono text-[#d4a359]" data-testid="exploded-percentage">
                      {Math.round(exploded * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onChangeExploded(0)}
                      className="text-[11px] font-mono text-[#9e978b] hover:text-[#f5efe6] whitespace-nowrap cursor-pointer"
                    >
                      Assembled
                    </button>
                    <input
                      id="exploded-slider"
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={exploded}
                      onChange={(e) => onChangeExploded(parseFloat(e.target.value))}
                      className="w-full horology-slider"
                      aria-label="Exploded Horological View"
                    />
                    <button
                      type="button"
                      onClick={() => onChangeExploded(1)}
                      className="text-[11px] font-mono text-[#9e978b] hover:text-[#f5efe6] whitespace-nowrap cursor-pointer"
                    >
                      Dissected
                    </button>
                  </div>
                </div>

                {/* Automaton Drive & Cloche Controls (3 cols) */}
                <div className="md:col-span-3 flex flex-wrap md:justify-end items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onToggleAutoCycle}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                      autoCycle
                        ? 'bg-[#d4a359] text-[#0b0d11] border-[#d4a359]'
                        : 'bg-[#141821] text-[#dfd9cc] border-[#d4a359]/30 hover:border-[#d4a359]'
                    }`}
                  >
                    {autoCycle ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{autoCycle ? 'Pause Cycle' : 'Auto-Bloom'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onToggleCloche}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
                      showCloche
                        ? 'bg-[#d4a359]/20 text-[#f7d794] border-[#d4a359]/60'
                        : 'bg-[#141821] text-[#b8b2a6] border-white/10 hover:text-white'
                    }`}
                    title="Toggle Borosilicate Exhibition Bell Jar"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Glass Cloche</span>
                  </button>

                  <button
                    type="button"
                    onClick={onToggleAutoRotate}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
                      autoRotate
                        ? 'bg-[#d4a359]/20 text-[#f7d794] border-[#d4a359]/60'
                        : 'bg-[#141821] text-[#b8b2a6] border-white/10 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Turntable</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeSpeed(speedMultiplier === 1 ? 2 : speedMultiplier === 2 ? 0.5 : 1)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-[#141821] text-[#d4a359] border border-[#d4a359]/30 hover:border-[#d4a359] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    aria-label="Cycle Escapement Speed"
                  >
                    {speedMultiplier}× Speed
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Curated Horological Material Finishes & Studio Atmosphere */}
            {activeTab === 'finishes' && (
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* 4 Finish Swatches */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
                  {(Object.keys(FINISH_PALETTES) as FinishId[]).map((fKey) => {
                    const p = FINISH_PALETTES[fKey];
                    const active = finishId === fKey;
                    return (
                      <button
                        key={fKey}
                        type="button"
                        onClick={() => onSelectFinish(fKey)}
                        className={`p-2 rounded-lg border text-left transition-colors flex items-center gap-2.5 cursor-pointer ${
                          active
                            ? 'bg-[#d4a359]/15 border-[#d4a359] text-white'
                            : 'bg-[#141821] border-white/10 text-[#c5bfb3] hover:border-[#d4a359]/40'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full shrink-0 border border-white/30"
                          style={{
                            background: `linear-gradient(135deg, ${p.primaryMetal} 0%, ${p.petalInner} 55%, ${p.crystalCore} 100%)`,
                          }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate">{p.name}</div>
                          <div className="text-[10px] text-[#8e887d] truncate">{p.subtitle}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Studio Lighting Environment Selector */}
                <div className="flex items-center gap-1.5 bg-[#141821] p-1.5 rounded-lg border border-white/5 shrink-0">
                  <span className="text-[11px] text-[#8e887d] px-1.5 whitespace-nowrap">
                    Lighting:
                  </span>
                  {(Object.keys(LIGHTING_PRESETS) as LightingPresetId[]).map((lKey) => {
                    const lPreset = LIGHTING_PRESETS[lKey];
                    const active = lightingId === lKey;
                    return (
                      <button
                        key={lKey}
                        type="button"
                        onClick={() => onSelectLighting(lKey)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'bg-[#d4a359] text-[#0b0d11] font-semibold'
                            : 'text-[#b8b2a6] hover:text-white'
                        }`}
                      >
                        {lPreset.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Interactive 11-Subsystem Horological Catalog */}
            {activeTab === 'inspector' && (
              <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                {SUBSYSTEM_CATALOG.map((sub) => {
                  const isSelected = selectedSubsystem === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => onSelectSubsystem(isSelected ? null : sub.id)}
                      className={`px-3 py-1.5 rounded-lg border text-left transition-colors shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-[#d4a359]/25 border-[#d4a359] text-[#f5efe6]'
                          : 'bg-[#141821] border-white/10 text-[#c5bfb3] hover:border-[#d4a359]/40 hover:text-white'
                      }`}
                    >
                      <div className="text-[10px] font-mono text-[#d4a359]">{sub.code}</div>
                      <div className="text-xs font-medium whitespace-nowrap">{sub.name}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}

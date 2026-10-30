/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ControlDock, DockTabId } from './components/ControlDock';
import { TulipViewport } from './components/TulipViewport';
import {
  CameraPresetId,
  computeTulipKinematics,
  FinishId,
  LightingPresetId,
  SubsystemId,
} from './utils/kinematics';
import { soundEngine } from './utils/soundEngine';

export default function App() {
  // Primary mechanical state: default to 65% open bloom so the user immediately sees
  // both the sculpted corolla cup and the internal biaxial tourbillon / crystal pistil
  const [bloom, setBloom] = useState<number>(0.65);
  const [exploded, setExploded] = useState<number>(0);
  const [autoCycle, setAutoCycle] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [showCloche, setShowCloche] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  // Visual finish, studio lighting, and camera preset state
  const [finishId, setFinishId] = useState<FinishId>('gilded-brass');
  const [lightingId, setLightingId] = useState<LightingPresetId>('atelier');
  const [cameraPresetId, setCameraPresetId] = useState<CameraPresetId>('overview');
  const [cameraPresetTrigger, setCameraPresetTrigger] = useState<number>(0);

  // Interactive subsystem inspection & UI drawer state
  const [selectedSubsystem, setSelectedSubsystem] = useState<SubsystemId | null>(null);
  const [activeTab, setActiveTab] = useState<DockTabId>('kinematics');
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);

  const telemetry = useMemo(() => computeTulipKinematics(bloom, exploded), [bloom, exploded]);

  // Keyboard shortcut 'H' for Cinema / Zen Mode (hide/show bottom control dock)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleBloomChange = useCallback((val: number) => {
    setAutoCycle(false);
    setBloom(val);
    if (val >= 0.99 || val <= 0.01) {
      soundEngine.playBloomChime();
    }
  }, []);

  const handleExplodedChange = useCallback((val: number) => {
    setExploded(val);
  }, []);

  const handleToggleAutoCycle = useCallback(() => {
    soundEngine.playClick(880);
    setAutoCycle((prev) => !prev);
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundEngine.setEnabled(next);
      return next;
    });
  }, []);

  const handleSelectFinish = useCallback((id: FinishId) => {
    soundEngine.playClick(940);
    setFinishId(id);
  }, []);

  const handleSelectLighting = useCallback((id: LightingPresetId) => {
    soundEngine.playClick(780);
    setLightingId(id);
  }, []);

  const handleSelectCameraPreset = useCallback((id: CameraPresetId) => {
    soundEngine.playClick(1020);
    setCameraPresetId(id);
    setCameraPresetTrigger((c) => c + 1);
  }, []);

  const handleSelectSubsystem = useCallback(
    (id: SubsystemId | null) => {
      setSelectedSubsystem(id);
      if (id === 'tourbillon-core' || id === 'telescopic-stamens') {
        setCameraPresetId('corolla');
        setCameraPresetTrigger((c) => c + 1);
      } else if (id === 'planetary-gears' || id === 'plinth-barrel' || id === 'drive-collar') {
        setCameraPresetId('gearbox');
        setCameraPresetTrigger((c) => c + 1);
      }
    },
    [],
  );

  const handleResetAll = useCallback(() => {
    soundEngine.playBloomChime();
    setAutoCycle(false);
    setBloom(0.65);
    setExploded(0);
    setSpeedMultiplier(1);
    setAutoRotate(true);
    setShowCloche(false);
    setFinishId('gilded-brass');
    setLightingId('atelier');
    setCameraPresetId('overview');
    setCameraPresetTrigger((c) => c + 1);
    setSelectedSubsystem(null);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0b0d11] select-none">
      <TulipViewport
        targetBloom={bloom}
        targetExploded={exploded}
        autoCycle={autoCycle}
        speedMultiplier={speedMultiplier}
        autoRotate={autoRotate}
        showCloche={showCloche}
        finishId={finishId}
        lightingId={lightingId}
        cameraPresetId={cameraPresetId}
        cameraPresetTrigger={cameraPresetTrigger}
        selectedSubsystem={selectedSubsystem}
        onSelectSubsystem={handleSelectSubsystem}
        onSyncLiveBloom={setBloom}
      />

      <ControlDock
        telemetry={telemetry}
        bloom={bloom}
        onChangeBloom={handleBloomChange}
        exploded={exploded}
        onChangeExploded={handleExplodedChange}
        autoCycle={autoCycle}
        onToggleAutoCycle={handleToggleAutoCycle}
        speedMultiplier={speedMultiplier}
        onChangeSpeed={(val) => {
          soundEngine.playClick(860);
          setSpeedMultiplier(val);
        }}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => {
          soundEngine.playClick(820);
          setAutoRotate((prev) => !prev);
        }}
        showCloche={showCloche}
        onToggleCloche={() => {
          soundEngine.playClick(760);
          setShowCloche((prev) => !prev);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        finishId={finishId}
        onSelectFinish={handleSelectFinish}
        lightingId={lightingId}
        onSelectLighting={handleSelectLighting}
        cameraPresetId={cameraPresetId}
        onSelectCameraPreset={handleSelectCameraPreset}
        selectedSubsystem={selectedSubsystem}
        onSelectSubsystem={handleSelectSubsystem}
        activeTab={activeTab}
        onChangeTab={(tab) => {
          soundEngine.playClick(900);
          setActiveTab(tab);
        }}
        dockCollapsed={dockCollapsed}
        onToggleDockCollapsed={() => {
          soundEngine.playClick(740);
          setDockCollapsed((prev) => !prev);
        }}
        onResetAll={handleResetAll}
      />
    </main>
  );
}

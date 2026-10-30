import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {
  CameraPresetId,
  CAMERA_PRESETS,
  FinishId,
  LightingPresetId,
  LIGHTING_PRESETS,
  SubsystemId,
} from '../utils/kinematics';
import { createProceduralTextures } from '../three/proceduralTextures';
import { createTulipAutomaton, TulipAutomatonRig } from '../three/tulipAutomaton';
import { soundEngine } from '../utils/soundEngine';

export interface TulipViewportProps {
  targetBloom: number;
  targetExploded: number;
  autoCycle: boolean;
  speedMultiplier: number;
  autoRotate: boolean;
  showCloche: boolean;
  finishId: FinishId;
  lightingId: LightingPresetId;
  cameraPresetId: CameraPresetId;
  cameraPresetTrigger: number;
  selectedSubsystem: SubsystemId | null;
  onSelectSubsystem: (subsystem: SubsystemId | null) => void;
  onSyncLiveBloom: (liveBloom: number) => void;
}

// Pre-allocated module-scope helpers for zero GC in the animation loop
const _pointerNdc = new THREE.Vector2();
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();

export function TulipViewport({
  targetBloom,
  targetExploded,
  autoCycle,
  speedMultiplier,
  autoRotate,
  showCloche,
  finishId,
  lightingId,
  cameraPresetId,
  cameraPresetTrigger,
  selectedSubsystem,
  onSelectSubsystem,
  onSyncLiveBloom,
}: TulipViewportProps) {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  // Store mutable props in refs so React UI updates never tear down the WebGL canvas
  const stateRef = useRef({
    targetBloom,
    targetExploded,
    currentBloom: targetBloom,
    currentExploded: targetExploded,
    autoCycle,
    speedMultiplier,
    autoRotate,
    showCloche,
    finishId,
    lightingId,
    selectedSubsystem,
    cameraTransitionActive: false,
    desiredCamPos: new THREE.Vector3(...CAMERA_PRESETS[cameraPresetId].position),
    desiredLookAt: new THREE.Vector3(...CAMERA_PRESETS[cameraPresetId].target),
  });

  const callbacksRef = useRef({
    onSelectSubsystem,
    onSyncLiveBloom,
  });

  useEffect(() => {
    callbacksRef.current.onSelectSubsystem = onSelectSubsystem;
    callbacksRef.current.onSyncLiveBloom = onSyncLiveBloom;
  }, [onSelectSubsystem, onSyncLiveBloom]);

  const rigRef = useRef<TulipAutomatonRig | null>(null);
  const lightsRef = useRef<{
    scene: THREE.Scene;
    keyLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    rimLight: THREE.DirectionalLight;
    controls: OrbitControls;
  } | null>(null);

  // Sync scalar targets into ref
  useEffect(() => {
    stateRef.current.targetBloom = targetBloom;
  }, [targetBloom]);

  useEffect(() => {
    stateRef.current.targetExploded = targetExploded;
  }, [targetExploded]);

  useEffect(() => {
    stateRef.current.autoCycle = autoCycle;
  }, [autoCycle]);

  useEffect(() => {
    stateRef.current.speedMultiplier = speedMultiplier;
  }, [speedMultiplier]);

  useEffect(() => {
    stateRef.current.autoRotate = autoRotate;
    if (lightsRef.current) {
      lightsRef.current.controls.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  useEffect(() => {
    stateRef.current.showCloche = showCloche;
  }, [showCloche]);

  useEffect(() => {
    stateRef.current.selectedSubsystem = selectedSubsystem;
  }, [selectedSubsystem]);

  // Apply finish changes immediately on existing meshes
  useEffect(() => {
    stateRef.current.finishId = finishId;
    rigRef.current?.applyFinish(finishId);
  }, [finishId]);

  // Apply lighting preset changes
  useEffect(() => {
    stateRef.current.lightingId = lightingId;
    if (!lightsRef.current) return;
    const preset = LIGHTING_PRESETS[lightingId];
    const { scene, keyLight, hemiLight, rimLight } = lightsRef.current;

    scene.background = new THREE.Color(preset.bgHex);
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.set(preset.fogHex);
    }
    keyLight.color.set(preset.keyColor);
    keyLight.intensity = preset.keyIntensity;
    hemiLight.color.set(preset.hemiSkyColor);
    hemiLight.groundColor.set(preset.hemiGroundColor);
    hemiLight.intensity = preset.hemiIntensity;
    rimLight.color.set(preset.rimColor);
    rimLight.intensity = preset.rimIntensity;
  }, [lightingId]);

  // Trigger damped camera transition when preset changes
  useEffect(() => {
    const preset = CAMERA_PRESETS[cameraPresetId];
    stateRef.current.desiredCamPos.set(...preset.position);
    stateRef.current.desiredLookAt.set(...preset.target);
    stateRef.current.cameraTransitionActive = true;
  }, [cameraPresetId, cameraPresetTrigger]);

  // Main WebGL initialization (runs once on mount)
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // 1. Software-WebGL detection from GPU renderer string
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.setAttribute('data-testid', 'tulip-webgl-canvas');
    renderer.domElement.className = 'block w-full h-full outline-none cursor-grab active:cursor-grabbing';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Scene & Studio RoomEnvironment Reflection Map
    const initialLight = LIGHTING_PRESETS[stateRef.current.lightingId];
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(initialLight.bgHex);
    scene.fog = new THREE.FogExp2(initialLight.fogHex, 0.042);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Camera & Damped OrbitControls
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 60);
    const initialPreset = CAMERA_PRESETS[cameraPresetId];
    camera.position.set(...initialPreset.position);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...initialPreset.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.autoRotate = !isSoftwareGl && stateRef.current.autoRotate;
    controls.autoRotateSpeed = 0.65;
    controls.minDistance = 2.1;
    controls.maxDistance = 13.5;
    controls.maxPolarAngle = Math.PI * 0.495; // Prevent camera going underneath the workbench floor
    controls.update();

    // Cancel scripted camera transition immediately if user grabs OrbitControls
    const onControlsStart = () => {
      stateRef.current.cameraTransitionActive = false;
    };
    controls.addEventListener('start', onControlsStart);

    // 4. Studio 3-Point Lighting Rig + Area Softboxes
    const keyLight = new THREE.DirectionalLight(initialLight.keyColor, initialLight.keyIntensity);
    keyLight.position.set(4.5, 7.5, 5.2);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    const d = 4.2;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 18;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(
      initialLight.hemiSkyColor,
      initialLight.hemiGroundColor,
      initialLight.hemiIntensity,
    );
    hemiLight.position.set(0, 12, 0);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(initialLight.rimColor, initialLight.rimIntensity);
    rimLight.position.set(-4.5, 5.2, -4.8);
    scene.add(rimLight);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softboxLeft = new THREE.RectAreaLight(0xfff0d4, 3.2, 3.0, 5.0);
      softboxLeft.position.set(-4.2, 4.0, 3.0);
      softboxLeft.lookAt(0, 2.8, 0);
      scene.add(softboxLeft);

      const softboxRight = new THREE.RectAreaLight(0xdbeafe, 2.4, 3.0, 5.0);
      softboxRight.position.set(4.2, 4.2, -2.5);
      softboxRight.lookAt(0, 2.8, 0);
      scene.add(softboxRight);
    }

    lightsRef.current = { scene, keyLight, hemiLight, rimLight, controls };

    // 5. Procedural Textures & Workbench Stage Floor
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const textures = createProceduralTextures(maxAnisotropy);

    // Horological Atelier Turntable Floor at y = 0
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    const floorGeo = new THREE.CylinderGeometry(50, 50, 0.12, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialLight.bgHex),
      roughness: 0.82,
      metalness: 0.18,
      bumpMap: textures.brushedMetalBump,
      bumpScale: 0.004,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.06;
    floorMesh.receiveShadow = true;
    stageGroup.add(floorMesh);

    // Concentric Inlaid Brass Workbench Rings (offset +0.02 on Y to prevent Z-fighting)
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xb88b4a,
      metalness: 0.88,
      roughness: 0.3,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const ringRadii = [1.85, 2.65, 3.85];
    const ringGeos: THREE.BufferGeometry[] = [];
    for (const r of ringRadii) {
      const rGeo = new THREE.RingGeometry(r, r + 0.018, 64);
      rGeo.rotateX(-Math.PI / 2);
      ringGeos.push(rGeo);
      const rMesh = new THREE.Mesh(rGeo, ringMat);
      rMesh.position.y = 0.008;
      stageGroup.add(rMesh);
    }

    // 6. Create the 11-Subsystem Mechanical Tulip Automaton
    const automaton = createTulipAutomaton(textures, isSoftwareGl, stateRef.current.finishId);
    scene.add(automaton.root);
    rigRef.current = automaton;

    // Pre-warm shaders on GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 7. Layer-1 Raycasting for Clicking / Inspecting Mechanical Subsystems
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      // Only treat as a click if pointer did not drag to orbit
      if (dx * dx + dy * dy > 36) return;

      const rect = renderer.domElement.getBoundingClientRect();
      _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(_pointerNdc, camera);
      const hits = raycaster.intersectObjects(automaton.interactables, false);
      if (hits.length > 0) {
        const hitSubsystem = hits[0].object.userData.subsystemId as SubsystemId | undefined;
        if (hitSubsystem) {
          soundEngine.playClick(980, 0.05);
          callbacksRef.current.onSelectSubsystem(hitSubsystem);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // 8. Responsive Resize Handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 9. Paced Render Loop with Software-WebGL `afterDraw()` Fence
    let frameId = 0;
    let isDisposed = false;
    let lastTime = performance.now() * 0.001;
    let elapsedSimTime = 0;
    let lastHudSyncTime = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (isDisposed) return;
      const now = performance.now() * 0.001;
      const rawDt = Math.min(0.1, Math.max(0.001, now - lastTime));
      lastTime = now;

      const st = stateRef.current;
      elapsedSimTime += rawDt * st.speedMultiplier;

      // Auto-cycle breathing bloom sinusoid if enabled
      if (st.autoCycle) {
        const cycleVal = 0.5 + 0.5 * Math.sin(elapsedSimTime * 0.65 - Math.PI * 0.25);
        st.targetBloom = cycleVal;
        if (now - lastHudSyncTime > 0.12) {
          lastHudSyncTime = now;
          callbacksRef.current.onSyncLiveBloom(Number(cycleVal.toFixed(2)));
        }
      }

      // Exponential damping on bloom and exploded assembly
      st.currentBloom = THREE.MathUtils.damp(st.currentBloom, st.targetBloom, 6.5, rawDt);
      st.currentExploded = THREE.MathUtils.damp(st.currentExploded, st.targetExploded, 6.0, rawDt);

      // Smooth damped camera preset transitions
      if (st.cameraTransitionActive) {
        const dampFactor = 1 - Math.exp(-5.5 * rawDt);
        _targetCamPos.copy(st.desiredCamPos);
        _targetLookAt.copy(st.desiredLookAt);

        camera.position.lerp(_targetCamPos, dampFactor);
        controls.target.lerp(_targetLookAt, dampFactor);

        if (
          camera.position.distanceToSquared(_targetCamPos) < 0.0015 &&
          controls.target.distanceToSquared(_targetLookAt) < 0.0015
        ) {
          camera.position.copy(_targetCamPos);
          controls.target.copy(_targetLookAt);
          st.cameraTransitionActive = false;
        }
      }

      controls.update();

      // Update 3D Mechanical Tulip Automaton
      automaton.update(
        st.currentBloom,
        st.currentExploded,
        elapsedSimTime,
        rawDt,
        st.showCloche,
        st.selectedSubsystem,
      );

      // Update Web Audio escapement impulse
      soundEngine.updateEscapementTick(now, st.currentBloom, st.speedMultiplier);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    // Perform initial synchronous render and start loop
    automaton.update(
      stateRef.current.currentBloom,
      stateRef.current.currentExploded,
      0,
      0.016,
      stateRef.current.showCloche,
      stateRef.current.selectedSubsystem,
    );
    renderer.render(scene, camera);
    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      controls.removeEventListener('start', onControlsStart);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      automaton.dispose();
      textures.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      ringMat.dispose();
      ringGeos.forEach((g) => g.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={canvasMountRef}
      className="fixed inset-0 w-screen h-screen overflow-hidden z-0"
      aria-label="Interactive 3D Mechanical Tulip Automaton Viewport"
    />
  );
}

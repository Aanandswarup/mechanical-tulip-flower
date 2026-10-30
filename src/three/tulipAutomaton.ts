import * as THREE from 'three';
import {
  FinishId,
   FINISH_PALETTES,
  SubsystemId,
  computeTulipKinematics,
  getExplodedOffset,
} from '../utils/kinematics';
import { ProceduralTextureSet } from './proceduralTextures';

export interface TulipAutomatonRig {
  root: THREE.Group;
  interactables: THREE.Object3D[];
  corePointLight: THREE.PointLight;
  update: (
    bloom: number,
    exploded: number,
    elapsedTime: number,
    deltaTime: number,
    showCloche: boolean,
    selectedSubsystem: SubsystemId | null,
  ) => void;
  applyFinish: (finishId: FinishId) => void;
  dispose: () => void;
}

/**
 * Generates an involute-style horological gear BufferGeometry with spoked cutouts and bevels.
 */
function createHorologicalGearGeometry(
  teeth: number,
  outerRadius: number,
  innerRadius: number,
  thickness: number,
  spokeCount = 5,
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const step = (Math.PI * 2) / teeth;
  const rootR = outerRadius * 0.87;
  const pitchR = outerRadius * 0.94;

  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.22;
    const a2 = a0 + step * 0.36;
    const a3 = a0 + step * 0.64;
    const a4 = a0 + step * 0.78;

    const p0x = Math.cos(a0) * rootR;
    const p0y = Math.sin(a0) * rootR;
    if (i === 0) shape.moveTo(p0x, p0y);
    else shape.lineTo(p0x, p0y);

    shape.lineTo(Math.cos(a1) * pitchR, Math.sin(a1) * pitchR);
    shape.lineTo(Math.cos(a2) * outerRadius, Math.sin(a2) * outerRadius);
    shape.lineTo(Math.cos(a3) * outerRadius, Math.sin(a3) * outerRadius);
    shape.lineTo(Math.cos(a4) * pitchR, Math.sin(a4) * pitchR);
  }
  shape.closePath();

  // Central arbor bore hole
  const boreHole = new THREE.Path();
  boreHole.absarc(0, 0, innerRadius * 0.38, 0, Math.PI * 2, true);
  shape.holes.push(boreHole);

  // Spoked lightening cutouts if gear is large enough
  if (spokeCount > 0 && innerRadius > 0.16) {
    const windowInner = innerRadius * 0.52;
    const windowOuter = rootR * 0.78;
    const spokeSector = (Math.PI * 2) / spokeCount;
    const padAngle = 0.16;

    for (let s = 0; s < spokeCount; s++) {
      const startA = s * spokeSector + padAngle;
      const endA = (s + 1) * spokeSector - padAngle;
      if (endA > startA + 0.1) {
        const hole = new THREE.Path();
        hole.moveTo(Math.cos(startA) * windowInner, Math.sin(startA) * windowInner);
        hole.absarc(0, 0, windowOuter, startA, endA, false);
        hole.lineTo(Math.cos(endA) * windowInner, Math.sin(endA) * windowInner);
        hole.absarc(0, 0, windowInner, endA, startA, true);
        shape.holes.push(hole);
      }
    }
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: Math.min(0.014, thickness * 0.22),
    bevelSize: Math.min(0.012, thickness * 0.2),
    bevelSegments: 2,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -thickness * 0.5, 0);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates a double-curved cupped tulip petal shell BufferGeometry pivoted at its basal hinge (0,0,0).
 */
function createCuppedPetalGeometry(
  height: number,
  maxWidth: number,
  cupDepth: number,
  thickness: number,
): THREE.BufferGeometry {
  const uSegs = 20;
  const vSegs = 28;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Build front and back surfaces for solid thickness
  for (let side = 0; side < 2; side++) {
    const zOffsetSign = side === 0 ? 1 : -1;
    for (let iv = 0; iv <= vSegs; iv++) {
      const v = iv / vSegs; // 0 at base hinge -> 1 at petal apex
      // Width profile of a classic tulip petal: narrow base, broad middle-upper belly, pointed tip
      const widthEnvelope =
        Math.sin(Math.pow(v, 0.72) * Math.PI) * (1 - 0.12 * Math.pow(v, 3)) +
        (1 - v) * 0.18;
      const halfW = maxWidth * 0.5 * widthEnvelope;

      // Longitudinal S-curve (cups inward then flares slightly at the very tip)
      const longitudinalZ =
        Math.sin(v * Math.PI * 0.92) * cupDepth * 0.85 -
        Math.pow(v, 3.2) * cupDepth * 0.22;

      for (let iu = 0; iu <= uSegs; iu++) {
        const u = iu / uSegs; // 0 to 1 across width
        const symU = (u - 0.5) * 2; // -1 to +1
        const x = symU * halfW;
        const y = v * height;

        // Transverse cupping (parabolic dish across width)
        const transverseCup = (1 - symU * symU) * cupDepth * 0.52 * Math.sin(v * Math.PI);
        // Subtle central keel ridge
        const keelRidge = Math.exp(-symU * symU * 18) * 0.018 * Math.sin(v * Math.PI);
        const halfThick = thickness * 0.5 * (1 - 0.45 * v);

        const z = longitudinalZ + transverseCup + keelRidge + zOffsetSign * halfThick;
        positions.push(x, y, z);
        uvs.push(u, v);
      }
    }
  }

  const stride = uSegs + 1;
  const vertsPerSide = (vSegs + 1) * stride;

  // Front surface triangles
  for (let iv = 0; iv < vSegs; iv++) {
    for (let iu = 0; iu < uSegs; iu++) {
      const a = iv * stride + iu;
      const b = a + 1;
      const c = (iv + 1) * stride + iu;
      const d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }

  // Back surface triangles (reversed winding)
  for (let iv = 0; iv < vSegs; iv++) {
    for (let iu = 0; iu < uSegs; iu++) {
      const a = vertsPerSide + iv * stride + iu;
      const b = a + 1;
      const c = vertsPerSide + (iv + 1) * stride + iu;
      const d = c + 1;
      indices.push(a, d, b, a, c, d);
    }
  }

  // Stitch perimeter edges between front and back
  for (let iv = 0; iv < vSegs; iv++) {
    // Left edge (iu = 0)
    const f0 = iv * stride;
    const f1 = (iv + 1) * stride;
    const b0 = vertsPerSide + f0;
    const b1 = vertsPerSide + f1;
    indices.push(f0, f1, b1, f0, b1, b0);

    // Right edge (iu = uSegs)
    const rf0 = iv * stride + uSegs;
    const rf1 = (iv + 1) * stride + uSegs;
    const rb0 = vertsPerSide + rf0;
    const rb1 = vertsPerSide + rf1;
    indices.push(rf0, rb1, rf1, rf0, rb0, rb1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Tags a Group and all of its descendant Meshes with a SubsystemId and enables raycast layer 1.
 */
function tagSubsystem(
  obj: THREE.Object3D,
  subsystemId: SubsystemId,
  interactables: THREE.Object3D[],
): void {
  obj.userData.subsystemId = subsystemId;
  obj.traverse((child) => {
    child.userData.subsystemId = subsystemId;
    if ((child as THREE.Mesh).isMesh) {
      child.layers.enable(1);
      interactables.push(child);
    }
  });
}

export function createTulipAutomaton(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
  initialFinish: FinishId = 'gilded-brass',
): TulipAutomatonRig {
  const root = new THREE.Group();
  const interactables: THREE.Object3D[] = [];
  const geometriesToDispose: THREE.BufferGeometry[] = [];
  const materialsToDispose: THREE.Material[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometriesToDispose.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materialsToDispose.push(m);
    return m;
  };

  // --- Shared PBR Material Library (varied roughness & metalness across adjacent parts) ---
  const palette = FINISH_PALETTES[initialFinish];

  const primaryBrassMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(palette.primaryMetal),
      metalness: 0.92,
      roughness: 0.2,
      bumpMap: textures.brushedMetalBump,
      bumpScale: 0.008,
      anisotropy: isSoftwareGl ? 0 : 0.75,
      anisotropyRotation: Math.PI * 0.25,
      clearcoat: 0.25,
      clearcoatRoughness: 0.18,
    }),
  );

  const secondarySteelMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(palette.secondaryMetal),
      metalness: 0.88,
      roughness: 0.46, // >= 0.25 roughness delta vs primaryBrassMat (0.20)
      bumpMap: textures.genevaStripeBump,
      bumpScale: 0.012,
      clearcoat: 0.35,
    }),
  );

  const accentPolishedMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(palette.accentMetal),
      metalness: 0.96,
      roughness: 0.1,
    }),
  );

  const outerPetalMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(palette.petalOuter),
      metalness: 0.35,
      roughness: 0.28,
      bumpMap: textures.petalFiligreeBump,
      bumpScale: 0.022,
      clearcoat: 0.85,
      clearcoatRoughness: 0.14,
      sheen: 0.65,
      sheenColor: new THREE.Color(palette.petalSheen),
      sheenRoughness: 0.35,
    }),
  );

  const innerPetalMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(palette.petalInner),
      metalness: 0.28,
      roughness: 0.22,
      bumpMap: textures.petalFiligreeBump,
      bumpScale: 0.018,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      sheen: 0.8,
      sheenColor: new THREE.Color(palette.petalSheen),
      sheenRoughness: 0.28,
    }),
  );

  const stemAlloyMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.stemMetal),
      metalness: 0.78,
      roughness: 0.52,
      bumpMap: textures.brushedMetalBump,
      bumpScale: 0.01,
    }),
  );

  const leafBladeMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(palette.leafSurface),
      metalness: 0.45,
      roughness: 0.58,
      bumpMap: textures.brushedMetalBump,
      bumpScale: 0.015,
      clearcoat: 0.35,
      clearcoatRoughness: 0.3,
    }),
  );

  const ebonyPlinthMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.plinthBase),
      metalness: 0.15,
      roughness: 0.72,
      bumpMap: textures.brushedMetalBump,
      bumpScale: 0.006,
    }),
  );

  const crystalCoreMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(palette.crystalCore),
      emissive: new THREE.Color(palette.crystalCore),
      emissiveIntensity: 0.65,
      metalness: 0.05,
      roughness: 0.08,
      transmission: isSoftwareGl ? 0 : 0.88,
      transparent: true,
      opacity: isSoftwareGl ? 0.82 : 1.0,
      ior: 1.77,
      thickness: 1.2,
      clearcoat: 1.0,
    }),
  );

  const clocheGlassMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#eef6ff'),
      metalness: 0.0,
      roughness: 0.05,
      transmission: isSoftwareGl ? 0 : 0.92,
      transparent: true,
      opacity: isSoftwareGl ? 0.16 : 0.32,
      ior: 1.48,
      thickness: 0.35,
      clearcoat: 1.0,
      depthWrite: false,
      side: THREE.FrontSide,
    }),
  );

  const chapterDialMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: textures.chapterRingMap,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );

  // Soft Radial Contact Shadow Plane at y = 0.015
  const contactShadowMesh = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(4.6, 4.6)),
    trackMat(
      new THREE.MeshBasicMaterial({
        map: textures.contactShadowMap,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
      }),
    ),
  );
  contactShadowMesh.rotation.x = -Math.PI / 2;
  contactShadowMesh.position.y = 0.012;
  root.add(contactShadowMesh);

  // ============================================================================
  // SUB-01: Chronometric Plinth & Mainspring Barrel (Grounded at y = 0)
  // ============================================================================
  const plinthGroup = new THREE.Group();
  root.add(plinthGroup);

  // Sculpted Lathe Pedestal Base
  const plinthLathePoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(1.42, 0.0),
    new THREE.Vector2(1.42, 0.08),
    new THREE.Vector2(1.32, 0.14),
    new THREE.Vector2(1.26, 0.28),
    new THREE.Vector2(1.34, 0.34),
    new THREE.Vector2(1.18, 0.42),
    new THREE.Vector2(1.12, 0.62),
    new THREE.Vector2(1.18, 0.68),
    new THREE.Vector2(0.96, 0.74),
    new THREE.Vector2(0.0, 0.74),
  ];
  const plinthBodyMesh = new THREE.Mesh(
    trackGeo(new THREE.LatheGeometry(plinthLathePoints, 48)),
    ebonyPlinthMat,
  );
  plinthBodyMesh.castShadow = true;
  plinthBodyMesh.receiveShadow = true;
  plinthGroup.add(plinthBodyMesh);

  // Milled Brass Bezel Rings around the Plinth
  const lowerBezelMesh = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(1.33, 0.032, 16, 48)),
    primaryBrassMat,
  );
  lowerBezelMesh.rotation.x = Math.PI / 2;
  lowerBezelMesh.position.y = 0.34;
  plinthGroup.add(lowerBezelMesh);

  const upperBezelMesh = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(1.15, 0.035, 16, 48)),
    primaryBrassMat,
  );
  upperBezelMesh.rotation.x = Math.PI / 2;
  upperBezelMesh.position.y = 0.68;
  plinthGroup.add(upperBezelMesh);

  // Horological Movement Bridge Plate (y = 0.75)
  const bridgePlateMesh = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.95, 0.98, 0.06, 48)),
    secondarySteelMat,
  );
  bridgePlateMesh.position.y = 0.76;
  bridgePlateMesh.receiveShadow = true;
  plinthGroup.add(bridgePlateMesh);

  // Engraved 360° Azimuth Chapter Ring Decal (offset +0.02 above bridge plate)
  const chapterDialMesh = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(2.26, 2.26)),
    chapterDialMat,
  );
  chapterDialMesh.rotation.x = -Math.PI / 2;
  chapterDialMesh.position.y = 0.795;
  plinthGroup.add(chapterDialMesh);

  // 4 Architectural Brass Bridge Pillars supporting the upper movement plate
  const pillarGeo = trackGeo(new THREE.CylinderGeometry(0.055, 0.065, 0.42, 16));
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const pillar = new THREE.Mesh(pillarGeo, primaryBrassMat);
    pillar.position.set(Math.cos(angle) * 0.74, 1.0, Math.sin(angle) * 0.74);
    pillar.castShadow = true;
    plinthGroup.add(pillar);
  }

  tagSubsystem(plinthGroup, 'plinth-barrel', interactables);

  // ============================================================================
  // SUB-02: Epicyclic Planetary Gear Train (Meshed inside the open-worked plinth)
  // ============================================================================
  const gearTrainGroup = new THREE.Group();
  gearTrainGroup.position.y = 0.88;
  root.add(gearTrainGroup);

  // Central Mainspring Crown Gear (48 teeth)
  const centralCrownGear = new THREE.Mesh(
    trackGeo(createHorologicalGearGeometry(48, 0.54, 0.24, 0.065, 6)),
    primaryBrassMat,
  );
  centralCrownGear.castShadow = true;
  gearTrainGroup.add(centralCrownGear);

  // 3 Planetary Pinion Gears (18 teeth) orbiting at 120° intervals
  const planetaryGears: THREE.Mesh[] = [];
  const planetGearGeo = trackGeo(createHorologicalGearGeometry(18, 0.23, 0.09, 0.055, 3));
  const planetArborGeo = trackGeo(new THREE.CylinderGeometry(0.032, 0.032, 0.28, 12));

  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const dist = 0.54 + 0.21;
    const pGear = new THREE.Mesh(planetGearGeo, secondarySteelMat);
    pGear.position.set(Math.cos(angle) * dist, 0.05, Math.sin(angle) * dist);
    pGear.castShadow = true;
    gearTrainGroup.add(pGear);
    planetaryGears.push(pGear);

    const arbor = new THREE.Mesh(planetArborGeo, accentPolishedMat);
    arbor.position.set(Math.cos(angle) * dist, 0.05, Math.sin(angle) * dist);
    gearTrainGroup.add(arbor);
  }

  // Upper Horological Skeleton Ring Bridge
  const upperBridgeGear = new THREE.Mesh(
    trackGeo(createHorologicalGearGeometry(36, 0.42, 0.22, 0.05, 5)),
    primaryBrassMat,
  );
  upperBridgeGear.position.y = 0.24;
  gearTrainGroup.add(upperBridgeGear);

  tagSubsystem(gearTrainGroup, 'planetary-gears', interactables);

  // ============================================================================
  // SUB-03: Articulated Vertebral Stem & Coaxial Lead Screw
  // ============================================================================
  const stemGroup = new THREE.Group();
  root.add(stemGroup);

  // Central Coaxial Lead Screw Shaft (y = 0.8 to 3.45)
  const leadScrewMesh = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.085, 0.095, 2.65, 24)),
    accentPolishedMat,
  );
  leadScrewMesh.position.y = 2.12;
  leadScrewMesh.castShadow = true;
  stemGroup.add(leadScrewMesh);

  // Helical Acme Thread Ridge wrapped around the lead screw
  const helixPoints: THREE.Vector3[] = [];
  const helixTurns = 16;
  for (let i = 0; i <= 160; i++) {
    const t = i / 160;
    const a = t * Math.PI * 2 * helixTurns;
    helixPoints.push(
      new THREE.Vector3(Math.cos(a) * 0.096, 1.05 + t * 2.15, Math.sin(a) * 0.096),
    );
  }
  const leadHelixMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPoints), 140, 0.014, 6, false)),
    primaryBrassMat,
  );
  stemGroup.add(leadHelixMesh);

  // 8 Articulated Vertebral Stem Collars along the lower/middle stem
  const vertebraLathe = [
    new THREE.Vector2(0.11, -0.09),
    new THREE.Vector2(0.19, -0.06),
    new THREE.Vector2(0.22, 0.0),
    new THREE.Vector2(0.19, 0.06),
    new THREE.Vector2(0.11, 0.09),
  ];
  const vertebraGeo = trackGeo(new THREE.LatheGeometry(vertebraLathe, 24));
  const ringWasherGeo = trackGeo(new THREE.TorusGeometry(0.18, 0.018, 10, 24));

  for (let v = 0; v < 8; v++) {
    const vy = 1.26 + v * 0.22;
    const vMesh = new THREE.Mesh(vertebraGeo, v % 2 === 0 ? stemAlloyMat : secondarySteelMat);
    vMesh.position.y = vy;
    vMesh.castShadow = true;
    stemGroup.add(vMesh);

    const washer = new THREE.Mesh(ringWasherGeo, primaryBrassMat);
    washer.rotation.x = Math.PI / 2;
    washer.position.y = vy + 0.09;
    stemGroup.add(washer);
  }

  // Twin Vertical Anti-Rotation Linear Guide Rods (x = ±0.25, y = 2.28 to 3.28)
  // These physically prevent the sliding Drive Collar from spinning with the lead screw!
  const guideRodGeo = trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 1.04, 12));
  const lowerGuideAnchor = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.32, 0.24, 0.06, 24)),
    secondarySteelMat,
  );
  lowerGuideAnchor.position.y = 2.28;
  stemGroup.add(lowerGuideAnchor);

  for (const side of [-1, 1]) {
    const guideRod = new THREE.Mesh(guideRodGeo, accentPolishedMat);
    guideRod.position.set(side * 0.25, 2.78, 0);
    guideRod.castShadow = true;
    stemGroup.add(guideRod);
  }

  // Twin External Capillary Conduits (TubeGeometry curving gracefully from Gearbox to Calyx)
  for (const side of [-1, 1]) {
    const conduitCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.05, side * 0.44),
      new THREE.Vector3(side * 0.12, 1.55, side * 0.34),
      new THREE.Vector3(-side * 0.1, 2.25, side * 0.26),
      new THREE.Vector3(0, 2.95, side * 0.32),
      new THREE.Vector3(0, 3.26, side * 0.44),
    ]);
    const conduitMesh = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(conduitCurve, 48, 0.024, 10, false)),
      primaryBrassMat,
    );
    conduitMesh.castShadow = true;
    stemGroup.add(conduitMesh);
  }

  // Upper Calyx Receptacle Cup (Fixed Anchor at y = 3.22)
  const calyxLathe = [
    new THREE.Vector2(0.1, 0.0),
    new THREE.Vector2(0.32, 0.06),
    new THREE.Vector2(0.56, 0.16),
    new THREE.Vector2(0.62, 0.24),
    new THREE.Vector2(0.46, 0.26),
    new THREE.Vector2(0.12, 0.18),
  ];
  const calyxCupMesh = new THREE.Mesh(
    trackGeo(new THREE.LatheGeometry(calyxLathe, 36)),
    primaryBrassMat,
  );
  calyxCupMesh.position.y = 3.22;
  calyxCupMesh.castShadow = true;
  stemGroup.add(calyxCupMesh);

  tagSubsystem(stemGroup, 'vertebral-stem', interactables);

  // ============================================================================
  // SUB-04: Linear Actuator Calyx Drive Collar (Slides vertically on Lead Screw & Guide Rods)
  // ============================================================================
  const driveCollarGroup = new THREE.Group();
  driveCollarGroup.position.y = 2.65; // Dynamic: slides from 2.48 (closed) to 3.00 (open)
  root.add(driveCollarGroup);

  // Stepped Phosphor-Bronze Lead Nut & Clevis Ring (no unmeshed outer gear teeth!)
  const collarLathePoints = [
    new THREE.Vector2(0.11, -0.13),
    new THREE.Vector2(0.28, -0.13),
    new THREE.Vector2(0.31, -0.07),
    new THREE.Vector2(0.38, -0.04),
    new THREE.Vector2(0.38, 0.07),
    new THREE.Vector2(0.31, 0.1),
    new THREE.Vector2(0.24, 0.14),
    new THREE.Vector2(0.11, 0.14),
  ];
  const collarSleeveMesh = new THREE.Mesh(
    trackGeo(new THREE.LatheGeometry(collarLathePoints, 36)),
    primaryBrassMat,
  );
  collarSleeveMesh.castShadow = true;
  driveCollarGroup.add(collarSleeveMesh);

  // Precision Blued-Steel Tension Band around the Clevis Collar
  const collarBandMesh = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.386, 0.386, 0.055, 36, 1, true)),
    secondarySteelMat,
  );
  collarBandMesh.position.y = 0.015;
  driveCollarGroup.add(collarBandMesh);

  // Twin Linear Ball-Bushing Sleeves riding on the ±0.25 Vertical Guide Rods
  const bushingGeo = trackGeo(new THREE.CylinderGeometry(0.052, 0.052, 0.32, 16));
  for (const side of [-1, 1]) {
    const bushing = new THREE.Mesh(bushingGeo, secondarySteelMat);
    bushing.position.set(side * 0.25, 0.01, 0);
    driveCollarGroup.add(bushing);
  }

  // 6 Radial Clevis Fork Lugs on the Drive Collar for the 6 Petal Tie-Rods
  const clevisLugGeo = trackGeo(new THREE.BoxGeometry(0.12, 0.09, 0.085));
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const lug = new THREE.Mesh(clevisLugGeo, accentPolishedMat);
    lug.position.set(Math.cos(a) * 0.38, 0.02, Math.sin(a) * 0.38);
    lug.rotation.y = -a;
    driveCollarGroup.add(lug);
  }

  tagSubsystem(driveCollarGroup, 'drive-collar', interactables);

  // ============================================================================
  // SUB-05, SUB-06, SUB-07: Six-Fold Petals (3 Outer, 3 Inner) & 4-Bar Linkages
  // ============================================================================
  const outerPetalPivots: {
    wrapper: THREE.Group;
    hinge: THREE.Group;
    azimuthRad: number;
  }[] = [];

  const innerPetalPivots: {
    wrapper: THREE.Group;
    hinge: THREE.Group;
    azimuthRad: number;
  }[] = [];

  const linkageStruts: {
    wrapper: THREE.Group;
    rod: THREE.Mesh;
    clevisTop: THREE.Mesh;
    clevisBottom: THREE.Mesh;
    azimuthRad: number;
    isOuter: boolean;
  }[] = [];

  const outerPetalShellGeo = trackGeo(createCuppedPetalGeometry(1.72, 0.86, 0.34, 0.045));
  const innerPetalShellGeo = trackGeo(createCuppedPetalGeometry(1.58, 0.76, 0.3, 0.04));

  // Dorsal Brass Exoskeleton Spine Curve for each Petal
  const spineCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.02, 0.03),
    new THREE.Vector3(0, 0.45, 0.24),
    new THREE.Vector3(0, 1.05, 0.31),
    new THREE.Vector3(0, 1.56, 0.12),
  ]);
  const dorsalSpineGeo = trackGeo(new THREE.TubeGeometry(spineCurve, 28, 0.026, 8, false));
  const hingeKnuckleGeo = trackGeo(new THREE.CylinderGeometry(0.06, 0.06, 0.24, 16));
  hingeKnuckleGeo.rotateZ(Math.PI / 2);

  const strutRodGeo = trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 1.0, 12));
  const clevisJointGeo = trackGeo(new THREE.SphereGeometry(0.048, 12, 12));

  for (let i = 0; i < 6; i++) {
    const isOuter = i % 2 === 0; // 0, 2, 4 = Outer Whorl; 1, 3, 5 = Inner Whorl (60° interleaved)
    const azimuthRad = (i * Math.PI) / 3;
    const hingeRadius = isOuter ? 0.54 : 0.44;
    const hingeY = isOuter ? 3.38 : 3.44;

    const petalWrapper = new THREE.Group();
    petalWrapper.position.set(
      Math.cos(azimuthRad) * hingeRadius,
      hingeY,
      Math.sin(azimuthRad) * hingeRadius,
    );
    // Orient local +Z radially outward from the flower center
    petalWrapper.rotation.y = Math.PI / 2 - azimuthRad;
    root.add(petalWrapper);

    const petalHinge = new THREE.Group();
    petalWrapper.add(petalHinge);

    // 1. Primary Cupped Petal Shell
    const shellMesh = new THREE.Mesh(
      isOuter ? outerPetalShellGeo : innerPetalShellGeo,
      isOuter ? outerPetalMat : innerPetalMat,
    );
    shellMesh.scale.z = -1;
    shellMesh.castShadow = true;
    shellMesh.receiveShadow = true;
    petalHinge.add(shellMesh);

    // 2. Dorsal Mechanical Exoskeleton Spine & Heel Bracket
    const spineMesh = new THREE.Mesh(dorsalSpineGeo, primaryBrassMat);
    spineMesh.scale.z = -1;
    spineMesh.position.z = 0.025;
    spineMesh.castShadow = true;
    petalHinge.add(spineMesh);

    // 3. Basal Hinge Knuckle & Lateral Filigree Frame Ribs
    const knuckleMesh = new THREE.Mesh(hingeKnuckleGeo, accentPolishedMat);
    petalHinge.add(knuckleMesh);

    for (const side of [-1, 1]) {
      const flankCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.08, 0.08, -0.02),
        new THREE.Vector3(side * 0.34, 0.65, -0.18),
        new THREE.Vector3(side * 0.28, 1.25, -0.16),
        new THREE.Vector3(0, 1.62, -0.06),
      ]);
      const flankRib = new THREE.Mesh(
        trackGeo(new THREE.TubeGeometry(flankCurve, 20, 0.014, 6, false)),
        primaryBrassMat,
      );
      petalHinge.add(flankRib);
    }

    if (isOuter) {
      outerPetalPivots.push({ wrapper: petalWrapper, hinge: petalHinge, azimuthRad });
      tagSubsystem(petalWrapper, 'outer-petals', interactables);
    } else {
      innerPetalPivots.push({ wrapper: petalWrapper, hinge: petalHinge, azimuthRad });
      tagSubsystem(petalWrapper, 'inner-petals', interactables);
    }

    // Four-Bar Linkage Tie-Rod connecting Drive Collar Lug to Petal Heel
    const strutWrapper = new THREE.Group();
    root.add(strutWrapper);

    const rodMesh = new THREE.Mesh(strutRodGeo, accentPolishedMat);
    rodMesh.castShadow = true;
    strutWrapper.add(rodMesh);

    const clevisTop = new THREE.Mesh(clevisJointGeo, primaryBrassMat);
    const clevisBottom = new THREE.Mesh(clevisJointGeo, primaryBrassMat);
    strutWrapper.add(clevisTop, clevisBottom);

    linkageStruts.push({
      wrapper: strutWrapper,
      rod: rodMesh,
      clevisTop,
      clevisBottom,
      azimuthRad,
      isOuter,
    });
    tagSubsystem(strutWrapper, 'four-bar-linkages', interactables);
  }

  // ============================================================================
  // SUB-08: Coaxial Calyx Escapement & Sun-Planet Differential (Seated inside Calyx Cup)
  // ============================================================================
  // Every gear here is horizontally aligned, mounted on real arbors & bridge arms,
  // and physically meshes tooth-to-tooth around the central axis!
  const tourbillonGroup = new THREE.Group();
  tourbillonGroup.position.y = 3.44;
  root.add(tourbillonGroup);

  // 1. Central Coaxial Sun Gear (24 teeth, pitch radius ~0.185) driven by the lead screw arbor
  const calyxSunGear = new THREE.Mesh(
    trackGeo(createHorologicalGearGeometry(24, 0.195, 0.08, 0.036, 4)),
    secondarySteelMat,
  );
  calyxSunGear.position.y = 0.02;
  tourbillonGroup.add(calyxSunGear);

  // 2. Three Meshing Planetary Pinions (12 teeth, pitch radius ~0.095) at center-to-center distance = 0.28
  const calyxPlanetGears: THREE.Mesh[] = [];
  const calyxPlanetGeo = trackGeo(createHorologicalGearGeometry(12, 0.105, 0.04, 0.036, 0));
  const calyxPinionArborGeo = trackGeo(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 12));
  const bridgeArmGeo = trackGeo(new THREE.BoxGeometry(0.32, 0.022, 0.055));
  const jewelChatonGeo = trackGeo(new THREE.CylinderGeometry(0.034, 0.038, 0.026, 16));

  // Rotating 3-arm Horological Carriage Bridge holding the 3 planet pinions
  const calyxCarriageGroup = new THREE.Group();
  tourbillonGroup.add(calyxCarriageGroup);

  const carriageHubRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.28, 0.016, 12, 36)),
    primaryBrassMat,
  );
  carriageHubRing.rotation.x = Math.PI / 2;
  carriageHubRing.position.y = 0.065;
  calyxCarriageGroup.add(carriageHubRing);

  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const meshDist = 0.28; // Exact tooth-to-tooth engagement with calyxSunGear!

    const pGear = new THREE.Mesh(calyxPlanetGeo, primaryBrassMat);
    pGear.position.set(Math.cos(a) * meshDist, 0.02, Math.sin(a) * meshDist);
    // Phase-align teeth so 12T planet meshes into 24T sun valleys
    pGear.rotation.y = -a * 2 + Math.PI / 12;
    calyxCarriageGroup.add(pGear);
    calyxPlanetGears.push(pGear);

    // Vertical steel arbor shaft for each planet pinion
    const arbor = new THREE.Mesh(calyxPinionArborGeo, accentPolishedMat);
    arbor.position.set(Math.cos(a) * meshDist, 0.03, Math.sin(a) * meshDist);
    calyxCarriageGroup.add(arbor);

    // Radial brass bridge arm & synthetic ruby jewel chaton cap supporting the top of the arbor
    const arm = new THREE.Mesh(bridgeArmGeo, primaryBrassMat);
    arm.position.set(Math.cos(a) * (meshDist * 0.55), 0.075, Math.sin(a) * (meshDist * 0.55));
    arm.rotation.y = -a;
    calyxCarriageGroup.add(arm);

    const chaton = new THREE.Mesh(jewelChatonGeo, crystalCoreMat);
    chaton.position.set(Math.cos(a) * meshDist, 0.088, Math.sin(a) * meshDist);
    calyxCarriageGroup.add(chaton);
  }

  // 3. Coaxial Oscillating Balance Wheel with 4 Timing Poise Screws & Spiral Hairspring (y = 0.14)
  const balanceWheelGroup = new THREE.Group();
  balanceWheelGroup.position.y = 0.14;
  tourbillonGroup.add(balanceWheelGroup);

  const balanceRim = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.34, 0.018, 12, 40)),
    primaryBrassMat,
  );
  balanceRim.rotation.x = Math.PI / 2;
  balanceWheelGroup.add(balanceRim);

  // Cross-bar spoke of the balance wheel
  const balanceSpokeGeo = trackGeo(new THREE.CylinderGeometry(0.012, 0.012, 0.68, 10));
  balanceSpokeGeo.rotateZ(Math.PI / 2);
  const balanceSpoke = new THREE.Mesh(balanceSpokeGeo, primaryBrassMat);
  balanceWheelGroup.add(balanceSpoke);

  // 4 Micro-Poise Timing Weights on the Balance Wheel Rim
  const poiseWeightGeo = trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.05, 10));
  poiseWeightGeo.rotateZ(Math.PI / 2);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const poise = new THREE.Mesh(poiseWeightGeo, accentPolishedMat);
    poise.position.set(Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35);
    poise.rotation.y = -a;
    balanceWheelGroup.add(poise);
  }

  // Flat Spiral Breguet Hairspring inside the Balance Wheel
  const hairspringPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 90; i++) {
    const t = i / 90;
    const spiralA = t * Math.PI * 2 * 3.5;
    const spiralR = 0.09 + t * 0.16;
    hairspringPts.push(new THREE.Vector3(Math.cos(spiralA) * spiralR, 0, Math.sin(spiralA) * spiralR));
  }
  const hairspringMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hairspringPts), 72, 0.006, 6, false)),
    accentPolishedMat,
  );
  balanceWheelGroup.add(hairspringMesh);

  tagSubsystem(tourbillonGroup, 'tourbillon-core', interactables);

  // ============================================================================
  // SUB-09: Telescopic Stamen Filaments (×6) & Trifid Stigma Optical Crystal Pistil
  // ============================================================================
  const stamensGroup = new THREE.Group();
  stamensGroup.position.y = 3.52;
  root.add(stamensGroup);

  // Precision-Turned Brass Collet Pedestal seating the Optical Crystal Pistil
  const colletLathe = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.14, 0.0),
    new THREE.Vector2(0.16, 0.08),
    new THREE.Vector2(0.12, 0.14),
    new THREE.Vector2(0.15, 0.22),
    new THREE.Vector2(0.09, 0.25),
  ];
  const pistilColletMesh = new THREE.Mesh(
    trackGeo(new THREE.LatheGeometry(colletLathe, 24)),
    primaryBrassMat,
  );
  stamensGroup.add(pistilColletMesh);

  // Central Faceted Optical Crystal Pistil Column
  const pistilPrismMesh = new THREE.Mesh(
    trackGeo(new THREE.OctahedronGeometry(0.22, 1)),
    crystalCoreMat,
  );
  pistilPrismMesh.scale.set(0.78, 1.85, 0.78);
  pistilPrismMesh.position.y = 0.58;
  stamensGroup.add(pistilPrismMesh);

  // Three Vertical Filigree Cage Straps embracing the Crystal Prism & anchoring the Top Stigma Crown
  const stigmaCrownGroup = new THREE.Group();
  stigmaCrownGroup.position.y = 0.96;
  stamensGroup.add(stigmaCrownGroup);

  // Upper Collet Cap Ring
  const upperColletCap = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.075, 0.11, 0.06, 24)),
    primaryBrassMat,
  );
  stigmaCrownGroup.add(upperColletCap);

  // 3 Sculpted Botanical Trifid Stigma Lobes + 3 Filigree Meridian Cage Ribs (connecting top cap to base collet!)
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const lobeGroup = new THREE.Group();
    lobeGroup.rotation.y = a;
    stigmaCrownGroup.add(lobeGroup);

    // Graceful outward-curling botanical stigma lobe
    const lobeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.03, 0.02, 0),
      new THREE.Vector3(0.09, 0.09, 0),
      new THREE.Vector3(0.16, 0.11, 0),
      new THREE.Vector3(0.19, 0.06, 0),
    ]);
    const lobeMesh = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(lobeCurve, 16, 0.018, 8, false)),
      primaryBrassMat,
    );
    lobeGroup.add(lobeMesh);

    // Meridian cage rib running down the outside of the crystal prism to the lower collet
    const meridianCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.09, -0.02, 0),
      new THREE.Vector3(0.18, -0.36, 0),
      new THREE.Vector3(0.13, -0.73, 0),
    ]);
    const meridianRib = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(meridianCurve, 20, 0.011, 6, false)),
      accentPolishedMat,
    );
    lobeGroup.add(meridianRib);
  }

  // Glowing Coronal Cabochon Jewel nestled inside the Trifid Stigma Crown
  const coronalJewel = new THREE.Mesh(
    trackGeo(new THREE.OctahedronGeometry(0.058, 1)),
    crystalCoreMat,
  );
  coronalJewel.position.y = 0.06;
  stigmaCrownGroup.add(coronalJewel);

  // Warm PointLight inside the Optical Crystal Core
  const corePointLight = new THREE.PointLight(palette.crystalCore, 1.6, 4.5, 1.8);
  corePointLight.position.set(0, 0.62, 0);
  stamensGroup.add(corePointLight);

  // 6 Articulated Telescopic Stamen Filaments with Clevis Base & Two-Lobed Anther Capsules
  const stamenPivots: THREE.Group[] = [];
  const stamenBaseClevisGeo = trackGeo(new THREE.CylinderGeometry(0.032, 0.036, 0.06, 12));
  const lowerTubeGeo = trackGeo(new THREE.CylinderGeometry(0.022, 0.026, 0.52, 12));
  lowerTubeGeo.translate(0, 0.26, 0);
  const upperTubeGeo = trackGeo(new THREE.CylinderGeometry(0.014, 0.016, 0.46, 12));
  upperTubeGeo.translate(0, 0.48, 0);
  const antherCollarGeo = trackGeo(new THREE.CylinderGeometry(0.028, 0.02, 0.05, 12));
  const antherGemGeo = trackGeo(new THREE.OctahedronGeometry(0.062, 1));
  antherGemGeo.scale(0.68, 1.65, 0.68);

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + Math.PI / 6;
    const sPivot = new THREE.Group();
    sPivot.position.set(Math.cos(angle) * 0.25, 0.06, Math.sin(angle) * 0.25);
    sPivot.rotation.y = Math.PI / 2 - angle;
    stamensGroup.add(sPivot);

    const baseClevis = new THREE.Mesh(stamenBaseClevisGeo, secondarySteelMat);
    baseClevis.rotation.z = Math.PI / 2;
    sPivot.add(baseClevis);

    const lowerSheath = new THREE.Mesh(lowerTubeGeo, primaryBrassMat);
    sPivot.add(lowerSheath);

    const upperExtension = new THREE.Mesh(upperTubeGeo, accentPolishedMat);
    upperExtension.name = 'stamen-extension';
    sPivot.add(upperExtension);

    const antherCollar = new THREE.Mesh(antherCollarGeo, primaryBrassMat);
    antherCollar.position.y = 0.72;
    upperExtension.add(antherCollar);

    const antherGem = new THREE.Mesh(antherGemGeo, crystalCoreMat);
    antherGem.position.y = 0.81;
    upperExtension.add(antherGem);

    stamenPivots.push(sPivot);
  }

  tagSubsystem(stamensGroup, 'telescopic-stamens', interactables);

  // ============================================================================
  // SUB-10: Counter-Balanced Cauline Leaves with Stem Clevis Hinge Brackets (×2)
  // ============================================================================
  const leavesPivots: {
    wrapper: THREE.Group;
    hinge: THREE.Group;
    azimuthRad: number;
    baseY: number;
  }[] = [];

  const leafShellGeo = trackGeo(createCuppedPetalGeometry(1.85, 0.58, 0.22, 0.038));
  const leafClevisBracketGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.09, 0.12));
  const leafHingePinGeo = trackGeo(new THREE.CylinderGeometry(0.038, 0.038, 0.18, 14));
  leafHingePinGeo.rotateZ(Math.PI / 2);

  for (let i = 0; i < 2; i++) {
    const azimuthRad = i === 0 ? 0 : Math.PI; // Left & Right flanks
    const baseY = i === 0 ? 1.48 : 1.72;

    const leafWrapper = new THREE.Group();
    leafWrapper.position.set(Math.cos(azimuthRad) * 0.23, baseY, Math.sin(azimuthRad) * 0.23);
    leafWrapper.rotation.y = Math.PI / 2 - azimuthRad;
    root.add(leafWrapper);

    // Stem-side Clevis Mounting Bracket & Horizontal Hinge Pin (replaces the floating gear!)
    const clevisBracket = new THREE.Mesh(leafClevisBracketGeo, primaryBrassMat);
    clevisBracket.position.set(0, 0, -0.04);
    leafWrapper.add(clevisBracket);

    const hingePin = new THREE.Mesh(leafHingePinGeo, accentPolishedMat);
    leafWrapper.add(hingePin);

    const leafHinge = new THREE.Group();
    leafWrapper.add(leafHinge);

    const leafBlade = new THREE.Mesh(leafShellGeo, leafBladeMat);
    leafBlade.scale.z = -1;
    leafBlade.castShadow = true;
    leafBlade.receiveShadow = true;
    leafHinge.add(leafBlade);

    // Dorsal Brass Midrib Spine
    const midribMesh = new THREE.Mesh(dorsalSpineGeo, primaryBrassMat);
    midribMesh.scale.set(0.85, 1.05, -0.75);
    leafHinge.add(midribMesh);

    leavesPivots.push({ wrapper: leafWrapper, hinge: leafHinge, azimuthRad, baseY });
    tagSubsystem(leafWrapper, 'articulated-leaves', interactables);
  }

  // ============================================================================
  // SUB-11: Optional Borosilicate Exhibition Cloche Dome (Toggleable)
  // ============================================================================
  const clocheGroup = new THREE.Group();
  root.add(clocheGroup);

  const clocheProfile = [
    new THREE.Vector2(1.36, 0.36),
    new THREE.Vector2(1.36, 3.85),
    new THREE.Vector2(1.32, 4.35),
    new THREE.Vector2(1.16, 4.82),
    new THREE.Vector2(0.86, 5.22),
    new THREE.Vector2(0.42, 5.48),
    new THREE.Vector2(0.0, 5.56),
  ];
  const clocheBellMesh = new THREE.Mesh(
    trackGeo(new THREE.LatheGeometry(clocheProfile, 48)),
    clocheGlassMat,
  );
  clocheBellMesh.renderOrder = 10;
  clocheGroup.add(clocheBellMesh);

  // Brass Finial Knob atop the Glass Cloche
  const clocheFinial = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.11, 20, 20)),
    primaryBrassMat,
  );
  clocheFinial.position.y = 5.62;
  clocheGroup.add(clocheFinial);

  const clocheFinialCollar = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.14, 0.022, 12, 28)),
    primaryBrassMat,
  );
  clocheFinialCollar.rotation.x = Math.PI / 2;
  clocheFinialCollar.position.y = 5.54;
  clocheGroup.add(clocheFinialCollar);

  tagSubsystem(clocheGroup, 'glass-cloche', interactables);

  // ============================================================================
  // INSTANCED MESH (>20 repeated micro-rivets, chapter studs & jewel bearings)
  // ============================================================================
  const rivetCount = 96;
  const rivetGeo = trackGeo(new THREE.SphereGeometry(0.022, 8, 8));
  const rivetInstanced = new THREE.InstancedMesh(rivetGeo, accentPolishedMat, rivetCount);
  const dummy = new THREE.Object3D();
  let rIdx = 0;

  // 36 Perimeter Studs around the Lower Plinth Bezel
  for (let i = 0; i < 36; i++) {
    const a = (i * Math.PI * 2) / 36;
    dummy.position.set(Math.cos(a) * 1.35, 0.355, Math.sin(a) * 1.35);
    dummy.scale.setScalar(1.0);
    dummy.updateMatrix();
    rivetInstanced.setMatrixAt(rIdx++, dummy.matrix);
  }

  // 36 Perimeter Studs around the Upper Plinth Chapter Bezel
  for (let i = 0; i < 36; i++) {
    const a = (i * Math.PI * 2) / 36;
    dummy.position.set(Math.cos(a) * 1.15, 0.695, Math.sin(a) * 1.15);
    dummy.scale.setScalar(0.95);
    dummy.updateMatrix();
    rivetInstanced.setMatrixAt(rIdx++, dummy.matrix);
  }

  // 24 Micro-Bolts around the Calyx Receptacle & Stem Vertebrae
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI * 2) / 24;
    const yLevel = i < 12 ? 3.38 : 0.79;
    const rad = i < 12 ? 0.58 : 0.88;
    dummy.position.set(Math.cos(a) * rad, yLevel, Math.sin(a) * rad);
    dummy.scale.setScalar(0.85);
    dummy.updateMatrix();
    rivetInstanced.setMatrixAt(rIdx++, dummy.matrix);
  }

  rivetInstanced.instanceMatrix.needsUpdate = true;
  rivetInstanced.computeBoundingSphere();
  rivetInstanced.frustumCulled = false;
  plinthGroup.add(rivetInstanced);

  // Pre-allocated scratch vectors for zero-GC per-frame linkage updates
  const _collarPos = new THREE.Vector3();
  const _heelPos = new THREE.Vector3();
  const _midPos = new THREE.Vector3();
  const _upAxis = new THREE.Vector3(0, 1, 0);
  const _dirVec = new THREE.Vector3();

  // --- Update Function (Deterministic Kinematics + Exploded Assembly) ---
  const update = (
    bloom: number,
    exploded: number,
    elapsedTime: number,
    _deltaTime: number,
    showCloche: boolean,
    _selectedSubsystem: SubsystemId | null,
  ): void => {
    const k = computeTulipKinematics(bloom, exploded);

    // 1. Plinth & Planetary Gear Train
    const plinthOff = getExplodedOffset('plinth-barrel', exploded);
    plinthGroup.position.set(plinthOff[0], plinthOff[1], plinthOff[2]);

    const gearOff = getExplodedOffset('planetary-gears', exploded);
    gearTrainGroup.position.set(gearOff[0], 0.88 + gearOff[1], gearOff[2]);

    const leadAngle = k.bloom * Math.PI * 8 + elapsedTime * 0.35;
    centralCrownGear.rotation.y = leadAngle * 0.25;
    upperBridgeGear.rotation.y = -leadAngle * 0.33;
    for (let i = 0; i < planetaryGears.length; i++) {
      planetaryGears[i].rotation.y = -leadAngle * 0.66;
    }

    // 2. Vertebral Stem & Coaxial Lead Screw
    const stemOff = getExplodedOffset('vertebral-stem', exploded);
    stemGroup.position.set(stemOff[0], stemOff[1], stemOff[2]);
    leadScrewMesh.rotation.y = leadAngle;

    // 3. Linear Actuator Drive Collar (slides linearly on the twin guide rods — zero rotation!)
    const collarOff = getExplodedOffset('drive-collar', exploded);
    const collarBaseY = 2.48 + k.bloom * 0.52;
    driveCollarGroup.position.set(collarOff[0], collarBaseY + collarOff[1], collarOff[2]);

    // 4. Outer Petals (×3) & Inner Petals (×3)
    for (let i = 0; i < outerPetalPivots.length; i++) {
      const p = outerPetalPivots[i];
      const off = getExplodedOffset('outer-petals', exploded, p.azimuthRad);
      p.wrapper.position.set(
        Math.cos(p.azimuthRad) * 0.54 + off[0],
        3.38 + off[1],
        Math.sin(p.azimuthRad) * 0.54 + off[2],
      );
      p.hinge.rotation.x = k.outerPetalAngleRad;
    }

    for (let i = 0; i < innerPetalPivots.length; i++) {
      const p = innerPetalPivots[i];
      const off = getExplodedOffset('inner-petals', exploded, p.azimuthRad);
      p.wrapper.position.set(
        Math.cos(p.azimuthRad) * 0.44 + off[0],
        3.44 + off[1],
        Math.sin(p.azimuthRad) * 0.44 + off[2],
      );
      p.hinge.rotation.x = k.innerPetalAngleRad;
    }

    // 5. Six-Fold Four-Bar Linkage Struts (Connect Drive Collar Lugs to Petal Heels)
    for (let i = 0; i < linkageStruts.length; i++) {
      const st = linkageStruts[i];
      const lOff = getExplodedOffset('four-bar-linkages', exploded, st.azimuthRad);
      const cR = 0.38;
      const pR = st.isOuter ? 0.54 : 0.44;
      const pY = st.isOuter ? 3.38 : 3.44;
      const pitch = st.isOuter ? k.outerPetalAngleRad : k.innerPetalAngleRad;

      // Bottom clevis at drive collar lug
      _collarPos.set(
        Math.cos(st.azimuthRad) * cR + lOff[0],
        collarBaseY + 0.02 + lOff[1],
        Math.sin(st.azimuthRad) * cR + lOff[2],
      );

      // Top clevis at petal dorsal heel (0.28 units up the petal spine)
      const heelRadial = pR + Math.sin(pitch) * 0.28 + 0.06;
      const heelVertical = pY + Math.cos(pitch) * 0.28 - 0.04;
      _heelPos.set(
        Math.cos(st.azimuthRad) * heelRadial + lOff[0],
        heelVertical + lOff[1],
        Math.sin(st.azimuthRad) * heelRadial + lOff[2],
      );

      _midPos.addVectors(_collarPos, _heelPos).multiplyScalar(0.5);
      _dirVec.subVectors(_heelPos, _collarPos);
      const length = Math.max(0.05, _dirVec.length());
      _dirVec.normalize();

      st.rod.position.copy(_midPos);
      st.rod.scale.set(1, length, 1);
      st.rod.quaternion.setFromUnitVectors(_upAxis, _dirVec);

      st.clevisBottom.position.copy(_collarPos);
      st.clevisTop.position.copy(_heelPos);
    }

    // 6. Coaxial Calyx Escapement & Sun-Planet Differential (100% horizontal & meshed!)
    const tourbOff = getExplodedOffset('tourbillon-core', exploded);
    tourbillonGroup.position.set(tourbOff[0], 3.44 + tourbOff[1], tourbOff[2]);
    // Central sun gear rotates with the lead screw
    calyxSunGear.rotation.y = leadAngle;
    // 3-arm carriage orbits slowly while the 3 planet pinions counter-rotate at 2:1 ratio
    calyxCarriageGroup.rotation.y = elapsedTime * 0.45;
    for (let i = 0; i < calyxPlanetGears.length; i++) {
      const a = (i * Math.PI * 2) / 3;
      calyxPlanetGears[i].rotation.y = -leadAngle * 2.0 - a * 2 + Math.PI / 12;
    }
    // Balance wheel oscillates harmonically back and forth at 3 Hz like a true Swiss escapement
    balanceWheelGroup.rotation.y = Math.sin(elapsedTime * Math.PI * 3.0) * 0.85;

    // 7. Telescopic Stamens & Trifid Stigma Optical Pistil Core
    const stamenOff = getExplodedOffset('telescopic-stamens', exploded);
    stamensGroup.position.set(stamenOff[0], 3.52 + stamenOff[1], stamenOff[2]);

    crystalCoreMat.emissiveIntensity = k.coreLuminescence * (0.9 + 0.1 * Math.sin(elapsedTime * 4));
    corePointLight.intensity = k.coreLuminescence * 1.4;

    for (let i = 0; i < stamenPivots.length; i++) {
      const sp = stamenPivots[i];
      sp.rotation.x = k.stamenSplayRad;
      const extMesh = sp.getObjectByName('stamen-extension');
      if (extMesh) {
        extMesh.position.y = k.stamenExtension;
      }
    }

    // 8. Counter-Balanced Cauline Leaves
    for (let i = 0; i < leavesPivots.length; i++) {
      const lf = leavesPivots[i];
      const lfOff = getExplodedOffset('articulated-leaves', exploded, lf.azimuthRad);
      lf.wrapper.position.set(
        Math.cos(lf.azimuthRad) * 0.23 + lfOff[0],
        lf.baseY + lfOff[1],
        Math.sin(lf.azimuthRad) * 0.23 + lfOff[2],
      );
      lf.hinge.rotation.x = k.leafPitchRad;
    }

    // 9. Glass Cloche Dome
    clocheGroup.visible = showCloche;
    if (showCloche) {
      const clocheOff = getExplodedOffset('glass-cloche', exploded);
      clocheGroup.position.set(clocheOff[0], clocheOff[1], clocheOff[2]);
    }
  };

  // --- Dynamic Material Finish Switcher ---
  const applyFinish = (finishId: FinishId): void => {
    const p = FINISH_PALETTES[finishId];
    primaryBrassMat.color.set(p.primaryMetal);
    secondarySteelMat.color.set(p.secondaryMetal);
    accentPolishedMat.color.set(p.accentMetal);
    outerPetalMat.color.set(p.petalOuter);
    outerPetalMat.sheenColor.set(p.petalSheen);
    innerPetalMat.color.set(p.petalInner);
    innerPetalMat.sheenColor.set(p.petalSheen);
    stemAlloyMat.color.set(p.stemMetal);
    leafBladeMat.color.set(p.leafSurface);
    ebonyPlinthMat.color.set(p.plinthBase);
    crystalCoreMat.color.set(p.crystalCore);
    crystalCoreMat.emissive.set(p.crystalCore);
    corePointLight.color.set(p.crystalCore);
  };

  const dispose = (): void => {
    geometriesToDispose.forEach((g) => g.dispose());
    materialsToDispose.forEach((m) => m.dispose());
  };

  return {
    root,
    interactables,
    corePointLight,
    update,
    applyFinish,
    dispose,
  };
}

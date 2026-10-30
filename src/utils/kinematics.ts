/**
 * Pure kinematic calculations, gear train ratios, finish palettes, and
 * subsystem catalog for the Valkenburg No. IV Mechanical Tulip Automaton.
 */

export type FinishId = 'gilded-brass' | 'titanium-ruby' | 'obsidian-copper' | 'porcelain-rose';
export type LightingPresetId = 'atelier' | 'observatory' | 'conservatory';
export type CameraPresetId = 'overview' | 'corolla' | 'gearbox' | 'mandala';

export type SubsystemId =
  | 'plinth-barrel'
  | 'planetary-gears'
  | 'vertebral-stem'
  | 'drive-collar'
  | 'four-bar-linkages'
  | 'outer-petals'
  | 'inner-petals'
  | 'tourbillon-core'
  | 'telescopic-stamens'
  | 'articulated-leaves'
  | 'glass-cloche';

export interface SubsystemSpec {
  id: SubsystemId;
  code: string;
  name: string;
  category: 'Primary Silhouette' | 'Secondary Mechanism' | 'Accent & Escapement';
  materialSpec: string;
  ratioOrTolerance: string;
  kinematicRole: string;
  explodeVector: [number, number, number]; // [x, y, z] displacement at 100% exploded
}

export interface KinematicTelemetry {
  /** Normalized bloom state in [0, 1] */
  bloom: number;
  /** Normalized exploded state in [0, 1] */
  exploded: number;
  /** Linear vertical travel of the drive collar in millimeters (0 to 18.5 mm) */
  collarTravelMm: number;
  /** Outer petal pitch angle in degrees from vertical axis (8° closed to 68° open) */
  outerPetalAngleDeg: number;
  /** Inner petal pitch angle in degrees from vertical axis (4° closed to 54° open, phase-delayed) */
  innerPetalAngleDeg: number;
  /** Outer petal pitch angle in radians */
  outerPetalAngleRad: number;
  /** Inner petal pitch angle in radians */
  innerPetalAngleRad: number;
  /** Four-bar linkage strut inclination angle in radians */
  strutAngleRad: number;
  /** Stamen filament radial splay angle in radians */
  stamenSplayRad: number;
  /** Stamen telescopic extension in world units */
  stamenExtension: number;
  /** Articulated leaf counter-balance pitch in radians */
  leafPitchRad: number;
  /** Mainspring barrel torque output in mN·m */
  mainspringTorqueMnm: number;
  /** Escapement frequency in beats per hour (vph) */
  escapementVph: number;
  /** Tourbillon cage angular velocity in RPM */
  tourbillonRpm: number;
  /** Optical core luminescence intensity in [0.15, 2.2] */
  coreLuminescence: number;
  /** Lead screw cumulative turns */
  leadScrewTurns: number;
}

export interface FinishPalette {
  id: FinishId;
  name: string;
  subtitle: string;
  primaryMetal: string;
  secondaryMetal: string;
  accentMetal: string;
  petalOuter: string;
  petalInner: string;
  petalSheen: string;
  crystalCore: string;
  stemMetal: string;
  leafSurface: string;
  plinthBase: string;
  swatchHex: string;
}

export const FINISH_PALETTES: Record<FinishId, FinishPalette> = {
  'gilded-brass': {
    id: 'gilded-brass',
    name: 'Gilded Brass & Blued Steel',
    subtitle: '18th-Century Horological Atelier',
    primaryMetal: '#d4a359',
    secondaryMetal: '#263c5c',
    accentMetal: '#e8c482',
    petalOuter: '#8c2230',
    petalInner: '#b83242',
    petalSheen: '#f4a261',
    crystalCore: '#ffaa33',
    stemMetal: '#5a6b5c',
    leafSurface: '#2d4436',
    plinthBase: '#181512',
    swatchHex: '#d4a359',
  },
  'titanium-ruby': {
    id: 'titanium-ruby',
    name: 'Brushed Titanium & Synthetic Ruby',
    subtitle: 'High-Chronometry Tourbillon Spec',
    primaryMetal: '#b8c0c8',
    secondaryMetal: '#3a424d',
    accentMetal: '#e2e6ec',
    petalOuter: '#252b34',
    petalInner: '#9e1b34',
    petalSheen: '#ff4d6d',
    crystalCore: '#ff1e56',
    stemMetal: '#6c7582',
    leafSurface: '#2e3846',
    plinthBase: '#111418',
    swatchHex: '#9e1b34',
  },
  'obsidian-copper': {
    id: 'obsidian-copper',
    name: 'Obsidian Patina & Beryllium Copper',
    subtitle: 'Nocturnal Botanical Instrument',
    primaryMetal: '#c8734b',
    secondaryMetal: '#1d2226',
    accentMetal: '#e69b72',
    petalOuter: '#192126',
    petalInner: '#284b44',
    petalSheen: '#52b788',
    crystalCore: '#38f2af',
    stemMetal: '#3c4942',
    leafSurface: '#1f362d',
    plinthBase: '#0f1214',
    swatchHex: '#38f2af',
  },
  'porcelain-rose': {
    id: 'porcelain-rose',
    name: 'Grand Feu Enamel & Rose Gold',
    subtitle: 'Imperial Geneva Cabinet Piece',
    primaryMetal: '#d9967f',
    secondaryMetal: '#483942',
    accentMetal: '#f3bfa8',
    petalOuter: '#ede6da',
    petalInner: '#d88c8a',
    petalSheen: '#ffb5a7',
    crystalCore: '#ff758f',
    stemMetal: '#8b7968',
    leafSurface: '#4a5d4e',
    plinthBase: '#1f1918',
    swatchHex: '#ede6da',
  },
};

export interface LightingPreset {
  id: LightingPresetId;
  name: string;
  bgHex: string;
  fogHex: string;
  keyColor: string;
  keyIntensity: number;
  hemiSkyColor: string;
  hemiGroundColor: string;
  hemiIntensity: number;
  rimColor: string;
  rimIntensity: number;
}

export const LIGHTING_PRESETS: Record<LightingPresetId, LightingPreset> = {
  atelier: {
    id: 'atelier',
    name: 'Atelier Warmth',
    bgHex: '#0b0d11',
    fogHex: '#0b0d11',
    keyColor: '#fff1db',
    keyIntensity: 2.8,
    hemiSkyColor: '#5c7699',
    hemiGroundColor: '#291f16',
    hemiIntensity: 0.85,
    rimColor: '#f5b971',
    rimIntensity: 1.9,
  },
  observatory: {
    id: 'observatory',
    name: 'Nocturnal Vault',
    bgHex: '#070a0f',
    fogHex: '#070a0f',
    keyColor: '#dce8ff',
    keyIntensity: 2.4,
    hemiSkyColor: '#3b5998',
    hemiGroundColor: '#12151f',
    hemiIntensity: 0.75,
    rimColor: '#64dfdf',
    rimIntensity: 2.2,
  },
  conservatory: {
    id: 'conservatory',
    name: 'Golden Solarium',
    bgHex: '#12100e',
    fogHex: '#12100e',
    keyColor: '#ffe3ba',
    keyIntensity: 3.2,
    hemiSkyColor: '#8ab09c',
    hemiGroundColor: '#36271c',
    hemiIntensity: 1.0,
    rimColor: '#ffb703',
    rimIntensity: 2.1,
  },
};

export interface CameraPreset {
  id: CameraPresetId;
  name: string;
  position: [number, number, number];
  target: [number, number, number];
}

export const CAMERA_PRESETS: Record<CameraPresetId, CameraPreset> = {
  overview: {
    id: 'overview',
    name: 'Full Automaton',
    position: [0, 3.6, 8.9],
    target: [0, 2.45, 0],
  },
  corolla: {
    id: 'corolla',
    name: 'Corolla & Tourbillon',
    position: [0, 4.85, 4.35],
    target: [0, 3.8, 0],
  },
  gearbox: {
    id: 'gearbox',
    name: 'Gearbox & Linkages',
    position: [2.8, 2.15, 3.65],
    target: [0, 1.45, 0],
  },
  mandala: {
    id: 'mandala',
    name: 'Top-Down Mandala',
    position: [0, 8.2, 0.5],
    target: [0, 3.5, 0],
  },
};

export const SUBSYSTEM_CATALOG: SubsystemSpec[] = [
  {
    id: 'plinth-barrel',
    code: 'SUB-01',
    name: 'Chronometric Plinth & Mainspring Barrel',
    category: 'Primary Silhouette',
    materialSpec: 'Turned Ebony, Brushed C36000 Brass & Vernier Chapter Ring',
    ratioOrTolerance: '72T Barrel · ±0.015 mm Concentricity',
    kinematicRole: 'Stores mechanical potential energy and anchors the automaton with a graduated 360° azimuth chapter ring.',
    explodeVector: [0, -0.75, 0],
  },
  {
    id: 'planetary-gears',
    code: 'SUB-02',
    name: 'Epicyclic Planetary Gear Train',
    category: 'Secondary Mechanism',
    materialSpec: 'Hardened Blued Steel Pinions & Involute Brass Wheels',
    ratioOrTolerance: '6:1 Compound Reduction · 48T / 16T / 12T',
    kinematicRole: 'Transfers mainspring torque into synchronized axial lead-screw rotation and escapement drive.',
    explodeVector: [0, -0.35, 0.55],
  },
  {
    id: 'vertebral-stem',
    code: 'SUB-03',
    name: 'Articulated Vertebral Stem & Lead Screw',
    category: 'Primary Silhouette',
    materialSpec: 'Beryllium-Copper Collars & Twin Capillary Conduits',
    ratioOrTolerance: '1.5 mm Pitch Acme Thread · 8 Vertebrae',
    kinematicRole: 'Houses the central coaxial lead screw while external capillary tubes channel optical power to the calyx.',
    explodeVector: [0, -0.1, 0],
  },
  {
    id: 'drive-collar',
    code: 'SUB-04',
    name: 'Linear Actuator Calyx Collar & Guide Bushings',
    category: 'Secondary Mechanism',
    materialSpec: 'Lapped Phosphor-Bronze Lead Nut & Twin Steel Guide Rods',
    ratioOrTolerance: '18.5 mm Stroke · 6 Radial Clevis Forks',
    kinematicRole: 'Translates rotary lead-screw motion into anti-rotated vertical travel along twin linear guide rods to drive the six petal linkages.',
    explodeVector: [0, -0.45, 0],
  },
  {
    id: 'four-bar-linkages',
    code: 'SUB-05',
    name: 'Six-Fold Four-Bar Linkage Struts',
    category: 'Secondary Mechanism',
    materialSpec: 'Turned Stainless Tie-Rods & Micro-Rivet Journals',
    ratioOrTolerance: '12 Pivots · 0.008 mm Radial Clearance',
    kinematicRole: 'Converts linear collar elevation into non-linear angular pitch across the inner and outer petal tiers.',
    explodeVector: [0.35, -0.2, 0.35],
  },
  {
    id: 'outer-petals',
    code: 'SUB-06',
    name: 'Outer Articulated Perianth Petals (×3)',
    category: 'Primary Silhouette',
    materialSpec: 'Guilloché Enamel Shell & Filigree Brass Exoskeleton',
    ratioOrTolerance: '8°–68° Aperture Arc · Phase Lead +12%',
    kinematicRole: 'Primary protective perianth shields that part first during the opening sequence to clear the inner whorl.',
    explodeVector: [0.65, 0.2, 0.65],
  },
  {
    id: 'inner-petals',
    code: 'SUB-07',
    name: 'Inner Articulated Corolla Petals (×3)',
    category: 'Primary Silhouette',
    materialSpec: 'Double-Curved Lathe Shell & Anodized Vein Ribs',
    ratioOrTolerance: '4°–54° Aperture Arc · Interleaved 60° Offset',
    kinematicRole: 'Secondary corolla whorl rotated 60° from the outer tier, framing the central escapement chamber.',
    explodeVector: [0.45, 0.45, 0.45],
  },
  {
    id: 'tourbillon-core',
    code: 'SUB-08',
    name: 'Coaxial Calyx Escapement & Sun-Planet Differential',
    category: 'Accent & Escapement',
    materialSpec: 'Three-Arm Brass Bridge, Synthetic Ruby Chatons & Poised Balance',
    ratioOrTolerance: '24T Sun / 3×12T Planet Pinions · 21,600 vph',
    kinematicRole: 'Meshes directly with the upper lead-screw arbor inside the calyx cup, regulating bloom speed via a coaxial balance wheel.',
    explodeVector: [0, 0.55, 0],
  },
  {
    id: 'telescopic-stamens',
    code: 'SUB-09',
    name: 'Telescopic Stamens & Trifid Stigma Pistil Core',
    category: 'Accent & Escapement',
    materialSpec: 'Coaxial Brass Micro-Tubes, Trifid Stigma Finial & Corundum Prism',
    ratioOrTolerance: '0°–31° Splay · Refractive Index n = 1.77',
    kinematicRole: 'Extends upward and splays radially around the collet-mounted optical crystal pistil and three-lobed botanical stigma crown.',
    explodeVector: [0, 0.95, 0],
  },
  {
    id: 'articulated-leaves',
    code: 'SUB-10',
    name: 'Counter-Balanced Cauline Leaves & Hinge Clevises (×2)',
    category: 'Primary Silhouette',
    materialSpec: 'Ribbed Patinated Alloy, Stem Clevis Brackets & Tie-Rods',
    ratioOrTolerance: '16°–42° Counter-Tilt · Dual Pivot Journals',
    kinematicRole: 'Pivots outward on stem-mounted clevis brackets in harmonic opposition to the flower head.',
    explodeVector: [0.7, -0.15, 0],
  },
  {
    id: 'glass-cloche',
    code: 'SUB-11',
    name: 'Optical Borosilicate Exhibition Cloche',
    category: 'Accent & Escapement',
    materialSpec: 'Hand-Blown Borosilicate Bell & Milled Brass Bezel',
    ratioOrTolerance: '2.2 mm Wall · AR Coating R < 0.4%',
    kinematicRole: 'Optional museum bell jar protecting the precision horological mechanisms from airborne dust.',
    explodeVector: [0, 1.45, 0],
  },
];

/**
 * Clamp a number between min and max.
 */
export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

/**
 * Smoothstep S-curve interpolation for natural mechanical acceleration/deceleration.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Computes deterministic mechanical telemetry and angles from normalized bloom [0, 1]
 * and exploded view [0, 1] states.
 */
export function computeTulipKinematics(bloomInput: number, explodedInput = 0): KinematicTelemetry {
  const bloom = clamp01(bloomInput);
  const exploded = clamp01(explodedInput);

  // Linear collar travel: 0.0 mm at closed bud -> 18.5 mm at full bloom
  const collarTravelMm = Number((bloom * 18.5).toFixed(2));

  // Outer petals lead the opening sequence (smoothstep 0.0 -> 0.88) so they never collide with inner petals
  const outerCurve = smoothstep(0.0, 0.88, bloom);
  // Inner petals follow with a slight phase delay (smoothstep 0.12 -> 1.0)
  const innerCurve = smoothstep(0.12, 1.0, bloom);

  const outerPetalAngleDeg = Number((8 + outerCurve * 60).toFixed(1)); // 8.0° to 68.0°
  const innerPetalAngleDeg = Number((4 + innerCurve * 50).toFixed(1)); // 4.0° to 54.0°

  const outerPetalAngleRad = (outerPetalAngleDeg * Math.PI) / 180;
  const innerPetalAngleRad = (innerPetalAngleDeg * Math.PI) / 180;

  // Four-bar linkage strut inclination (connects collar clevis to petal heel)
  const strutAngleRad = 0.22 + outerCurve * 0.78;

  // Stamens extend vertically first, then splay radially once petals clear 30%
  const stamenCurve = smoothstep(0.2, 1.0, bloom);
  const stamenSplayRad = (4 + stamenCurve * 27) * (Math.PI / 180);
  const stamenExtension = Number((0.18 * smoothstep(0.1, 0.9, bloom)).toFixed(4));

  // Cauline leaves tilt gracefully as counterweights
  const leafPitchRad = (16 + smoothstep(0.0, 1.0, bloom) * 26) * (Math.PI / 180);

  // Mainspring torque increases as the barrel winds/drives the linkage (42.0 to 118.5 mN·m)
  const mainspringTorqueMnm = Number((42 + bloom * 76.5).toFixed(1));

  // Escapement beats per hour & tourbillon cage RPM
  const escapementVph = 21600;
  const tourbillonRpm = Number((1.0 + bloom * 1.5).toFixed(2));

  // Core luminescence intensifies as the crystal pistil is exposed
  const coreLuminescence = Number((0.25 + smoothstep(0.15, 1.0, bloom) * 1.85).toFixed(2));

  // Lead screw turns (18.5 mm travel / 1.5 mm pitch = 12.33 turns)
  const leadScrewTurns = Number((collarTravelMm / 1.5).toFixed(2));

  return {
    bloom,
    exploded,
    collarTravelMm,
    outerPetalAngleDeg,
    innerPetalAngleDeg,
    outerPetalAngleRad,
    innerPetalAngleRad,
    strutAngleRad,
    stamenSplayRad,
    stamenExtension,
    leafPitchRad,
    mainspringTorqueMnm,
    escapementVph,
    tourbillonRpm,
    coreLuminescence,
    leadScrewTurns,
  };
}

/**
 * Computes the 3D exploded displacement offset for a given subsystem and normalized explode factor [0, 1].
 */
export function getExplodedOffset(
  subsystemId: SubsystemId,
  explodedInput: number,
  radialAngleRad = 0,
): [number, number, number] {
  const t = smoothstep(0, 1, clamp01(explodedInput));
  const spec = SUBSYSTEM_CATALOG.find((s) => s.id === subsystemId);
  if (!spec || t === 0) return [0, 0, 0];

  const [vx, vy, vz] = spec.explodeVector;
  // For radially symmetric parts (petals, linkages, leaves), project radial outward offset along radialAngleRad
  if (
    subsystemId === 'outer-petals' ||
    subsystemId === 'inner-petals' ||
    subsystemId === 'four-bar-linkages' ||
    subsystemId === 'articulated-leaves'
  ) {
    const radialMag = vx * t;
    return [
      Number((Math.cos(radialAngleRad) * radialMag).toFixed(4)),
      Number((vy * t).toFixed(4)),
      Number((Math.sin(radialAngleRad) * radialMag).toFixed(4)),
    ];
  }

  return [
    Number((vx * t).toFixed(4)),
    Number((vy * t).toFixed(4)),
    Number((vz * t).toFixed(4)),
  ];
}

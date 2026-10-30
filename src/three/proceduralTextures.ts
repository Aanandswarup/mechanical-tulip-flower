import * as THREE from 'three';

export interface ProceduralTextureSet {
  brushedMetalBump: THREE.CanvasTexture;
  genevaStripeBump: THREE.CanvasTexture;
  petalFiligreeBump: THREE.CanvasTexture;
  chapterRingMap: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  dispose: () => void;
}

/**
 * Generates all procedural surface maps (bump, roughness, chapter ring dial, and
 * radial contact shadow) using HTML5 2D Canvas with zero external file dependencies.
 */
export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  // 1. Fine Brushed Metal Bump / Roughness Map (256x256)
  const brushedCanvas = document.createElement('canvas');
  brushedCanvas.width = 256;
  brushedCanvas.height = 256;
  const bCtx = brushedCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y++) {
    const shade = 115 + Math.floor(Math.sin(y * 0.7) * 14 + ((y * 37) % 19));
    bCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
    bCtx.fillRect(0, y, 256, 1);
  }
  const brushedMetalBump = new THREE.CanvasTexture(brushedCanvas);
  brushedMetalBump.colorSpace = THREE.NoColorSpace;
  brushedMetalBump.wrapS = THREE.RepeatWrapping;
  brushedMetalBump.wrapT = THREE.RepeatWrapping;
  brushedMetalBump.repeat.set(3, 3);
  brushedMetalBump.anisotropy = maxAnisotropy;

  // 2. Côtes de Genève (Geneva Stripes) & Perlage Horological Plate Bump Map (256x256)
  const genevaCanvas = document.createElement('canvas');
  genevaCanvas.width = 256;
  genevaCanvas.height = 256;
  const gCtx = genevaCanvas.getContext('2d')!;
  gCtx.fillStyle = '#787878';
  gCtx.fillRect(0, 0, 256, 256);

  const stripeCount = 8;
  const stripeW = 256 / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    const grad = gCtx.createLinearGradient(i * stripeW, 0, (i + 1) * stripeW, 0);
    grad.addColorStop(0, '#555555');
    grad.addColorStop(0.5, '#b8b8b8');
    grad.addColorStop(1, '#555555');
    gCtx.fillStyle = grad;
    gCtx.fillRect(i * stripeW, 0, stripeW, 256);
  }
  const genevaStripeBump = new THREE.CanvasTexture(genevaCanvas);
  genevaStripeBump.colorSpace = THREE.NoColorSpace;
  genevaStripeBump.wrapS = THREE.RepeatWrapping;
  genevaStripeBump.wrapT = THREE.RepeatWrapping;
  genevaStripeBump.repeat.set(2, 2);
  genevaStripeBump.anisotropy = maxAnisotropy;

  // 3. Botanical Filigree & Art-Nouveau Mechanical Ribbing for Tulip Petals (512x512)
  const petalCanvas = document.createElement('canvas');
  petalCanvas.width = 512;
  petalCanvas.height = 512;
  const pCtx = petalCanvas.getContext('2d')!;
  pCtx.fillStyle = '#606060';
  pCtx.fillRect(0, 0, 512, 512);

  // Longitudinal organic-mechanical ribs converging toward tip and base
  pCtx.strokeStyle = '#d8d8d8';
  for (let i = -8; i <= 8; i++) {
    pCtx.lineWidth = i === 0 ? 5 : 2.2;
    pCtx.beginPath();
    const xBase = 256 + i * 16;
    const xMid = 256 + i * 26;
    const xTip = 256 + i * 6;
    pCtx.moveTo(xBase, 500);
    pCtx.bezierCurveTo(xMid, 350, xMid, 160, xTip, 12);
    pCtx.stroke();
  }

  // Cross-brace micro-lattice chevrons
  pCtx.strokeStyle = '#9e9e9e';
  pCtx.lineWidth = 1.5;
  for (let y = 60; y < 460; y += 36) {
    pCtx.beginPath();
    pCtx.moveTo(64, y + 18);
    pCtx.quadraticCurveTo(256, y - 14, 448, y + 18);
    pCtx.stroke();
  }

  const petalFiligreeBump = new THREE.CanvasTexture(petalCanvas);
  petalFiligreeBump.colorSpace = THREE.NoColorSpace;
  petalFiligreeBump.wrapS = THREE.ClampToEdgeWrapping;
  petalFiligreeBump.wrapT = THREE.ClampToEdgeWrapping;
  petalFiligreeBump.anisotropy = maxAnisotropy;

  // 4. Engraved Horological Chapter Ring Dial Texture (1024x1024, SRGBColorSpace)
  const dialCanvas = document.createElement('canvas');
  dialCanvas.width = 1024;
  dialCanvas.height = 1024;
  const dCtx = dialCanvas.getContext('2d')!;
  dCtx.clearRect(0, 0, 1024, 1024);

  const cx = 512;
  const cy = 512;

  // Outer brass chapter ring backing
  dCtx.strokeStyle = 'rgba(228, 188, 118, 0.85)';
  dCtx.lineWidth = 3;
  dCtx.beginPath();
  dCtx.arc(cx, cy, 480, 0, Math.PI * 2);
  dCtx.stroke();

  dCtx.beginPath();
  dCtx.arc(cx, cy, 430, 0, Math.PI * 2);
  dCtx.stroke();

  dCtx.beginPath();
  dCtx.arc(cx, cy, 385, 0, Math.PI * 2);
  dCtx.stroke();

  // 360 degree graduations & Roman / degree numerals
  const numerals = ['0°', '30°', '60°', '90°', '120°', '150°', '180°', '210°', '240°', '270°', '300°', '330°'];
  for (let deg = 0; deg < 360; deg += 2) {
    const rad = (deg * Math.PI) / 180;
    const isMajor = deg % 30 === 0;
    const isMedium = deg % 10 === 0;
    const rOuter = 478;
    const rInner = isMajor ? 434 : isMedium ? 452 : 464;

    dCtx.strokeStyle = isMajor ? '#f6d598' : 'rgba(228, 188, 118, 0.65)';
    dCtx.lineWidth = isMajor ? 3.5 : isMedium ? 2 : 1;
    dCtx.beginPath();
    dCtx.moveTo(cx + Math.cos(rad) * rInner, cy + Math.sin(rad) * rInner);
    dCtx.lineTo(cx + Math.cos(rad) * rOuter, cy + Math.sin(rad) * rOuter);
    dCtx.stroke();

    if (isMajor) {
      const idx = deg / 30;
      dCtx.save();
      dCtx.translate(cx + Math.cos(rad) * 408, cy + Math.sin(rad) * 408);
      dCtx.rotate(rad + Math.PI / 2);
      dCtx.fillStyle = '#f6d598';
      dCtx.font = '600 22px "JetBrains Mono", monospace';
      dCtx.textAlign = 'center';
      dCtx.textBaseline = 'middle';
      dCtx.fillText(numerals[idx], 0, 0);
      dCtx.restore();
    }
  }

  const chapterRingMap = new THREE.CanvasTexture(dialCanvas);
  chapterRingMap.colorSpace = THREE.SRGBColorSpace;
  chapterRingMap.anisotropy = maxAnisotropy;

  // 5. Radial Soft Contact Shadow Map (256x256)
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const sCtx = shadowCanvas.getContext('2d')!;
  const sGrad = sCtx.createRadialGradient(128, 128, 12, 128, 128, 124);
  sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  sGrad.addColorStop(0.45, 'rgba(0, 0, 0, 0.45)');
  sGrad.addColorStop(0.78, 'rgba(0, 0, 0, 0.12)');
  sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 256, 256);

  const contactShadowMap = new THREE.CanvasTexture(shadowCanvas);
  contactShadowMap.colorSpace = THREE.SRGBColorSpace;

  return {
    brushedMetalBump,
    genevaStripeBump,
    petalFiligreeBump,
    chapterRingMap,
    contactShadowMap,
    dispose: () => {
      brushedMetalBump.dispose();
      genevaStripeBump.dispose();
      petalFiligreeBump.dispose();
      chapterRingMap.dispose();
      contactShadowMap.dispose();
    },
  };
}

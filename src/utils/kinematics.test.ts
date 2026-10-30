import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp01,
  smoothstep,
  computeTulipKinematics,
  getExplodedOffset,
  SUBSYSTEM_CATALOG,
  FINISH_PALETTES,
} from './kinematics';

test('clamp01 bounds inputs strictly within [0, 1]', () => {
  assert.equal(clamp01(-0.5), 0);
  assert.equal(clamp01(0.45), 0.45);
  assert.equal(clamp01(1.8), 1);
  assert.equal(clamp01(Number.NaN), 0);
});

test('computeTulipKinematics produces closed bud state at bloom = 0', () => {
  const k = computeTulipKinematics(0, 0);
  assert.equal(k.bloom, 0);
  assert.equal(k.collarTravelMm, 0);
  assert.equal(k.outerPetalAngleDeg, 8.0);
  assert.equal(k.innerPetalAngleDeg, 4.0);
  assert.equal(k.leadScrewTurns, 0);
  assert.ok(k.outerPetalAngleDeg > k.innerPetalAngleDeg, 'Outer petals remain outside inner petals when closed');
});

test('computeTulipKinematics enforces phase lead so outer petals never collide with inner petals', () => {
  for (const sample of [0.1, 0.25, 0.5, 0.75, 1.0]) {
    const k = computeTulipKinematics(sample);
    assert.ok(
      k.outerPetalAngleDeg > k.innerPetalAngleDeg + 3.5,
      `At bloom=${sample}, outerPetalAngleDeg (${k.outerPetalAngleDeg}) must exceed innerPetalAngleDeg (${k.innerPetalAngleDeg})`,
    );
  }
});

test('computeTulipKinematics reaches full anthesis telemetry at bloom = 1', () => {
  const k = computeTulipKinematics(1, 1);
  assert.equal(k.collarTravelMm, 18.5);
  assert.equal(k.outerPetalAngleDeg, 68.0);
  assert.equal(k.innerPetalAngleDeg, 54.0);
  assert.equal(k.mainspringTorqueMnm, 118.5);
  assert.equal(k.leadScrewTurns, 12.33);
  assert.ok(k.coreLuminescence > 2.0);
});

test('getExplodedOffset returns zero vector at exploded = 0 and radial vectors at exploded = 1', () => {
  assert.deepEqual(getExplodedOffset('plinth-barrel', 0), [0, 0, 0]);
  const plinthFull = getExplodedOffset('plinth-barrel', 1);
  assert.equal(plinthFull[1], -0.75);

  const petal0 = getExplodedOffset('outer-petals', 1, 0);
  assert.equal(petal0[0], 0.65);
  assert.equal(petal0[1], 0.2);
  assert.equal(petal0[2], 0);
});

test('SUBSYSTEM_CATALOG and FINISH_PALETTES have complete horological metadata', () => {
  assert.ok(SUBSYSTEM_CATALOG.length >= 10, 'Catalog must define at least 10 composite subsystems');
  assert.equal(Object.keys(FINISH_PALETTES).length, 4);
  assert.equal( smoothstep(0, 1, 0.5), 0.5);
});

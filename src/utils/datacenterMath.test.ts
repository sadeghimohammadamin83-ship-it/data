import test from 'node:test';
import assert from 'node:assert/strict';
import { computeDataCenterMetrics, clamp } from './datacenterMath.ts';

test('clamp handles lower, upper, and within-bounds values', () => {
  assert.equal(clamp(10, 20, 50), 20);
  assert.equal(clamp(60, 20, 50), 50);
  assert.equal(clamp(35, 20, 50), 35);
});

test('computeDataCenterMetrics calculates valid default layout', () => {
  const metrics = computeDataCenterMetrics({
    length: 48,
    width: 32,
    rackRows: 4,
    racksPerRow: 12,
    aisleWidth: 2.2,
    rackWidth: 0.6,
    rackDepth: 1.1,
    rackGap: 0.06,
  });

  assert.equal(metrics.footprintArea, 48 * 32);
  assert.equal(metrics.effectiveRackRows, 4);
  assert.equal(metrics.effectiveRacksPerRow, 12);
  assert.equal(metrics.totalRacks, 48);
  assert.equal(metrics.isClamped, false);
  assert.ok(metrics.hallArea > 0);
  assert.ok(metrics.floorUtilizationPercent > 0 && metrics.floorUtilizationPercent <= 100);
});

test('computeDataCenterMetrics clamps oversized layout and raises isClamped', () => {
  const metrics = computeDataCenterMetrics({
    length: 24, // small building
    width: 18,
    rackRows: 10, // too many rows for 18m width
    racksPerRow: 28, // too many racks for 24m length
    aisleWidth: 3.5,
    rackWidth: 0.8,
    rackDepth: 1.2,
    rackGap: 0.1,
  });

  assert.equal(metrics.isClamped, true);
  assert.ok(metrics.effectiveRackRows < 10);
  assert.ok(metrics.effectiveRacksPerRow < 28);
  assert.ok(metrics.totalRacks < 280);
});

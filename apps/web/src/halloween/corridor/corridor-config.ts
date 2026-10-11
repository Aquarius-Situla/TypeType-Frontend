export const CORRIDOR = {
  width: 560,
  ceiling: 170,
  floor: 190,
  segmentLength: 420,
  perspective: 620,
  segmentsBehind: 6,
  segmentsAhead: 6,
  fogClear: 500,
  fogSolid: 2400,
} as const;

export const WALK = {
  walkSpeed: 230,
  runSpeed: 520,
  strafeSpeed: 160,
  acceleration: 7,
  walkStride: 115,
  runStride: 150,
  wallMargin: 70,
  mouseSensitivity: 0.0022,
  maxPitch: 1.25,
} as const;

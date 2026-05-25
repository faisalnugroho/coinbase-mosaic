// Coinbase "C" Logo Pixel Mask — Rebuilt 1:1 from uploaded image
// Pre-computed set of (x,y) coordinates in [0,99] that form the Coinbase C logo.
// The C is a circle (radius 42) with a smaller inner circle cutout (radius 28)
// and a gap on the right side to create the letter "C" shape.
// Pixels scatter outward from the C, creating a grunge aesthetic.

const CENTER_X = 49.5;
const CENTER_Y = 49.5;
const OUTER_RADIUS = 42.0;
const INNER_RADIUS = 28.0;
const GAP_ANGLE_START = -Math.PI / 6;  // Gap starts at 30° below right horizontal
const GAP_ANGLE_END = Math.PI / 6;     // Gap ends at 30° above right horizontal
const SCATTER_RADIUS = 48.0;           // Max scatter distance from center

function inOuterRing(x: number, y: number): boolean {
  const dx = x - CENTER_X;
  const dy = y - CENTER_Y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist <= OUTER_RADIUS;
}

function inInnerCutout(x: number, y: number): boolean {
  const dx = x - CENTER_X;
  const dy = y - CENTER_Y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist <= INNER_RADIUS;
}

function inGapZone(x: number, y: number): boolean {
  // The gap is on the right side of the C
  const dx = x - CENTER_X;
  const dy = y - CENTER_Y;
  const angle = Math.atan2(dy, dx);
  return angle >= GAP_ANGLE_START && angle <= GAP_ANGLE_END;
}

function isCPixel(x: number, y: number): boolean {
  if (!inOuterRing(x, y)) return false;
  if (inInnerCutout(x, y)) return false;
  if (inGapZone(x, y)) return false;
  return true;
}

// Scatter mask: pixels that scatter outward from the C
// These are pixels between OUTER_RADIUS and SCATTER_RADIUS
function isScatterPixel(x: number, y: number): boolean {
  const dx = x - CENTER_X;
  const dy = y - CENTER_Y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist <= OUTER_RADIUS || dist > SCATTER_RADIUS) return false;
  // Random-looking scatter — use deterministic hash-like spread
  // Pixels scatter more densely near the C edge, thinning outward
  const normalizedDist = (dist - OUTER_RADIUS) / (SCATTER_RADIUS - OUTER_RADIUS);
  const hash = ((x * 374761393 + y * 668265263) & 0x7fffffff) / 0x7fffffff;
  // Higher probability near edge, drops to ~10% at max scatter distance
  return hash < (1.0 - normalizedDist * 0.85);
}

// Main logo pixels (the C shape itself)
export const LOGO_PIXELS: [number, number][] = [];
for (let y = 0; y < 100; y++) {
  for (let x = 0; x < 100; x++) {
    if (isCPixel(x, y)) {
      LOGO_PIXELS.push([x, y]);
    }
  }
}

// Scatter pixels (surrounding the C)
export const SCATTER_PIXELS: [number, number][] = [];
for (let y = 0; y < 100; y++) {
  for (let x = 0; x < 100; x++) {
    if (isScatterPixel(x, y)) {
      SCATTER_PIXELS.push([x, y]);
    }
  }
}

// Fast lookup sets
export const LOGO_MASK: Set<string> = new Set(
  LOGO_PIXELS.map(([x, y]) => `${x},${y}`)
);

export const SCATTER_MASK: Set<string> = new Set(
  SCATTER_PIXELS.map(([x, y]) => `${x},${y}`)
);

export function isLogoPixel(x: number, y: number): boolean {
  return LOGO_MASK.has(`${x},${y}`);
}

export function isScatterPixelFunc(x: number, y: number): boolean {
  return SCATTER_MASK.has(`${x},${y}`);
}

export const TOTAL_LOGO_PIXELS = LOGO_PIXELS.length;
export const TOTAL_SCATTER_PIXELS = SCATTER_PIXELS.length;

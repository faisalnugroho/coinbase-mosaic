// Coinbase C Logo Pixel Mask
// Three pixel sets: C shape (white/glowing), circle fill (blue bg), scatter (ambient)

const CX = 49.5, CY = 49.5;
const R_OUTER = 42.0;
const R_INNER = 26.0;       // Inner cutout for C shape
const R_SCATTER = 48.0;
const GAP_START = -Math.PI / 5.5;  // C gap right side
const GAP_END = Math.PI / 5.5;

function dist(x: number, y: number): number {
  return Math.sqrt((x - CX) ** 2 + (y - CY) ** 2);
}

// C shape — ring pixels that form the actual C letter (white/glowing)
function isCShape(x: number, y: number): boolean {
  const d = dist(x, y);
  if (d > R_OUTER || d <= R_INNER) return false;
  const angle = Math.atan2(y - CY, x - CX);
  if (angle >= GAP_START && angle <= GAP_END) return false;
  return true;
}

// Circle fill — all pixels inside outer circle (including C shape area)
function inCircle(x: number, y: number): boolean {
  return dist(x, y) <= R_OUTER;
}

// Non-C circle fill (circle minus C shape)
function isCircleFill(x: number, y: number): boolean {
  return inCircle(x, y) && !isCShape(x, y);
}

// Scatter
function isScatter(x: number, y: number): boolean {
  const d = dist(x, y);
  if (d <= R_OUTER || d > R_SCATTER) return false;
  const nd = (d - R_OUTER) / (R_SCATTER - R_OUTER);
  const h = ((x * 374761393 + y * 668265263) & 0x7fffffff) / 0x7fffffff;
  return h < (1.0 - nd * 0.85);
}

// Generate all sets
export const C_SHAPE_PIXELS: [number, number][] = [];
export const CIRCLE_FILL_PIXELS: [number, number][] = [];
export const LOGO_PIXELS: [number, number][] = []; // all claimable pixels (C + fill)
export const SCATTER_PIXELS: [number, number][] = [];

for (let y = 0; y < 100; y++) {
  for (let x = 0; x < 100; x++) {
    if (isCShape(x, y)) { C_SHAPE_PIXELS.push([x, y]); LOGO_PIXELS.push([x, y]); }
    else if (isCircleFill(x, y)) { CIRCLE_FILL_PIXELS.push([x, y]); LOGO_PIXELS.push([x, y]); }
    else if (isScatter(x, y)) { SCATTER_PIXELS.push([x, y]); }
  }
}

// Lookup
const cSet = new Set(C_SHAPE_PIXELS.map(([x, y]) => `${x},${y}`));
const logoSet = new Set(LOGO_PIXELS.map(([x, y]) => `${x},${y}`));

export function isLogoPixel(x: number, y: number): boolean { return logoSet.has(`${x},${y}`); }
export function isCShapePixel(x: number, y: number): boolean { return cSet.has(`${x},${y}`); }

export const TOTAL_LOGO_PIXELS = LOGO_PIXELS.length;
export const TOTAL_C_SHAPE_PIXELS = C_SHAPE_PIXELS.length;

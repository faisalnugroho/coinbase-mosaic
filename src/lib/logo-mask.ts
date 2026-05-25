// Coinbase C Logo Pixel Mask
// Full circle fill — every pixel inside radius 42 is a mosaic pixel.
// The white C shape is drawn as a canvas overlay in MosaicCanvas.
// Scatter pixels surround the circle for grunge effect.

const CENTER_X = 49.5;
const CENTER_Y = 49.5;
const OUTER_RADIUS = 42.0;
const SCATTER_RADIUS = 48.0;

function inCircle(x: number, y: number): boolean {
  const dx = x - CENTER_X;
  const dy = y - CENTER_Y;
  return dx * dx + dy * dy <= OUTER_RADIUS * OUTER_RADIUS;
}

function isScatterPixel(x: number, y: number): boolean {
  const dx = x - CENTER_X;
  const dy = y - CENTER_Y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist <= OUTER_RADIUS || dist > SCATTER_RADIUS) return false;
  const normalizedDist = (dist - OUTER_RADIUS) / (SCATTER_RADIUS - OUTER_RADIUS);
  const hash = ((x * 374761393 + y * 668265263) & 0x7fffffff) / 0x7fffffff;
  return hash < (1.0 - normalizedDist * 0.85);
}

// All pixels inside the circle — full fill
export const LOGO_PIXELS: [number, number][] = [];
for (let y = 0; y < 100; y++) {
  for (let x = 0; x < 100; x++) {
    if (inCircle(x, y)) LOGO_PIXELS.push([x, y]);
  }
}

// Scatter pixels
export const SCATTER_PIXELS: [number, number][] = [];
for (let y = 0; y < 100; y++) {
  for (let x = 0; x < 100; x++) {
    if (isScatterPixel(x, y)) SCATTER_PIXELS.push([x, y]);
  }
}

export const LOGO_MASK: Set<string> = new Set(LOGO_PIXELS.map(([x, y]) => `${x},${y}`));
export const SCATTER_MASK: Set<string> = new Set(SCATTER_PIXELS.map(([x, y]) => `${x},${y}`));

export function isLogoPixel(x: number, y: number): boolean { return LOGO_MASK.has(`${x},${y}`); }
export function isScatterPixelFunc(x: number, y: number): boolean { return SCATTER_MASK.has(`${x},${y}`); }

export const TOTAL_LOGO_PIXELS = LOGO_PIXELS.length;

// Coinbase Logo Pixel Mask
// Pre-computed set of (x,y) coordinates in [0,99] that fall inside the Coinbase circle.
// Center at (49.5, 49.5), radius 44.0 — fills most of the 100x100 grid.
//
// The Coinbase logo is a solid blue circle. Only pixels within this circle
// are part of the "mosaic" and can be claimed by users.

const CENTER_X = 49.5;
const CENTER_Y = 49.5;
const RADIUS = 44.0;

function inCircle(x: number, y: number): boolean {
  const dx = x - CENTER_X;
  const dy = y - CENTER_Y;
  return dx * dx + dy * dy <= RADIUS * RADIUS;
}

// Generate all circle pixel coordinates
export const LOGO_PIXELS: [number, number][] = [];
for (let y = 0; y < 100; y++) {
  for (let x = 0; x < 100; x++) {
    if (inCircle(x, y)) {
      LOGO_PIXELS.push([x, y]);
    }
  }
}

// Fast lookup set: "x,y" -> true
export const LOGO_MASK: Set<string> = new Set(
  LOGO_PIXELS.map(([x, y]) => `${x},${y}`)
);

export function isLogoPixel(x: number, y: number): boolean {
  return LOGO_MASK.has(`${x},${y}`);
}

export const TOTAL_LOGO_PIXELS = LOGO_PIXELS.length;

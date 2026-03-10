const SCALE = 80;

export function nifiToWorld(x: number, y: number): [number, number, number] {
  return [x / SCALE, 0.5, y / SCALE];
}

export function worldToNifi(pos: [number, number, number]): { x: number; y: number } {
  return { x: pos[0] * SCALE, y: pos[2] * SCALE };
}

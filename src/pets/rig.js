// The pixel rig. A visitor paints one 32×32 picture; this file cuts it into
// body parts and re-poses them to produce every animation frame. It is pure
// math on RGBA byte arrays (no DOM), so it also runs in Node for previews.
import { ANIMATIONS, SPECIES_ANIMATIONS } from "./animations.js";

export const SIZE = 32; // painted skin, in pixels
export const FRAME = 48; // baked frame: extra room for jumps and lunges
export const OX = 8; // where the skin sits inside a frame
export const OY = 16;
// Frames are drawn at twice the painted resolution, so parts can move and
// turn in half-pixel steps. That is what keeps the motion smooth.
export const RES = 2;
export const PIXELS = FRAME * RES; // real width and height of a baked frame
// Cats are drawn a little smaller than dogs, and rabbits smaller again. It is
// applied when a pet is shown, so it also covers pets painted before the
// sizes differed.
export const SPECIES_SCALE = { dog: 1, cat: 0.84, rabbit: 0.76 };

// Back-to-front draw order. "B" legs are on the far side of the body.
const ORDER = ["backB", "frontB", "tail", "body", "backA", "frontA", "head"];
const INDEX = Object.fromEntries(ORDER.map((name, i) => [name, i]));

// Every pixel of the canvas belongs to exactly one part, painted or not, so
// whatever a visitor draws (wings, hats, spikes) moves with something.
export function partAt(x, y) {
  if (y >= 25) {
    if (x <= 10) return "backA";
    if (x <= 15) return "backB";
    if (x <= 20) return "frontA";
    return "frontB";
  }
  if (x <= 5) return "tail";
  if ((x >= 19 && y <= 15) || x >= 26) return "head";
  return "body";
}

const PART_MAP = new Uint8Array(SIZE * SIZE);
for (let y = 0; y < SIZE; y++)
  for (let x = 0; x < SIZE; x++) PART_MAP[y * SIZE + x] = INDEX[partAt(x, y)];

// Joints, in skin pixels. The body turns on the hip; everything else hangs
// off the body.
const PIVOTS = {
  root: [15.5, 25],
  body: [9.5, 22.5],
  head: [21, 15.5],
  tail: [6, 16.5],
  backA: [8.5, 25],
  backB: [13.5, 25],
  frontA: [18.5, 25],
  frontB: [23.5, 25],
};
const SPECIES_PIVOTS = { cat: { tail: [6, 18.5] }, rabbit: { tail: [6, 18.5] } };
const pivotsFor = (species) => ({ ...PIVOTS, ...SPECIES_PIVOTS[species] });

// When a part turns, a wedge opens at its joint. To hide it, pixels close to
// the joint are also drawn with the body, underneath the moving part.
const BLEND = { head: 3.2, tail: 2.5, backA: 2.2, frontA: 2.2 };
const underlayCache = {};
function underlayFor(species) {
  if (underlayCache[species]) return underlayCache[species];
  const pivots = pivotsFor(species);
  const mask = new Uint8Array(SIZE * SIZE);
  for (const [part, radius] of Object.entries(BLEND)) {
    const [px, py] = pivots[part];
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++)
        if (
          PART_MAP[y * SIZE + x] === INDEX[part] &&
          Math.hypot(x + 0.5 - px, y + 0.5 - py) <= radius
        )
          mask[y * SIZE + x] = 1;
  }
  return (underlayCache[species] = mask);
}

// 2D affine matrices as [a, b, c, d, e, f]: x' = ax + cy + e, y' = bx + dy + f.
const mul = (m, n) => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];
function invert(m) {
  const det = m[0] * m[3] - m[1] * m[2];
  return [
    m[3] / det,
    -m[1] / det,
    -m[2] / det,
    m[0] / det,
    (m[2] * m[5] - m[3] * m[4]) / det,
    (m[1] * m[4] - m[0] * m[5]) / det,
  ];
}
// A pose entry is [dx, dy, degrees] or just degrees. Positive turns clockwise.
function local(entry, [px, py]) {
  const [dx, dy, deg] = Array.isArray(entry) ? entry : [0, 0, entry || 0];
  const r = (deg * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return [
    cos,
    sin,
    -sin,
    cos,
    px - cos * px + sin * py + dx,
    py - sin * px - cos * py + dy,
  ];
}

const FAR_SHADE = 0.8; // far-side legs are drawn a little darker
const Z_GLYPHS = {
  3: ["###", ".#.", "###"],
  4: ["####", "..#.", ".#..", "####"],
};

/** Draws one pose of a skin into a new PIXELS×PIXELS RGBA buffer. */
export function renderPose(skin, pose, species = "dog") {
  const out = new Uint8ClampedArray(PIXELS * PIXELS * 4);
  const pivots = pivotsFor(species);
  const underlay = underlayFor(species);
  const root = local(pose.root, pivots.root);
  const body = mul(root, local(pose.body, pivots.body));
  const flash = pose.flash ? 0.7 : 0;

  for (const part of ORDER) {
    const world =
      part === "body" ? body : mul(body, local(pose[SHORT[part]], pivots[part]));
    const inv = invert(world);
    const id = INDEX[part];
    const shade = part.endsWith("B") ? FAR_SHADE : 1;
    for (let fy = 0; fy < PIXELS; fy++) {
      for (let fx = 0; fx < PIXELS; fx++) {
        const x = (fx + 0.5) / RES - OX;
        const y = (fy + 0.5) / RES - OY;
        const sx = Math.floor(inv[0] * x + inv[2] * y + inv[4]);
        const sy = Math.floor(inv[1] * x + inv[3] * y + inv[5]);
        if (sx < 0 || sy < 0 || sx >= SIZE || sy >= SIZE) continue;
        const s = sy * SIZE + sx;
        if (PART_MAP[s] !== id && !(part === "body" && underlay[s])) continue;
        if (skin[s * 4 + 3] < 128) continue;
        const o = (fy * PIXELS + fx) * 4;
        for (let c = 0; c < 3; c++) {
          const value = skin[s * 4 + c] * shade;
          out[o + c] = value + (255 - value) * flash;
        }
        out[o + 3] = 255;
      }
    }
  }

  for (const [gx, gy, size] of pose.fx || []) {
    Z_GLYPHS[size].forEach((row, dy) =>
      [...row].forEach((cell, dx) => {
        const x = gx + dx;
        const y = gy + dy;
        if (cell !== "#" || x < 0 || y < 0 || x > FRAME - 1 || y > FRAME - 1) return;
        for (let sy = 0; sy < RES; sy++)
          for (let sx = 0; sx < RES; sx++)
            out.set(
              [143, 168, 216, 255],
              ((Math.round(y * RES) + sy) * PIXELS + Math.round(x * RES) + sx) * 4,
            );
      }),
    );
  }
  return out;
}
const SHORT = {
  head: "head",
  tail: "tail",
  frontA: "fa",
  frontB: "fb",
  backA: "ba",
  backB: "bb",
};

const triple = (entry) =>
  Array.isArray(entry) ? entry : [0, 0, entry || 0];
const smooth = (t) => t * t * (3 - 2 * t);

// Blends two keyframes. Flashes and sleep glyphs are not blended: they come
// from the earlier keyframe.
function between(a, b, t) {
  const pose = { flash: a.flash, fx: a.fx };
  for (const part of ["root", "body", ...Object.values(SHORT)]) {
    const from = triple(a[part]);
    const to = triple(b[part]);
    pose[part] = from.map((value, i) => value + (to[i] - value) * t);
  }
  return pose;
}

/**
 * Bakes one named animation: { frames, ms, loop }. Each keyframe is followed
 * by `tween - 1` in-between poses, and the frame time shrinks to match.
 */
export function bakeAnimation(skin, name, species = "dog") {
  const { frames: keys, ms, loop, tween = 3, linear } =
    SPECIES_ANIMATIONS[species]?.[name] ?? ANIMATIONS[name];
  const poses = [];
  keys.forEach((key, i) => {
    const next = keys[i + 1] ?? (loop ? keys[0] : null);
    poses.push(key);
    if (!next) return;
    for (let step = 1; step < tween; step++) {
      const t = step / tween;
      poses.push(between(key, next, linear ? t : smooth(t)));
    }
  });
  return {
    ms: ms / tween,
    loop,
    frames: poses.map((pose) => renderPose(skin, pose, species)),
  };
}

// Keyframes shared by every dog and cat. Each frame is a pose: per part,
// either degrees or [dx, dy, degrees]. Positive angles turn clockwise, and the
// pet faces right, so a negative leg angle swings the paw forward.
//   root  whole pet          body  torso, turning on the hip
//   head  tail               fa/fb front legs (near/far)   ba/bb back legs
//   flash white hit-flash    fx    sleeping "z" glyphs [x, y, size]

const RUN_LEGS = [-35, -15, 10, 35, 15, -10];
const run = RUN_LEGS.map((_, i) => ({
  body: [0, [0, -1, -2, -1, 0, 0][i], [-3, -2, 0, 3, 2, 0][i]],
  head: 3,
  tail: -25,
  fa: RUN_LEGS[i],
  fb: RUN_LEGS[(i + 1) % 6],
  ba: RUN_LEGS[(i + 3) % 6],
  bb: RUN_LEGS[(i + 4) % 6],
}));

const airborne = { fa: -30, fb: -40, ba: 30, bb: 40, tail: 15 };
const lying = { body: [0, 5, 0], fa: -88, fb: -88, ba: -88, bb: -88, tail: -50 };
const sitting = (tail, head = 0) => ({
  body: [0, 5, -30],
  fa: 30,
  fb: [-1, 2, 30],
  ba: -60,
  bb: -60,
  head: [0, head, 24],
  tail: 30 + tail,
});
const recoil = {
  root: [-3, -1, 0],
  body: [0, 0, -8],
  head: [0, 0, -22],
  fa: -15,
  fb: -20,
  tail: -30,
};
const onBack = (extra) => ({ root: [0, -15, -180], tail: -20, ...extra });

export const ANIMATIONS = {
  idle: {
    ms: 240,
    loop: true,
    frames: [
      { tail: 8 },
      { head: [0, 1, 0], tail: -8 },
      { head: [0, 1, 0], tail: 8 },
      { tail: -8 },
    ],
  },
  idle2: {
    ms: 150,
    loop: true,
    frames: [
      { head: -14, tail: 20 },
      { head: -14, tail: -15 },
      { head: -14, tail: 20 },
      { head: -14, tail: -15 },
      { head: [0, 1, 10], tail: 20 },
      { head: [0, 1, 10], tail: -15 },
      { tail: 20 },
      { tail: -15 },
    ],
  },
  run: { ms: 90, loop: true, frames: run },
  sitting: {
    ms: 280,
    loop: true,
    frames: [sitting(10), sitting(-10, 1), sitting(10, 1), sitting(-10)],
  },
  sleep: {
    ms: 480,
    loop: true,
    frames: [
      { ...lying, head: [0, 4, 25], fx: [[39, 25, 3]] },
      { ...lying, head: [0, 5, 25], fx: [[39, 25, 3], [42, 19, 4]] },
      { ...lying, head: [0, 5, 25], fx: [[42, 19, 4], [44, 13, 4]] },
      { ...lying, head: [0, 4, 25], fx: [[44, 13, 4]] },
    ],
  },
  jump: {
    ms: 85,
    loop: false,
    frames: [
      { body: [0, 2, 0], head: [0, 1, 5], tail: -10 },
      { root: [0, -4, -8], ...airborne },
      { root: [0, -10, -5], ...airborne },
      { root: [0, -13, 0], fa: -20, fb: -30, ba: 20, bb: 30, tail: 15 },
      { root: [0, -10, 5], fa: -20, fb: -30, ba: 20, bb: 30 },
      { root: [0, -4, 8], fa: -30, fb: -20, ba: 10, bb: 20, tail: -10 },
      { body: [0, 2, 0], head: [0, 1, 5] },
      {},
    ],
  },
  attack: {
    ms: 80,
    loop: false,
    frames: [
      { root: [-2, 0, 0], body: [0, 1, 4], head: 8, tail: 20 },
      { root: [-3, 0, 0], body: [0, 1, 5], head: 10, tail: 25 },
      { root: [4, -1, 0], head: [2, 0, -12], ...airborne, tail: -20 },
      { root: [6, 0, 0], head: [2, 0, 12], fa: -25, fb: -35, ba: 20, bb: 30 },
      { root: [3, 0, 0], head: [1, 0, 4] },
      {},
    ],
  },
  hurt: {
    ms: 80,
    loop: false,
    frames: [
      { root: [-1, 0, 0], body: [0, 0, -6], head: -18, tail: -30, flash: 1 },
      recoil,
      { ...recoil, flash: 1 },
      { root: [-1, 0, 0], head: -8 },
      {},
    ],
  },
  // Bowled over onto its back, paws in the air.
  die: {
    ms: 100,
    loop: false,
    frames: [
      { ...recoil, flash: 1 },
      { root: [0, -5, -45], tail: -20 },
      { root: [-1, -11, -90], tail: -20 },
      { root: [-1, -15, -135], tail: -20 },
      onBack({ fa: -20, fb: 20, ba: 20, bb: -20 }),
      onBack({ root: [0, -16, -180], fa: 15, fb: -15, ba: -15, bb: 15 }),
      onBack({ fa: -10, fb: 10, ba: 10, bb: -10 }),
      onBack({}),
    ],
  },
  // Legs give way and it flops flat on its belly.
  die2: {
    ms: 110,
    loop: false,
    frames: [
      { head: -10, flash: 1 },
      { body: [0, 2, 0], fa: -30, fb: -40, ba: 30, bb: 40, head: [0, 1, 10] },
      { body: [0, 4, 0], fa: -60, fb: -70, ba: 60, bb: 70, head: [0, 2, 20], tail: -40 },
      { body: [0, 5, 0], fa: -86, fb: -90, ba: 86, bb: 90, head: [0, 3, 25], tail: -60 },
      { body: [0, 5, 0], fa: -86, fb: -90, ba: 86, bb: 90, head: [1, 5, 28], tail: -70 },
    ],
  },
};

export const ANIMATION_NAMES = Object.keys(ANIMATIONS);
export const ANIMATION_LABELS = {
  idle: "Idle",
  idle2: "Idle 2",
  run: "Run",
  sitting: "Sitting",
  sleep: "Sleep",
  jump: "Jump",
  attack: "Attack",
  hurt: "Hurt",
  die: "Die",
  die2: "Die 2",
};

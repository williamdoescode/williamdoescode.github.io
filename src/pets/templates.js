// The standard Dog and Cat that visitors paint over. Each is built from a few
// rectangles and then outlined, so the art always lines up with the rig's
// part map in rig.js (legs below row 25, tail left of column 6, and so on).
import { SIZE } from "./rig.js";

function draw(shapes, outline) {
  const grid = new Array(SIZE * SIZE).fill(null);
  for (const [x0, y0, x1, y1, color] of shapes)
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) grid[y * SIZE + x] = color;
  const filled = (x, y) =>
    x >= 0 && y >= 0 && x < SIZE && y < SIZE && grid[y * SIZE + x] !== null;
  const skin = new Uint8ClampedArray(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let color = grid[y * SIZE + x];
      if (
        color === null &&
        (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))
      )
        color = outline;
      if (color === null) continue;
      const value = parseInt(color.slice(1), 16);
      skin.set([value >> 16, (value >> 8) & 255, value & 255, 255], (y * SIZE + x) * 4);
    }
  }
  return skin;
}

const legs = (near, far) => [
  [12, 24, 14, 30, far],
  [22, 24, 24, 30, far],
  [7, 24, 9, 30, near],
  [17, 24, 19, 30, near],
];

function dog() {
  const fur = "#c98a4b";
  const dark = "#8f5a2a";
  const cream = "#f3dfbc";
  const ink = "#2a1a10";
  return draw(
    [
      ...legs(fur, dark),
      [7, 30, 9, 30, cream], // paws
      [17, 30, 19, 30, cream],
      [7, 15, 24, 23, fur], // body
      [8, 14, 23, 14, fur],
      [10, 22, 21, 23, cream], // belly
      [5, 13, 7, 15, fur], // tail, climbing up and back
      [4, 11, 5, 13, fur],
      [3, 9, 4, 11, fur],
      [3, 8, 4, 9, cream],
      [20, 7, 28, 15, fur], // head
      [21, 6, 27, 6, fur],
      [27, 10, 30, 14, cream], // muzzle
      [30, 10, 30, 10, ink], // nose
      [28, 13, 29, 13, ink], // mouth
      [25, 9, 25, 10, ink], // eye
      [20, 6, 22, 12, dark], // floppy ear
    ],
    "#4a2c16",
  );
}

function cat() {
  const fur = "#9aa0ad";
  const dark = "#6b7180";
  const white = "#eef0f5";
  return draw(
    [
      ...legs(fur, dark),
      [7, 30, 9, 30, white],
      [17, 30, 19, 30, white],
      [7, 16, 24, 23, fur], // body
      [8, 15, 23, 15, fur],
      [11, 22, 20, 23, white],
      [11, 15, 11, 17, dark], // tabby stripes
      [14, 15, 14, 17, dark],
      [17, 15, 17, 17, dark],
      [4, 18, 7, 19, fur], // tail: out, then straight up with a hooked tip
      [3, 9, 4, 18, fur],
      [3, 12, 4, 12, dark],
      [3, 15, 4, 15, dark],
      [1, 8, 3, 9, fur],
      [1, 8, 2, 8, white],
      [20, 8, 29, 15, fur], // head
      [21, 7, 28, 7, fur],
      [21, 5, 22, 6, fur], // ears
      [21, 4, 21, 4, fur],
      [26, 5, 27, 6, fur],
      [27, 4, 27, 4, fur],
      [27, 12, 29, 14, white], // muzzle
      [29, 11, 29, 11, "#e58a9a"], // nose
      [26, 10, 26, 11, "#2f7d4f"], // eye
      [23, 8, 23, 9, dark],
    ],
    "#2e3140",
  );
}

export const SPECIES = ["dog", "cat"];
export const TEMPLATES = { dog: dog(), cat: cat() };

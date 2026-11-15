// Pixel art for the playground, painted in code like the pets are. Each
// picture is drawn on a small grid, outlined, and turned into an image that
// is shown at twice its size (the same scale the pets use).

function art(w, h, outline, paint) {
  const grid = new Array(w * h).fill(null);
  const px = (x, y, color) => {
    if (x >= 0 && y >= 0 && x < w && y < h) grid[y * w + x] = color;
  };
  const rect = (x, y, rw, rh, color) => {
    for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) px(x + i, y + j, color);
  };
  // `keep` limits a disc to some of its pixels (stripes, bands).
  const disc = (cx, cy, r, color, keep) => {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r && (!keep || keep(x, y)))
          px(x, y, color);
  };
  // A triangle with its point at (cx, top), `half` pixels wide at the base.
  const peak = (cx, top, height, half, color) => {
    for (let dy = 0; dy < height; dy++) {
      const reach = Math.round((dy / (height - 1)) * half);
      rect(cx - reach, top + dy, reach * 2 + 1, 1, color);
    }
  };
  paint({ px, rect, disc, peak });

  const filled = (x, y) => x >= 0 && y >= 0 && x < w && y < h && grid[y * w + x] !== null;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext("2d");
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let color = grid[y * w + x];
      if (
        color === null &&
        (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))
      )
        color = outline;
      if (color === null) continue;
      context.fillStyle = color;
      context.fillRect(x, y, 1, 1);
    }
  }
  return { url: canvas.toDataURL("image/png"), w: w * 2, h: h * 2 };
}

const paintings = {
  tree: () =>
    art(58, 78, "#1d3324", ({ rect, disc, px }) => {
      rect(26, 50, 7, 26, "#7a4f2a");
      rect(31, 50, 2, 26, "#5f3b1e");
      rect(24, 74, 11, 2, "#7a4f2a");
      disc(29, 30, 22, "#2f7240");
      disc(16, 36, 12, "#2f7240");
      disc(42, 36, 12, "#2f7240");
      disc(27, 26, 19, "#3f8f4a");
      disc(15, 33, 9, "#3f8f4a");
      disc(40, 32, 9, "#3f8f4a");
      disc(22, 19, 10, "#58ad5a");
      disc(14, 29, 5, "#58ad5a");
      disc(36, 22, 5, "#58ad5a");
      for (const [x, y] of [[20, 36], [34, 40], [41, 27], [27, 12]]) {
        px(x, y, "#e5574f");
        px(x + 1, y, "#e5574f");
        px(x, y + 1, "#e5574f");
        px(x + 1, y + 1, "#c33c36");
      }
    }),
  pine: () =>
    art(44, 80, "#16301f", ({ rect, peak }) => {
      rect(19, 64, 6, 14, "#6d4526");
      rect(23, 64, 2, 14, "#523219");
      for (const [top, height, half] of [[36, 30, 19], [20, 26, 15], [3, 24, 11]]) {
        peak(21, top, height, half, "#2c6a45");
        peak(19, top + 3, height - 6, Math.round(half * 0.55), "#3f8a57");
      }
    }),
  doghouse: () =>
    art(56, 50, "#2a1a10", ({ rect, disc, peak }) => {
      rect(6, 22, 44, 26, "#c98a4e");
      for (const y of [28, 35, 42]) rect(6, y, 44, 1, "#a8703a");
      rect(19, 31, 18, 17, "#33200f"); // doorway
      disc(27.5, 31, 9, "#33200f");
      rect(19, 46, 18, 2, "#4a3120");
      peak(28, 2, 20, 26, "#c8463c"); // roof
      peak(28, 5, 12, 12, "#de655a");
      rect(2, 21, 53, 2, "#9f342d");
      rect(23, 15, 10, 4, "#f3e6c8"); // bone sign
      rect(22, 14, 2, 2, "#f3e6c8");
      rect(22, 18, 2, 2, "#f3e6c8");
      rect(32, 14, 2, 2, "#f3e6c8");
      rect(32, 18, 2, 2, "#f3e6c8");
    }),
  cathouse: () =>
    art(44, 50, "#2b1f3d", ({ rect, disc, peak, px }) => {
      peak(11, 4, 10, 6, "#8c6bc4"); // ears
      peak(32, 4, 10, 6, "#8c6bc4");
      peak(11, 8, 5, 3, "#f2a7c3");
      peak(32, 8, 5, 3, "#f2a7c3");
      rect(4, 13, 36, 33, "#8c6bc4");
      rect(4, 13, 36, 4, "#a98cdc");
      rect(2, 46, 40, 3, "#6b4fa0");
      disc(22, 32, 10, "#2b1f3d"); // round door
      disc(22, 33, 8, "#3b2c52");
      for (const [x, y] of [[8, 22], [35, 24]]) {
        px(x, y, "#e9defa");
        px(x + 2, y, "#e9defa");
        px(x + 1, y + 1, "#e9defa");
        px(x + 1, y - 1, "#e9defa");
      }
    }),
  pole: () =>
    art(28, 48, "#2a1a10", ({ rect, disc }) => {
      rect(2, 43, 24, 4, "#8c6bc4"); // base
      rect(2, 43, 24, 1, "#a98cdc");
      rect(10, 9, 8, 34, "#dcbc8c"); // rope-wrapped post
      for (let y = 11; y < 43; y += 3) rect(10, y, 8, 1, "#b89460");
      rect(16, 9, 2, 34, "#c9a676");
      rect(4, 5, 20, 4, "#8c6bc4"); // perch
      rect(4, 5, 20, 1, "#a98cdc");
      rect(22, 9, 1, 7, "#e9defa"); // dangling toy
      disc(22.5, 18, 2.4, "#e5574f");
    }),
  ball: () =>
    art(16, 16, "#5c1f1c", ({ disc }) => {
      disc(7.5, 7.5, 6, "#e5574f");
      disc(7.5, 7.5, 6, "#f6f1e7", (x, y) => Math.abs(x - y) <= 1);
      disc(5, 5, 1.5, "#ff9c92");
    }),
  yarn: () =>
    art(20, 16, "#6e2c4c", ({ disc, px }) => {
      disc(7.5, 7.5, 6, "#e58ab0");
      disc(7.5, 7.5, 6, "#c7628f", (x, y) => (x + y) % 3 === 0);
      disc(6, 6, 3, "#f6b3cf", (x, y) => (x - y + 12) % 3 === 0);
      for (const [x, y] of [[14, 12], [15, 13], [16, 13], [17, 12], [18, 13]])
        px(x, y, "#e58ab0");
    }),
};

const made = {};
/** { url, w, h } for one picture; w and h are its on-screen size. */
export function picture(name) {
  return (made[name] ??= paintings[name]());
}

let grassTile;
/** A see-through tile of grass tufts and flowers, laid over the field colour. */
export function grass() {
  if (grassTile) return grassTile;
  const size = 48;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  let seed = 7;
  const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(next() * (size - 3));
    const y = Math.floor(next() * (size - 3)) + 2;
    context.fillStyle = next() < 0.5 ? "#0000001f" : "#ffffff24";
    context.fillRect(x, y, 1, 2);
    context.fillRect(x + 2, y - 1, 1, 2);
  }
  for (const color of ["#fff6c4", "#ffffff", "#ffd0e0"]) {
    const x = Math.floor(next() * (size - 2));
    const y = Math.floor(next() * (size - 2));
    context.fillStyle = color;
    context.fillRect(x, y, 2, 2);
  }
  return (grassTile = canvas.toDataURL("image/png"));
}

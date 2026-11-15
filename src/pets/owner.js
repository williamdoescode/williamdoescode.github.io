// William's own dogs. They are painted here in code (same rectangles-plus-
// outline approach as the templates), so they exist even without the pets API.
import { draw } from "./templates.js";

const INK = "#120d0c";

// [far legs, then near legs], each `wide` pixels across, from row `top` down.
const legs = (near, far, wide = 3, top = 24) => [
  [12, top, 11 + wide, 30, far],
  [22, top, 21 + wide, 30, far],
  [7, top, 6 + wide, 30, near],
  [17, top, 16 + wide, 30, near],
];

function rottweiler() {
  const coat = "#3d3a42";
  const shade = "#2a282e";
  const tan = "#bd6d30";
  const tanShade = "#8a4e22";
  return draw(
    [
      ...legs(coat, shade, 4),
      [12, 29, 15, 30, tanShade], // tan feet
      [22, 29, 25, 30, tanShade],
      [7, 28, 10, 30, tan],
      [17, 28, 20, 30, tan],
      [6, 14, 25, 23, coat], // a broad, heavy body
      [7, 13, 24, 13, coat],
      [8, 13, 20, 13, "#4b4852"], // sheen along the back
      [22, 18, 25, 22, tan], // chest patch
      [4, 14, 5, 16, coat], // docked tail
      [19, 6, 28, 15, coat], // wide head
      [20, 5, 27, 5, coat],
      [27, 10, 30, 14, coat], // muzzle, tan underneath
      [27, 12, 30, 14, tan],
      [25, 13, 26, 14, tan],
      [30, 10, 30, 10, INK],
      [28, 13, 29, 13, INK],
      [25, 9, 25, 10, INK], // eye, with the tan spot above it
      [25, 8, 25, 8, tan],
      [20, 6, 22, 11, shade], // floppy ear
    ],
    "#141216",
  );
}

function doberman() {
  const coat = "#37343c";
  const shade = "#26242a";
  const rust = "#b05a2c";
  const rustShade = "#7e3f1f";
  return draw(
    [
      [12, 22, 14, 30, shade], // long legs
      [22, 23, 24, 30, shade],
      [7, 22, 9, 30, coat],
      [17, 23, 19, 30, coat],
      [12, 28, 14, 30, rustShade],
      [22, 28, 24, 30, rustShade],
      [7, 27, 9, 30, rust],
      [17, 27, 19, 30, rust],
      [7, 15, 24, 21, coat], // lean body with a deep chest and tucked belly
      [8, 14, 23, 14, coat],
      [16, 22, 24, 23, coat],
      [22, 19, 24, 23, rust],
      [4, 14, 5, 15, coat], // docked tail
      [19, 11, 23, 15, coat], // long neck
      [20, 5, 27, 12, coat], // narrow head held high
      [27, 8, 30, 11, coat], // long muzzle
      [27, 10, 30, 11, rust],
      [24, 11, 26, 12, rust],
      [30, 8, 30, 8, INK],
      [25, 7, 25, 8, INK],
      [25, 6, 25, 6, rust],
      [21, 2, 22, 5, coat], // cropped, upright ears
      [21, 1, 21, 1, coat],
      [22, 3, 22, 5, shade],
    ],
    "#141216",
  );
}

function malinois() {
  const fawn = "#cc8f50";
  const shade = "#a26c36";
  const mask = "#2e2628";
  const cream = "#eed6a8";
  return draw(
    [
      ...legs(fawn, shade),
      [7, 15, 24, 23, fawn],
      [8, 14, 23, 14, fawn],
      [9, 14, 20, 15, shade], // darker saddle
      [10, 22, 21, 23, cream],
      [5, 15, 6, 17, fawn], // tail carried low, dark tip
      [4, 16, 5, 20, fawn],
      [3, 19, 4, 23, fawn],
      [3, 22, 4, 23, mask],
      [20, 7, 28, 15, fawn], // head
      [21, 6, 27, 6, fawn],
      [27, 10, 30, 14, mask], // the black mask
      [25, 12, 26, 14, mask],
      [24, 9, 24, 9, mask],
      [25, 9, 25, 10, INK],
      [28, 13, 29, 13, "#5d4d4f"],
      [20, 3, 22, 7, mask], // upright black ears
      [21, 2, 21, 2, mask],
    ],
    "#3a2416",
  );
}

function husky() {
  const grey = "#8a909c";
  const dark = "#5c626f";
  const white = "#f2f4f8";
  const offWhite = "#c9ced8";
  return draw(
    [
      ...legs(white, offWhite),
      [7, 15, 24, 23, grey],
      [8, 14, 23, 14, grey],
      [8, 14, 22, 15, dark], // dark back
      [9, 21, 24, 23, white], // white belly and chest
      [21, 17, 24, 20, white],
      [3, 13, 6, 15, grey], // bushy tail curled over the back
      [2, 9, 5, 13, grey],
      [3, 7, 5, 9, grey],
      [2, 10, 2, 12, white],
      [4, 7, 5, 8, white],
      [20, 7, 28, 15, grey], // head
      [21, 6, 27, 6, grey],
      [21, 6, 27, 7, dark],
      [25, 11, 28, 15, white], // white face
      [27, 10, 30, 14, white],
      [25, 8, 26, 8, white],
      [30, 10, 30, 10, INK],
      [28, 13, 29, 13, INK],
      [25, 9, 25, 10, "#3f9fe0"], // blue eye
      [20, 3, 22, 6, dark], // upright ears
      [21, 2, 21, 2, dark],
      [21, 4, 21, 5, "#e9b9b0"],
    ],
    "#2e3140",
  );
}

function chowChow() {
  const red = "#c9783a";
  const light = "#e6a660";
  const dark = "#9a5524";
  return draw(
    [
      ...legs(red, dark, 4),
      [6, 12, 25, 24, red], // a big ball of fluff
      [7, 11, 24, 11, red],
      [6, 19, 9, 24, light], // fluffy breeches
      [11, 23, 20, 24, light],
      [17, 10, 23, 20, light], // mane
      [3, 9, 5, 14, light], // tail curled onto the back
      [2, 10, 2, 13, light],
      [4, 8, 5, 8, light],
      [20, 5, 29, 15, red], // large round head
      [21, 4, 28, 4, red],
      [21, 12, 25, 15, light],
      [28, 10, 30, 14, light], // short muzzle
      [30, 10, 30, 11, INK],
      [28, 13, 30, 13, INK],
      [29, 14, 29, 14, "#3d4a7a"], // the famous blue tongue
      [26, 8, 26, 9, INK],
      [25, 7, 27, 7, dark], // scowling brow
      [21, 3, 22, 3, dark], // small rounded ears
      [26, 3, 27, 3, dark],
    ],
    "#4a2710",
  );
}

function aspin() {
  const white = "#f6f1e7";
  const shade = "#d3cbbd";
  const orange = "#e08a3c";
  return draw(
    [
      [12, 23, 14, 30, shade],
      [22, 24, 24, 30, shade],
      [7, 23, 9, 30, white],
      [17, 24, 19, 30, white],
      [7, 16, 24, 22, white], // lean white body
      [8, 15, 23, 15, white],
      [17, 23, 24, 23, white],
      [10, 16, 12, 17, orange], // small orange spots
      [15, 19, 16, 20, orange],
      [20, 17, 21, 17, orange],
      [8, 20, 8, 21, orange],
      [5, 14, 6, 16, white], // tail curled up
      [3, 11, 5, 14, white],
      [3, 9, 4, 11, white],
      [4, 8, 5, 9, white],
      [3, 12, 4, 13, orange],
      [20, 7, 28, 15, white], // head
      [21, 6, 27, 6, white],
      [27, 10, 30, 14, white],
      [30, 10, 30, 10, INK],
      [28, 13, 29, 13, INK],
      [25, 9, 25, 10, INK],
      [20, 4, 22, 8, orange], // orange ear that folds at the tip
      [22, 4, 24, 5, orange],
    ],
    "#6b5a4a",
  );
}

const pack = [
  ["brixi", "Brixi", "Rottweiler", rottweiler],
  ["lira", "Lira", "Chow Chow", chowChow],
  ["cloe", "Cloe", "Belgian Malinois", malinois],
  ["adelle", "Adelle", "Doberman", doberman],
  ["mustard", "Mustard", "Husky", husky],
  ["maple", "Maple", "Aspin", aspin],
];

/** Pet records shaped like the API's, plus `breed` and `owner`. */
export const OWNER_PETS = pack.map(([id, name, breed]) => ({
  id,
  name,
  breed,
  species: "dog",
  owner: true,
  signature: [],
  skin: `owner:${id}`,
}));
export const OWNER_SKINS = Object.fromEntries(
  pack.map(([id, , , paint]) => [`owner:${id}`, paint()]),
);

// Browser-side glue around the rig: loading a pet's painting and caching the
// baked frames so each animation is only computed once per pet.
import { bakeAnimation, FRAME, SIZE } from "./rig.js";
import { skinUrl } from "./api.js";

const skins = new Map();

/** Loads a saved pet's 32×32 painting as RGBA bytes. */
export function loadSkin(pet) {
  if (!skins.has(pet.id)) {
    skins.set(
      pet.id,
      new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = SIZE;
          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, SIZE, SIZE);
          resolve(context.getImageData(0, 0, SIZE, SIZE).data);
        };
        image.onerror = () => reject(new Error("Painting failed to load."));
        image.src = skinUrl(pet);
      }),
    );
  }
  return skins.get(pet.id);
}
export const rememberSkin = (id, skin) => skins.set(id, Promise.resolve(skin));

export function skinToPng(skin) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  canvas.getContext("2d").putImageData(new ImageData(skin, SIZE, SIZE), 0, 0);
  return canvas.toDataURL("image/png");
}

const baked = new WeakMap();
/** { frames: ImageData[], ms, loop } for one animation of one skin. */
export function framesFor(skin, species, name) {
  let bySkin = baked.get(skin);
  if (!bySkin) baked.set(skin, (bySkin = {}));
  const key = `${species}:${name}`;
  if (!bySkin[key]) {
    const animation = bakeAnimation(skin, name, species);
    bySkin[key] = {
      ...animation,
      frames: animation.frames.map((frame) => new ImageData(frame, FRAME, FRAME)),
    };
  }
  return bySkin[key];
}

export const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

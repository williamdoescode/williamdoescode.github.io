import { useEffect, useRef, useState } from "react";
import { FRAME } from "./rig.js";
import { framesFor, loadSkin, reducedMotion } from "./sprites.js";

/** Plays one animation of a skin. Non-looping ones hold their last frame. */
export default function PetSprite({
  skin,
  species,
  animation = "idle",
  size = FRAME * 2,
  onDone,
  className = "",
}) {
  const canvas = useRef(null);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (!skin) return;
    const context = canvas.current.getContext("2d");
    const { frames, ms, loop } = framesFor(skin, species, animation);
    const still = reducedMotion() && loop;
    let index = 0;
    let timer;
    const step = () => {
      context.putImageData(frames[index], 0, 0);
      if (still) return;
      if (index === frames.length - 1 && !loop) {
        done.current?.();
        return;
      }
      index = (index + 1) % frames.length;
      timer = setTimeout(step, ms);
    };
    step();
    return () => clearTimeout(timer);
  }, [skin, species, animation]);

  return (
    <canvas
      ref={canvas}
      className={`pet-sprite ${className}`}
      width={FRAME}
      height={FRAME}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

/** Resolves a saved pet's painting; null until it has loaded. */
export function useSkin(pet) {
  const [skin, setSkin] = useState(null);
  useEffect(() => {
    let live = true;
    setSkin(null);
    if (pet)
      loadSkin(pet).then(
        (data) => live && setSkin(data),
        () => {},
      );
    return () => {
      live = false;
    };
  }, [pet]);
  return skin;
}

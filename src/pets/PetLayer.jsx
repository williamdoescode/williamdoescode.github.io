import { useEffect, useRef, useState } from "react";
import Icon from "../Icon.jsx";
import { PIXELS, SPECIES_SCALE } from "./rig.js";
import { framesFor, reducedMotion } from "./sprites.js";
import { useSkin } from "./PetSprite.jsx";
import { usePets } from "./PetProvider.jsx";

const BOX = PIXELS; // on-screen size of a pet's frame
const WALK_SPEED = 70; // px per second
const GRAVITY = 1800;
const DRAG_START = 6;
const between = (min, max) => min + Math.random() * (max - min);

/**
 * One pet living on the bottom edge of the window. It wanders, sits, and
 * naps on its own; click it to make it jump or attack, drag it to carry it
 * (it does not enjoy that), and dismiss it from its name tag.
 */
function RoamingPet({ pet, at, onRemove }) {
  const skin = useSkin(pet);
  const box = useRef(null);
  const canvas = useRef(null);
  const control = useRef(null);
  const [tagged, setTagged] = useState(false);

  useEffect(() => {
    if (!skin) return;
    const context = canvas.current.getContext("2d");
    const still = reducedMotion();
    const size = SPECIES_SCALE[pet.species];
    const maxX = () => Math.max(0, window.innerWidth - BOX);
    const s = {
      x: at ? at.x - BOX / 2 : between(0, maxX()),
      y: at && !still ? Math.min(0, at.y + BOX / 3 - window.innerHeight) : 0,
      vy: 0,
      dir: Math.random() < 0.5 ? -1 : 1,
      state: "",
      anim: "idle",
      frame: 0,
      frameAt: 0,
      frozen: false,
      until: 0,
      target: 0,
    };
    let now = performance.now();
    let last = now;
    let raf;
    let removal;

    function play(state, anim, seconds = 0) {
      s.state = state;
      s.anim = anim;
      s.frame = 0;
      s.frameAt = now;
      s.frozen = false;
      s.until = now + seconds * 1000;
    }
    function wander() {
      if (still) return play("rest", "sitting", Infinity);
      const roll = Math.random();
      if (roll < 0.4) {
        s.target = between(0, maxX());
        s.dir = s.target < s.x ? -1 : 1;
        play("walk", "run");
      } else if (roll < 0.6) play("rest", "idle", between(2, 4));
      else if (roll < 0.72) play("rest", "idle2", between(2, 3));
      else if (roll < 0.88) play("rest", "sitting", between(4, 8));
      else play("rest", "sleep", between(8, 14));
    }
    function animationEnded() {
      if (s.state === "act") wander();
      else if (s.state === "held") {
        // After the yelp, dangle in the mid-jump pose.
        s.anim = "jump";
        s.frame = 6;
        s.frozen = true;
      } else if (s.state === "dying") {
        s.frozen = true;
        removal ??= setTimeout(onRemove, 900);
      }
    }

    function tick(time) {
      now = time;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (s.state === "fall") {
        s.vy += GRAVITY * dt;
        s.y += s.vy * dt;
        if (s.y >= 0) {
          s.y = 0;
          play("rest", "idle", between(0.6, 1.5));
        }
      } else if (s.state === "walk") {
        s.x += s.dir * WALK_SPEED * dt;
        if ((s.target - s.x) * s.dir <= 0) wander();
      } else if (s.state === "rest" && now > s.until) wander();
      s.x = Math.min(maxX(), Math.max(0, s.x));

      const animation = framesFor(skin, pet.species, s.anim);
      if (!s.frozen && now - s.frameAt >= animation.ms) {
        s.frameAt = now;
        if (s.frame < animation.frames.length - 1) s.frame++;
        else if (animation.loop) s.frame = 0;
        else animationEnded();
      }
      // animationEnded may have switched animation, so look the frame up again.
      context.putImageData(framesFor(skin, pet.species, s.anim).frames[s.frame], 0, 0);
      box.current.style.translate = `${Math.round(s.x)}px ${Math.round(s.y)}px`;
      canvas.current.style.scale = `${s.dir * size} ${size}`;
      raf = requestAnimationFrame(tick);
    }

    if (s.y < 0) play("fall", "jump");
    else wander();
    if (s.state === "fall") {
      s.frame = 8;
      s.frozen = true;
    }
    raf = requestAnimationFrame(tick);

    // Pointer and keyboard controls, used by the handlers below.
    let press = null;
    let skipClick = false;
    control.current = {
      down(event) {
        if (s.state === "dying" || event.button) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        press = {
          x: event.clientX,
          y: event.clientY,
          dx: event.clientX - s.x,
          dy: event.clientY - (window.innerHeight + s.y),
          held: false,
        };
      },
      move(event) {
        if (!press) return;
        if (
          !press.held &&
          Math.hypot(event.clientX - press.x, event.clientY - press.y) < DRAG_START
        )
          return;
        if (!press.held) {
          press.held = true;
          play("held", "hurt");
        }
        s.x = event.clientX - press.dx;
        s.y = Math.min(0, event.clientY - press.dy - window.innerHeight);
      },
      up() {
        if (press?.held) {
          // A mouse fires a click after the drop; touch may not.
          skipClick = true;
          setTimeout(() => (skipClick = false), 100);
          s.vy = 0;
          if (still) {
            s.y = 0;
            wander();
          } else {
            play("fall", "jump");
            s.frame = 8;
            s.frozen = true;
          }
        }
        press = null;
      },
      click() {
        if (skipClick) return (skipClick = false);
        if (s.state === "dying" || s.state === "fall") return;
        play("act", Math.random() < 0.5 ? "jump" : "attack");
      },
      dismiss() {
        if (s.state === "dying") return;
        s.y = 0;
        play("dying", Math.random() < 0.5 ? "die" : "die2");
      },
    };

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(removal);
    };
    // A pet's behavior is set up once per painting; `at` only seeds it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skin]);

  useEffect(() => {
    if (!tagged) return;
    const timer = setTimeout(() => setTagged(false), 3000);
    return () => clearTimeout(timer);
  }, [tagged]);

  if (!skin) return null;
  return (
    <div ref={box} className="roaming-pet" data-tagged={tagged || undefined}>
      <canvas ref={canvas} className="pet-sprite" width={PIXELS} height={PIXELS} />
      <button
        type="button"
        className="roaming-pet-hit"
        aria-label={`${pet.name} the ${pet.species}. Press to play, Delete to send home.`}
        onPointerDown={(event) => control.current.down(event)}
        onPointerMove={(event) => control.current.move(event)}
        onPointerUp={() => control.current.up()}
        onPointerCancel={() => control.current.up()}
        onClick={() => {
          control.current.click();
          setTagged(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Delete" || event.key === "Backspace")
            control.current.dismiss();
        }}
      />
      <span className="roaming-pet-tag">
        {pet.name}
        <button
          type="button"
          aria-label={`Send ${pet.name} home`}
          onClick={() => control.current.dismiss()}
        >
          <Icon name="solid fa-xmark" />
        </button>
      </span>
    </div>
  );
}

/** The pets this visitor has let loose on the page. */
export default function PetLayer() {
  const { roaming, unplace } = usePets();
  return (
    <div className="pet-layer">
      {roaming.map(({ id, n, at, pet }) => (
        <RoamingPet key={`${id}:${n}`} pet={pet} at={at} onRemove={() => unplace(id)} />
      ))}
    </div>
  );
}

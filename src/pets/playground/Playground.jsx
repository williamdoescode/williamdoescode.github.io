import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Icon from "../../Icon.jsx";
import { PIXELS, SPECIES_SCALE } from "../rig.js";
import { framesFor, reducedMotion } from "../sprites.js";
import { useSkin } from "../PetSprite.jsx";
import { KindFilter, NameSearch, Pager, usePetFinder } from "../PetFinder.jsx";
import { usePets } from "../PetProvider.jsx";
import { soundFor } from "../sounds.js";
import { grass, picture } from "./art.js";
import {
  THINGS,
  addPet,
  addThing,
  bounds,
  createSim,
  drop,
  hold,
  poke,
  resize,
  step,
  toss,
} from "./sim.js";
import "./playground.css";

const STORE_KEY = "portfolio-playground"; // this visitor's pets and things
const MAX_PETS = 12;
const ROSTER_PAGE = 12; // pets offered on the shelf at a time
const DRAG_START = 6;
// Trees and the starting things, as [kind, across, down] in parts of the field.
const TREES = [
  ["tree", 0.07, 0.36],
  ["pine", 0.21, 0.2],
  ["tree", 0.5, 0.16],
  ["pine", 0.79, 0.22],
  ["tree", 0.94, 0.42],
  ["pine", 0.05, 0.9],
  ["tree", 0.95, 0.92],
];
const STARTER = [
  ["doghouse", 0.27, 0.48],
  ["cathouse", 0.71, 0.46],
  ["pole", 0.62, 0.8],
  ["ball", 0.42, 0.68],
  ["yarn", 0.55, 0.58],
];
const starterThings = (round = 0) =>
  STARTER.map(([type, fx, fy], i) => ({ id: `s${round}-${i}`, type, fx, fy }));

function readStore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (!saved || !Array.isArray(saved.things)) return null;
    return {
      pets: Array.isArray(saved.pets) ? saved.pets.filter((id) => typeof id === "string") : null,
      things: saved.things.filter(
        (thing) =>
          thing &&
          THINGS[thing.type] &&
          typeof thing.id === "string" &&
          Number.isFinite(thing.fx) &&
          Number.isFinite(thing.fy),
      ),
    };
  } catch {
    return null;
  }
}
function writeStore(value) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(value));
  } catch {
    /* The playground still works for this visit. */
  }
}

/** One pet in the field. The simulation moves it; this handles the visitor. */
function PlayPet({ pet, sim, toWorld }) {
  const skin = useSkin(pet);
  const box = useRef(null);
  const canvas = useRef(null);
  const entity = useRef(null);
  const press = useRef(null);
  const skipClick = useRef(false);
  const [said, setSaid] = useState(null); // { text, n }
  const [tagged, setTagged] = useState(false);

  useEffect(() => {
    if (!skin) return;
    const e = addPet(sim, pet, skin);
    e.node = box.current;
    e.canvas = canvas.current;
    e.context = canvas.current.getContext("2d");
    e.node.style.translate = `${Math.round(e.x)}px ${Math.round(e.y)}px`;
    entity.current = e;
    return () => {
      sim.pets.delete(pet.id);
      entity.current = null;
    };
  }, [skin, pet, sim]);

  useEffect(() => {
    if (!said && !tagged) return;
    const timer = setTimeout(() => {
      setSaid(null);
      setTagged(false);
    }, 1400);
    return () => clearTimeout(timer);
  }, [said, tagged]);

  if (!skin) return null;
  return (
    <div ref={box} className="pg-pet" data-tagged={tagged || undefined}>
      <span className="pg-shadow" />
      <canvas ref={canvas} className="pet-sprite" width={PIXELS} height={PIXELS} />
      {said && (
        <span key={said.n} className="pet-say" role="status">
          {said.text}
        </span>
      )}
      <button
        type="button"
        className="pg-pet-hit"
        aria-label={`${pet.name} the ${pet.breed || pet.species}. Press to play.`}
        onPointerDown={(event) => {
          const e = entity.current;
          if (!e || event.button) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          const at = toWorld(event);
          press.current = {
            x: event.clientX,
            y: event.clientY,
            dx: at.x - e.x,
            dy: at.y - e.y,
            held: false,
          };
        }}
        onPointerMove={(event) => {
          const e = entity.current;
          const grip = press.current;
          if (!e || !grip) return;
          if (
            !grip.held &&
            Math.hypot(event.clientX - grip.x, event.clientY - grip.y) < DRAG_START
          )
            return;
          if (!grip.held) {
            grip.held = true;
            hold(sim, e);
          }
          const at = toWorld(event);
          const b = bounds(sim);
          e.x = Math.min(b.x1, Math.max(b.x0, at.x - grip.dx));
          e.y = Math.min(b.y1, Math.max(b.y0, at.y - grip.dy));
        }}
        onPointerUp={() => {
          if (press.current?.held && entity.current) {
            drop(sim, entity.current);
            // A mouse fires a click after the drop; touch may not.
            skipClick.current = true;
            setTimeout(() => (skipClick.current = false), 100);
          }
          press.current = null;
        }}
        onPointerCancel={() => {
          if (press.current?.held && entity.current) drop(sim, entity.current);
          press.current = null;
        }}
        onClick={() => {
          if (skipClick.current || !entity.current) return;
          poke(sim, entity.current);
          setTagged(true);
          setSaid((last) => ({
            text: soundFor(pet.species, last?.text),
            n: (last?.n || 0) + 1,
          }));
        }}
      />
      <span className="pg-tag">{pet.name}</span>
    </div>
  );
}

/** A house, pole, or toy in the field: click it, drag it, or throw it. */
function PlayThing({ thing, sim, toWorld, onMove, onRemove, onAway }) {
  const art = picture(thing.type);
  const kind = THINGS[thing.type];
  const box = useRef(null);
  const body = useRef(null);
  const entity = useRef(null);
  const press = useRef(null);

  useEffect(() => {
    const t = addThing(sim, {
      id: thing.id,
      type: thing.type,
      x: thing.fx * sim.w,
      y: thing.fy * sim.h,
      tall: art.h,
      fall: thing.fall,
    });
    t.node = box.current;
    t.body = body.current;
    t.node.style.translate = `${Math.round(t.x)}px ${Math.round(t.y)}px`;
    entity.current = t;
    return () => {
      sim.things.delete(thing.id);
      entity.current = null;
    };
    // Its place is only read when it first appears; after that the
    // simulation owns it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thing.id, sim]);

  function release(event, cancelled) {
    const grip = press.current;
    const t = entity.current;
    press.current = null;
    if (!grip || !t) return;
    if (!grip.held) {
      if (cancelled) return;
      // A plain click: kick a toy somewhere, or give a house a wobble.
      const angle = Math.random() * Math.PI * 2;
      if (kind.toy) toss(sim, t, Math.cos(angle) * 270, Math.sin(angle) * 190, 250);
      else t.shake = sim.now;
      return;
    }
    t.held = false;
    onAway(false);
    if (grip.away && !cancelled) return onRemove(thing.id);
    if (kind.toy && grip.trail.length > 1) {
      // Let go while moving and it flies off that way.
      const first = grip.trail[0];
      const last = grip.trail.at(-1);
      const seconds = (last.t - first.t) / 1000;
      const vx = seconds > 0.02 ? (last.x - first.x) / seconds : 0;
      const vy = seconds > 0.02 ? (last.y - first.y) / seconds : 0;
      const speed = Math.hypot(vx, vy);
      if (speed > 120) {
        const cap = Math.min(1, 520 / speed);
        toss(sim, t, vx * cap, vy * cap, 170);
      }
    }
    onMove(thing.id, t.x / sim.w, t.y / sim.h);
  }

  return (
    <div ref={box} className="pg-thing" data-type={thing.type}>
      <span className="pg-shadow" style={{ width: art.w * 0.8, left: -art.w * 0.4 }} />
      <button
        ref={body}
        type="button"
        className="pg-thing-body"
        style={{ left: -art.w / 2, top: -art.h, width: art.w, height: art.h }}
        aria-label={`${kind.label}. Press to play with it, drag to move it, Delete to put it away.`}
        onPointerDown={(event) => {
          const t = entity.current;
          if (!t || event.button) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          const at = toWorld(event);
          press.current = {
            x: event.clientX,
            y: event.clientY,
            dx: at.x - t.x,
            dy: at.y - t.y,
            held: false,
            away: false,
            trail: [],
          };
        }}
        onPointerMove={(event) => {
          const t = entity.current;
          const grip = press.current;
          if (!t || !grip) return;
          if (
            !grip.held &&
            Math.hypot(event.clientX - grip.x, event.clientY - grip.y) < DRAG_START
          )
            return;
          if (!grip.held) {
            grip.held = true;
            t.held = true;
            t.vx = t.vy = t.vz = t.z = 0;
          }
          const at = toWorld(event);
          const b = bounds(sim);
          t.x = Math.min(b.x1, Math.max(b.x0, at.x - grip.dx));
          t.y = Math.min(b.y1, Math.max(b.y0, t.tall + 4, at.y - grip.dy));
          grip.trail = [
            ...grip.trail.filter((point) => event.timeStamp - point.t < 110),
            { t: event.timeStamp, x: at.x, y: at.y },
          ];
          const away = at.x < 0 || at.y < 0 || at.x > sim.w || at.y > sim.h;
          if (away !== grip.away) onAway((grip.away = away));
        }}
        onPointerUp={(event) => release(event, false)}
        onPointerCancel={(event) => release(event, true)}
        onClick={(event) => {
          // Keyboard "click": pointer clicks are handled on pointer-up.
          if (event.detail === 0 && entity.current) {
            const t = entity.current;
            const angle = Math.random() * Math.PI * 2;
            if (kind.toy) toss(sim, t, Math.cos(angle) * 270, Math.sin(angle) * 190, 250);
            else t.shake = sim.now;
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Delete" || event.key === "Backspace") onRemove(thing.id);
        }}
      >
        <img src={art.url} alt="" width={art.w} height={art.h} draggable="false" />
      </button>
    </div>
  );
}

/** A still picture of a pet for the shelf. */
function PetThumb({ pet }) {
  const skin = useSkin(pet);
  const canvas = useRef(null);
  useEffect(() => {
    if (skin)
      canvas.current
        .getContext("2d")
        .putImageData(framesFor(skin, pet.species, "idle").frames[0], 0, 0);
  }, [skin, pet.species]);
  return <canvas ref={canvas} className="pet-sprite" width={PIXELS} height={PIXELS} />;
}

/**
 * The playground: a field with trees where pets roam on their own and play
 * with whatever the visitor puts down. It takes over the whole page. Music
 * started on the main page keeps playing underneath.
 */
export default function Playground({ onExit }) {
  const { pets, ownerPets, keys } = usePets();
  const everyone = useMemo(() => [...ownerPets, ...pets], [ownerPets, pets]);

  const [saved] = useState(readStore);
  // null means "the visitor has not chosen yet": William's dogs, the
  // visitor's own pets, and a couple of cats to use the cat toys.
  const [chosen, setChosen] = useState(saved?.pets ?? null);
  const [things, setThings] = useState(() => saved?.things ?? starterThings());
  const [size, setSize] = useState(null); // { w, h, zoom } of the field
  const [away, setAway] = useState(false); // a thing is being dragged off the field
  const [ghost, setGhost] = useState(null); // a thing being dragged in from the shelf
  const round = useRef(1);

  const petIds = useMemo(() => {
    if (chosen) return chosen;
    const visitors = pets.filter((pet) => pet.id in keys).slice(0, 3);
    const others = (species, most) =>
      pets.filter((pet) => pet.species === species && !(pet.id in keys)).slice(0, most);
    return [...ownerPets, ...visitors, ...others("cat", 2), ...others("rabbit", 1)].map(
      (pet) => pet.id,
    );
  }, [chosen, pets, ownerPets, keys]);
  const inside = everyone.filter((pet) => petIds.includes(pet.id)).slice(0, MAX_PETS);
  // On the shelf, pets already in the field come first so they are easy to
  // send home, however long the list gets.
  const roster = useMemo(
    () => [...inside, ...everyone.filter((pet) => !inside.includes(pet))],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [everyone, petIds],
  );
  const finder = usePetFinder(roster, ROSTER_PAGE);

  const wrap = useRef(null);
  const sim = useRef(null);
  sim.current ??= createSim();
  const zoom = useRef(1);

  useLayoutEffect(() => {
    const measure = () => {
      const { width, height } = wrap.current.getBoundingClientRect();
      const scale = width >= 1600 ? 2 : width >= 900 ? 1.5 : 1;
      setSize((old) =>
        old && old.w === width / scale && old.h === height / scale
          ? old
          : { w: width / scale, h: height / scale, zoom: scale },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap.current);
    return () => observer.disconnect();
  }, []);
  // Before the pets and things join (their effects run after this one).
  useLayoutEffect(() => {
    if (!size) return;
    zoom.current = size.zoom;
    resize(sim.current, size.w, size.h);
  }, [size]);

  const toWorld = useCallback((event) => {
    const frame = wrap.current.getBoundingClientRect();
    return {
      x: (event.clientX - frame.left) / zoom.current,
      y: (event.clientY - frame.top) / zoom.current,
    };
  }, []);

  // The clock: move everything, then show it.
  useEffect(() => {
    const world = sim.current;
    world.still = reducedMotion();
    world.now = performance.now();
    let frame;
    const tick = (now) => {
      step(world, now);
      for (const e of world.pets.values()) {
        const scale = SPECIES_SCALE[e.pet.species];
        e.node.style.translate = `${Math.round(e.x)}px ${Math.round(e.y)}px`;
        e.node.style.zIndex = Math.round(e.y);
        e.canvas.style.scale = `${e.dir * scale} ${scale}`;
        const shown = `${e.anim}:${e.frame}`;
        if (shown !== e.shown) {
          e.context.putImageData(framesFor(e.skin, e.pet.species, e.anim).frames[e.frame], 0, 0);
          e.shown = shown;
        }
      }
      for (const t of world.things.values()) {
        t.node.style.translate = `${Math.round(t.x)}px ${Math.round(t.y)}px`;
        t.node.style.zIndex = Math.round(t.y);
        t.body.style.translate = `0 ${-Math.round(t.z)}px`;
        t.body.firstChild.style.rotate = `${t.spin.toFixed(2)}rad`;
        t.node.toggleAttribute("data-shake", now - t.shake < 450);
        t.node.toggleAttribute("data-held", t.held);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Remember the playground, with toys wherever they have rolled to.
  const latest = useRef(null);
  latest.current = { chosen, things };
  const save = useCallback(() => {
    const world = sim.current;
    writeStore({
      pets: latest.current.chosen,
      things: latest.current.things.map(({ id, type, fx, fy }) => {
        const t = world.things.get(id);
        return t ? { id, type, fx: t.x / world.w, fy: t.y / world.h } : { id, type, fx, fy };
      }),
    });
  }, []);
  useEffect(() => {
    save();
  }, [chosen, things, save]);
  useEffect(() => {
    window.addEventListener("pagehide", save);
    return () => {
      window.removeEventListener("pagehide", save);
      save();
    };
  }, [save]);

  const count = (type) => things.filter((thing) => thing.type === type).length;
  function addThingAt(type, fx, fy, fall) {
    setThings((list) =>
      list.filter((thing) => thing.type === type).length >= THINGS[type].limit
        ? list
        : [
            ...list,
            { id: `t${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`, type, fx, fy, fall },
          ],
    );
  }
  // Dragging a thing off the shelf; a plain click drops one in from above.
  const skipClick = useRef(false);
  function grabFromShelf(type, down) {
    if (down.button) return;
    let dragging = false;
    const move = (event) => {
      if (
        !dragging &&
        Math.hypot(event.clientX - down.clientX, event.clientY - down.clientY) < DRAG_START
      )
        return;
      dragging = true;
      setGhost({ type, x: event.clientX, y: event.clientY });
    };
    const end = (event) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      setGhost(null);
      if (!dragging) return;
      skipClick.current = true;
      setTimeout(() => (skipClick.current = false), 100);
      const at = toWorld(event);
      const world = sim.current;
      if (event.type === "pointerup" && at.x > 0 && at.y > 0 && at.x < world.w && at.y < world.h)
        addThingAt(type, at.x / world.w, at.y / world.h, false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  const narrow = size && size.w < 560;
  const trees = narrow ? TREES.filter((_, i) => i % 2 === 0) : TREES;

  return (
    <div className="playground">
      <header className="pg-bar">
        <a
          className="button button-quiet pg-back"
          href="#pets"
          onClick={(event) => {
            event.preventDefault();
            onExit();
          }}
        >
          <Icon name="solid fa-arrow-left" /> Go back to Main Page
        </a>
        <div className="pg-title">
          <span className="eyebrow">ENTERTAINMENT</span>
          <h1>Playground</h1>
        </div>
        <div className="pg-bar-actions">
          <button
            className="button button-quiet"
            type="button"
            onClick={() => {
              setChosen(null);
              setThings(starterThings(round.current++));
            }}
          >
            <Icon name="solid fa-rotate-left" /> Reset
          </button>
        </div>
      </header>

      <div ref={wrap} className="pg-field">
        {size && (
          <div
            className="pg-world"
            style={{
              width: size.w,
              height: size.h,
              scale: String(size.zoom),
              backgroundImage: `url(${grass()})`,
            }}
          >
            {trees.map(([kind, fx, fy]) => {
              const art = picture(kind);
              const y = Math.max(art.h + 6, fy * size.h);
              return (
                <img
                  key={`${kind}${fx}`}
                  className="pg-tree"
                  src={art.url}
                  alt=""
                  width={art.w}
                  height={art.h}
                  draggable="false"
                  style={{
                    translate: `${Math.round(fx * size.w - art.w / 2)}px ${Math.round(y - art.h)}px`,
                    zIndex: Math.round(y),
                  }}
                />
              );
            })}
            {things.map((thing) => (
              <PlayThing
                key={thing.id}
                thing={thing}
                sim={sim.current}
                toWorld={toWorld}
                onAway={setAway}
                onMove={(id, fx, fy) =>
                  setThings((list) =>
                    list.map((other) => (other.id === id ? { ...other, fx, fy } : other)),
                  )
                }
                onRemove={(id) => setThings((list) => list.filter((other) => other.id !== id))}
              />
            ))}
            {inside.map((pet) => (
              <PlayPet key={pet.id} pet={pet} sim={sim.current} toWorld={toWorld} />
            ))}
          </div>
        )}
        <p className="pg-hint">
          Click a pet or a toy. Drag things to move them, throw the ball, or drop
          things on the shelf to put them away.
        </p>
      </div>

      <div className="pg-shelf" data-away={away || undefined}>
        <section className="pg-shelf-group" aria-label="Things to place">
          <span className="eyebrow">{away ? "DROP HERE TO PUT AWAY" : "THINGS"}</span>
          <div className="pg-things">
            {Object.entries(THINGS).map(([type, kind]) => {
              const art = picture(type);
              return (
                <button
                  key={type}
                  type="button"
                  disabled={count(type) >= kind.limit}
                  title={`Add a ${kind.label.toLowerCase()} (click, or drag it onto the grass)`}
                  onPointerDown={(event) => grabFromShelf(type, event)}
                  onClick={() => {
                    if (skipClick.current) return;
                    addThingAt(type, 0.3 + Math.random() * 0.4, 0.45 + Math.random() * 0.35, true);
                  }}
                >
                  <img src={art.url} alt="" draggable="false" />
                  {kind.label}
                </button>
              );
            })}
          </div>
        </section>
        <section className="pg-shelf-group pg-shelf-pets" aria-label="Pets in the playground">
          <div className="pg-roster-tools">
            <span className="eyebrow">
              PETS · {inside.length} OF {MAX_PETS} IN
            </span>
            <KindFilter finder={finder} />
            <NameSearch finder={finder} />
            <Pager finder={finder} />
          </div>
          <div className="pg-roster">
            {finder.total === 0 && <p className="pg-roster-empty">No pets match that.</p>}
            {finder.shown.map((pet) => {
              const here = inside.includes(pet);
              return (
                <button
                  key={pet.id}
                  type="button"
                  aria-pressed={here}
                  disabled={!here && inside.length >= MAX_PETS}
                  title={here ? `Send ${pet.name} home` : `Bring ${pet.name} in`}
                  onClick={() =>
                    setChosen(
                      here
                        ? inside.filter((other) => other !== pet).map((other) => other.id)
                        : [...inside.map((other) => other.id), pet.id],
                    )
                  }
                >
                  <PetThumb pet={pet} />
                  {pet.name}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {ghost && (
        <img
          className="pg-ghost"
          src={picture(ghost.type).url}
          alt=""
          style={{
            left: ghost.x,
            top: ghost.y,
            width: picture(ghost.type).w * (size?.zoom || 1),
          }}
        />
      )}
    </div>
  );
}

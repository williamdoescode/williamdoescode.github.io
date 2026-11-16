// The playground's little world: where every pet and thing is, what each pet
// is up to, and how the toys roll. Positions are in field pixels, measured
// to where a pet's feet (or a thing's base) touch the grass. Nothing here
// touches the page; Playground.jsx draws whatever this decides.
import { framesFor } from "../sprites.js";

export const THINGS = {
  doghouse: { label: "Dog House", limit: 2 },
  cathouse: { label: "Cat House", limit: 2 },
  pole: { label: "Scratch Pole", limit: 3 },
  ball: { label: "Ball", limit: 4, toy: true },
  yarn: { label: "Yarn", limit: 4, toy: true },
};
// How a toy moves: how fast it slows, how much it bounces, how hard a pet
// knocks it, and how high it hops.
const TOYS = {
  ball: { drag: 1.0, bounce: 0.55, kick: [190, 300], hop: [150, 270], radius: 12 },
  yarn: { drag: 2.1, bounce: 0.25, kick: [110, 180], hop: [60, 150], radius: 12 },
};
// What each species feels like doing, as chances out of 1. Whatever is left
// over is spent wandering and resting.
const WISHES = {
  dog: [["ball", 0.32], ["yarn", 0.05], ["pole", 0.03], ["doghouse", 0.09]],
  cat: [["yarn", 0.27], ["pole", 0.17], ["ball", 0.07], ["cathouse", 0.09]],
  rabbit: [["ball", 0.12], ["yarn", 0.1], ["pole", 0.02]], // mostly hops about
};

const WALK = 46; // pixels per second
const RUN = 108;
const GRAVITY = 900;
const MAX_CHASERS = 3;
const between = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function createSim() {
  return { w: 600, h: 400, now: 0, still: false, pets: new Map(), things: new Map() };
}
/** The part of the field pets and things may stand on. */
export function bounds(sim) {
  return { x0: 36, x1: sim.w - 36, y0: 84, y1: sim.h - 12 };
}
export function resize(sim, w, h) {
  const sx = w / sim.w;
  const sy = h / sim.h;
  sim.w = w;
  sim.h = h;
  for (const entity of [...sim.pets.values(), ...sim.things.values()]) {
    entity.x *= sx;
    entity.y *= sy;
  }
}

// ───────── Pets ─────────
function play(sim, e, state, anim, seconds = 0) {
  e.state = state;
  e.anim = anim;
  e.frame = 0;
  e.frameAt = sim.now;
  e.frozen = false;
  e.until = sim.now + seconds * 1000;
}
function rest(sim, e) {
  e.goal = null;
  if (sim.still) return play(sim, e, "rest", "sitting", Infinity);
  const roll = Math.random();
  if (roll < 0.35) play(sim, e, "rest", "idle", between(1.2, 3));
  else if (roll < 0.55) play(sim, e, "rest", "idle2", between(2, 3));
  else if (roll < 0.87) play(sim, e, "rest", "sitting", between(3, 6));
  else play(sim, e, "rest", "sleep", between(6, 10));
}
function walkTo(sim, e, x, y, goal = null, speed = WALK) {
  const b = bounds(sim);
  e.tx = clamp(x, b.x0, b.x1);
  e.ty = clamp(y, b.y0, b.y1);
  e.goal = goal;
  e.speed = speed;
  e.giveUp = sim.now + 14000;
  play(sim, e, "walk", "run");
}
function chase(sim, e) {
  const toy = sim.things.get(e.target);
  if (!toy || toy.held) return rest(sim, e);
  walkTo(sim, e, toy.x, toy.y, "toy", RUN);
  e.giveUp = sim.now + 7000;
}
function seek(sim, e, thing) {
  e.target = thing.id;
  if (THINGS[thing.type].toy) {
    e.kicks = 1 + Math.floor(Math.random() * 3);
    chase(sim, e);
  } else if (thing.type === "pole") {
    walkTo(sim, e, thing.x + (e.x < thing.x ? -26 : 26), thing.y + 3, "pole");
  } else {
    walkTo(sim, e, thing.x, thing.y + 10, "house"); // nap by its own front door
  }
}
function decide(sim, e) {
  if (sim.still) return rest(sim, e);
  const roll = Math.random();
  let chance = 0;
  for (const [type, share] of WISHES[e.pet.species] || WISHES.dog) {
    chance += share;
    if (roll >= chance) continue;
    const options = [...sim.things.values()].filter((t) => t.type === type && !t.held);
    if (options.length) return seek(sim, e, pick(options));
    break;
  }
  if (Math.random() < 0.55) {
    const b = bounds(sim);
    walkTo(sim, e, between(b.x0, b.x1), between(b.y0, b.y1));
  } else rest(sim, e);
}
function arrive(sim, e) {
  const thing = sim.things.get(e.target);
  if (!e.goal || !thing) return rest(sim, e);
  if (e.goal === "toy") {
    e.dir = thing.x < e.x ? -1 : 1;
    const pounce = e.pet.species !== "dog" && Math.random() < 0.4;
    play(sim, e, "act", pounce ? "jump" : "attack");
    const toy = TOYS[thing.type];
    knock(
      thing,
      (e.dir > 0 ? 0 : Math.PI) + between(-0.9, 0.9),
      between(...toy.kick),
      between(...toy.hop),
    );
    e.kicks--;
    e.after = e.kicks > 0 ? "chase" : null;
  } else if (e.goal === "pole") {
    e.dir = thing.x < e.x ? -1 : 1;
    e.kicks = 3 + Math.floor(Math.random() * 3);
    e.after = "scratch";
    thing.shake = sim.now;
    play(sim, e, "act", "attack");
  } else {
    e.dir = Math.random() < 0.5 ? -1 : 1;
    play(sim, e, "rest", "sleep", between(8, 14));
  }
}
function animationEnded(sim, e) {
  if (e.state === "held") {
    // After the yelp, dangle in the mid-jump pose.
    e.anim = "jump";
    e.frame = 6;
    e.frozen = true;
  } else if (e.state !== "act") return;
  else if (e.after === "chase") chase(sim, e);
  else if (e.after === "scratch" && --e.kicks > 0 && sim.things.has(e.target)) {
    sim.things.get(e.target).shake = sim.now;
    play(sim, e, "act", "attack");
  } else rest(sim, e);
}

export function addPet(sim, pet, skin) {
  const b = bounds(sim);
  const e = {
    id: pet.id,
    pet,
    skin,
    x: between(b.x0, b.x1),
    y: between(b.y0, b.y1),
    dir: Math.random() < 0.5 ? -1 : 1,
    goal: null,
    target: null,
    after: null,
    kicks: 0,
  };
  rest(sim, e);
  e.until = sim.now + between(300, 2500); // do not all set off at once
  sim.pets.set(pet.id, e);
  return e;
}
/** A visitor clicked the pet. */
export function poke(sim, e) {
  if (e.state === "held") return;
  e.after = null;
  play(sim, e, "act", Math.random() < 0.5 ? "jump" : "attack");
}
export function hold(sim, e) {
  e.goal = null;
  play(sim, e, "held", "hurt");
}
export function drop(sim, e) {
  play(sim, e, "rest", "idle", between(0.6, 1.4));
}

// ───────── Things ─────────
export function addThing(sim, { id, type, x, y, tall = 0, fall = false }) {
  const b = bounds(sim);
  const thing = {
    id,
    type,
    tall, // its height, so a tall thing cannot be pushed off the top
    x: clamp(x, b.x0, b.x1),
    y: clamp(y, Math.max(b.y0, tall + 4), b.y1),
    z: fall ? 150 : 0, // height above the grass
    vx: 0,
    vy: 0,
    vz: 0,
    spin: 0,
    shake: -1e9,
    held: false,
  };
  sim.things.set(id, thing);
  return thing;
}
function knock(thing, angle, speed, hop) {
  thing.vx = Math.cos(angle) * speed;
  thing.vy = Math.sin(angle) * speed * 0.7;
  thing.vz = hop;
}
/** A visitor threw or kicked a toy: nearby pets may run after it. */
export function toss(sim, thing, vx, vy, hop) {
  thing.vx = vx;
  thing.vy = vy;
  thing.vz = hop;
  if (sim.still) return;
  let chasers = 0;
  for (const e of sim.pets.values()) {
    if (chasers >= MAX_CHASERS) break;
    if (e.state !== "rest" && !(e.state === "walk" && e.goal !== "toy")) continue;
    const favourite = thing.type === (e.pet.species === "dog" ? "ball" : "yarn");
    if (Math.random() > (favourite ? 0.75 : 0.25)) continue;
    chasers++;
    seek(sim, e, thing);
  }
}

// ───────── One step of time ─────────
export function step(sim, now) {
  const dt = Math.min(0.05, (now - sim.now) / 1000);
  sim.now = now;
  const b = bounds(sim);

  for (const thing of sim.things.values()) {
    const toy = TOYS[thing.type];
    if (!toy || thing.held) continue;
    thing.x += thing.vx * dt;
    thing.y += thing.vy * dt;
    thing.spin += (thing.vx * dt) / toy.radius;
    const slow = Math.exp(-toy.drag * dt);
    thing.vx *= slow;
    thing.vy *= slow;
    if (Math.hypot(thing.vx, thing.vy) < 5) thing.vx = thing.vy = 0;
    if (thing.z > 0 || thing.vz > 0) {
      thing.vz -= GRAVITY * dt;
      thing.z += thing.vz * dt;
      if (thing.z <= 0) {
        thing.z = 0;
        thing.vz = thing.vz < -70 ? -thing.vz * toy.bounce : 0;
      }
    }
    // Roll back off the edges of the field.
    if (thing.x < b.x0 || thing.x > b.x1) {
      thing.x = clamp(thing.x, b.x0, b.x1);
      thing.vx *= -0.6;
    }
    if (thing.y < b.y0 || thing.y > b.y1) {
      thing.y = clamp(thing.y, b.y0, b.y1);
      thing.vy *= -0.6;
    }
  }

  for (const e of sim.pets.values()) {
    if (e.state === "walk") {
      if (e.goal === "toy") {
        const toy = sim.things.get(e.target);
        if (!toy || toy.held) {
          rest(sim, e);
          continue;
        }
        // Run to just beside the toy, on the side the pet is coming from.
        e.tx = clamp(toy.x + (e.x < toy.x ? -20 : 20), b.x0, b.x1);
        e.ty = clamp(toy.y - 2, b.y0, b.y1);
      }
      const dx = e.tx - e.x;
      const dy = e.ty - e.y;
      const distance = Math.hypot(dx, dy);
      const reached = distance < 5;
      if (reached && e.goal === "toy" && sim.things.get(e.target).z > 14) {
        /* Wait under the toy until it comes down. */
      } else if (reached) arrive(sim, e);
      else if (now > e.giveUp) rest(sim, e);
      else {
        const move = Math.min(distance, e.speed * dt);
        e.x += (dx / distance) * move;
        e.y += (dy / distance) * move;
        if (Math.abs(dx) > 2) e.dir = dx < 0 ? -1 : 1;
      }
    } else if (e.state === "rest" && now > e.until) decide(sim, e);
    if (e.state !== "held") {
      e.x = clamp(e.x, b.x0, b.x1);
      e.y = clamp(e.y, b.y0, b.y1);
    }

    const animation = framesFor(e.skin, e.pet.species, e.anim);
    if (!e.frozen && now - e.frameAt >= animation.ms) {
      e.frameAt = now;
      if (e.frame < animation.frames.length - 1) e.frame++;
      else if (animation.loop) e.frame = 0;
      else animationEnded(sim, e);
    }
  }
}

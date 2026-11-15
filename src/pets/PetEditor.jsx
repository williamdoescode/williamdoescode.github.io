import { useEffect, useRef, useState } from "react";
import Icon from "../Icon.jsx";
import Modal from "./Modal.jsx";
import PetCard from "./PetCard.jsx";
import PetSprite from "./PetSprite.jsx";
import { SignaturePad } from "./Signature.jsx";
import { usePets } from "./PetProvider.jsx";
import { createPet, updatePet } from "./api.js";
import { loadSkin, skinToPng } from "./sprites.js";
import { SIZE } from "./rig.js";
import { SPECIES, TEMPLATES } from "./templates.js";
import { ANIMATIONS, ANIMATION_LABELS, ANIMATION_NAMES } from "./animations.js";

const PALETTE = [
  "#1e1a1c", "#4a4347", "#8b8589", "#cfc9c4", "#ffffff", "#2a1a10",
  "#6b3f1d", "#8f5a2a", "#c98a4b", "#e8b878", "#f3dfbc", "#fbe9a6",
  "#f2c14e", "#e98a3a", "#d9534f", "#8e2f3a", "#e58a9a", "#f6c7d1",
  "#7b5ea7", "#3f5fa8", "#4fa3d9", "#8fd3e8", "#2f7d4f", "#7fc46b",
];
const TOOLS = [
  ["pencil", "solid fa-pencil", "Pencil"],
  ["eraser", "solid fa-eraser", "Eraser"],
  ["fill", "solid fa-fill-drip", "Fill"],
  ["pick", "solid fa-eye-dropper", "Pick a color"],
];
const MAX_UNDO = 40;
const MIN_PIXELS = 12;
const MAX_NAME = 24;

const rgb = (hex) => {
  const value = parseInt(hex.slice(1), 16);
  return [value >> 16, (value >> 8) & 255, value & 255, 255];
};
const hex = (pixels, i) =>
  "#" + [0, 1, 2].map((c) => pixels[i + c].toString(16).padStart(2, "0")).join("");

/** The 32×32 pixel painter. `skin` is replaced (never mutated) on each stroke. */
function Painter({ skin, species, onChange }) {
  const canvas = useRef(null);
  const guide = useRef(null);
  const work = useRef(null); // pixels being edited during a stroke
  const lastCell = useRef(null);
  const undo = useRef([]);
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState(PALETTE[8]);

  const paint = (pixels) =>
    canvas.current
      .getContext("2d")
      .putImageData(new ImageData(pixels, SIZE, SIZE), 0, 0);
  useEffect(() => paint(skin), [skin]);
  useEffect(() => {
    guide.current
      .getContext("2d")
      .putImageData(new ImageData(TEMPLATES[species], SIZE, SIZE), 0, 0);
  }, [species]);

  function commit(next) {
    undo.current = [...undo.current.slice(-MAX_UNDO + 1), skin];
    onChange(next);
  }
  const cell = (event) => {
    const rect = canvas.current.getBoundingClientRect();
    const at = (value) => Math.min(SIZE - 1, Math.max(0, Math.floor(value * SIZE)));
    return [
      at((event.clientX - rect.left) / rect.width),
      at((event.clientY - rect.top) / rect.height),
    ];
  };
  function dot(pixels, x, y) {
    pixels.set(tool === "eraser" ? [0, 0, 0, 0] : rgb(color), (y * SIZE + x) * 4);
  }
  function line(pixels, [x0, y0], [x1, y1]) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++)
      dot(
        pixels,
        Math.round(x0 + ((x1 - x0) * i) / steps),
        Math.round(y0 + ((y1 - y0) * i) / steps),
      );
  }
  function flood(pixels, x, y) {
    const key = (i) => pixels.slice(i * 4, i * 4 + 4).join();
    const from = key(y * SIZE + x);
    const to = rgb(color);
    if (from === to.join()) return;
    const queue = [[x, y]];
    while (queue.length) {
      const [cx, cy] = queue.pop();
      if (cx < 0 || cy < 0 || cx >= SIZE || cy >= SIZE) continue;
      if (key(cy * SIZE + cx) !== from) continue;
      pixels.set(to, (cy * SIZE + cx) * 4);
      queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
  }

  function onPointerDown(event) {
    if (event.button) return;
    const [x, y] = cell(event);
    if (tool === "pick") {
      const i = (y * SIZE + x) * 4;
      if (skin[i + 3]) setColor(hex(skin, i));
      setTool("pencil");
      return;
    }
    const pixels = new Uint8ClampedArray(skin);
    if (tool === "fill") {
      flood(pixels, x, y);
      commit(pixels);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    work.current = pixels;
    lastCell.current = [x, y];
    dot(pixels, x, y);
    paint(pixels);
  }
  function onPointerMove(event) {
    if (!work.current) return;
    const next = cell(event);
    line(work.current, lastCell.current, next);
    lastCell.current = next;
    paint(work.current);
  }
  function onPointerUp() {
    if (!work.current) return;
    commit(work.current);
    work.current = null;
  }

  return (
    <div className="painter">
      <div className="painter-canvas">
        <canvas ref={guide} className="painter-guide" width={SIZE} height={SIZE} />
        <canvas
          ref={canvas}
          width={SIZE}
          height={SIZE}
          role="img"
          aria-label={`Pixel canvas for your ${species}, 32 by 32. Paint with a mouse, pen, or finger.`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>
      <div className="painter-tools">
        <div className="painter-row" role="group" aria-label="Tools">
          {TOOLS.map(([id, icon, label]) => (
            <button
              key={id}
              type="button"
              className="icon-button"
              aria-label={label}
              title={label}
              aria-pressed={tool === id}
              onClick={() => setTool(id)}
            >
              <Icon name={icon} />
            </button>
          ))}
          <button
            type="button"
            className="icon-button"
            aria-label="Undo"
            title="Undo"
            disabled={!undo.current.length}
            onClick={() => {
              const previous = undo.current.pop();
              if (previous) onChange(previous);
            }}
          >
            <Icon name="solid fa-rotate-left" />
          </button>
        </div>
        <div className="painter-palette" role="group" aria-label="Colors">
          {PALETTE.map((swatch) => (
            <button
              key={swatch}
              type="button"
              style={{ background: swatch }}
              aria-label={`Color ${swatch}`}
              aria-pressed={color === swatch}
              onClick={() => {
                setColor(swatch);
                if (tool === "eraser" || tool === "pick") setTool("pencil");
              }}
            />
          ))}
          <label className="painter-custom" title="Custom color">
            <span className="sr-only">Custom color</span>
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
            />
          </label>
        </div>
        <div className="painter-row">
          <button
            type="button"
            className="painter-text"
            onClick={() => commit(new Uint8ClampedArray(TEMPLATES[species]))}
          >
            Start over
          </button>
          <button
            type="button"
            className="painter-text"
            onClick={() => commit(new Uint8ClampedArray(SIZE * SIZE * 4))}
          >
            Blank canvas
          </button>
        </div>
      </div>
    </div>
  );
}

/** Loops the chosen animation; one-shot ones replay after a short pause. */
function Preview({ skin, species }) {
  const [animation, setAnimation] = useState("idle");
  const [round, setRound] = useState(0);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div className="pet-preview">
      <div className="pet-card-stage">
        <PetSprite
          key={round}
          skin={skin}
          species={species}
          animation={animation}
          size={144}
          onDone={() => {
            clearTimeout(timer.current);
            timer.current = setTimeout(() => setRound((n) => n + 1), 900);
          }}
        />
      </div>
      <div className="pet-chips" role="group" aria-label="Preview an animation">
        {ANIMATION_NAMES.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={animation === name}
            onClick={() => {
              clearTimeout(timer.current);
              setAnimation(name);
              setRound((n) => n + 1);
            }}
          >
            {ANIMATION_LABELS[name]}
            {!ANIMATIONS[name].loop && <span className="sr-only"> (plays once)</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Paint a pet, then name and (optionally) sign its card, then save it for
 * everyone. Opened on one of the visitor's own pets, it edits that pet instead.
 */
export default function PetEditor() {
  const { savePet, editing, keys, place, close, openVisitors } = usePets();
  const [step, setStep] = useState("paint"); // paint → card → done
  const [species, setSpecies] = useState(editing?.species || "dog");
  const [skin, setSkin] = useState(() =>
    editing ? null : new Uint8ClampedArray(TEMPLATES.dog),
  );
  const [touched, setTouched] = useState(Boolean(editing));
  const [name, setName] = useState(editing?.name || "");
  const [signature, setSignature] = useState(editing?.signature || []);
  const [website, setWebsite] = useState(""); // honeypot: people never see it
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null);

  // Editing starts from the saved painting.
  useEffect(() => {
    if (!editing) return;
    let live = true;
    loadSkin(editing).then(
      (data) => live && setSkin(new Uint8ClampedArray(data)),
      () => live && setError("Could not load the painting. Please try again."),
    );
    return () => {
      live = false;
    };
  }, [editing]);

  let painted = 0;
  for (let i = 3; skin && i < skin.length; i += 4) if (skin[i]) painted++;

  function chooseSpecies(next) {
    setSpecies(next);
    // An untouched template swaps with the species; a painting is kept.
    if (!touched) setSkin(new Uint8ClampedArray(TEMPLATES[next]));
  }
  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const details = {
        species,
        name: name.trim(),
        skin: skinToPng(skin),
        signature,
        website,
      };
      const { pet, token } = editing
        ? await updatePet(editing.id, keys[editing.id] || "", details)
        : await createPet(details);
      savePet(pet, token, skin);
      setSaved(pet);
      setStep("done");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }

  if (step === "done")
    return (
      <Modal
        title={`${saved.name} ${editing ? "has a new look" : "has moved in"}`}
        eyebrow="SAVED"
        onClose={close}
      >
        <div className="pet-modal-body pet-done">
          <PetCard pet={saved} skin={skin} animation="idle2" />
          <p className="pet-lede">
            {saved.name} is on the visitors page, where anyone can drag it onto
            the portfolio. You can edit it any time from this browser.
          </p>
          <div className="pet-modal-actions">
            <button className="button button-quiet" type="button" onClick={openVisitors}>
              See all visitors
            </button>
            <button
              className="button button-primary"
              type="button"
              onClick={() => {
                place(saved.id, { x: window.innerWidth / 2, y: window.innerHeight / 3 });
                close();
              }}
            >
              Let {saved.name} loose <Icon name="solid fa-paw" />
            </button>
          </div>
        </div>
      </Modal>
    );

  if (step === "card")
    return (
      <Modal title="Name its card" eyebrow="STEP 2 OF 2" onClose={close}>
        <form className="pet-modal-body pet-card-form" onSubmit={save}>
          <div className="pet-card-stage">
            <PetSprite skin={skin} species={species} animation="sitting" size={144} />
          </div>
          <div className="pet-fields">
            <label>
              <span className="eyebrow">PET NAME</span>
              <input
                type="text"
                value={name}
                maxLength={MAX_NAME}
                required
                autoComplete="off"
                placeholder={species === "dog" ? "Biscuit" : "Mochi"}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <div>
              <span className="eyebrow">YOUR SIGNATURE (OPTIONAL)</span>
              <SignaturePad strokes={signature} onChange={setSignature} />
            </div>
            <input
              className="pet-honeypot"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
            <p className="pet-note">
              Your pet, its name, and your signature (if you add one) will be
              public on this site.
            </p>
            {error && (
              <p className="pet-error" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="pet-modal-actions">
            <button
              className="button button-quiet"
              type="button"
              onClick={() => setStep("paint")}
            >
              <Icon name="solid fa-arrow-left" /> Back to painting
            </button>
            <button
              className="button button-primary"
              type="submit"
              disabled={saving || !name.trim()}
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Save my pet"}
            </button>
          </div>
        </form>
      </Modal>
    );

  return (
    <Modal
      title={editing ? `Edit ${editing.name}` : "Paint your pet"}
      eyebrow="STEP 1 OF 2"
      onClose={close}
    >
      <div className="pet-modal-body">
        {!skin && (
          <p className="pet-empty" role="status">
            {error || "Fetching the painting."}
          </p>
        )}
        <div className="pet-species" role="group" aria-label="Species">
          {SPECIES.map((kind) => (
            <button
              key={kind}
              type="button"
              aria-pressed={species === kind}
              onClick={() => chooseSpecies(kind)}
            >
              <Icon name={`solid fa-${kind}`} /> {kind === "dog" ? "Dog" : "Cat"}
            </button>
          ))}
        </div>
        {skin && (
        <div className="pet-editor">
          <Painter
            skin={skin}
            species={species}
            onChange={(next) => {
              setSkin(next);
              setTouched(true);
            }}
          />
          <Preview skin={skin} species={species} />
        </div>
        )}
        <p className="pet-note">
          Paint over the template or start blank. The faint outline shows where
          the head, legs, and tail go, so every animation fits your drawing.
        </p>
        <div className="pet-modal-actions">
          <button
            className="button button-primary"
            type="button"
            disabled={painted < MIN_PIXELS}
            onClick={() => setStep("card")}
          >
            Next: name its card <Icon name="solid fa-arrow-right" />
          </button>
        </div>
      </div>
    </Modal>
  );
}

import { useEffect, useState } from "react";
import Icon from "../Icon.jsx";
import PetCard from "./PetCard.jsx";
import PetSprite, { useSkin } from "./PetSprite.jsx";
import { usePets } from "./PetProvider.jsx";
import { soundFor } from "./sounds.js";

const DRAG_START = 6; // pixels of movement before a press becomes a drag

/**
 * Dragging a pet out of its card and onto the page. Returns the handler a
 * card calls on pointer-down, the ghost that follows the pointer, and
 * whether a drag is under way.
 */
export function useDragOut(onDrop) {
  const { place } = usePets();
  const [drag, setDrag] = useState(null); // { pet, skin, x, y }

  function grab(pet, skin, down) {
    if (down.button) return;
    let dragging = false;
    // Dragging across the page would otherwise select its text.
    const page = document.documentElement.style;
    page.userSelect = page.webkitUserSelect = "none";
    const move = (event) => {
      if (
        !dragging &&
        Math.hypot(event.clientX - down.clientX, event.clientY - down.clientY) <
          DRAG_START
      )
        return;
      dragging = true;
      setDrag({ pet, skin, x: event.clientX, y: event.clientY });
    };
    const end = (event) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      page.userSelect = page.webkitUserSelect = "";
      setDrag(null);
      if (!dragging || event.type === "pointercancel") return;
      place(pet.id, { x: event.clientX, y: event.clientY });
      onDrop?.();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  const ghost = drag && (
    <div className="pet-ghost" style={{ left: drag.x, top: drag.y }}>
      <PetSprite skin={drag.skin} species={drag.pet.species} animation="run" />
    </div>
  );
  return [grab, ghost, Boolean(drag)];
}

/**
 * One pet's card with everything a visitor can do to it: click it to hear
 * it, like it, drag it out or let it loose, and edit it if it is theirs.
 */
export default function PetTile({ pet, onGrab, onLoose }) {
  const {
    online,
    roaming,
    keys,
    likes,
    liked,
    isAdmin,
    place,
    unplace,
    removePet,
    setLike,
    openEditor,
  } = usePets();
  const mine = pet.id in keys;
  const loved = liked.includes(pet.id);
  const count = likes[pet.id] || 0;
  const skin = useSkin(pet);
  const [hover, setHover] = useState(false);
  const [said, setSaid] = useState(null); // { text, n }
  const out = roaming.some((entry) => entry.id === pet.id);

  useEffect(() => {
    if (!said) return;
    const timer = setTimeout(() => setSaid(null), 1400);
    return () => clearTimeout(timer);
  }, [said]);

  return (
    <li>
      <PetCard
        pet={pet}
        skin={skin}
        animation={said ? "attack" : hover ? "run" : "idle"}
        stage={{
          title: "Click to say hi, or drag onto the page",
          "data-draggable": true,
          onPointerEnter: () => setHover(true),
          onPointerLeave: () => setHover(false),
          onPointerDown: (event) => skin && onGrab(pet, skin, event),
          onClick: () =>
            setSaid((last) => ({
              text: soundFor(pet.species, last?.text),
              n: (last?.n || 0) + 1,
            })),
        }}
        bubble={
          said && (
            <span key={said.n} className="pet-say">
              {said.text}
            </span>
          )
        }
      >
        {mine && <span className="pet-card-badge">Yours</span>}
        <div className="pet-card-actions">
          {online && (
            <button
              type="button"
              className="pet-like"
              aria-pressed={loved}
              aria-label={`${loved ? "Unlike" : "Like"} ${pet.name} (${count} ${count === 1 ? "like" : "likes"})`}
              onClick={() => setLike(pet.id, !loved)}
            >
              <Icon name={`${loved ? "solid" : "regular"} fa-heart`} />
              {count}
            </button>
          )}
          {out ? (
            <button type="button" onClick={() => unplace(pet.id)}>
              <Icon name="solid fa-house" /> Call back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                place(pet.id);
                onLoose?.();
              }}
            >
              <Icon name="solid fa-paw" /> Let loose
            </button>
          )}
          {mine && (
            <button type="button" onClick={() => openEditor(pet)}>
              <Icon name="solid fa-pencil" /> Edit
            </button>
          )}
          {isAdmin && !pet.owner && (
            <button
              type="button"
              onClick={() =>
                window.confirm(`Delete ${pet.name} for everyone?`) &&
                removePet(pet.id).catch((error) => window.alert(error.message))
              }
            >
              <Icon name="regular fa-trash-can" /> Delete
            </button>
          )}
        </div>
      </PetCard>
    </li>
  );
}

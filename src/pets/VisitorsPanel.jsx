import { useState } from "react";
import Icon from "../Icon.jsx";
import Modal from "./Modal.jsx";
import PetCard from "./PetCard.jsx";
import PetSprite, { useSkin } from "./PetSprite.jsx";
import { usePets } from "./PetProvider.jsx";

const PAGE = 24;
const DRAG_START = 6; // pixels of movement before a press becomes a drag

function VisitorCard({ pet, onGrab }) {
  const { roaming, keys, isAdmin, place, unplace, removePet, close, openEditor } =
    usePets();
  const mine = pet.id in keys;
  const skin = useSkin(pet);
  const [hover, setHover] = useState(false);
  const out = roaming.some((entry) => entry.id === pet.id);
  return (
    <li>
      <PetCard
        pet={pet}
        skin={skin}
        animation={hover ? "run" : "idle"}
        stage={{
          title: "Drag onto the page",
          "data-draggable": true,
          onPointerEnter: () => setHover(true),
          onPointerLeave: () => setHover(false),
          onPointerDown: (event) => skin && onGrab(pet, skin, event),
        }}
      >
        {mine && <span className="pet-card-badge">Yours</span>}
        <div className="pet-card-actions">
          {out ? (
            <button type="button" onClick={() => unplace(pet.id)}>
              <Icon name="solid fa-house" /> Call back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                place(pet.id);
                close();
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
          {isAdmin && (
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

/** Every visitor's pet. Any of them can be dragged out onto the page. */
export default function VisitorsPanel() {
  const { pets, place, close, openEditor } = usePets();
  const [shown, setShown] = useState(PAGE);
  const [drag, setDrag] = useState(null); // { pet, skin, x, y }

  function grab(pet, skin, down) {
    if (down.button) return;
    let dragging = false;
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
      setDrag(null);
      if (!dragging || event.type === "pointercancel") return;
      place(pet.id, { x: event.clientX, y: event.clientY });
      close();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  return (
    <>
      <Modal
        title="Visitors"
        eyebrow={`${pets.length} ${pets.length === 1 ? "PET HAS" : "PETS HAVE"} STOPPED BY`}
        className="pet-visitors"
        data-dragging={drag ? true : undefined}
        onClose={close}
      >
        <div className="pet-modal-body">
          <p className="pet-lede">
            Drag any pet out of its card and drop it on the page, or use{" "}
            <em>Let loose</em>. They are everyone's to play with.
          </p>
          {pets.length === 0 ? (
            <p className="pet-empty">No pets yet. Yours could be the first.</p>
          ) : (
            <ul className="pet-grid">
              {pets.slice(0, shown).map((pet) => (
                <VisitorCard key={pet.id} pet={pet} onGrab={grab} />
              ))}
            </ul>
          )}
          <div className="pet-modal-actions">
            {shown < pets.length && (
              <button
                className="button button-quiet"
                type="button"
                onClick={() => setShown(shown + PAGE)}
              >
                Show more
              </button>
            )}
            <button
              className="button button-primary"
              type="button"
              onClick={() => openEditor()}
            >
              Create your pet <Icon name="solid fa-paintbrush" />
            </button>
          </div>
        </div>
      </Modal>
      {drag && (
        <div className="pet-ghost" style={{ left: drag.x, top: drag.y }}>
          <PetSprite skin={drag.skin} species={drag.pet.species} animation="run" />
        </div>
      )}
    </>
  );
}

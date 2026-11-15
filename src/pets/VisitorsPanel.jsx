import { useState } from "react";
import Icon from "../Icon.jsx";
import Modal from "./Modal.jsx";
import PetTile, { useDragOut } from "./PetTile.jsx";
import { usePets } from "./PetProvider.jsx";

const PAGE = 24;

/** Every visitor's pet. Any of them can be dragged out onto the page. */
export default function VisitorsPanel() {
  const { pets, close, openEditor } = usePets();
  const [shown, setShown] = useState(PAGE);
  const [grab, ghost, dragging] = useDragOut(close);

  return (
    <>
      <Modal
        title="Visitors"
        eyebrow={`${pets.length} ${pets.length === 1 ? "PET HAS" : "PETS HAVE"} STOPPED BY`}
        className="pet-visitors"
        data-dragging={dragging || undefined}
        onClose={close}
      >
        <div className="pet-modal-body">
          <p className="pet-lede">
            Click a pet to say hi and give it a heart. Drag any pet out of its
            card and drop it on the page, or use <em>Let loose</em>. They are
            everyone's to play with.
          </p>
          {pets.length === 0 ? (
            <p className="pet-empty">No pets yet. Yours could be the first.</p>
          ) : (
            <ul className="pet-grid">
              {pets.slice(0, shown).map((pet) => (
                <PetTile key={pet.id} pet={pet} onGrab={grab} onLoose={close} />
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
      {ghost}
    </>
  );
}

import { useMemo, useRef, useState } from "react";
import Icon from "../Icon.jsx";
import Modal from "./Modal.jsx";
import { KindFilter, NameSearch, Pager, usePetFinder } from "./PetFinder.jsx";
import PetTile, { useDragOut } from "./PetTile.jsx";
import { usePets } from "./PetProvider.jsx";

const PAGE = 12;

/** Every visitor's pet. Any of them can be dragged out onto the page. */
export default function VisitorsPanel() {
  const { pets, likes, close, closeNow, openEditor } = usePets();
  const [order, setOrder] = useState("newest"); // newest | liked | name
  const sorted = useMemo(() => {
    if (order === "liked")
      return [...pets].sort((a, b) => (likes[b.id] || 0) - (likes[a.id] || 0));
    if (order === "name") return [...pets].sort((a, b) => a.name.localeCompare(b.name));
    return pets; // the server lists the newest first
  }, [pets, likes, order]);
  const finder = usePetFinder(sorted, PAGE);
  const [grab, ghost, dragging] = useDragOut(closeNow); // already faded out mid-drag
  const body = useRef(null);

  return (
    <>
      <Modal
        title="Visitors"
        eyebrow={`${pets.length} ${pets.length === 1 ? "PET HAS" : "PETS HAVE"} STOPPED BY`}
        className="pet-visitors"
        data-dragging={dragging || undefined}
        onClose={close}
      >
        <div ref={body} className="pet-modal-body">
          <p className="pet-lede">
            Click a pet to say hi and give it a heart. Drag any pet out of its
            card and drop it on the page, or use <em>Let loose</em>. They are
            everyone's to play with.
          </p>
          {pets.length === 0 ? (
            <p className="pet-empty">No pets yet. Yours could be the first.</p>
          ) : (
            <>
              <div className="pet-tools">
                <KindFilter finder={finder} />
                <NameSearch finder={finder} />
                <label className="pet-sort">
                  <span className="sr-only">Sort by</span>
                  <select value={order} onChange={(event) => setOrder(event.target.value)}>
                    <option value="newest">Newest first</option>
                    <option value="liked">Most liked</option>
                    <option value="name">Name A to Z</option>
                  </select>
                </label>
              </div>
              {finder.total === 0 ? (
                <p className="pet-empty">No pets match that.</p>
              ) : (
                <ul className="pet-grid">
                  {finder.shown.map((pet) => (
                    <PetTile key={pet.id} pet={pet} onGrab={grab} onLoose={close} />
                  ))}
                </ul>
              )}
            </>
          )}
          <div className="pet-modal-actions">
            <Pager finder={finder} onChange={() => body.current.scrollTo({ top: 0 })} />
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

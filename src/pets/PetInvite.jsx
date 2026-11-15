import { useEffect, useState } from "react";
import Icon from "../Icon.jsx";
import { usePets } from "./PetProvider.jsx";

const SEEN_KEY = "portfolio-pets-invite";

/** The paw button in the corner, with a one-time "leave a pet?" nudge. */
export default function PetInvite() {
  const { pets, openEditor, openVisitors } = usePets();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "seen";
    } catch {
      /* Without storage the nudge simply shows again next visit. */
    }
    if (seen) return;
    const timer = setTimeout(() => setOpen(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  function remember() {
    try {
      localStorage.setItem(SEEN_KEY, "seen");
    } catch {
      /* See above. */
    }
  }
  function toggle(next) {
    setOpen(next);
    remember();
  }

  return (
    <div
      className="pet-invite"
      onKeyDown={(event) => event.key === "Escape" && toggle(false)}
    >
      {open && (
        <div className="pet-bubble" role="dialog" aria-label="Visitor pets">
          <button
            className="pet-bubble-close"
            type="button"
            aria-label="Dismiss"
            onClick={() => toggle(false)}
          >
            <Icon name="solid fa-xmark" />
          </button>
          <span className="eyebrow">VISITOR PETS</span>
          <p>
            Leave a pet behind? Paint a tiny dog or cat, sign its card, and let
            it roam this page.
          </p>
          <div className="pet-bubble-actions">
            <button
              className="button button-primary"
              type="button"
              onClick={() => {
                remember();
                openEditor();
              }}
            >
              Create a pet
            </button>
            <button
              className="button button-quiet"
              type="button"
              onClick={() => {
                remember();
                openVisitors();
              }}
            >
              Visitors ({pets.length})
            </button>
          </div>
        </div>
      )}
      <button
        className="pet-fab"
        type="button"
        aria-label="Visitor pets"
        aria-expanded={open}
        onClick={() => toggle(!open)}
      >
        <Icon name="solid fa-paw" />
      </button>
    </div>
  );
}

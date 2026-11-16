import Icon from "../Icon.jsx";
import PetTile, { useDragOut } from "./PetTile.jsx";
import { usePets } from "./PetProvider.jsx";

const LATEST = 3;

/**
 * The pets part of the Entertainment section: William's own dogs, then the
 * newest visitor pets with the way in to create one and to see them all.
 */
export default function PetPanel() {
  const { online, pets, ownerPets, openEditor, openVisitors } = usePets();
  const [grab, ghost] = useDragOut();

  return (
    <div className="pet-panel">
      <div className="pg-invite">
        <div>
          <span className="eyebrow">ROOM TO RUN</span>
          <h4>Playground</h4>
          <p>
            A field with trees, a ball, yarn, and a scratch pole. Put the pets
            in and watch them play. The music keeps going.
          </p>
        </div>
        <a className="button button-primary" href="#playground">
          Proceed to Playground <Icon name="solid fa-arrow-right" />
        </a>
      </div>
      <section className="pet-group" aria-labelledby="owner-pets-title">
        <header className="pet-group-head">
          <div>
            <span className="eyebrow">THE PACK AT HOME</span>
            <h4 id="owner-pets-title">William's Pets</h4>
          </div>
        </header>
        <ul className="pet-grid">
          {ownerPets.map((pet) => (
            <PetTile key={pet.id} pet={pet} onGrab={grab} />
          ))}
        </ul>
      </section>

      {online && (
        <section className="pet-group" aria-labelledby="visitor-pets-title">
          <header className="pet-group-head">
            <div>
              <span className="eyebrow">
                {pets.length} {pets.length === 1 ? "PET HAS" : "PETS HAVE"} STOPPED BY
              </span>
              <h4 id="visitor-pets-title">Visitor Pets</h4>
            </div>
            <div className="pet-group-actions">
              {pets.length > 0 && (
                <button className="button button-quiet" type="button" onClick={openVisitors}>
                  See all
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
          </header>
          {pets.length === 0 ? (
            <p className="pet-empty">
              No visitor pets yet. Paint a dog, cat, or rabbit and yours will be the first.
            </p>
          ) : (
            <ul className="pet-grid pet-latest">
              {pets.slice(0, LATEST).map((pet) => (
                <PetTile key={pet.id} pet={pet} onGrab={grab} />
              ))}
            </ul>
          )}
        </section>
      )}
      {ghost}
    </div>
  );
}

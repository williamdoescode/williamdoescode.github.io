import PetSprite from "./PetSprite.jsx";
import { Signature } from "./Signature.jsx";

const date = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

/**
 * A pet's card: sprite, name, breed or species, date, and signature.
 * `bubble` is drawn over the sprite (what the pet is saying).
 */
export default function PetCard({
  pet,
  skin,
  animation = "idle",
  stage,
  bubble,
  children,
}) {
  return (
    <article className="pet-card">
      <div className="pet-card-stage" {...stage}>
        <PetSprite skin={skin} species={pet.species} animation={animation} />
        {bubble}
      </div>
      <h3>{pet.name}</h3>
      <span className="eyebrow">
        {(pet.breed || pet.species).toUpperCase()}
        {pet.createdAt && ` · ${date(pet.createdAt).toUpperCase()}`}
      </span>
      <Signature strokes={pet.signature} />
      {children}
    </article>
  );
}

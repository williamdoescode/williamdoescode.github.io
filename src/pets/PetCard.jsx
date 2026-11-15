import PetSprite from "./PetSprite.jsx";
import { Signature } from "./Signature.jsx";

const date = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

/** A pet's signed card: sprite, name, species, date, and signature. */
export default function PetCard({ pet, skin, animation = "idle", stage, children }) {
  return (
    <article className="pet-card">
      <div className="pet-card-stage" {...stage}>
        <PetSprite skin={skin} species={pet.species} animation={animation} />
      </div>
      <h3>{pet.name}</h3>
      <span className="eyebrow">
        {pet.species.toUpperCase()}
        {pet.createdAt && ` · ${date(pet.createdAt).toUpperCase()}`}
      </span>
      <Signature strokes={pet.signature} />
      {children}
    </article>
  );
}

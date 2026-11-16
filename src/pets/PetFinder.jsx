import { useMemo, useState } from "react";
import Icon from "../Icon.jsx";
import { SPECIES, SPECIES_ICONS, SPECIES_LABELS } from "./templates.js";

/**
 * Narrows a long list of pets: by kind (All, Dog, Cat, Rabbit), by name, and
 * one page at a time. Returns what to show plus the controls to render.
 *   const finder = usePetFinder(pets, 12);
 *   finder.shown   the pets on the current page
 *   finder.total   how many match the kind and the search
 */
export function usePetFinder(pets, perPage) {
  const [kind, setKind] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const named = useMemo(() => {
    const text = query.trim().toLowerCase();
    return text ? pets.filter((pet) => pet.name.toLowerCase().includes(text)) : pets;
  }, [pets, query]);
  const matching = useMemo(
    () => (kind === "all" ? named : named.filter((pet) => pet.species === kind)),
    [named, kind],
  );
  const pages = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, pages - 1); // the list may have shrunk
  const shown = matching.slice(current * perPage, (current + 1) * perPage);

  return {
    shown,
    total: matching.length,
    kind,
    query,
    page: current,
    pages,
    counts: (which) =>
      which === "all" ? named.length : named.filter((pet) => pet.species === which).length,
    setKind: (next) => {
      setKind(next);
      setPage(0);
    },
    setQuery: (next) => {
      setQuery(next);
      setPage(0);
    },
    setPage,
  };
}

/** The All / Dog / Cat / Rabbit buttons, each with how many it holds. */
export function KindFilter({ finder }) {
  return (
    <div className="pet-filter" role="group" aria-label="Kind of pet">
      {["all", ...SPECIES].map((kind) => (
        <button
          key={kind}
          type="button"
          aria-pressed={finder.kind === kind}
          onClick={() => finder.setKind(kind)}
        >
          {kind !== "all" && <Icon name={SPECIES_ICONS[kind]} />}
          {kind === "all" ? "All" : SPECIES_LABELS[kind]}
          <small>{finder.counts(kind)}</small>
        </button>
      ))}
    </div>
  );
}

export function NameSearch({ finder }) {
  return (
    <label className="pet-search">
      <Icon name="solid fa-magnifying-glass" />
      <span className="sr-only">Search pets by name</span>
      <input
        type="search"
        value={finder.query}
        placeholder="Search by name"
        autoComplete="off"
        onChange={(event) => finder.setQuery(event.target.value)}
      />
    </label>
  );
}

/** Previous / next, shown only when there is more than one page. */
export function Pager({ finder, onChange }) {
  if (finder.pages < 2) return null;
  const go = (page) => {
    finder.setPage(page);
    onChange?.();
  };
  return (
    <nav className="pet-pager" aria-label="Pages of pets">
      <button
        type="button"
        aria-label="Previous page"
        disabled={finder.page === 0}
        onClick={() => go(finder.page - 1)}
      >
        <Icon name="solid fa-chevron-left" />
      </button>
      <span aria-live="polite">
        {finder.page + 1} / {finder.pages}
      </span>
      <button
        type="button"
        aria-label="Next page"
        disabled={finder.page >= finder.pages - 1}
        onClick={() => go(finder.page + 1)}
      >
        <Icon name="solid fa-chevron-right" />
      </button>
    </nav>
  );
}

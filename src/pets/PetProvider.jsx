import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { deletePet, listPets } from "./api.js";
import { rememberSkin } from "./sprites.js";
import PetInvite from "./PetInvite.jsx";
import PetEditor from "./PetEditor.jsx";
import VisitorsPanel from "./VisitorsPanel.jsx";
import PetLayer from "./PetLayer.jsx";

const PLACED_KEY = "portfolio-pets-placed";
const MINE_KEY = "portfolio-pets-mine";
const MAX_PLACED = 12;
const DEFAULT_PLACED = 3; // newest pets greet a first-time visitor

function stored(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}
function store(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Still works for this visit. */
  }
}

const PetContext = createContext(null);
export const usePets = () => useContext(PetContext);

/**
 * Visitor pets: loads everyone's pets, remembers which ones this visitor let
 * loose on the page, and mounts the invite, editor, visitors panel, and the
 * roaming layer. If the pets API is unreachable the whole feature stays hidden.
 */
export function PetProvider({ ready, children }) {
  const [pets, setPets] = useState(null);
  const [view, setView] = useState(null); // "editor" | "visitors"
  // Entries are { id, n, at }: n re-mounts a pet that is dropped again, and
  // at is where it was dropped. null means "not chosen yet".
  const [placed, setPlaced] = useState(() =>
    stored(PLACED_KEY)?.map((id) => ({ id, n: 0, at: null })) ?? null,
  );
  const [mine, setMine] = useState(() => stored(MINE_KEY) || []);
  const [adminToken, setAdminToken] = useState("");

  useEffect(() => {
    let live = true;
    listPets().then(
      (list) => {
        if (!live) return;
        setPets(list);
        if (location.hash === "#visitors") setView("visitors");
        if (location.hash === "#pets-admin") {
          const token = window.prompt("Pets admin token");
          if (token) {
            setAdminToken(token);
            setView("visitors");
          }
        }
      },
      () => {},
    );
    return () => {
      live = false;
    };
  }, []);

  const roaming = useMemo(() => {
    if (!pets) return [];
    const entries =
      placed ??
      pets.slice(0, DEFAULT_PLACED).map((pet) => ({ id: pet.id, n: 0, at: null }));
    return entries
      .map((entry) => ({ ...entry, pet: pets.find((pet) => pet.id === entry.id) }))
      .filter((entry) => entry.pet);
  }, [pets, placed]);

  const update = useCallback(
    (change) =>
      setPlaced((current) => {
        const base =
          current ??
          (pets || []).slice(0, DEFAULT_PLACED).map((pet) => ({ id: pet.id, n: 0, at: null }));
        const next = change(base).slice(-MAX_PLACED);
        store(PLACED_KEY, next.map((entry) => entry.id));
        return next;
      }),
    [pets],
  );
  const place = useCallback(
    (id, at = null) =>
      update((list) => [
        ...list.filter((entry) => entry.id !== id),
        { id, n: (list.find((entry) => entry.id === id)?.n ?? -1) + 1, at },
      ]),
    [update],
  );
  const unplace = useCallback(
    (id) => update((list) => list.filter((entry) => entry.id !== id)),
    [update],
  );

  const addPet = useCallback((pet, skin) => {
    rememberSkin(pet.id, skin);
    setPets((list) => [pet, ...(list || [])]);
    setMine((list) => {
      const next = [...list, pet.id];
      store(MINE_KEY, next);
      return next;
    });
  }, []);
  const removePet = useCallback(
    async (id) => {
      await deletePet(id, adminToken);
      setPets((list) => list.filter((pet) => pet.id !== id));
    },
    [adminToken],
  );

  const value = useMemo(
    () => ({
      available: pets !== null,
      pets: pets || [],
      roaming,
      mine,
      isAdmin: adminToken !== "",
      place,
      unplace,
      addPet,
      removePet,
      openEditor: () => setView("editor"),
      openVisitors: () => setView("visitors"),
      close: () => setView(null),
    }),
    [pets, roaming, mine, adminToken, place, unplace, addPet, removePet],
  );

  return (
    <PetContext.Provider value={value}>
      {children}
      {pets !== null && ready && (
        <>
          <PetLayer />
          {!view && <PetInvite />}
          {view === "editor" && <PetEditor />}
          {view === "visitors" && <VisitorsPanel />}
        </>
      )}
    </PetContext.Provider>
  );
}

/** Footer link to the visitors panel; renders nothing without the API. */
export function VisitorsLink() {
  const { available, pets, openVisitors } = usePets();
  if (!available) return null;
  return (
    <a
      href="#visitors"
      onClick={(event) => {
        event.preventDefault();
        openVisitors();
      }}
    >
      Visitor pets ({pets.length})
    </a>
  );
}

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
const MINE_KEY = "portfolio-pets-mine"; // ids only, from before edit tokens
const KEYS_KEY = "portfolio-pets-keys"; // { petId: editToken }
const MAX_PLACED = 12;

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}
function stored(key) {
  const value = read(key);
  return Array.isArray(value) ? value : null;
}
// This visitor's own pets and their edit tokens. Pets made before tokens
// existed are listed with an empty one; the server issues it on first edit.
function storedKeys() {
  const keys = Object.fromEntries((stored(MINE_KEY) || []).map((id) => [id, ""]));
  const saved = read(KEYS_KEY);
  return saved && typeof saved === "object" ? { ...keys, ...saved } : keys;
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
 * loose on the page (none until they choose some), and mounts the invite, editor, visitors panel, and the
 * roaming layer. If the pets API is unreachable the whole feature stays hidden.
 */
export function PetProvider({ ready, children }) {
  const [pets, setPets] = useState(null);
  const [view, setView] = useState(null); // "editor" | "visitors"
  const [editing, setEditing] = useState(null); // the pet being edited, if any
  // Entries are { id, n, at }: n re-mounts a pet that is dropped again, and
  // at is where it was dropped.
  const [placed, setPlaced] = useState(() =>
    (stored(PLACED_KEY) || []).map((id) => ({ id, n: 0, at: null })),
  );
  const [keys, setKeys] = useState(storedKeys);
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
    return placed
      .map((entry) => ({ ...entry, pet: pets.find((pet) => pet.id === entry.id) }))
      .filter((entry) => entry.pet);
  }, [pets, placed]);

  const update = useCallback(
    (change) =>
      setPlaced((current) => {
        const next = change(current).slice(-MAX_PLACED);
        store(PLACED_KEY, next.map((entry) => entry.id));
        return next;
      }),
    [],
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

  /** Records a pet this visitor just created or edited, with its edit token. */
  const savePet = useCallback((pet, token, skin) => {
    rememberSkin(pet, skin);
    setPets((list) =>
      list.some((other) => other.id === pet.id)
        ? list.map((other) => (other.id === pet.id ? pet : other))
        : [pet, ...list],
    );
    setKeys((current) => {
      const next = { ...current, [pet.id]: token };
      store(KEYS_KEY, next);
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
      keys,
      editing,
      isAdmin: adminToken !== "",
      place,
      unplace,
      savePet,
      removePet,
      openEditor: (pet = null) => {
        setEditing(pet);
        setView("editor");
      },
      openVisitors: () => setView("visitors"),
      close: () => setView(null),
    }),
    [pets, roaming, keys, editing, adminToken, place, unplace, savePet, removePet],
  );

  return (
    <PetContext.Provider value={value}>
      {children}
      {pets !== null && ready && (
        <>
          <PetLayer />
          {!view && <PetInvite />}
          {view === "editor" && <PetEditor key={editing?.id} />}
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

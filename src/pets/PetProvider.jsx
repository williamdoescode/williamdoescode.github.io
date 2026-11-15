import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { deletePet, likePet, listPets } from "./api.js";
import { OWNER_PETS, OWNER_SKINS } from "./owner.js";
import { rememberSkin } from "./sprites.js";
import PetInvite from "./PetInvite.jsx";
import PetEditor from "./PetEditor.jsx";
import VisitorsPanel from "./VisitorsPanel.jsx";
import PetLayer from "./PetLayer.jsx";

const PLACED_KEY = "portfolio-pets-placed";
const MINE_KEY = "portfolio-pets-mine"; // ids only, from before edit tokens
const KEYS_KEY = "portfolio-pets-keys"; // { petId: editToken }
const LIKED_KEY = "portfolio-pets-liked"; // ids this visitor has liked
const VISITOR_KEY = "portfolio-pets-visitor"; // random id, so a like counts once
const MAX_PLACED = 12;

// William's pets are painted in code, so their paintings are ready at once.
for (const pet of OWNER_PETS) rememberSkin(pet, OWNER_SKINS[pet.skin]);

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
function visitorId() {
  const saved = read(VISITOR_KEY);
  if (typeof saved === "string" && /^[a-f0-9]{32}$/.test(saved)) return saved;
  const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  store(VISITOR_KEY, id);
  return id;
}

const PetContext = createContext(null);
export const usePets = () => useContext(PetContext);

/**
 * Pets: William's own (built in) and visitors' (from the pets API). Remembers
 * which ones this visitor let loose on the page (none until they choose some)
 * and which they liked, and mounts the invite, editor, visitors panel, and
 * the roaming layer. If the API is unreachable, only William's pets show and
 * the visitor features (creating, likes, the visitors panel) stay hidden.
 */
export function PetProvider({ ready, children }) {
  const [pets, setPets] = useState(null); // visitors' pets; null while offline
  const [likes, setLikes] = useState({}); // pet id → count
  const [liked, setLiked] = useState(() => stored(LIKED_KEY) || []);
  const [visitor] = useState(visitorId);
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
        setPets(list.pets);
        setLikes(list.likes);
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
    const everyone = [...OWNER_PETS, ...(pets || [])];
    return placed
      .map((entry) => ({ ...entry, pet: everyone.find((pet) => pet.id === entry.id) }))
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

  /** Likes or unlikes a pet. The heart changes at once; the server confirms. */
  const setLike = useCallback(
    (id, on) => {
      const mark = (state) =>
        setLiked((current) => {
          const next = current.filter((other) => other !== id);
          if (state) next.push(id);
          store(LIKED_KEY, next);
          return next;
        });
      const bump = (by) =>
        setLikes((current) => ({ ...current, [id]: Math.max(0, (current[id] || 0) + by) }));
      mark(on);
      bump(on ? 1 : -1);
      likePet(id, visitor, on).then(
        (result) => setLikes((current) => ({ ...current, [id]: result.likes })),
        () => {
          mark(!on);
          bump(on ? -1 : 1);
        },
      );
    },
    [visitor],
  );

  const value = useMemo(
    () => ({
      online: pets !== null,
      pets: pets || [],
      ownerPets: OWNER_PETS,
      roaming,
      keys,
      likes,
      liked,
      editing,
      isAdmin: adminToken !== "",
      place,
      unplace,
      savePet,
      removePet,
      setLike,
      openEditor: (pet = null) => {
        setEditing(pet);
        setView("editor");
      },
      openVisitors: () => setView("visitors"),
      close: () => setView(null),
    }),
    [pets, roaming, keys, likes, liked, editing, adminToken, place, unplace, savePet, removePet, setLike],
  );

  return (
    <PetContext.Provider value={value}>
      {children}
      {ready && (
        <>
          <PetLayer />
          {pets !== null && !view && <PetInvite />}
          {pets !== null && view === "editor" && <PetEditor key={editing?.id} />}
          {pets !== null && view === "visitors" && <VisitorsPanel />}
        </>
      )}
    </PetContext.Provider>
  );
}

/** Footer link to the visitors panel; renders nothing without the API. */
export function VisitorsLink() {
  const { online, pets, openVisitors } = usePets();
  if (!online) return null;
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

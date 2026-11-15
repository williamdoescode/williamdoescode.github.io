// Talks to the PHP pets API (public/pets-api/pets.php). By default it sits
// next to the site; set VITE_PETS_API when the site is hosted elsewhere
// (for example GitHub Pages calling the API on a cPanel subdomain).
const BASE = (
  import.meta.env.VITE_PETS_API || new URL("pets-api/", document.baseURI).href
).replace(/\/*$/, "/");

async function call(options) {
  let response;
  try {
    response = await fetch(`${BASE}pets.php`, options);
  } catch {
    throw new Error("Could not reach the pet server.");
  }
  let body = null;
  try {
    body = await response.json();
  } catch {
    /* A static host answers with the PHP source or a 404 page. */
  }
  if (!response.ok || !body)
    throw new Error(body?.error || "The pet server is not available.");
  return body;
}

// text/plain keeps cross-origin posts "simple", so no preflight is needed.
const post = (payload) =>
  call({
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload),
  });

/** Resolves to { pets, likes }, where likes maps a pet id to its count. */
export async function listPets() {
  const { pets, likes } = await call({ cache: "no-store" });
  if (!Array.isArray(pets)) throw new Error("The pet server is not available.");
  return { pets, likes: likes && typeof likes === "object" ? likes : {} };
}
/** Adds or removes this visitor's like; resolves to { id, likes, liked }. */
export const likePet = (id, visitor, on) =>
  post({ action: "like", id, visitor, on });
/** Both resolve to { pet, token }; the token lets this visitor edit it later. */
export const createPet = (pet) => post({ action: "create", ...pet });
export const updatePet = (id, token, pet) =>
  post({ action: "update", id, token, ...pet });
export const deletePet = (id, token) => post({ action: "delete", id, token });
export const skinUrl = (pet) => BASE + pet.skin;

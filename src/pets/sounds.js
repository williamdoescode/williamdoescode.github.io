// What a pet says when it is clicked.
const SOUNDS = {
  dog: [
    "Bark!",
    "Bork!",
    "Ruuff!",
    "Woof!",
    "Arf arf!",
    "Awoo~",
    "Yip!",
    "Boof.",
    "Grrr...",
    "Wan wan!",
  ],
  cat: [
    "Meeow!",
    "neow~",
    "Mrrp?",
    "Purrr~",
    "Mew!",
    "Nyaa~",
    "Mrow.",
    "Prrt!",
    "Hsss!",
    "Miau~",
  ],
  rabbit: [
    "Squeak!",
    "*thump*",
    "Hop hop!",
    "Nibble~",
    "Snff snff",
    "Eep!",
    "*binky*",
    "Honk!",
  ],
};

/** A random sound for the species, never the same one twice in a row. */
export function soundFor(species, previous) {
  const options = (SOUNDS[species] || SOUNDS.dog).filter((sound) => sound !== previous);
  return options[Math.floor(Math.random() * options.length)];
}

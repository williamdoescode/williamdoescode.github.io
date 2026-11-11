// Picks the most vivid hue from the album cover so the page can glow with it.
function toHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

export async function extractColor(src) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = src;
  await image.decode();
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, size, size);
  const { data } = context.getImageData(0, 0, size, size);

  const bins = Array.from({ length: 24 }, () => ({ weight: 0, h: 0, s: 0 }));
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = toHsl(data[i], data[i + 1], data[i + 2]);
    // Favor saturated mid-tones; near-black and near-white pixels barely count.
    const weight = s * s * (1 - Math.abs(l - 0.5) * 2);
    const bin = bins[Math.floor(h / 15) % 24];
    bin.weight += weight;
    bin.h += h * weight;
    bin.s += s * weight;
  }
  const best = bins.reduce((a, b) => (b.weight > a.weight ? b : a));
  if (best.weight < 2) return "hsl(40 30% 70%)"; // Grayscale cover: warm neutral.
  const hue = Math.round(best.h / best.weight);
  const saturation = Math.round(
    Math.min(85, Math.max(45, (best.s / best.weight) * 100)),
  );
  return `hsl(${hue} ${saturation}% 60%)`;
}

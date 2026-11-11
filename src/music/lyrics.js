import { mediaUrl } from "./media.js";

// Synced lyrics come from LRCLIB (https://lrclib.net), a free, CORS-enabled
// lyrics database. A track can also point at its own .lrc file instead.
const cache = new Map();

export function parseLrc(text) {
  const lines = [];
  for (const raw of text.split(/\r?\n/)) {
    const stamps = [...raw.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
    if (!stamps.length) continue;
    const words = raw.replace(/\[[^\]]*\]/g, "").trim();
    for (const [, min, sec] of stamps)
      lines.push({ time: (Number(min) * 60 + Number(sec)) * 1000, text: words });
  }
  return lines.sort((a, b) => a.time - b.time);
}

function toResult(record) {
  const duration = record?.duration ?? 0;
  if (record?.syncedLyrics)
    return { state: "synced", lines: parseLrc(record.syncedLyrics), duration };
  if (record?.instrumental) return { state: "instrumental", lines: [], duration };
  return { state: "missing", lines: [], duration };
}

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal });
  return response.ok ? response.json() : null;
}

export async function loadLyrics(track, signal) {
  if (cache.has(track.id)) return cache.get(track.id);
  let result;
  if (track.lyrics) {
    const response = await fetch(mediaUrl(track.lyrics), { signal });
    result = response.ok
      ? { state: "synced", lines: parseLrc(await response.text()), duration: 0 }
      : toResult(null);
  } else {
    const query = new URLSearchParams({
      track_name: track.title,
      artist_name: track.artist,
    });
    let record = await fetchJson(`https://lrclib.net/api/get?${query}`, signal);
    if (!record?.syncedLyrics) {
      const matches =
        (await fetchJson(`https://lrclib.net/api/search?${query}`, signal)) ?? [];
      record = matches.find((item) => item.syncedLyrics) ?? record;
    }
    result = toResult(record);
  }
  cache.set(track.id, result);
  return result;
}

// Index of the last line whose timestamp has passed, or -1 before the first.
export function lineAt(lines, ms) {
  let low = 0;
  let high = lines.length - 1;
  let found = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (lines[mid].time <= ms) {
      found = mid;
      low = mid + 1;
    } else high = mid - 1;
  }
  return found;
}

export function formatTime(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "0:00";
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

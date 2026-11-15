// Song search: Apple's iTunes Search API finds songs (free, no key), then the
// YouTube Data API finds a playable upload for the chosen one.
// The YouTube key comes from .env.local (VITE_YOUTUBE_API_KEY) at build time.
// Restrict it to your site's address in Google Cloud: it ships in the page.
const YOUTUBE_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const MATCHES_KEY = "portfolio-youtube-matches";

export const canSearch = Boolean(YOUTUBE_KEY);

export async function searchSongs(term, signal) {
  const params = new URLSearchParams({ term, media: "music", entity: "song", limit: "12" });
  const response = await fetch(`https://itunes.apple.com/search?${params}`, { signal });
  if (!response.ok) throw new Error("Search failed");
  const { results = [] } = await response.json();
  const seen = new Set();
  return results
    .filter((item) => item.kind === "song" && item.artworkUrl100)
    .map((item) => ({
      id: `itunes-${item.trackId}`,
      title: item.trackName,
      artist: item.artistName,
      cover: item.artworkUrl100.replace(/\d+x\d+bb/, "600x600bb"),
      duration: item.trackTimeMillis,
      findOnYouTube: true,
    }))
    .filter((song) => {
      const key = `${song.title}|${song.artist}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}

const toMs = (iso) => {
  const [, h = 0, m = 0, s = 0] = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/) ?? [];
  return ((+h * 60 + +m) * 60 + +s) * 1000;
};

// Versions that rarely match the album audio the lyrics are timed to.
const UNWANTED = /\b(live|cover|karaoke|remix|sped up|slowed|reverb|8d|instrumental|nightcore|reaction|extended)\b/i;

function score(video, track, rank) {
  const { title, channelTitle } = video.snippet;
  const lead = track.artist.split(/,|&| feat| x /i)[0].trim().toLowerCase();
  let points = -rank;
  if (track.duration)
    points -= (Math.abs(toMs(video.contentDetails.duration) - track.duration) / 1000) * 2;
  if (/ - Topic$/.test(channelTitle)) points += 25;
  if (/official audio|[([]audio[)\]]/i.test(title)) points += 20;
  if (/vevo$/i.test(channelTitle) || channelTitle.toLowerCase().includes(lead)) points += 10;
  if (/official (music )?video/i.test(title)) points -= 6;
  if (/lyric/i.test(title)) points -= 4;
  const unwanted = title.match(UNWANTED)?.[0];
  if (unwanted && !track.title.toLowerCase().includes(unwanted.toLowerCase())) points -= 30;
  return points;
}

async function youtube(path, params) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/${path}?${new URLSearchParams({ ...params, key: YOUTUBE_KEY })}`,
  );
  if (response.status === 403) throw new Error("quota");
  if (!response.ok) throw new Error("YouTube search failed");
  return response.json();
}

function readMatches() {
  try {
    return JSON.parse(localStorage.getItem(MATCHES_KEY)) ?? {};
  } catch {
    return {};
  }
}

// Returns the best YouTube video id for a song, remembering past matches so
// repeat plays don't spend API quota (each search costs ~101 of 10,000 daily units).
export async function findVideo(track) {
  const key = `${track.artist} — ${track.title}`.toLowerCase();
  const matches = readMatches();
  if (matches[key]) return matches[key];

  const found = await youtube("search", {
    part: "id",
    q: `${track.artist} ${track.title} audio`,
    type: "video",
    videoEmbeddable: "true",
    videoCategoryId: "10",
    maxResults: "8",
  });
  const ids = (found.items ?? []).map((item) => item.id.videoId).filter(Boolean);
  if (!ids.length) throw new Error("not found");
  const { items = [] } = await youtube("videos", {
    part: "snippet,contentDetails",
    id: ids.join(","),
  });
  const best = items
    .map((video) => ({ id: video.id, points: score(video, track, ids.indexOf(video.id)) }))
    .sort((a, b) => b.points - a.points)[0];
  if (!best) throw new Error("not found");

  try {
    localStorage.setItem(MATCHES_KEY, JSON.stringify({ ...matches, [key]: best.id }));
  } catch {
    /* Matching still works; it just isn't remembered. */
  }
  return best.id;
}

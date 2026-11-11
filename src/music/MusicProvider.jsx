import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { playlist } from "../data.js";
import { extractColor } from "./color.js";
import { lineAt, loadLyrics } from "./lyrics.js";
import { mediaUrl } from "./media.js";
import { loadSpotifyApi } from "./spotify.js";

const MusicContext = createContext(null);
const BACKDROP_KEY = "portfolio-lyrics-backdrop";
const NO_LYRICS = { state: "idle", lines: [], duration: 0 };
// Show each line a beat early; it reads as "on time" to the ear.
const LEAD_MS = 150;

export const useMusic = () => useContext(MusicContext);

// Runs a callback every animation frame with (positionMs, durationMs).
// Used for progress bars and timers so React doesn't re-render 60×/second.
export function useTicker(callback) {
  const { subscribe } = useMusic();
  const latest = useRef(callback);
  latest.current = callback;
  useEffect(
    () => subscribe((position, duration) => latest.current(position, duration)),
    [subscribe],
  );
}

function readBackdrop() {
  try {
    return localStorage.getItem(BACKDROP_KEY) !== "off";
  } catch {
    return true;
  }
}

export function MusicProvider({ children }) {
  const [index, setIndex] = useState(-1);
  const [status, setStatus] = useState("idle"); // idle | loading | playing | paused | error
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [backdrop, setBackdropState] = useState(readBackdrop);
  const [lyrics, setLyrics] = useState(NO_LYRICS);
  const [line, setLine] = useState(-1);
  const [color, setColor] = useState(null);
  const [error, setError] = useState("");

  const track = playlist[index] ?? null;
  const indexRef = useRef(-1);
  const mutedRef = useRef(false);
  const linesRef = useRef([]);
  const lineRef = useRef(-1);
  const clock = useRef({ position: 0, duration: 0, at: 0, paused: true });
  const engine = useRef({ kind: null, audio: null, controller: null, creating: null });
  const spotifyFlags = useRef({ pendingPlay: false, played: false });
  const tickers = useRef(new Set());
  const embedHost = useRef(null);
  const nextRef = useRef(() => {});

  const subscribe = useCallback((fn) => {
    tickers.current.add(fn);
    return () => tickers.current.delete(fn);
  }, []);

  const getPosition = useCallback(() => {
    const { kind, audio } = engine.current;
    if (kind === "audio") return (audio?.currentTime || 0) * 1000;
    const c = clock.current;
    if (c.paused) return c.position;
    return Math.min(c.position + performance.now() - c.at, c.duration || Infinity);
  }, []);

  const getDuration = useCallback(() => {
    const { kind, audio } = engine.current;
    if (kind === "audio") return (audio?.duration || 0) * 1000;
    return clock.current.duration;
  }, []);

  const getAudio = useCallback(() => {
    const e = engine.current;
    if (e.audio) return e.audio;
    const audio = new Audio();
    audio.preload = "auto";
    audio.addEventListener("playing", () => setStatus("playing"));
    audio.addEventListener("pause", () => !audio.ended && setStatus("paused"));
    audio.addEventListener("waiting", () => setStatus("loading"));
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration * 1000));
    audio.addEventListener("ended", () => nextRef.current());
    audio.addEventListener("error", () => {
      if (!audio.getAttribute("src")) return;
      setStatus("error");
      setError("This track couldn't be loaded.");
    });
    e.audio = audio;
    return audio;
  }, []);

  const onSpotifyUpdate = useCallback(({ data }) => {
    if (engine.current.kind !== "spotify" || !data) return;
    const flags = spotifyFlags.current;
    const c = clock.current;
    c.position = data.position;
    c.duration = data.duration;
    c.paused = data.isPaused || data.isBuffering;
    c.at = performance.now();
    setDuration(data.duration);
    if (data.isBuffering) setStatus("loading");
    else setStatus(data.isPaused ? "paused" : "playing");
    if (!data.isPaused) flags.pendingPlay = false;
    if (data.position > 1500) flags.played = true;
    // The embed stops (and rewinds) at the end of a track: move on.
    if (
      flags.played &&
      data.isPaused &&
      data.duration > 0 &&
      (data.position === 0 || data.position >= data.duration - 800)
    ) {
      flags.played = false;
      nextRef.current();
    }
  }, []);

  const getController = useCallback(
    async (uri) => {
      const e = engine.current;
      if (e.controller) {
        e.controller.loadUri(uri);
        return e.controller;
      }
      e.creating ??= loadSpotifyApi().then(
        (IFrameAPI) =>
          new Promise((resolve) => {
            const target = document.createElement("div");
            embedHost.current.replaceChildren(target);
            IFrameAPI.createController(
              target,
              { uri, width: "100%", height: 80 },
              (controller) => {
                controller.addListener("playback_update", onSpotifyUpdate);
                controller.addListener("ready", () => {
                  if (spotifyFlags.current.pendingPlay) controller.play();
                  resolve(controller);
                });
              },
            );
          }),
      );
      try {
        e.controller = await e.creating;
      } finally {
        e.creating = null;
      }
      return e.controller;
    },
    [onSpotifyUpdate],
  );

  const select = useCallback(
    async (i) => {
      const next = playlist[i];
      if (!next) return;
      indexRef.current = i;
      setIndex(i);
      setStatus("loading");
      setError("");
      setDuration(0);
      lineRef.current = -1;
      setLine(-1);
      clock.current = { position: 0, duration: 0, at: performance.now(), paused: true };
      spotifyFlags.current = { pendingPlay: true, played: false };
      const e = engine.current;
      if (next.audio) {
        e.controller?.pause();
        e.kind = "audio";
        const audio = getAudio();
        audio.src = mediaUrl(next.audio);
        audio.muted = mutedRef.current;
        try {
          await audio.play();
        } catch (err) {
          if (err.name !== "AbortError" && indexRef.current === i) setStatus("paused");
        }
        return;
      }
      e.audio?.pause();
      e.kind = "spotify";
      // Spotify's embed has no volume control, so "mute" there means paused.
      mutedRef.current = false;
      setMuted(false);
      try {
        const controller = await getController(next.spotify);
        if (indexRef.current === i) controller.play();
      } catch {
        if (indexRef.current !== i) return;
        setStatus("error");
        setError("Spotify couldn't load. Check your connection or content blocker.");
      }
    },
    [getAudio, getController],
  );

  const next = useCallback(
    () => select((indexRef.current + 1) % playlist.length),
    [select],
  );
  nextRef.current = next;

  const seek = useCallback((ms) => {
    const { kind, audio, controller } = engine.current;
    if (kind === "audio" && audio) audio.currentTime = ms / 1000;
    if (kind === "spotify" && controller) {
      controller.seek(ms / 1000);
      Object.assign(clock.current, { position: ms, at: performance.now() });
    }
  }, []);

  const previous = useCallback(() => {
    if (getPosition() > 3000) return seek(0);
    select((indexRef.current - 1 + playlist.length) % playlist.length);
  }, [getPosition, seek, select]);

  const togglePlay = useCallback(() => {
    const { kind, audio, controller } = engine.current;
    if (indexRef.current < 0 || !kind) return select(Math.max(indexRef.current, 0));
    if (kind === "audio") return audio.paused ? audio.play().catch(() => {}) : audio.pause();
    if (!controller) return;
    if (mutedRef.current) {
      mutedRef.current = false;
      setMuted(false);
      return controller.resume();
    }
    controller.togglePlay();
  }, [select]);

  const toggleMute = useCallback(() => {
    const value = !mutedRef.current;
    mutedRef.current = value;
    setMuted(value);
    const { kind, audio, controller } = engine.current;
    if (kind === "audio" && audio) audio.muted = value;
    if (kind === "spotify" && controller) value ? controller.pause() : controller.resume();
  }, []);

  const stop = useCallback(() => {
    const e = engine.current;
    e.audio?.pause();
    e.audio?.removeAttribute("src");
    e.controller?.pause();
    e.kind = null;
    indexRef.current = -1;
    setIndex(-1);
    setStatus("idle");
    setError("");
  }, []);

  const setBackdrop = useCallback((value) => {
    setBackdropState(value);
    try {
      localStorage.setItem(BACKDROP_KEY, value ? "on" : "off");
    } catch {
      /* The choice still applies for this visit. */
    }
  }, []);

  // Lyrics for the selected track.
  useEffect(() => {
    linesRef.current = [];
    lineRef.current = -1;
    if (!track) return setLyrics(NO_LYRICS);
    const controller = new AbortController();
    setLyrics({ state: "loading", lines: [], duration: 0 });
    loadLyrics(track, controller.signal)
      .then((result) => {
        linesRef.current = result.state === "synced" ? result.lines : [];
        setLyrics(result);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setLyrics({ ...NO_LYRICS, state: "missing" });
      });
    return () => controller.abort();
  }, [track]);

  // Album color, or a hand-picked one from data.js.
  useEffect(() => {
    if (!track) return;
    let current = true;
    const pick = track.color
      ? Promise.resolve(track.color)
      : extractColor(mediaUrl(track.cover));
    pick.then((value) => current && setColor(value)).catch(() => {});
    return () => {
      current = false;
    };
  }, [track]);

  // One animation loop drives the lyric clock and every registered ticker.
  useEffect(() => {
    if (index < 0) return;
    const offset = (playlist[index].lyricsOffset ?? 0) + LEAD_MS;
    let frame;
    const loop = () => {
      const position = getPosition();
      const total = getDuration();
      tickers.current.forEach((fn) => fn(position, total));
      const current = lineAt(linesRef.current, position + offset);
      if (current !== lineRef.current) {
        lineRef.current = current;
        setLine(current);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [index, getPosition, getDuration]);

  const active = Boolean(track) && status !== "idle";
  useEffect(() => {
    const root = document.documentElement;
    if (color) root.style.setProperty("--music", color);
    root.dataset.music = active && backdrop ? "on" : "off";
    root.dataset.musicPaused = String(status === "paused");
    root.dataset.player = active ? "on" : "off";
  }, [active, backdrop, color, status]);

  // A Spotify track much longer than what's playing means a 30-second preview.
  const preview =
    Boolean(track?.spotify) &&
    !track?.audio &&
    duration > 0 &&
    duration < 31000 &&
    lyrics.duration > 45;

  const value = useMemo(
    () => ({
      playlist,
      track,
      index,
      status,
      muted,
      backdrop,
      lyrics,
      line: preview ? -1 : line,
      preview,
      error,
      embedHost,
      subscribe,
      select,
      togglePlay,
      toggleMute,
      next,
      previous,
      seek,
      stop,
      setBackdrop,
    }),
    [
      track,
      index,
      status,
      muted,
      backdrop,
      lyrics,
      line,
      preview,
      error,
      subscribe,
      select,
      togglePlay,
      toggleMute,
      next,
      previous,
      seek,
      stop,
      setBackdrop,
    ],
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

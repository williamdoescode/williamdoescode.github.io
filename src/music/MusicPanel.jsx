import { useRef } from "react";
import Icon from "../Icon.jsx";
import { BackdropButton, Equalizer, MuteButton, PlayButton } from "./Controls.jsx";
import { formatTime } from "./lyrics.js";
import { mediaUrl } from "./media.js";
import { useMusic, useTicker } from "./MusicProvider.jsx";

function Progress() {
  const { track, seek } = useMusic();
  const input = useRef(null);
  const elapsed = useRef(null);
  const total = useRef(null);
  const dragging = useRef(false);
  const label = useRef("");

  useTicker((position, duration) => {
    const range = input.current;
    if (!range) return;
    if (!dragging.current) {
      range.max = String(Math.max(duration, 1));
      range.value = String(position);
    }
    const shown = dragging.current ? Number(range.value) : position;
    range.style.setProperty("--fill", `${duration ? (shown / duration) * 100 : 0}%`);
    const text = `${formatTime(shown)} of ${formatTime(duration)}`;
    if (text !== label.current) {
      label.current = text;
      range.setAttribute("aria-valuetext", text);
      elapsed.current.textContent = formatTime(shown);
      total.current.textContent = formatTime(duration);
    }
  });

  const commit = (event) => {
    dragging.current = false;
    seek(Number(event.currentTarget.value));
  };

  return (
    <div className="progress">
      <span ref={elapsed}>0:00</span>
      <input
        ref={input}
        type="range"
        min="0"
        max="1"
        step="250"
        defaultValue="0"
        aria-label="Seek"
        disabled={!track}
        onPointerDown={() => (dragging.current = true)}
        onPointerUp={commit}
        onKeyUp={commit}
        onInput={() => (dragging.current = true)}
      />
      <span ref={total}>0:00</span>
    </div>
  );
}

function statusNote({ track, status, lyrics, preview, error }) {
  if (error) return error;
  if (!track) return "Pick a song. The page will sing along.";
  if (preview)
    return "Spotify is playing a 30-second preview. Log in to Spotify in this browser for full songs and synced lyrics.";
  if (status === "loading") return "Warming up the speakers…";
  if (lyrics.state === "loading") return "Finding the lyrics…";
  if (lyrics.state === "instrumental") return "Instrumental. Just vibes.";
  if (lyrics.state === "missing") return "No synced lyrics for this one, but the colors still move.";
  return "";
}

export default function MusicPanel() {
  const music = useMusic();
  const { playlist, track, index, status, select, togglePlay, previous, next, embedHost } =
    music;
  const shown = track ?? playlist[0];
  const playing = status === "playing";
  const note = statusNote(music);

  return (
    <div className="music-panel" data-state={status}>
      <div className="now-playing">
        <div className="now-cover">
          <img src={mediaUrl(shown.cover)} alt="" width="112" height="112" />
          <span className="vinyl" aria-hidden="true" />
        </div>
        <div className="now-meta">
          <span className="eyebrow">
            {!track
              ? "READY WHEN YOU ARE"
              : status === "loading"
                ? "LOADING…"
                : playing
                  ? "NOW PLAYING"
                  : "PAUSED"}
          </span>
          <h3>{shown.title}</h3>
          <p>{shown.artist}</p>
          <Progress />
        </div>
        <div className="player-controls">
          <div className="player-transport">
            <button
              type="button"
              className="icon-button"
              aria-label="Previous track"
              disabled={!track}
              onClick={previous}
            >
              <Icon name="solid fa-backward-step" />
            </button>
            <PlayButton />
            <button
              type="button"
              className="icon-button"
              aria-label="Next track"
              onClick={track ? next : () => select(1 % playlist.length)}
            >
              <Icon name="solid fa-forward-step" />
            </button>
          </div>
          <div className="player-toggles">
            <MuteButton />
            <BackdropButton />
          </div>
        </div>
      </div>

      <ol className="track-list" aria-label="Playlist">
        {playlist.map((item, i) => {
          const current = i === index;
          return (
            <li key={item.id}>
              <button
                type="button"
                className="track"
                aria-current={current || undefined}
                aria-label={`${current && playing ? "Pause" : "Play"} ${item.title} by ${item.artist}`}
                onClick={() => (current ? togglePlay() : select(i))}
              >
                <span className="track-number" aria-hidden="true">
                  {current && playing ? <Equalizer /> : String(i + 1).padStart(2, "0")}
                </span>
                <img src={mediaUrl(item.cover)} alt="" width="40" height="40" loading="lazy" />
                <span className="track-text">
                  <strong>{item.title}</strong>
                  <span>{item.artist}</span>
                </span>
                <Icon
                  name={item.audio ? "solid fa-music" : "brands fa-spotify"}
                  className="track-source"
                />
              </button>
            </li>
          );
        })}
      </ol>

      {/* Spotify replaces the child of this element with its player. */}
      <div className="spotify-embed" ref={embedHost} />

      <p className="music-note" role="status">
        {note}
      </p>
      <p className="music-credit">
        Music via Spotify · Lyrics via{" "}
        <a href="https://lrclib.net" target="_blank" rel="noopener noreferrer">
          LRCLIB
        </a>
      </p>
    </div>
  );
}

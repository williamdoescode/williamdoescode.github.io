import Icon from "../Icon.jsx";
import { useMusic } from "./MusicProvider.jsx";

export function Equalizer() {
  return (
    <span className="equalizer" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

export function PlayButton({ className = "" }) {
  const { status, togglePlay, track } = useMusic();
  const playing = status === "playing";
  return (
    <button
      type="button"
      className={`icon-button play-button ${className}`}
      aria-label={playing ? "Pause" : track ? "Play" : "Play the playlist"}
      onClick={togglePlay}
      data-loading={status === "loading" || undefined}
    >
      <Icon name={playing ? "solid fa-pause" : "solid fa-play"} />
    </button>
  );
}

export function MuteButton() {
  const { muted, toggleMute, track } = useMusic();
  return (
    <button
      type="button"
      className="icon-button"
      aria-label="Mute music"
      aria-pressed={muted}
      title={muted ? "Unmute" : "Mute"}
      disabled={!track}
      onClick={toggleMute}
    >
      <Icon name={muted ? "solid fa-volume-xmark" : "solid fa-volume-high"} />
    </button>
  );
}

export function BackdropButton() {
  const { backdrop, setBackdrop } = useMusic();
  return (
    <button
      type="button"
      className="icon-button"
      aria-label="Lyrics and colors in the background"
      aria-pressed={backdrop}
      title={backdrop ? "Hide background lyrics" : "Show background lyrics"}
      onClick={() => setBackdrop(!backdrop)}
    >
      <Icon name="solid fa-microphone-lines" />
    </button>
  );
}

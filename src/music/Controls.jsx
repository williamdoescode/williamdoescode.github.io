import { useEffect, useRef, useState } from "react";
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

const volumeIcon = (muted, volume) =>
  muted || volume === 0
    ? "solid fa-volume-xmark"
    : volume < 50
      ? "solid fa-volume-low"
      : "solid fa-volume-high";

export function MuteButton() {
  const { muted, volume, setVolume, toggleMute, track } = useMusic();
  return (
    <button
      type="button"
      className="icon-button"
      aria-label="Mute music"
      aria-pressed={muted}
      title={muted ? "Unmute" : "Mute"}
      disabled={!track}
      // At zero volume, "unmute" means bringing the sound back.
      onClick={() => (!muted && volume === 0 ? setVolume(60) : toggleMute())}
    >
      <Icon name={volumeIcon(muted, volume)} />
    </button>
  );
}

export function VolumeSlider() {
  const { muted, volume, setVolume, source } = useMusic();
  const unsupported = source === "spotify";
  const shown = muted ? 0 : volume;
  return (
    <input
      type="range"
      className="volume-slider"
      min="0"
      max="100"
      step="1"
      value={shown}
      aria-label="Volume"
      aria-valuetext={`${shown}%`}
      title={unsupported ? "Spotify's player doesn't allow volume changes here" : `Volume ${shown}%`}
      disabled={unsupported}
      style={{ "--fill": `${shown}%` }}
      onChange={(event) => setVolume(Number(event.target.value))}
    />
  );
}

// Compact control for tight spaces: a button that opens a slider above it.
export function VolumePopover() {
  const { muted, volume } = useMusic();
  const [open, setOpen] = useState(false);
  const root = useRef(null);

  useEffect(() => {
    if (!open) return;
    const outside = (event) => !root.current?.contains(event.target) && setOpen(false);
    const escape = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      root.current?.querySelector("button")?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div className="volume-popover-wrap" ref={root}>
      <button
        type="button"
        className="icon-button"
        aria-label="Volume"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name={volumeIcon(muted, volume)} />
      </button>
      {open && (
        <div className="volume-popover" role="group" aria-label="Volume">
          <MuteButton />
          <VolumeSlider />
          <span className="volume-value">{muted ? 0 : volume}%</span>
        </div>
      )}
    </div>
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

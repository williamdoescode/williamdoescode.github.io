import { useEffect, useRef, useState } from "react";
import Icon from "../Icon.jsx";
import { BackdropButton, MuteButton, PlayButton } from "./Controls.jsx";
import { mediaUrl } from "./media.js";
import { useMusic, useTicker } from "./MusicProvider.jsx";

// Keeps the music within reach while scrolling. It steps aside whenever the
// full player in the Entertainment section is on screen.
export default function MiniPlayer() {
  const { track, lyrics, line, next, stop } = useMusic();
  const bar = useRef(null);
  const [panelVisible, setPanelVisible] = useState(false);

  useEffect(() => {
    const panel = document.querySelector(".music-panel");
    if (!panel) return;
    const observer = new IntersectionObserver(([entry]) =>
      setPanelVisible(entry.isIntersecting),
    );
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  useTicker((position, duration) => {
    bar.current?.style.setProperty(
      "--progress",
      duration ? Math.min(position / duration, 1) : 0,
    );
  });

  if (!track) return null;
  const lyric =
    lyrics.state === "synced" && line >= 0 ? lyrics.lines[line].text || "♪" : track.artist;

  return (
    <aside
      className="mini-player"
      aria-label="Music player"
      data-hidden={panelVisible || undefined}
      inert={panelVisible}
    >
      <img src={mediaUrl(track.cover)} alt="" width="40" height="40" />
      <a className="mini-text" href="#entertainment">
        <strong>{track.title}</strong>
        <span key={lyric} className="mini-lyric">
          {lyric}
        </span>
      </a>
      <div className="mini-controls">
        <PlayButton />
        <button
          type="button"
          className="icon-button mini-next"
          aria-label="Next track"
          onClick={next}
        >
          <Icon name="solid fa-forward-step" />
        </button>
        <MuteButton />
        <BackdropButton />
        <button type="button" className="icon-button" aria-label="Stop music" onClick={stop}>
          <Icon name="solid fa-xmark" />
        </button>
      </div>
      <span className="mini-progress" ref={bar} aria-hidden="true" />
    </aside>
  );
}

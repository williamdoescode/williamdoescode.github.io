import { useRef } from "react";
import { formatTime } from "./lyrics.js";
import { useMusic, useTicker } from "./MusicProvider.jsx";

// Lines alternate between the two side ovals: the active line glows on one
// side while the next one waits, dimmed, on the other.
function sides({ track, lyrics, line, preview }) {
  if (!track) return null;
  const { lines } = lyrics;
  if (lyrics.state !== "synced" || preview || !lines.length) {
    const message =
      lyrics.state === "loading"
        ? "Finding the lyrics…"
        : preview
          ? "Preview mode"
          : lyrics.state === "instrumental"
            ? "Instrumental"
            : "Lyrics unavailable";
    return {
      left: { key: `title-${track.id}`, text: track.title, active: true },
      right: { key: `artist-${track.id}`, text: track.artist, note: message },
    };
  }
  const text = (i) => lines[i]?.text || "♪";
  if (line < 0)
    return {
      left: { key: `title-${track.id}`, text: track.title, active: true },
      right: { key: `${track.id}-0`, text: text(0) },
    };
  const current = { key: `${track.id}-${line}`, text: text(line), active: true };
  const upcoming = lines[line + 1]
    ? { key: `${track.id}-${line + 1}`, text: text(line + 1) }
    : { key: `${track.id}-end`, text: "" };
  return line % 2 === 0
    ? { left: current, right: upcoming }
    : { left: upcoming, right: current };
}

function Oval({ side, content, children, ovalRef }) {
  return (
    <div
      ref={ovalRef}
      className={`lyric-oval lyric-oval-${side}`}
      data-active={content?.active || undefined}
    >
      <span className="lyric-ring" />
      {content && (
        <p key={content.key} className="lyric-line">
          {content.text}
          {content.note && <small>{content.note}</small>}
        </p>
      )}
      {children}
    </div>
  );
}

export default function LyricsBackdrop() {
  const music = useMusic();
  const left = useRef(null);
  const right = useRef(null);
  const time = useRef(null);
  const lastTime = useRef("");
  const content = sides(music);

  useTicker((position, duration) => {
    const progress = duration ? Math.min(position / duration, 1) : 0;
    left.current?.style.setProperty("--progress", progress);
    right.current?.style.setProperty("--progress", progress);
    const text = `${formatTime(position)} / ${formatTime(duration)}`;
    if (time.current && text !== lastTime.current) {
      lastTime.current = text;
      time.current.textContent = text;
    }
  });

  return (
    <div className="lyric-stage" aria-hidden="true">
      <div className="lyric-glow" />
      <Oval side="left" content={content?.left} ovalRef={left}>
        {music.track && (
          <span className="lyric-meta">
            ♪ {music.track.title} · {music.track.artist}
          </span>
        )}
      </Oval>
      <Oval side="right" content={content?.right} ovalRef={right}>
        <span className="lyric-meta" ref={time} />
      </Oval>
    </div>
  );
}

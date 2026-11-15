import { useMusic } from "./MusicProvider.jsx";

// The same lyrics glow in both side gutters: the current line, large, with
// the next line waiting underneath.
function currentLines({ track, lyrics, line, preview }) {
  if (!track) return null;
  const { lines } = lyrics;
  if (lyrics.state !== "synced" || preview || !lines.length) {
    const note =
      lyrics.state === "loading"
        ? "Finding the lyrics…"
        : preview
          ? "Lyrics sync with full songs only"
          : lyrics.state === "instrumental"
            ? "Instrumental"
            : "No lyrics for this song";
    return { key: `${track.id}-note`, current: "♪", next: note };
  }
  const text = (i) => lines[i]?.text || "♪";
  if (line < 0) return { key: `${track.id}-intro`, current: "♪", next: text(0) };
  return {
    key: `${track.id}-${line}`,
    current: text(line),
    next: lines[line + 1] ? text(line + 1) : "",
  };
}

export default function LyricsBackdrop() {
  const content = currentLines(useMusic());
  return (
    <div className="lyric-stage" aria-hidden="true">
      <div className="lyric-glow" />
      {["left", "right"].map((side) => (
        <div key={side} className={`lyric-side lyric-side-${side}`}>
          {content && (
            <>
              <p key={content.key} className="lyric-current">
                {content.current}
              </p>
              <p key={`${content.key}-next`} className="lyric-next">
                {content.next}
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

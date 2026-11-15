import { useEffect, useState } from "react";
import Icon from "../Icon.jsx";
import { formatTime } from "./lyrics.js";
import { useMusic } from "./MusicProvider.jsx";
import { searchSongs } from "./search.js";

// Type to search any song; picking one plays it next and adds it to the list.
export default function MusicSearch() {
  const { playTrack } = useMusic();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [state, setState] = useState("idle"); // idle | loading | done | error

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setState("idle");
      return;
    }
    const controller = new AbortController();
    setState("loading");
    const timer = setTimeout(() => {
      searchSongs(term, controller.signal)
        .then((songs) => {
          setResults(songs);
          setState("done");
        })
        .catch((err) => {
          if (err.name !== "AbortError") setState("error");
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const play = (song) => {
    playTrack(song);
    setQuery("");
  };

  return (
    <div className="music-search" role="search">
      <label className="search-field">
        <Icon name="solid fa-magnifying-glass" />
        <span className="sr-only">Search for a song or artist</span>
        <input
          type="search"
          placeholder="Search any song or artist"
          autoComplete="off"
          spellCheck="false"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => event.key === "Escape" && setQuery("")}
        />
        {query && (
          <button
            type="button"
            className="search-clear"
            aria-label="Clear search"
            onClick={() => setQuery("")}
          >
            <Icon name="solid fa-xmark" />
          </button>
        )}
      </label>

      {state !== "idle" && (
        <div className="search-results" aria-live="polite" aria-busy={state === "loading"}>
          {state === "loading" && results.length === 0 && (
            <p className="search-message">Searching…</p>
          )}
          {state === "error" && (
            <p className="search-message">Search isn't available right now. Try again soon.</p>
          )}
          {state === "done" && results.length === 0 && (
            <p className="search-message">No songs found for “{query.trim()}”.</p>
          )}
          {results.length > 0 && (
            <ul aria-label="Search results">
              {results.map((song) => (
                <li key={song.id}>
                  <button
                    type="button"
                    className="result"
                    aria-label={`Play ${song.title} by ${song.artist}`}
                    onClick={() => play(song)}
                  >
                    <img src={song.cover} alt="" width="40" height="40" loading="lazy" />
                    <span className="track-text">
                      <strong>{song.title}</strong>
                      <span>{song.artist}</span>
                    </span>
                    <span className="result-time">{formatTime(song.duration)}</span>
                    <Icon name="solid fa-play" className="result-play" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

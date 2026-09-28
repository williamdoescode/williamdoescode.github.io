import { useEffect } from "react";
import "./Intro.css";

export default function Intro({ onFinish }) {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finishOnEscape = (event) => {
      if (event.key === "Escape") onFinish();
    };
    const finishOnReducedMotion = (event) => {
      if (event.matches) onFinish();
    };
    document.body.classList.add("intro-running");
    window.addEventListener("keydown", finishOnEscape);
    preference.addEventListener("change", finishOnReducedMotion);
    // A fallback also removes the overlay if animation events are interrupted.
    const timeout = window.setTimeout(onFinish, 2200);
    return () => {
      window.clearTimeout(timeout);
      document.body.classList.remove("intro-running");
      window.removeEventListener("keydown", finishOnEscape);
      preference.removeEventListener("change", finishOnReducedMotion);
    };
  }, [onFinish]);

  return (
    <div
      className="intro-overlay"
      onAnimationEnd={(event) => {
        if (
          event.animationName === "intro-exit" &&
          event.target === event.currentTarget
        )
          onFinish();
      }}
    >
      <div className="intro-art" aria-hidden="true">
        <div className="intro-panel intro-panel-top">
          <span className="intro-logo">
            WV<span>.</span>
          </span>
        </div>
        <div className="intro-panel intro-panel-bottom">
          <span className="intro-logo">
            WV<span>.</span>
          </span>
        </div>
        <span className="intro-slice" />
        <span className="intro-caption">WILLIAM VELASCO / WEB DEVELOPER</span>
      </div>
      <button className="intro-skip" type="button" onClick={onFinish}>
        Skip intro <span aria-hidden="true">↗</span>
      </button>
    </div>
  );
}

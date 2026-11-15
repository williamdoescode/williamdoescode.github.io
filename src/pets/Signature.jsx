import { useRef, useState } from "react";

export const SIGNATURE_W = 300;
export const SIGNATURE_H = 100;
const MAX_POINTS = 700;

const path = (stroke) =>
  stroke.length === 1
    ? `M${stroke[0].join(" ")} l0.01 0`
    : `M${stroke.map((point) => point.join(" ")).join(" L")}`;

/** A saved signature. It is drawn in the current text color. */
export function Signature({ strokes }) {
  // Frame the ink itself, so a small signature in one corner still centers.
  const points = (strokes || []).flat();
  if (!points.length) return null; // signing is optional
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const pad = 6;
  const left = Math.min(...xs) - pad;
  const top = Math.min(...ys) - pad;
  const width = Math.max(90, Math.max(...xs) - left + pad);
  const height = Math.max(30, Math.max(...ys) - top + pad);
  return (
    <svg
      className="signature"
      viewBox={`${left} ${top} ${width} ${height}`}
      role="img"
      aria-label="Signature"
    >
      {strokes.map((stroke, index) => (
        <path key={index} d={path(stroke)} />
      ))}
    </svg>
  );
}

/** Where a visitor signs. Strokes are stored as points, not as an image. */
export function SignaturePad({ strokes, onChange }) {
  const svg = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const count = strokes.reduce((total, stroke) => total + stroke.length, 0);

  const point = (event) => {
    const rect = svg.current.getBoundingClientRect();
    const clamp = (value, max) => Math.round(Math.min(max, Math.max(0, value)));
    return [
      clamp(((event.clientX - rect.left) / rect.width) * SIGNATURE_W, SIGNATURE_W),
      clamp(((event.clientY - rect.top) / rect.height) * SIGNATURE_H, SIGNATURE_H),
    ];
  };

  return (
    <div className="signature-pad">
      <svg
        ref={svg}
        className="signature"
        viewBox={`0 0 ${SIGNATURE_W} ${SIGNATURE_H}`}
        role="img"
        aria-label="Signature area. Draw with a mouse, pen, or finger."
        onPointerDown={(event) => {
          if (count >= MAX_POINTS) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setDrawing(true);
          onChange([...strokes, [point(event)]]);
        }}
        onPointerMove={(event) => {
          if (!drawing || count >= MAX_POINTS) return;
          const next = point(event);
          const stroke = strokes.at(-1);
          const last = stroke.at(-1);
          if (Math.hypot(next[0] - last[0], next[1] - last[1]) < 2) return;
          onChange([...strokes.slice(0, -1), [...stroke, next]]);
        }}
        onPointerUp={() => setDrawing(false)}
        onPointerCancel={() => setDrawing(false)}
      >
        <line
          className="signature-rule"
          x1="16"
          y1="78"
          x2={SIGNATURE_W - 16}
          y2="78"
        />
        {strokes.map((stroke, index) => (
          <path key={index} d={path(stroke)} />
        ))}
      </svg>
      {count === 0 && <span className="signature-hint">Sign here</span>}
      {count > 0 && (
        <button
          type="button"
          className="signature-clear"
          onClick={() => onChange([])}
        >
          Clear
        </button>
      )}
    </div>
  );
}

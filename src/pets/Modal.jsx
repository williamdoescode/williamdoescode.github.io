import { useEffect, useRef } from "react";
import Icon from "../Icon.jsx";

// A page overlay rather than a <dialog>: a pet dragged out of the visitors
// panel has to travel over the page, which the browser's top layer would hide.
export default function Modal({
  title,
  eyebrow,
  onClose,
  className = "",
  children,
  ...rest
}) {
  const box = useRef(null);
  useEffect(() => {
    const shell = document.querySelector(".site-shell");
    const before = document.activeElement;
    document.body.classList.add("gallery-open");
    if (shell) shell.inert = true;
    box.current.querySelector("[data-autofocus]")?.focus();
    return () => {
      document.body.classList.remove("gallery-open");
      if (shell) shell.inert = false;
      before?.focus?.({ preventScroll: true });
    };
  }, []);

  function onKeyDown(event) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
    }
    if (event.key !== "Tab") return;
    const items = [
      ...box.current.querySelectorAll(
        "button:not(:disabled), input, [href], [tabindex='0']",
      ),
    ].filter((item) => item.offsetParent !== null);
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className={`pet-overlay ${className}`}
      onPointerDown={(event) =>
        event.target === event.currentTarget && onClose()
      }
      {...rest}
    >
      <div
        ref={box}
        className="pet-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={onKeyDown}
      >
        <div className="pet-modal-header">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            data-autofocus
            aria-label="Close"
            onClick={onClose}
          >
            <Icon name="solid fa-xmark" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

import Intro from "./Intro.jsx";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  asset,
  email,
  projects,
  socials,
  toolkit,
  projectTools,
} from "./data.js";

function Icon({ name, ...props }) {
  return <i className={`fa-${name}`} aria-hidden="true" {...props} />;
}
function SectionHeading({ title, id, children }) {
  return (
    <div className="section-heading">
      <h2 id={id}>{title}</h2>
      {children}
    </div>
  );
}
function Tags({ items }) {
  return (
    <ul className="tags">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
function SocialLinks() {
  return (
    <div className="social-links">
      {socials.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${link.name} (opens in a new tab)`}
        >
          <Icon name={link.icon} />
          {link.name}
          <span className="social-arrow" aria-hidden="true">
            ↗
          </span>
        </a>
      ))}
    </div>
  );
}
function Header({ theme, onToggle }) {
  return (
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="William Velasco, home">
        wv<span> /</span>
      </a>
      <nav aria-label="Main navigation">
        <a href="#projects">Projects</a>
        <a href="#experience">Experience</a>
        <a href="#toolkit">Toolkit</a>
        <a href="#contact">Contact</a>
      </nav>
      <button
        className="icon-button theme-toggle"
        type="button"
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        aria-pressed={theme === "dark"}
        onClick={onToggle}
      >
        <Icon name={theme === "dark" ? "regular fa-sun" : "regular fa-moon"} />
      </button>
    </header>
  );
}
function Profile() {
  return (
    <section className="profile-card" aria-labelledby="profile-name">
      <div className="profile-identity">
        <div className="portrait-frame">
          <img
            src={asset("images/wmv.png")}
            alt="William Velasco"
            width="132"
            height="152"
            fetchPriority="high"
          />
          <span className="portrait-corner" aria-hidden="true">
            &lt;/&gt;
          </span>
        </div>
        <div className="profile-name">
          <span className="eyebrow">FULL-STACK WEB DEVELOPER</span>
          <h1 id="profile-name">
            William
            <br />
            Velasco<span>.</span>
          </h1>
          <p className="location">
            <Icon name="solid fa-location-dot" />
            Philippines
          </p>
        </div>
      </div>
      <div className="profile-description">
        <span className="eyebrow">WHAT I DO</span>
        <p>
          I build web apps, connect APIs, and turn everyday problems into{" "}
          <em>useful experiences.</em>
        </p>
        <SocialLinks />
      </div>
      <div className="profile-actions">
        <a className="button button-primary" href="#projects">
          Projects
          <Icon name="solid fa-arrow-right" />
        </a>
        <a
          className="button button-quiet"
          href={asset("files/wmv-resume.pdf")}
          download
        >
          Download résumé
          <Icon name="solid fa-download" />
        </a>
        <a className="button button-quiet" href="#contact">
          Start a conversation
          <Icon name="regular fa-envelope" />
        </a>
      </div>
      <div className="profile-footnote">
        <span>
          <span className="status-dot" />
          Available for work
        </span>
        <span className="profile-signature">
          THOUGHTFUL CODE. HUMAN EXPERIENCES.
        </span>
      </div>
    </section>
  );
}
function ProjectCard({ project, onOpen }) {
  const open = (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    onOpen(project, event.currentTarget);
  };
  const tools = project.tags.map(
    (name) =>
      toolkit
        .flatMap((group) => group.tools)
        .find((tool) => tool.name === name) || { name, ...projectTools[name] },
  );
  return (
    <article className="project-card">
      <div className="project-info">
        <span className="eyebrow">{project.category}</span>
        <h3>
          <a href={project.images[0]} onClick={open}>
            {project.title}
            <Icon name="solid fa-arrow-up-right-from-square" />
          </a>
        </h3>
        <p>{project.summary}</p>
        <ToolIcons tools={tools} />
      </div>
      <a
        className="project-preview"
        href={project.images[0]}
        onClick={open}
        aria-label={`View ${project.title} project gallery`}
      >
        <img
          src={project.images[0]}
          alt={`${project.title} dashboard`}
          width="1600"
          height="900"
          loading="lazy"
        />
        <span className="preview-action">
          <Icon name="regular fa-images" />
          {project.images.length} screenshots{" "}
          <Icon name="solid fa-arrow-up-right-from-square" />
        </span>
      </a>
    </article>
  );
}
function ProjectGallery({ project, onClose }) {
  const dialog = useRef(null);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    document.body.classList.add("gallery-open");
    return () => {
      element.close();
      document.body.classList.remove("gallery-open");
    };
  }, []);
  const changeImage = (direction) =>
    setIndex(
      (current) =>
        (current + direction + project.images.length) % project.images.length,
    );
  return (
    <dialog
      ref={dialog}
      id="project-dialog"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          const buttons = [...dialog.current.querySelectorAll("button")];
          const first = buttons[0];
          const last = buttons.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
        if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
          event.preventDefault();
          changeImage(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
      onClick={(event) => {
        const rect = dialog.current.getBoundingClientRect();
        if (
          event.target === dialog.current &&
          (event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom)
        )
          onClose();
      }}
    >
      <div className="dialog-header">
        <span className="eyebrow">PROJECT DETAILS</span>
        <button
          className="icon-button"
          type="button"
          autoFocus
          aria-label="Close project gallery"
          onClick={onClose}
        >
          <Icon name="solid fa-xmark" />
        </button>
      </div>
      <div className="dialog-body">
        <h2 id="dialog-title">{project.title}</h2>
        <p id="dialog-description">{project.description}</p>
        <Tags items={project.tags} />
      </div>
      <div className="gallery-image-wrap">
        <img
          id="gallery-image"
          src={project.images[index]}
          alt={`${project.title}, screenshot ${index + 1} of ${project.images.length}`}
          width="1600"
          height="900"
        />
      </div>
      <div className="gallery-controls">
        <button
          className="icon-button"
          type="button"
          aria-label="Previous screenshot"
          onClick={() => changeImage(-1)}
        >
          <Icon name="solid fa-arrow-left" />
        </button>
        <p id="gallery-count" aria-live="polite">
          {index + 1} / {project.images.length}
        </p>
        <button
          className="icon-button"
          type="button"
          aria-label="Next screenshot"
          onClick={() => changeImage(1)}
        >
          <Icon name="solid fa-arrow-right" />
        </button>
      </div>
    </dialog>
  );
}
function ToolIcons({ tools }) {
  const [pinned, setPinned] = useState(null);
  return (
    <ul className="tool-icons">
      {tools.map((tool) => (
        <li key={tool.name}>
          <button
            type="button"
            className={`tool-icon${pinned === tool.name ? " is-pinned" : ""}`}
            aria-label={tool.name}
            aria-pressed={pinned === tool.name}
            onClick={() =>
              setPinned((current) => (current === tool.name ? null : tool.name))
            }
            onBlur={() => setPinned(null)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setPinned(null);
                event.currentTarget.blur();
              }
            }}
          >
            {tool.icon ? (
              <Icon name={tool.icon} />
            ) : (
              <span
                className={`tool-monogram${tool.name === "Xero" ? " tool-xero" : ""}`}
                aria-hidden="true"
              >
                {tool.mark}
                {tool.sub && <small>{tool.sub}</small>}
              </span>
            )}
            <span className="tool-tooltip" aria-hidden="true">
              {tool.name}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
function Experience() {
  return (
    <section
      id="experience"
      className="resume-section experience-section"
      aria-labelledby="experience-title"
    >
      <SectionHeading title="Professional Experience" id="experience-title" />
      <div className="experience-list">
        <article className="experience-entry">
          <div className="experience-heading">
            <h3>EBOS PH</h3>
            <span>Remote · Full-time</span>
          </div>
          <p className="experience-role">Full Stack Developer</p>
          <p className="experience-summary">
            Built financial and accounting modules, optimized MySQL performance,
            and improved team workflows with GitLab.
          </p>
        </article>
        <article className="experience-entry">
          <div className="experience-heading">
            <h3>Media Conquest</h3>
            <span>Remote · Part-time</span>
          </div>
          <p className="experience-role">Full Stack Developer</p>
          <p className="experience-summary">
            Refactored legacy APIs and optimized PHP data fetching to improve
            reliability and responsiveness.
          </p>
        </article>
      </div>
    </section>
  );
}

function Toolkit() {
  return (
    <section
      id="toolkit"
      className="resume-section"
      aria-labelledby="toolkit-title"
    >
      <SectionHeading title="My toolkit" id="toolkit-title">
        <p>
          A few familiar tools.
          <br />
          Plenty of possibilities.
        </p>
        <p className="toolkit-hint">
          Hover, focus, or tap
          <br />
          to explore.
        </p>
      </SectionHeading>
      <div className="toolkit">
        {toolkit.map((group) => (
          <div className="toolkit-row" key={group.title}>
            <h3>{group.title}</h3>
            <ToolIcons tools={group.tools} />
          </div>
        ))}
      </div>
    </section>
  );
}
function Contact() {
  const [message, setMessage] = useState("");
  const timer = useRef(null);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setMessage("Email copied!");
    } catch {
      setMessage("Use the email link below.");
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(""), 3000);
  }
  return (
    <section
      id="contact"
      className="contact-section"
      aria-labelledby="contact-title"
    >
      <div className="contact-copy">
        <span className="eyebrow contact-kicker">
          <span className="status-dot" />
          OPEN TO NEW OPPORTUNITIES
        </span>
        <h2 id="contact-title">Let's build something useful.</h2>
        <a className="email-link" href={`mailto:${email}`}>
          {email}
        </a>
      </div>
      <div className="contact-actions">
        <a className="button button-primary" href={`mailto:${email}`}>
          Let's talk
          <Icon name="solid fa-arrow-up-right-from-square" />
        </a>
        {navigator.clipboard && window.isSecureContext && (
          <button
            className="button button-secondary"
            type="button"
            onClick={copyEmail}
          >
            <Icon name="regular fa-copy" />
            {message || "Copy email"}
          </button>
        )}
      </div>
      <span className="sr-only" role="status">
        {message}
      </span>
    </section>
  );
}
export default function App() {
  const [introOpen, setIntroOpen] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const finishIntro = useCallback(() => setIntroOpen(false), []);
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "dark",
  );
  const [project, setProject] = useState(null);
  const trigger = useRef(null);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content =
      theme === "dark" ? "#0b090a" : "#fffcf2";
    try {
      localStorage.setItem("portfolio-theme", theme);
    } catch {
      /* Theme still works for this visit. */
    }
  }, [theme]);
  function closeProject() {
    setProject(null);
    requestAnimationFrame(() =>
      trigger.current?.focus({ preventScroll: true }),
    );
  }
  return (
    <>
      <a className="skip-link" href="#main" inert={introOpen}>
        Skip to content
      </a>
      <div className="site-shell" inert={introOpen}>
        <Header
          theme={theme}
          onToggle={() =>
            setTheme((current) => (current === "dark" ? "light" : "dark"))
          }
        />
        <main id="main">
          <Profile />
          <section
            id="projects"
            className="work-section"
            aria-labelledby="work-title"
          >
            <div className="work-heading">
              <SectionHeading title="Projects" id="work-title" />
              <span className="eyebrow">IDEAS INTO WORKING SOFTWARE</span>
            </div>
            <div className="projects-grid">
              {projects.map((item) => (
                <ProjectCard
                  key={item.id}
                  project={item}
                  onOpen={(selection, element) => {
                    trigger.current = element;
                    setProject(selection);
                  }}
                />
              ))}
            </div>
            <a
              className="text-link github-link"
              href={socials[0].url}
              target="_blank"
              rel="noopener noreferrer"
            >
              More experiments on GitHub{" "}
              <Icon name="solid fa-arrow-up-right-from-square" />
            </a>
          </section>
          <Experience />
          <Toolkit />
          <section
            className="resume-section education-section"
            aria-labelledby="education-title"
          >
            <SectionHeading title="Education" id="education-title" />
            <div className="education">
              <span className="education-icon">
                <Icon name="solid fa-graduation-cap" />
              </span>
              <div>
                <h3>B.S. in Information Technology</h3>
                <p>
                  A foundation in technology. A curiosity that keeps growing.
                </p>
              </div>
            </div>
          </section>
          <Contact />
        </main>
        <footer className="site-footer">
          <p>
            © {new Date().getFullYear()} William Velasco <span>/</span> Made
            with care.
          </p>
          <a href="#top">
            Back to top <Icon name="solid fa-arrow-up" />
          </a>
        </footer>
      </div>
      {introOpen && <Intro onFinish={finishIntro} />}
      {project && (
        <ProjectGallery
          key={project.id}
          project={project}
          onClose={closeProject}
        />
      )}
    </>
  );
}

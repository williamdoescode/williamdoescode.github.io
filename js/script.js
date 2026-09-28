(() => {
  "use strict";

  const root = document.documentElement;
  const themeButton = document.querySelector(".theme-toggle");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let manualTheme = false;
  try {
    manualTheme = ["light", "dark"].includes(
      localStorage.getItem("portfolio-theme"),
    );
  } catch {
    /* Storage is optional. */
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    const isDark = theme === "dark";
    themeButton.setAttribute(
      "aria-label",
      `Switch to ${isDark ? "light" : "dark"} mode`,
    );
    themeButton.setAttribute("aria-pressed", String(isDark));
    themeButton.firstElementChild.className = isDark
      ? "fa-regular fa-sun"
      : "fa-regular fa-moon";
    document.querySelector('meta[name="theme-color"]').content = isDark
      ? "#141917"
      : "#f8f9f6";
  }

  applyTheme(root.dataset.theme || (systemTheme.matches ? "dark" : "light"));
  themeButton.hidden = false;
  themeButton.addEventListener("click", () => {
    const theme = root.dataset.theme === "dark" ? "light" : "dark";
    manualTheme = true;
    applyTheme(theme);
    try {
      localStorage.setItem("portfolio-theme", theme);
    } catch {
      /* Keep the theme for this visit. */
    }
  });
  systemTheme.addEventListener("change", (event) => {
    if (!manualTheme) applyTheme(event.matches ? "dark" : "light");
  });

  const localTime = document.querySelector("#local-time");
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  function updateTime() {
    localTime.textContent = timeFormatter.format(new Date());
    localTime.dateTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Manila",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date());
  }
  updateTime();
  window.setInterval(updateTime, 60000);
  document.querySelector("#year").textContent = new Date().getFullYear();

  // Content stays visible without JavaScript or IntersectionObserver.
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.08 },
    );
    document
      .querySelectorAll(".reveal")
      .forEach((section) => revealObserver.observe(section));

    const navLinks = [...document.querySelectorAll(".site-header nav a")];
    const visibleSections = new Set();
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visibleSections.add(entry.target.id);
          else visibleSections.delete(entry.target.id);
        });
        const active = navLinks.find((link) =>
          visibleSections.has(link.hash.slice(1)),
        );
        navLinks.forEach((link) => {
          if (link === active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-10% 0px -35% 0px" },
    );
    navLinks.forEach((link) =>
      navObserver.observe(document.querySelector(link.hash)),
    );
  }

  const copyButton = document.querySelector("#copy-email");
  let copyReset;
  if (navigator.clipboard && window.isSecureContext) {
    copyButton.hidden = false;
    copyButton.addEventListener("click", async () => {
      const announcement = document.querySelector("#announcement");
      try {
        await navigator.clipboard.writeText("williamvelasco41@gmail.com");
        copyButton.textContent = "Email copied!";
        announcement.textContent = "Email address copied to clipboard.";
      } catch {
        copyButton.textContent = "Use email link below";
        announcement.textContent =
          "Copy unavailable. Use the email link below the buttons.";
      }
      window.clearTimeout(copyReset);
      copyReset = window.setTimeout(() => {
        copyButton.textContent = "Copy email";
      }, 3000);
    });
  }

  // All project details live here; the HTML previews remain useful without JS.
  const projects = {
    inventory: {
      title: "Inventory System",
      description:
        "An inventory management application with custom reporting, stock alerts, and multi-user support. Built to bring complex warehouse operations into a clear, practical workspace.",
      tags: ["Laravel", "Vue.js", "Inertia.js", "MySQL", "Tailwind CSS"],
      images: [2, 3, 4, 5].map(
        (number) => `./images/inventory project/${number}.png`,
      ),
    },
    atpeis: {
      title: "ATPEIS",
      description:
        "Assignment Tracking and Performance Evaluation Information System. An HR and tracking platform designed to organize assignments and support detailed staff performance monitoring.",
      tags: ["PHP", "MySQL", "Bootstrap"],
      images: [3, 4, 5, 1, 2].map((number) => `./images/atpeis ${number}.png`),
    },
  };
  const dialog = document.querySelector("#project-dialog");
  const galleryImage = document.querySelector("#gallery-image");
  let activeProject;
  let imageIndex = 0;
  let galleryTrigger;

  function showImage(index) {
    imageIndex =
      (index + activeProject.images.length) % activeProject.images.length;
    galleryImage.src = activeProject.images[imageIndex];
    galleryImage.alt = `${activeProject.title}, screenshot ${imageIndex + 1} of ${activeProject.images.length}`;
    document.querySelector("#gallery-count").textContent =
      `${imageIndex + 1} / ${activeProject.images.length}`;
  }

  document.querySelectorAll("[data-project]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        typeof dialog.showModal !== "function"
      )
        return;
      const project = projects[link.dataset.project];
      if (!project) return;
      event.preventDefault();
      galleryTrigger = link;
      activeProject = project;
      document.querySelector("#dialog-title").textContent = project.title;
      document.querySelector("#dialog-description").textContent =
        project.description;
      document.querySelector("#dialog-tags").replaceChildren(
        ...project.tags.map((tag) => {
          const item = document.createElement("li");
          item.textContent = tag;
          return item;
        }),
      );
      showImage(0);
      dialog.showModal();
      document.body.classList.add("gallery-open");
    });
  });
  document
    .querySelector("#close-dialog")
    .addEventListener("click", () => dialog.close());
  document
    .querySelector("#previous-image")
    .addEventListener("click", () => showImage(imageIndex - 1));
  document
    .querySelector("#next-image")
    .addEventListener("click", () => showImage(imageIndex + 1));
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      showImage(imageIndex + (event.key === "ArrowLeft" ? -1 : 1));
    }
  });
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom)
    )
      dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("gallery-open");
    galleryTrigger?.focus({ preventScroll: true });
  });
})();

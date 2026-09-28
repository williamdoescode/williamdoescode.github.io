# William Velasco — React Portfolio

A centered portfolio built with React and Vite, with a compact 820px centered container, split project rows, project galleries, and an icon-based toolkit.

## Run locally

Use Node.js 22.12+ (Node 24 recommended).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. To test the production site:

```sh
npm run build
npm run preview
```

React needs a development server or production build; opening `index.html` directly will not run the app.

## Design and interaction

- The default dark theme uses `#0b090a` for the page background and `#fffcf2` for primary text. Light mode reverses that pairing. A visitor's saved theme is preserved.
- The profile card groups the portrait, name, introduction, social links, and main actions in a compact layout that stacks on mobile.
- Toolkit icons reveal names on hover, keyboard focus, or tap. Each has an accessible name. Escape dismisses a focused label.
- Project galleries support arrow keys, Escape, focus containment, and returning focus to the trigger.
- Animations respect reduced-motion settings. Printed pages include toolkit labels.
- Icons, images, and the résumé are served locally.

## Project structure

- `src/App.jsx`: React components and interaction state.
- `src/data.js`: projects, screenshot paths, toolkit entries, contact details, and social links.
- `src/styles.css`: theme tokens, component styles, responsive layouts, and print styles.
- `src/main.jsx`: React entry point.
- `public/images/`: portrait, favicon, and project screenshots.
- `public/files/wmv-resume.pdf`: downloadable résumé.
- `public/icons/fontawesome/`: locally hosted icon assets.
- `.github/workflows/deploy.yml`: production build and GitHub Pages deployment.

## GitHub Pages

In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**. The included workflow builds and deploys `dist` when changes are pushed to `main`, or when triggered manually. Source files are not the deployable site.

Vite uses a relative base (`./`), and public asset paths use `import.meta.env.BASE_URL`, so the production build supports both the account site and project subdirectories. See [Vite's deployment guide](https://vite.dev/guide/static-deploy.html#github-pages).

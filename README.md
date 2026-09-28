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

- Every page visit starts with a brief WV split animation. Skip intro or Escape reveals the content immediately; reduced-motion visitors go straight to the page.
- Professional Experience summarizes the EBOS PH and Media Conquest roles.

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
- `docs/`: committed production build served by GitHub Pages.
- `public/.nojekyll`: disables Jekyll processing for the static build.

## GitHub Pages

Live site: https://williamdoescode.github.io/

Both the React source and published files live on **main**. Pages must stay configured to **Deploy from a branch → main → /docs**. The root contains development source; the `docs/` folder contains the production site.

### Prepare an update

```sh
npm run build
npm run preview
```

The build regenerates `docs/`, including assets and `.nojekyll`. Review the result, then commit and push the source changes **and** the updated `docs/` directory when you choose to publish. GitHub Pages publishes that directory after the push.

`npm run deploy` is an alias for the local build only. It never commits, pushes, or changes repository settings. A separate publishing branch or custom Actions workflow is no longer required.

Do not edit generated files in `docs/` directly; edit `src/` or `public/` and rebuild. The relative Vite base supports both account sites and project subdirectories.

See [GitHub's publishing-source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

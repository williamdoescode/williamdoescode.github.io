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
- `.github/workflows/deploy.yml`: production build and GitHub Pages deployment.

## GitHub Pages

Live site: https://williamdoescode.github.io/

Pages is configured to **Deploy from a branch → gh-pages → / (root)**. The `gh-pages` branch contains the built site; `main` contains the React source.

To publish an update using your existing GitHub Git credentials:

```sh
npm run deploy
```

This builds the app locally, clones the publishing branch into a temporary directory, commits the production files, and pushes without force. The source checkout stays on its current branch. Commit and push your source changes separately to keep `main` up to date.

The Actions deployment workflow is currently manual-only because GitHub blocked the custom workflow with an account billing lock. Branch-based Pages publishing uses the locally generated build. If you later restore Actions deployment, resolve the account issue, set Pages Source to GitHub Actions, and run the workflow manually.

The relative Vite base supports both the account site and project subdirectories.

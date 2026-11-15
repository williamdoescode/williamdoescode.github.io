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

## Visitor pets

Visitors can paint a 32×32 dog or cat, name it, sign its card, and let it roam the page. Every pet appears in the Visitors panel (paw button, or the footer link, or `#visitors`), and anyone can drag any pet onto the page.

- **One painting, ten animations.** `src/pets/rig.js` cuts the painting into head, body, legs, and tail, and `src/pets/animations.js` re-poses those parts for Idle, Idle 2, Run, Sitting, Sleep, Jump, Attack, Hurt, Die, and Die 2. Visitors never draw frames.
- **Storage is a small PHP script, no database.** `public/pets-api/pets.php` (PHP 8.1+) writes `data/pets.json`, `data/pets/{id}.json`, and `data/pets/{id}.png` next to itself. It creates `data/` on the first save, validates every upload, and rate-limits by salted IP hash.
- **Which pets roam is per visitor** (saved in their browser). First-time visitors see the three newest pets.
- **Without the API the feature hides itself**, so the site still works on a static host.

### Run it locally

```sh
npm run pets-api   # PHP built-in server on 127.0.0.1:8787
npm run dev        # Vite proxies /pets-api to it
```

Pets saved while developing land in `public/pets-api/data/`, which is git-ignored.

### Deploy

- **cPanel:** nothing extra. The build copies `pets-api/` into `docs/`, and the normal deploy puts it beside the site. Deploys never touch `data/`, so saved pets survive.
- **GitHub Pages** cannot run PHP. Host `pets-api/` on your cPanel domain or a subdomain, then build with the API address in `.env.production`:

  ```sh
  VITE_PETS_API=https://pets.example.com/pets-api/
  ```

### Moderation

Create `pets-api/data/private/admin-token.txt` on the server containing a long random string. Then open the site at `#pets-admin`, enter the token, and each card in the Visitors panel gets a Delete button. Without that file, deleting is disabled.

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

## cPanel hosting

The same `docs/` build runs on any cPanel (Apache) host. No Node.js app or server setup is needed. `public/.htaccess` is copied into the build. It sets `index.html` as the index, sends the correct MIME types for module scripts and fonts, enables compression, and caches hashed bundles long-term while always revalidating the page.

### Option A: Git Version Control (recommended)

1. In cPanel, open **Git™ Version Control → Create** and clone this repository (outside `public_html`, e.g. `~/repositories/portfolio`).
2. After pushing a new build, open **Manage → Pull or Deploy**, then **Update from Remote** and **Deploy HEAD Commit**.

`.cpanel.yml` copies `docs/` into `~/public_html/`. To deploy to an addon domain or subfolder, change `DEPLOYPATH` in that file. Deploys add and overwrite files but never delete. To remove old `assets/index-*.js` and `.css` bundles, use File Manager.

### Option B: File Manager upload

1. Run `npm run build`.
2. Zip the **contents** of `docs/`, including the hidden `.htaccess`, and upload the zip to `public_html` (or a subfolder).
3. Extract it there. In File Manager, enable **Settings → Show Hidden Files** to confirm `.htaccess` is present.

### White screen?

A white screen means the server is showing the root `index.html`, the Vite development page, instead of the build in `docs/`. That happens when the repository is cloned or uploaded straight into `public_html`, or when **Deploy HEAD Commit** was never run. Two safety nets now handle it:

- The root `.htaccess` serves every request from `docs/` when the repository itself is the web root (needs `mod_rewrite`, which cPanel hosts have by default). This also hides `.git`, `src/`, and `node_modules/`.
- If rewrites are unavailable, the development page sends visitors to `docs/` when its source script can't run.

The cleanest setup is still Option A or B, which puts the built files directly in `public_html`.

Filenames on cPanel are case-sensitive, unlike on Windows, so keep image references in `src/data.js` matching the files exactly. To force HTTPS, use **Domains → Force HTTPS Redirect** in cPanel.

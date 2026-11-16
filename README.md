# William — React Portfolio

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

## Pets

The Entertainment section has a Pets area below the music player. It shows William's own dogs, then the newest visitor pets. Visitors can paint a 32×32 dog or cat, name it, optionally sign its card, and let it roam the page. Every visitor pet appears in the Visitors panel (**See all**, the paw button, the footer link, or `#visitors`), and anyone can drag any pet onto the page.

- **William's Pets** are painted in code in `src/pets/owner.js` (Brixi, Lira, Cloe, Adelle, Mustard, Maple). To change a coat or add a dog, edit that file; a new dog's id must also be added to `OWNER_PETS` in `public/pets-api/pets.php` so it can be liked.
- **Click a pet and it speaks.** Dogs and cats pick a random line from `src/pets/sounds.js`.
- **Likes.** Each card has a heart. A visitor can like each pet once and take it back. Counts live in `data/likes.json`; the server keeps a salted hash of each browser's random visitor id in `data/private/likers.json` so a repeat like does not count twice.

- **One painting, ten animations.** `src/pets/rig.js` cuts the painting into head, body, legs, and tail, and `src/pets/animations.js` re-poses those parts for Idle, Idle 2, Run, Sitting, Sleep, Jump, Attack, Hurt, Die, and Die 2. Visitors never draw frames. Frames are drawn at twice the painted resolution with in-between poses added automatically, and cats are shown slightly smaller than dogs (`SPECIES_SCALE`). All of this happens when a pet is displayed, so it applies to every pet already saved.
- **Storage is a small PHP script, no database.** `public/pets-api/pets.php` (PHP 8.1+) writes `data/pets.json`, `data/pets/{id}.json`, and `data/pets/{id}.png` next to itself. It creates `data/` on the first save, validates every upload, and rate-limits by salted IP hash.
- **Which pets roam is per visitor** (saved in their browser). Nothing roams until a visitor lets a pet loose.
- **Visitors can edit their own pets.** Saving a pet returns an edit token that stays in that visitor's browser; the server keeps only its hash in `data/private/tokens.json`. Pets saved before tokens existed have none, so the first edit claims them. The site only shows Edit to the browser that created the pet, but a hand-written request could claim such a pet first.
- **Without the API only William's pets show.** Creating, likes, and the Visitors panel hide themselves, so the site still works on a static host.

### Playground

**Proceed to Playground** in the Pets area swaps the whole page for a field with trees (`#playground`; **Go back to Main Page** or the browser's Back button returns to where the visitor was). The code is in `src/pets/playground/`.

- Pets wander, nap, and play on their own. Dogs mostly chase the ball, cats mostly bat the yarn and scratch the pole, and each naps by its own kind of house. `sim.js` holds those habits (`WISHES`) and the toy physics (`TOYS`).
- Visitors can click a pet to hear it, click or throw a toy (nearby pets run after it), drag anything to move it, add things from the shelf, and drop a thing on the shelf to put it away. The shelf also chooses which pets are in the field (up to 12).
- The dog house, cat house, scratch pole, ball, yarn, and trees are painted in code in `art.js`.
- The layout is saved in each visitor's own browser; it is not shared between visitors.
- Music keeps playing because the portfolio stays loaded underneath. While a YouTube song plays, its player sits in the corner of the playground at the 200×200 YouTube requires.

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

Open the site at `#pets-admin` and enter the admin token. A wrong token is reported straight away; the right one adds a Delete button to each card in the Visitors panel.

The token is set in `public/pets-api/admin-hash.php`, which holds only its SHA-256 hash, so the file is safe to commit and deploys with the site. The token itself is not written anywhere in the project: keep it somewhere private. To change it, pick a long random string and put its hash in that file:

```sh
php -r "echo hash('sha256', 'your-new-token');"
```

A plain-text token in `pets-api/data/private/admin-token.txt` on the server also works, beside the live `pets.php`. Never commit a plain-text token: this repository and the GitHub Pages site are public. This is not a pet's edit token.

## Music

The Entertainment section plays full songs through YouTube's embedded player. Synced lyrics from LRCLIB glow in both side gutters on screens 1360px and wider, and in the floating mini-player on smaller screens. The page tints itself with the album cover's color. The starter playlist lives in `src/data.js`.

YouTube's terms don't allow hiding the player, so it shows at the 200×200 minimum in place of the album cover while a song plays.

### Song search

Visitors can search any song. Apple's iTunes Search API finds it, then the YouTube Data API picks the upload whose length best matches (official audio and "- Topic" uploads first), so the lyrics stay in sync. The search box only appears once a YouTube key is set:

1. In [Google Cloud](https://console.cloud.google.com/), create a project, enable **YouTube Data API v3**, and create an **API key**.
2. Restrict the key: **API restrictions → YouTube Data API v3**, and **Website restrictions** → your site addresses (for example `https://yourdomain.com/*` and `https://williamdoescode.github.io/*`). The key ships inside the page, so these restrictions are what protect it.
3. Copy `.env.example` to `.env.local`, paste the key after `VITE_YOUTUBE_API_KEY=`, then run `npm run build` and deploy.

The free quota is 10,000 units a day, and each new song search costs about 101, so roughly 100 searches a day. Each visitor's browser remembers its matches, so replaying a song costs nothing. When the quota runs out, the player says so and the playlist keeps working.

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

# William Velasco — Portfolio

A responsive, centered portfolio and résumé built with semantic HTML, CSS, and vanilla JavaScript. It runs directly on GitHub Pages without a build step or package installation. Font Awesome is served locally from the existing assets; there are no runtime CDN dependencies.

## Preview

Open `index.html` in a browser, or serve the repository with your preferred static server. For example, if Python is installed:

```sh
python -m http.server 8000
```

Visit `http://localhost:8000`. Clipboard support requires localhost or HTTPS; an email link is always available.

## Publish on GitHub Pages

Push the files to your publishing branch. In the repository's **Settings → Pages**, choose **Deploy from a branch**, select that branch and **/ (root)**, and save. All local assets use relative paths, so the site also works under a project subdirectory. No backend or client-side router is needed.

## Edit the portfolio

- `index.html`: biography, project previews, skills, education, and contact links.
- `css/style.css`: shared design tokens, both themes, component styles, responsive layouts, reduced motion, and print styles.
- `js/theme.js`: applies the saved or system theme before the page paints.
- `js/script.js`: theme controls, local time, section highlighting, copy email, and project gallery. Update the `projects` object when changing gallery details or screenshots.
- `images/`: portrait, favicon, and existing project screenshots.
- `files/wmv-resume.pdf`: downloadable résumé.

Light and dark themes follow the system preference until a visitor chooses a theme. That choice is saved when browser storage is available. The native project dialog supports Escape, arrow-key navigation, focus containment, and returning focus to the original link. Core content, navigation, résumé, and screenshot links remain available without JavaScript.

## Verification

The redesign was checked in headless Chrome at widths from 320 to 1440 pixels, including theme persistence, system theme changes, project galleries, screenshot loading, keyboard and focus behavior, clipboard, résumé download, reduced motion, no-JavaScript content, and serving from a subdirectory.

# Personal homepage maintenance

This folder, `personal-homepage` at the workspace root, is the canonical source for the user's personal website. Continue maintaining these files when the user requests website changes. `outputs/personal-homepage` is a compatibility symlink to this folder; other extracted folders and older HTML files under `outputs` are historical copies.

## Confirmed profile

- Name: Yuhong Li
- Affiliation: Nankai University
- Position: graduate student
- Academic field: theoretical physics
- Email: 2310408@mail.nankai.edu.cn
- GitHub: PaulLi07
- Repository: https://github.com/PaulLi07/personal-homepage
- Website: https://paulli07.github.io/personal-homepage/

Use these facts and any later information supplied by the user. Research topics, publications, achievements, and personal stories currently remain placeholders; do not invent them.

## Design preferences

- All visitor-facing website content is in English. Maintenance documentation may be in Chinese.
- A simple academic style with a universe theme: elegant, artistic, and restrained.
- Regular-width typography and moderate heading sizes. The user explicitly rejected condensed, oversized display lettering.
- Preserve the framework adapted from https://swarajsingh-portfolio-25.pages.dev/: full-screen photographic hero, split About section, Academic thumbnails with large previews and full-screen details, scattered Life photographs, and Contact section.
- Navigation: About, Academic, Life, Contact. Academic includes Research, Publications, Notes, and Projects.
- Use the downloaded placeholder images until the user replaces them or requests other online images. Do not generate replacement images unless the user changes this preference.

## Files and editing

- `index.html`: main page structure, profile information, navigation, and visible copy.
- `credits.html`: visitor-facing asset attribution.
- `css/styles.css`: typography, layout, responsive rules, and visual styling.
- `js/content.js`: academic entries and Life gallery descriptions, images, and attribution.
- `js/gallery.js`: previews, dialogs, section switching, hash routes, focus restoration.
- `js/transitions.js`: opening and detail transitions.
- `js/main.js`: navigation, scroll behavior, and reveal effects.
- `assets/images/`: local images. Keep replacement filenames when practical; update alt text, placeholder captions, and credits when images change.
- `docs/image-sources.md` and `docs/download-manifest.json`: image origins and replacement guide.
- `docs/reference-analysis.md`: analysis of the original reference framework.

Keep HTML, styles, scripts, and images separate. Preserve relative asset URLs so the site works under the GitHub Pages repository path. The website is static and requires no build process or external runtime dependencies.

## Verification and delivery

Check the affected JavaScript files with `node --check`. Verify local resource paths when adding assets. For layout or interaction changes, inspect the affected desktop and mobile views in the available browser and check relevant dialog/navigation behavior. Keep keyboard access and reduced-motion behavior intact.

The user maintains the public website by manually uploading local updates to GitHub. Ordinary maintenance requests authorize local changes; publish or push remotely only when the user asks for that action. Do not schedule background maintenance from this standing request.

The current upload guide is in `README.md`. When requested or when delivering an updated source package, regenerate `outputs/personal-homepage-source.zip` from this canonical folder. Place `index.html` at `personal-homepage/index.html` inside the archive. Exclude `.DS_Store`, Git metadata, caches, and previous archives. Tell the user to upload the contents of this folder to the repository root.

Record substantial new user preferences here when they change the ongoing maintenance requirements.

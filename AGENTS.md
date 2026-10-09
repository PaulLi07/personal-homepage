# Personal homepage maintenance

This folder, `personal-homepage` at the workspace root, is the canonical source for the user's personal website. Continue maintaining these files when the user requests website changes. `outputs/personal-homepage` is a compatibility symlink to this folder; other extracted folders and older HTML files under `outputs` are historical copies.

Read `README.md`, `docs/ARCHITECTURE.md`, and `docs/WORKFLOW.md` for project entry points, extension constraints, and the basic work protocol.

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

Run `npm run check` and `git diff --check` before committing. For layout or interaction changes, inspect the affected desktop and mobile views in the available browser and check relevant dialog/navigation behavior. Keep keyboard access and reduced-motion behavior intact. The maintenance commands do not introduce browser runtime dependencies or a build step.

## Git work protocol

- Repository root is this folder, not the surrounding multi-project workspace. `origin` is the HTTPS repository above; local `main` tracks `origin/main`.
- Start by checking Git status. Fetch before synchronization or publication; inspect existing uncommitted user work and remote differences before editing or integrating changes.
- Preserve the remote's existing commit history. Use fast-forward-only pulls; do not discard user changes, hard-reset working files, or force-push shared history as a routine workflow.
- Small content, fix, or documentation tasks may be committed locally on `main`. Use a task branch for larger features or design changes; validate before integrating into local `main`.
- Local commits are part of authorized maintenance. Review and stage only the task's files, using a short `feat:`, `fix:`, `style:`, `docs:`, or `chore:` subject. Leave unrelated user changes intact.
- Update the framework/workflow documentation when the relevant structure changes; record significant changes in `CHANGELOG.md`.

The user maintains the public website by manually uploading local updates to GitHub. Ordinary maintenance requests authorize local changes; publish or push remotely only when the user asks for that action. Do not schedule background maintenance from this standing request.

The upload guide is in `docs/WORKFLOW.md`. Use `npm run package` when delivering an updated source package; it generates `outputs/personal-homepage-source.zip` outside this repository, with `personal-homepage/index.html` inside the archive. Exclude system files, Git metadata, caches, and previous archives. Tell the user to upload the contents of this folder to the repository root. A publish/push request overrides the ordinary local-only delivery mode; execute the authorized publication without asking for redundant permission.

Record substantial new user preferences here when they change the ongoing maintenance requirements.

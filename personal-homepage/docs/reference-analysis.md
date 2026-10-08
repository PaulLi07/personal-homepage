# Reference source analysis

Reference: <https://swarajsingh-portfolio-25.pages.dev/>

Read on 2026-10-08: the complete HTML document (39,444 bytes), compiled stylesheet `assets/index-BYyCr5JF.css` (12,800 bytes), and JavaScript bundle `assets/index-CFzbJSSm.js` (176,959 bytes). The application-specific code was separated from the bundled libraries for inspection. These downloaded research copies are outside the upload folder.

## Original framework

| Original structure | Behavior found in source | Adaptation |
| --- | --- | --- |
| Fixed navbar | Name and year on the left; four sections and a résumé button on the right; hides while scrolling down; duplicate labels roll on hover | Name, About, Academic, Life, Contact, and email link; same navigation behavior |
| Loader | Greeting, image-load counter, five equal vertical color strips | Brief greeting and five strips; bounded startup avoids waiting indefinitely for images |
| `.page1`, `.landing-div` | Shared full-screen background for the opening section and introduction; lower-edge title on the left and a short bio on the right | NASA background, academic identity, two-column hero |
| `#about`, `.mainAbout` | Approximately 65% image / 32% introduction, with facts near the bottom | Landscape portrait placeholder, actual student information, profile facts |
| `.page2`, `#projects` | Full-screen background, four bottom thumbnails, large right-hand hover preview revealed with a horizontal clip | Research, Publications, Notes, Projects; same preview composition |
| `.projects-overlay` | Fixed full-screen detail; left 44% for title and image, right 56% for description and supporting information; curtain and image transition | Accessible native dialog with the same split, detail navigation, description, facts, and editable entries |
| `.page3`, `#cover` | Four scattered photographs around a central Recognition title | Life gallery with four photographs and a central title |
| `.page4`, `#contact` | Full-screen background, three contact columns, name and a thank-you badge near the bottom | Email, GitHub, affiliation, name, and thank-you line |

## Styling and runtime

The reference uses Tailwind CSS 4.1.14, GSAP 3.13.0, ScrollTrigger, ScrollSmoother, SplitText, ScrollTo, and Flip. Headings use Staatliches and Stint Ultra Condensed; the palette is dark moss `#242A23` and ice blue `#C5E0F1`.

At the user's request, this adaptation uses regular system typography at moderate sizes. The dark palette becomes a cool charcoal, retaining the ice-blue accent and photographic full-screen structure. It does not retain the condensed display fonts.

The layout and interaction framework are recreated in separate HTML, CSS, and JavaScript files. CSS, native Web Animations, and IntersectionObserver implement the reference's essential transitions without a build step or a downloaded third-party runtime. It supports keyboard navigation, Escape to close details, browser back, relative asset paths, and reduced motion. The original résumé, awards, project copy, and personal photos are replaced with appropriate academic sections and clearly identified placeholders.

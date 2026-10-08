# Image sources and replacement guide

All images are downloaded placeholders. None are personal photographs or AI-generated images. Paths below are relative to the website root.

| Local file in `assets/images/` | Used for | Source and credit | Suggested replacement |
| --- | --- | --- | --- |
| `hero-carina.jpg` | Hero; academic background | [Cosmic Cliffs](https://images.nasa.gov/details/carina_nebula), NASA / ESA / CSA / STScI | A wide space image, approximately 1920 × 1100 or larger |
| `about-placeholder.jpg` | About image | [Mountain lake](https://unsplash.com/photos/a-lake-with-trees-and-mountains-in-the-background-8fVmVlnrN5k), Ivan Rohovchenko / Unsplash | A portrait, campus photograph, or personal landscape |
| `research-placeholder.jpg` | Research thumbnail, preview, detail | Same Cosmic Cliffs image; separate file for independent replacement | A research-related image or diagram |
| `publications-placeholder.jpg` | Publications; contact background | [Andromeda Galaxy](https://images.nasa.gov/details/PIA04921), NASA/JPL/California Institute of Technology | A paper illustration or another wide image |
| `notes-placeholder.jpg` | Notes thumbnail, preview, detail | [Pillars of Creation](https://images.nasa.gov/details/GSFC_20171208_Archive_e000842), NASA / ESA / Hubble Heritage Team (STScI/AURA) | A notebook, blackboard, or study image |
| `projects-placeholder.jpg` | Projects thumbnail, preview, detail | [Earthrise](https://science.nasa.gov/resource/apollo-8s-iconic-earthrise/), NASA / Bill Anders | A project illustration or screenshot |
| `life-moments.jpg` | Moments gallery | Same Ivan Rohovchenko photograph; separate file for independent replacement | A personal memory |
| `life-places.jpg` | Places gallery | [Coastal cliffs](https://unsplash.com/photos/rocky-cliffs-meet-the-oceans-frothy-waves-YRu3lLu4n-k), Benjamin Chambon / Unsplash | A travel photograph |
| `life-notes.jpg` | Little things; Life background | [Kalen Emsley](https://unsplash.com/@kalenemsley) / Unsplash; exact image download URL is recorded in the manifest | An everyday detail |
| `life-outside.jpg` | Outside gallery | [Coastline](https://unsplash.com/fr/photos/un-plan-deau-pres-dune-falaise-rocheuse-tbTUtOJMs_0), Tomáš Malík / Unsplash | A personal outdoor photograph |

Replace an image with a JPG of the same filename to update all its uses. If the file extension changes, update the path in both `index.html` and `js/content.js`. Image containers use `object-fit: cover`; adjust `object-position` in `css/styles.css` if a portrait needs a different crop.

When replacing placeholders, also update alt text, credits, source links, and placeholder captions in `index.html`, `js/content.js`, and `credits.html`. Keep the credits for downloaded images that remain in use.

Usage references: [NASA images and media guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/) and [Unsplash license](https://unsplash.com/license). The direct URLs used for downloading are preserved in `download-manifest.json`.

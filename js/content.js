/* Edit academic entries and gallery stories here.
   No build step is needed. Keep the object structure and quotation marks intact.
   Example entry: { title: "Paper title", meta: "Authors · Journal · Year", description: "Short summary", url: "https://doi.org/..." }
   Leave entries empty until you have actual content to share. */
window.HOMEPAGE_CONTENT = {
  academic: {
    research: {
      title: "Research.",
      label: "Research",
      kicker: "Academic · 01",
      subtitle: "Questions and ideas in theoretical physics.",
      image: "assets/images/research-placeholder.jpg",
      imageAlt: "The Cosmic Cliffs in the Carina Nebula",
      credit: "NASA, ESA, CSA, STScI · Cosmic Cliffs",
      source: "https://images.nasa.gov/details/carina_nebula",
      description: [
        "My academic field is theoretical physics. This section will introduce my research interests, ongoing work, and the questions that guide it.",
        "Specific topics and research updates will be added as this website grows."
      ],
      facts: [{ label: "Field", value: "Theoretical physics" }, { label: "Affiliation", value: "Nankai University" }],
      listTitle: "Research updates",
      emptyMessage: "Research details have not been added yet.",
      entries: []
    },
    publications: {
      title: "Publications.",
      label: "Publications",
      kicker: "Academic · 02",
      subtitle: "Papers, preprints, and academic contributions.",
      image: "assets/images/publications-placeholder.jpg",
      imageAlt: "An ultraviolet view of the Andromeda Galaxy",
      credit: "NASA/JPL-Caltech · Andromeda Galaxy",
      source: "https://images.nasa.gov/details/PIA04921",
      description: [
        "A place for publications and preprints, with links to the original papers and a short introduction to each contribution.",
        "The list will be updated when publication information is available."
      ],
      facts: [{ label: "Collection", value: "Papers & preprints" }, { label: "Links", value: "DOI and arXiv links to follow" }],
      listTitle: "Publication list",
      emptyMessage: "Publication information has not been added yet.",
      entries: []
    },
    notes: {
      title: "Notes.",
      label: "Notes",
      kicker: "Academic · 03",
      subtitle: "Reading, learning, and working through ideas.",
      image: "assets/images/notes-placeholder.jpg",
      imageAlt: "The Pillars of Creation in the Eagle Nebula",
      credit: "NASA, ESA, Hubble Heritage Team · Pillars of Creation",
      source: "https://images.nasa.gov/details/GSFC_20171208_Archive_e000842",
      description: [
        "This section will collect study notes, reading reflections, and explanations developed while learning theoretical physics.",
        "Notes and downloadable material will be added over time."
      ],
      facts: [{ label: "Focus", value: "Reading & study" }, { label: "Format", value: "Articles, notes, and PDFs" }],
      listTitle: "Reading & study notes",
      emptyMessage: "No notes have been added to this website yet.",
      entries: []
    },
    projects: {
      title: "Projects.",
      label: "Projects",
      kicker: "Academic · 04",
      subtitle: "Ideas made concrete through work and exploration.",
      image: "assets/images/projects-placeholder.jpg",
      imageAlt: "Earth rising above the Moon, photographed by Apollo 8",
      credit: "NASA / Bill Anders · Apollo 8 Earthrise",
      source: "https://science.nasa.gov/resource/apollo-8s-iconic-earthrise/",
      description: [
        "A home for academic projects, calculations, and code, with enough context to explain the question behind each piece of work.",
        "Project descriptions and links will be added when they are ready to share."
      ],
      facts: [{ label: "Collection", value: "Projects & code" }, { label: "Profile", value: "GitHub · PaulLi07" }],
      listTitle: "Selected projects",
      emptyMessage: "Project details have not been added yet.",
      entries: [],
      link: { label: "Visit GitHub ↗", url: "https://github.com/PaulLi07" }
    }
  },
  life: {
    moments: {
      title: "Moments.", label: "Moments", kicker: "Life · 01",
      subtitle: "Small memories, collected along the way.",
      image: "assets/images/life-moments.jpg", imageAlt: "A lake framed by mountains and evergreen trees",
      credit: "Ivan Rohovchenko / Unsplash · Placeholder photograph",
      source: "https://unsplash.com/photos/a-lake-with-trees-and-mountains-in-the-background-8fVmVlnrN5k",
      description: ["A place for personal photographs and the stories behind them.", "This landscape is a temporary placeholder. Personal memories will be added here."],
      listTitle: "Stories", emptyMessage: "Personal stories to follow.", entries: []
    },
    places: {
      title: "Places.", label: "Places", kicker: "Life · 02",
      subtitle: "A change of scenery, a different perspective.",
      image: "assets/images/life-places.jpg", imageAlt: "Waves breaking below rocky coastal cliffs",
      credit: "Benjamin Chambon / Unsplash · Placeholder photograph",
      source: "https://unsplash.com/photos/rocky-cliffs-meet-the-oceans-frothy-waves-YRu3lLu4n-k",
      description: ["A space for places, journeys, and observations away from the desk.", "This coastal photograph is a temporary placeholder for a future personal collection."],
      listTitle: "Places & journeys", emptyMessage: "Photographs and travel stories to follow.", entries: []
    },
    notes: {
      title: "Little things.", label: "Little things", kicker: "Life · 03",
      subtitle: "Room for the details that make a day.",
      image: "assets/images/life-notes.jpg", imageAlt: "Mountains reflected in a misty lake",
      credit: "Kalen Emsley / Unsplash · Placeholder photograph",
      source: "https://unsplash.com/@kalenemsley",
      description: ["Everyday details, passing thoughts, and small things worth remembering.", "This image is a temporary placeholder. A personal collection will take its place."],
      listTitle: "Everyday notes", emptyMessage: "Everyday notes to follow.", entries: []
    },
    outside: {
      title: "Outside.", label: "Outside", kicker: "Life · 04",
      subtitle: "Beyond the page, beyond the desk.",
      image: "assets/images/life-outside.jpg", imageAlt: "Blue water beside an open coastline",
      credit: "Tomáš Malík / Unsplash · Placeholder photograph",
      source: "https://unsplash.com/fr/photos/un-plan-deau-pres-dune-falaise-rocheuse-tbTUtOJMs_0",
      description: ["A place for life outside academic work.", "This photograph is a temporary placeholder, ready to be replaced with something personal."],
      listTitle: "Life outside", emptyMessage: "Personal photographs and stories to follow.", entries: []
    }
  }
};

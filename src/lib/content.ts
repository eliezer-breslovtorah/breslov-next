export type TermRef = {
  id: number;
  slug: string;
  title: string;
  taxonomy: string;
  parentId: number;
};
export type Lesson = {
  id?: string;
  bodyText?: string;
  categories?: TermRef[];
  collectionSlugs?: string[];
  publishedAt?: string;
  updatedAt?: string;
  status?: "draft" | "publish";
  dedication?: string;
  access?: "public" | "members" | "legacy";
  hasMedia?: boolean;
  videoEmbedUrl?: string;
  slug: string;
  title: string;
  speaker: string;
  collection: string;
  topic: string;
  format: "Audio" | "Video";
  duration?: string;
  description: string;
  legacyUrl: string;
  image: string;
};
export type Collection = {
  sourceId?: number;
  taxonomy?: string;
  parentId?: number;
  count?: number;
  hebrewTitle?: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  legacyUrl: string;
};
export type Teacher = {
  slug: string;
  name: string;
  description: string;
  image: string;
  legacyUrl: string;
};

const origin = "https://www.breslovtorah.com";
const maimon = "/images/rabbi-nasan-maimon.jpg";
const rosenfeld = "/images/rabbi-rosenfeld.jpg";

// Curated, source-verified public metadata, not a full database import.
// Playback URLs and access entitlements deliberately do not belong in this public model.
export const lessons: Lesson[] = [
  ...["17:27", "18:08", "16:36", "19:31", "22:39"].map(
    (duration, index): Lesson => {
      const part = index + 1;
      const slug = `azamra-lesson-${part}-lm1-torah-282-part-${part}`;
      return {
        slug,
        title: `Azamra – Lesson ${part} – LM1 – Torah 282 – Part ${part}`,
        speaker: "Rabbi Nasan Maimon",
        collection: "Azamra – The Good Point",
        topic: "Personal growth",
        format: "Audio",
        duration,
        description: `Part ${part} of a five-lesson study of Likutey Moharan, Torah 282.`,
        legacyUrl: `${origin}/shiurim/${slug}/`,
        image: maimon,
      };
    },
  ),
  {
    slug: "binding-ones-soul-to-the-tzaddik",
    title:
      "lm2-330 – 2Likutey Moharan 1 – Para. 2-3 – Love Your Neighbor – Nusach of Hiskashrus – Binding One’s Soul to the Tzaddik",
    speaker: "Rabbi Nasan Maimon",
    collection: "Likutey Moharan 2",
    topic: "Prayer",
    format: "Audio",
    duration: "59:44",
    description:
      "A text-based class on connecting prayer to the community and the tzaddik.",
    legacyUrl: `${origin}/shiurim/lm2-lesson-330-torah-001-para-02-binding-ones-soul-to-the-tzaddik/`,
    image: maimon,
  },
  {
    slug: "copper-snake-audio",
    title: "Chukas – The Copper Snake",
    speaker: "Rabbi Zvi Aryeh Rosenfeld z”l",
    collection: "NaCh – Prophets and Writings",
    topic: "Parsha",
    format: "Audio",
    duration: "6:20",
    description:
      "An audio clip about Chizkiyahu and the copper snake, featured on the existing homepage.",
    legacyUrl: `${origin}/shiurim/nach-41-melachim-2-lesson-11-clip-chizkiyahu-hamelech-destroys-the-copper-snake/`,
    image: rosenfeld,
  },
  {
    slug: "copper-snake-video",
    title: "Chukas – The Copper Snake (Captions)",
    speaker: "Rabbi Zvi Aryeh Rosenfeld z”l",
    collection: "NaCh – Prophets and Writings",
    topic: "Parsha",
    format: "Video",
    duration: "5:17",
    description:
      "The captioned video featured on the existing Breslov Torah homepage.",
    legacyUrl: `${origin}/`,
    image: rosenfeld,
  },
];

export const collections: Collection[] = [
  {
    slug: "azamra",
    title: "Azamra – The Good Point",
    description:
      "Study Torah 282 and the practice of finding goodness in ourselves and others.",
    image: maimon,
    legacyUrl: `${origin}/courses/azamra-good-point/`,
  },
  {
    slug: "simcha",
    title: "Simcha – Joy",
    description:
      "A course exploring Rebbe Nachman’s teachings on happiness in daily life.",
    image: maimon,
    legacyUrl: `${origin}/courses/simcha/`,
  },
  {
    slug: "likutey-moharan-2",
    title: "Likutey Moharan 2",
    description:
      "Rabbi Maimon’s classes on the second volume of Rebbe Nachman’s teachings.",
    image: maimon,
    legacyUrl: `${origin}/series/likutey-moharan-2-tinyana/`,
  },
  {
    slug: "nach",
    title: "NaCh – Prophets and Writings",
    description: "Explore the Prophets and Writings with Rabbi Rosenfeld.",
    image: rosenfeld,
    legacyUrl: `${origin}/rabbi-rosenfeld/`,
  },
];
export const teachers: Teacher[] = [
  {
    slug: "nasan-maimon",
    name: "Rabbi Nasan Maimon",
    description:
      "Explore Rabbi Maimon’s library of text-based Breslov classes and courses.",
    image: maimon,
    legacyUrl: `${origin}/rabbi-maimon-media-library/`,
  },
  {
    slug: "zvi-aryeh-rosenfeld",
    name: "Rabbi Zvi Aryeh Rosenfeld z”l",
    description: "Discover the preserved audio teachings of Rabbi Rosenfeld.",
    image: rosenfeld,
    legacyUrl: `${origin}/rabbi-rosenfeld/`,
  },
  {
    slug: "michel-dorfman",
    name: "Rabbi Yechiel Michel Dorfman z”l",
    description: "Learn about Rabbi Dorfman and explore his existing archive.",
    image: "/images/Rabbi-Michel-Dorfman.jpg",
    legacyUrl: `${origin}/rabbi-yechiel-michel-dorfman-zal/`,
  },
];

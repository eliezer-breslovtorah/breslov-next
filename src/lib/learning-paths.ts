import settings from "../../content/homepage.json" with { type: "json" };

/** Editorial choices reference existing lessons and collections, never duplicate recordings.
 * Update these selections when the teaching team changes its recommended starting points.
 * Lesson access remains controlled by the catalog/media API, not these display cards.
 */
export const STARTER_STEPS = [
  {
    title: "Begin with one small step",
    description:
      "A short introduction to seeking help and taking the first step. Continue with the mini-clips when you have a few minutes.",
    lessonTitle: "The First Step - Breslov Basics 1",
    lessonSlug: "breslov-basics-01-the-first-step",
    courseSlug: "courses-breslov-basics-mini-clips",
    duration: "1:45",
  },
  {
    title: "Find the good in yourself and others",
    description:
      "Begin Azamra, Rebbe Nachman’s teaching on finding good points. Follow its five numbered lessons in order.",
    lessonTitle: "Azamra - Lesson 1 - LM1 - Torah 282 - Part 1",
    lessonSlug: "azamra-lesson-1-lm1-torah-282-part-1",
    courseSlug: "azamra",
    duration: "17:27",
  },
  {
    title: "Build a personal connection through prayer",
    description:
      "Start the introduction to Hishtapkhus HaNefesh, Outpouring of the Soul, and explore prayer in your own words.",
    lessonTitle: "Outpouring - Introduction - Part 01",
    lessonSlug: "outpouring-intro-part-01",
    courseSlug: "courses-hishtapkhus-outpouring",
    duration: "29:44",
  },
  {
    title: "Make room for joy",
    description:
      "Continue with the first lesson of the beginner Simcha course: practical teachings on cultivating lasting joy.",
    lessonTitle: "Simcha - Joy - Lesson 01",
    lessonSlug: "simcha-joy-lesson-01",
    courseSlug: "courses-beginner",
    duration: "45:35",
  },
] as const;

/** These are collection URLs with confirmed lesson membership, not English full-text searches. */
export const LIFE_TOPICS = [
  {
    label: "Joy & encouragement",
    description:
      "Find good points and learn practical ways to cultivate simcha.",
    href: "/courses/courses-beginner",
  },
  {
    label: "Prayer & connection",
    description: "Make space to speak to Hashem in your own words.",
    href: "/courses/courses-hishtapkhus-outpouring",
  },
  {
    label: "Faith in daily life",
    description: "Explore emunah through practical Breslov advice.",
    href: "/courses/courses-aitzos-hamevuoros-faith",
  },
  {
    label: "Family & relationships",
    description: "Teachings on shalom bayis and building peace at home.",
    href: "/courses/courses-shalom-bayis-family-peace",
  },
  {
    label: "Parenting",
    description: "Torah perspectives on education and raising children.",
    href: "/courses/courses-healthy-parenting",
  },
  {
    label: "Starting again",
    description: "Encouragement from Meshivas Nefesh, Restore My Soul.",
    href: "/courses/series-meshivas-nefesh-restore-soul",
  },
] as const;

/** Reuse the team's existing verified excerpts and original-media routes. */
export const RAV_NASAN_SAMPLES = settings.clips.filter(
  (clip) => clip.speaker === "Rabbi Nasan Maimon",
);

/** Explicit textual starts are selected from lesson numbering, not upload dates.
 * The Halakhos historical introduction belongs to the first pass; dated recordings
 * remain available through their separate second-pass collection.
 */
export const SYSTEMATIC_TEXTS = [
  {
    title: "Likutey Moharan · Volume 1",
    description:
      "Begin with the introduction and Torah 1, then follow the numbered lessons.",
    href: "/courses/series-likutey-moharan-1",
    startingLessonSlug: "lm1-lesson-001-intro-torah-001-para-1",
  },
  {
    title: "Likutey Halakhos · First pass",
    description:
      "Start with the historical background in OC1, then study the numbered first-pass recordings.",
    href: "/courses/likutey-halakhos-first-pass",
    startingLessonSlug: "oc1-lesson-001-likutey-halakhos-historical-background",
  },
  {
    title: "Likutey Halakhos · Second pass",
    description:
      "Follow the dated recordings of Rav Nasan’s later study of Likutey Halakhos.",
    href: "/courses/likutey-halakhos-second-pass",
  },
  {
    title: "Sichos HaRan",
    description:
      "Begin with sayings 1–2 and explore Rebbe Nachman’s wisdom in textual order.",
    href: "/courses/series-sichos-wisdom",
    startingLessonSlug: "sichos-haran-001",
  },
  {
    title: "Meshivas Nefesh",
    description:
      "Study Restore My Soul from Lesson 01 onward for sustained encouragement.",
    href: "/courses/series-meshivas-nefesh-restore-soul",
    startingLessonSlug: "meshivas-nefesh-restore-my-soul-lesson-01",
  },
] as const;

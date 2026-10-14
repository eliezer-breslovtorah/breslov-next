import type { Collection } from "@/lib/content";

export type CourseGroupId =
  | "texts"
  | "calendar"
  | "topics"
  | "parsha"
  | "history"
  | "formats"
  | "audiences"
  | "other";
export type CourseFamily = {
  id: string;
  title: string;
  description: string;
  items: Collection[];
};
export type CourseGroup = {
  id: CourseGroupId;
  title: string;
  description: string;
  families: CourseFamily[];
};

type FamilyDefinition = [string, string, string, string[]];
const definitions: Record<CourseGroupId, FamilyDefinition[]> = {
  texts: [
    [
      "moharan",
      "Likutey Moharan",
      "Rebbe Nachman’s central teachings, with classes on both volumes.",
      [
        "series-likutey-moharan-1",
        "likutey-moharan-2",
        "series-r-rosenfeld-likutey-moharan-1",
        "series-r-rosenfeld-likutey-moharan-2-tinyana",
      ],
    ],
    [
      "halakhos",
      "Likutey Halakhos",
      "Rav Nosson’s teachings on Torah law. Choose the numbered first pass or dated second pass.",
      [
        "likutey-halakhos-first-pass",
        "likutey-halakhos-second-pass",
        "series-likuteyhalakhos",
        "types-likutey-halakhos",
      ],
    ],
    [
      "sichos",
      "Sichos HaRan",
      "Rebbe Nachman’s wisdom and practical advice.",
      [
        "series-sichos-wisdom",
        "series-rabbi-rosenfeld-sichos-wisdom",
        "series-r-rosenfeld-sichos-haran-by-sichah",
        "types-sichos-haran-wisdom",
      ],
    ],
    [
      "stories",
      "Sipurey Maasios",
      "Explore Rebbe Nachman’s stories and their deeper meaning.",
      [
        "series-sipurey-maasios",
        "courses-sipurey-masiyos-13-stories",
        "series-r-rosenfeld-sipurey-maasios",
        "types-sipurei-masiyos-stories",
      ],
    ],
    [
      "meshivas",
      "Meshivas Nefesh",
      "Encouragement and restoring the soul.",
      ["series-meshivas-nefesh-restore-soul"],
    ],
    [
      "tefilos",
      "Likutey Tefilos",
      "Rav Nosson’s prayers inspired by Rebbe Nachman’s teachings.",
      ["series-likutey-tefilos"],
    ],
    [
      "hamidos",
      "Sefer HaMidos",
      "The Alef-Bet Book: guidance on character and daily life.",
      ["series-sefer-hamidos"],
    ],
    [
      "tehillim",
      "Tehillim",
      "Study the Psalms and their place in Jewish life.",
      ["courses-sefer-tehillim", "courses-tehillim"],
    ],
    [
      "ein-yaakov",
      "Ein Yaakov",
      "The wisdom of the Talmud’s narratives.",
      ["series-rabbi-rosenfeld-ein-yaakov"],
    ],
    [
      "nach",
      "NaCh",
      "Prophets, Writings, and the history of the Jewish people.",
      ["nach"],
    ],
  ],
  calendar: [
    ...[
      "Nissan",
      "Iyar",
      "Sivan",
      "Tammuz",
      "Av",
      "Elul",
      "Tishrei",
      "Cheshvan",
      "Kislev",
      "Teves",
      "Shevat",
      "Adar",
    ].map((name, index): FamilyDefinition => {
      const number = String(index + 1).padStart(2, "0");
      return [
        `month-${number}`,
        name,
        `Teachings for ${name} and its holidays.`,
        [
          index === 0
            ? "courses-nissan"
            : `courses-${number}-${name.toLowerCase()}`,
          `types-chodesh-${number}-${name.toLowerCase()}`,
          ...(index === 7 ? ["types-chodesh-8-cheshvan"] : []),
          ...(index === 5 ? ["types-elul-rosh-hashanah"] : []),
        ],
      ];
    }),
    [
      "shabbos",
      "Shabbos",
      "Prepare for and deepen the experience of Shabbos.",
      ["courses-shabbos"],
    ],
    [
      "holidays",
      "Jewish holidays",
      "Browse holiday teachings throughout the year.",
      ["types-holidays", "courses-calendar"],
    ],
  ],
  topics: [
    [
      "joy",
      "Joy & finding the good",
      "Practical paths to simcha and finding good points.",
      [
        "simcha",
        "azamra",
        "types-achieving-joy",
        "courses-beginner",
        "courses-simcha-level-2-intermediate",
        "courses-simcha-level-3-advanced",
      ],
    ],
    [
      "prayer",
      "Prayer & Hisbodedus",
      "Traditional prayer and speaking to Hashem in your own words.",
      [
        "courses-tefilah-prayer",
        "courses-hisbodedus",
        "courses-hishtapkhus-outpouring",
        "courses-siddur",
        "types-tefilah",
        "types-hosbodedus-prayer-in-solitude",
      ],
    ],
    [
      "faith",
      "Faith",
      "Develop emunah and bring faith into everyday life.",
      [
        "courses-deepening-faith",
        "courses-aitzos-hamevuoros-faith",
        "types-emunah-faith",
      ],
    ],
    [
      "family",
      "Family & relationships",
      "Shalom bayis, parenting, and education.",
      [
        "courses-shalom-bayis-family-peace",
        "courses-healthy-parenting",
        "types-marriage-shalom-bayis",
        "types-education",
      ],
    ],
    [
      "tzaddik",
      "Connecting to the Tzaddik",
      "Understanding the role of the tzaddik in Breslov life.",
      [
        "courses-tzaddik",
        "courses-hiskashrus-letzaddik-ha-emes",
        "courses-searching-for-the-tzaddik-today",
        "types-tzaddik",
      ],
    ],
    [
      "livelihood",
      "Livelihood",
      "Faith and spiritual purpose in earning a living.",
      ["courses-parnassah"],
    ],
    [
      "israel",
      "Eretz Yisrael",
      "The meaning and holiness of the Land of Israel.",
      ["courses-eretz-yisrael", "types-eretz-yisrael"],
    ],
    [
      "health",
      "Health",
      "Teachings on physical and spiritual wellbeing.",
      ["types-health"],
    ],
    [
      "halakha",
      "Halakha & customs",
      "Practical Torah law and Jewish customs.",
      ["series-halakha-r-rosenfeld", "types-halakha"],
    ],
  ],
  parsha: ["bereishis", "shemos", "vayikra", "bamidbar", "devarim"].map(
    (book): FamilyDefinition => [
      book,
      book === "vayikra" ? "Vayikra" : book[0].toUpperCase() + book.slice(1),
      "Weekly Torah portions, grouped by book.",
      [`parshios-${book}`],
    ],
  ),
  history: [
    [
      "history",
      "Breslov history & biographies",
      "Meet the people and events that shaped Breslov.",
      [
        "series-breslov-history-biography",
        "courses-c-11-biographies",
        "types-history",
        "types-history-2",
        "types-biography-yahrzeit",
        "types-yahrzeits",
      ],
    ],
    [
      "rebbe-nachman",
      "The life of Rebbe Nachman",
      "His life, spiritual work, and legacy.",
      [
        "series-chayey-moharan",
        "series-shevachey-haran",
        "series-rabbi-rosenfeld-praises",
      ],
    ],
    [
      "dorfman",
      "Rabbi Michel Dorfman",
      "Teachings from Rabbi Michel Dorfman.",
      ["series-rabbi-michel-dorfman", "types-reb-michel-dorfman-zl"],
    ],
  ],
  formats: [
    [
      "short",
      "Short teachings",
      "Make time for learning with concise classes and clips.",
      [
        "courses-breslov-basics-mini-clips",
        "series-two-minute-topics",
        "types-2-minute-topics",
        "types-breslov-basics-mini-clips",
        "series-r-rosenfeld-clips",
      ],
    ],
    [
      "music",
      "Music & nigunim",
      "Breslov melodies, holy song, and soundscapes.",
      [
        "courses-breslov-nigunim-melodies",
        "series-zemiros",
        "courses-music",
        "series-music",
        "types-music",
      ],
    ],
    [
      "archive",
      "Live classes & topic archives",
      "Browse recorded classes and conversations.",
      [
        "series-live-shiur-archive",
        "series-topics",
        "series-rabbi-rosenfeld-topics",
        "series-food-for-the-soul",
      ],
    ],
  ],
  audiences: [
    [
      "women",
      "Breslov Torah for women",
      "Teachings collected especially for women.",
      ["courses-women", "types-breslov-torah-for-women"],
    ],
    [
      "students",
      "Yeshiva students",
      "Classes given for Mir Yeshiva students.",
      ["series-mir-shiur"],
    ],
    [
      "languages",
      "Hebrew & Yiddish",
      "Classes in Hebrew and Yiddish.",
      ["courses-hebrew-and-yiddish"],
    ],
  ],
  other: [],
};

const groupDetails: Record<CourseGroupId, [string, string]> = {
  texts: [
    "Breslov texts & Torah study",
    "Choose a sefer and follow a sustained course of learning.",
  ],
  calendar: [
    "The Jewish year",
    "Find teachings for the months, holidays, and Shabbos.",
  ],
  topics: [
    "Topics for daily life",
    "Explore joy, prayer, faith, family, and other areas of personal growth.",
  ],
  parsha: [
    "Weekly Torah portions",
    "Explore the parsha through the five books of the Torah.",
  ],
  history: [
    "History & biographies",
    "Discover Breslov’s teachers, stories, and heritage.",
  ],
  formats: [
    "More ways to listen",
    "Short classes, music, and recorded archives.",
  ],
  audiences: [
    "Audiences & languages",
    "Find classes for your community and preferred language.",
  ],
  other: [
    "Other collections",
    "Additional collections from the lesson library.",
  ],
};

/** Classify every imported collection without changing its identity or metadata. */
export function courseGroupFor(
  collection: Collection,
  collections: Collection[] = [],
): CourseGroupId {
  for (const [group, families] of Object.entries(definitions)) {
    if (families.some((family) => family[3].includes(collection.slug)))
      return group as CourseGroupId;
  }
  if (/^parsh(?:ios|as)-/.test(collection.slug)) return "parsha";
  if (/^types-chodesh-|^courses-\d{2}-/.test(collection.slug))
    return "calendar";
  if (/^LH[1-8]\b/i.test(collection.title)) return "texts";
  const parent = collection.parentId
    ? collections.find((item) => item.sourceId === collection.parentId)
    : undefined;
  if (parent && parent.slug !== collection.slug && !parent.parentId)
    return courseGroupFor(parent);
  if (/biograph|yahrzeit|history|praises/i.test(collection.title))
    return "history";
  if (/mini.?clips|two.minute|2.minute|music|zemiros/i.test(collection.title))
    return "formats";
  if (collection.taxonomy === "courses" || collection.taxonomy === "types")
    return "topics";
  return "other";
}

/** Curated landing cards use only real collection URLs; all raw collections remain available separately. */
export function courseGroups(collections: Collection[]): CourseGroup[] {
  const lookup = new Map(
    collections.map((collection) => [collection.slug, collection]),
  );
  return (Object.keys(definitions) as CourseGroupId[])
    .map((id) => ({
      id,
      title: groupDetails[id][0],
      description: groupDetails[id][1],
      families: definitions[id]
        .map(([familyId, title, description, slugs]) => ({
          id: familyId,
          title,
          description,
          items: slugs
            .map((slug) => lookup.get(slug))
            .filter((item): item is Collection => Boolean(item)),
        }))
        .filter((family) => family.items.length > 0),
    }))
    .filter((group) => group.families.length > 0);
}

export function courseCollectionLabel(collection: Collection): string {
  return collection.title
    .replace(/^Chodesh\s+\d{1,2}\s*-\s*/i, "")
    .replace(/^\d{2}-/, "");
}

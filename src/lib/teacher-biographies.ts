/**
 * Editorial biographies for the imported teachers whose descriptions are empty.
 * Reviewed against the linked primary/institutional sources on 2026-10-11.
 * Update these paragraphs here, or enter a custom description in Admin → Taxonomy.
 * A saved teacher description takes precedence; separate its paragraphs with a blank line.
 * Source URLs are editorial references, not navigation back to the old website.
 */
export type TeacherBiography = {
  paragraphs: readonly [string, string];
  sources: readonly { title: string; url: string }[];
};

export const teacherBiographies: Record<string, TeacherBiography> = {
  "nasan-maimon": {
    paragraphs: [
      "Rabbi Nasan Maimon is a Torah educator and counselor whose teaching connects the wisdom of Rebbe Nachman of Breslov with everyday life. He learned closely with Rabbi Zvi Aryeh Rosenfeld, his father-in-law, and Rabbi Yechiel Michel Dorfman, receiving the Breslov tradition through years of personal study with both teachers.",
      "In 2008, Rabbi Maimon founded BreslovTorah.com to make Breslov learning available to students around the world. His recorded classes translate and explain the major Breslov texts in English, giving listeners a way to study the original teachings and apply them to their own spiritual growth, relationships, and daily challenges.",
    ],
    sources: [
      {
        title: "Breslov Research Institute: Nasan Maimon",
        url: "https://breslov.org/author/nasan-maimon/",
      },
    ],
  },
  "zvi-aryeh-rosenfeld": {
    paragraphs: [
      "Rabbi Zvi Aryeh Rosenfeld was a Breslov teacher and Torah scholar who received rabbinic ordination from Rabbi Avraham Sternhartz and Rabbi Avraham Yoffen. His learning encompassed Talmud, Jewish law, Chassidic teachings, and Kabbalah. He served as a leader of Breslov until his passing in 1978.",
      "Through classes and personal guidance, Rabbi Rosenfeld introduced students from many backgrounds to Torah and Breslov chassidus. His teaching lives on in more than a thousand recorded lectures. He also helped establish the Breslov Yeshiva in Jerusalem, supporting a center where the Breslov tradition could be studied and passed on to future generations.",
    ],
    sources: [
      {
        title: "Breslov World Center: Biographies",
        url: "https://www.breslov.com/world/biographies.html",
      },
    ],
  },
  "michel-dorfman": {
    paragraphs: [
      "Rabbi Yechiel Michel Dorfman (1913–2006), known as Reb Michel, was an elder of the Breslov community and a student of Rabbi Avraham Sternhartz. Born in Ukraine, he maintained a Torah-observant family through severe persecution in the Soviet Union, including imprisonment in Siberia. He and his wife moved to Israel in 1971.",
      "In Jerusalem, Reb Michel headed the Breslov Kollel in Meah She’arim and later became a co-director of the Central Breslov Yeshiva. He taught and guided families, worked to preserve Rebbe Nachman’s gravesite, and helped organize the Rosh Hashanah gathering in Uman. His life joined dedication to prayer and Torah study with service to the wider Breslov community.",
    ],
    sources: [
      {
        title: "Breslov Torah: About Us — Rabbi Yechiel Michel Dorfman",
        url: "https://www.breslovtorah.com/about-us/",
      },
    ],
  },
  "rabbi-aryeh-kaplan-zl": {
    paragraphs: [
      "Rabbi Aryeh Kaplan was a Torah scholar, author, and teacher whose writing brought Jewish learning to a broad English-speaking audience. Drawing on his background in physics, he organized complex material with precision and clarity. His work explored Jewish law, faith, and mysticism, making demanding subjects accessible to readers beginning or deepening their Jewish studies.",
      "Rabbi Kaplan played an influential role in the movement of Jews returning to religious observance and wrote extensively for NCSY. His books, essays, and translations continue to introduce new generations to Torah. Alongside his scholarship, he was known for welcoming visitors into his home and taking time to respond to people seeking guidance in their spiritual lives.",
    ],
    sources: [
      {
        title: "Orthodox Union: Rabbi Aryeh Kaplan",
        url: "https://www.ou.org/judaism-101/bios/leaders-in-the-diaspora/rabbi-aryeh-kaplan/",
      },
      {
        title: "Orthodox Union: Remembering Rabbi Aryeh Kaplan",
        url: "https://www.ou.org/news/remembering-rabbi-aryeh-kaplan-ncsy-republishes-collection-of-his-selected-works/",
      },
    ],
  },
};

export function teacherBiographyParagraphs(
  slug: string,
  description: string,
): readonly string[] {
  const custom = description.trim();
  if (custom)
    return custom
      .split(/\r?\n\s*\r?\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  return teacherBiographies[slug]?.paragraphs ?? [];
}

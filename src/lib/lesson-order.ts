type SequenceLesson = { title: string };

const halakhosVolumes = ["OC1", "OC2", "OC3", "YD1", "YD2", "EH", "CM1", "CM2"];

/** Fixed-width digit runs give SQLite's binary string comparison natural numeric order. */
function natural(value: string): string {
  return value.replace(/\d+/g, (digits) =>
    digits.replace(/^0+(?=\d)/, "").padStart(12, "0"),
  );
}

function numbered(value: string, suffix = ""): string {
  // The separator sorts Lesson 1 before Lesson 1a, and both before Lesson 2.
  return `${natural(value)}:${suffix.toLowerCase()}`;
}

/** A cheap, title-only key for opt-in textual navigation. It never rewrites metadata.
 * Numbered Halakhos volumes follow OC1–CM2; dated titles retain calendar order.
 * Unnumbered introductions/special classes follow explicit numbered recordings.
 * The full natural title resolves parts/paragraphs without treating Part 10 as Part 1.
 */
export function lessonSequenceKey(lesson: SequenceLesson): string {
  const title = lesson.title
    .normalize("NFKC")
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const tail = natural(title);

  const beginner = title.match(
    /\bbreslov basics\s*(?:-\s*)?(\d+)([a-z]?)(?=\b|\s*-)/,
  );
  if (beginner) return `0:n:00:${numbered(beginner[1], beginner[2])}:${tail}`;
  const date = title.match(/^(\d{4})-(\d{2})-(\d{2})(?:\b|\s*-)/);
  if (date) return `0:z:${date[1]}${date[2]}${date[3]}:${tail}`;

  const halakhos = title.match(
    /^(oc[1-3]|yd[12]|eh|cm[12])\s*-\s*lesson\s+(\d+)([a-z]?)(?=\b|\s*-)/,
  );
  if (halakhos) {
    const volume = halakhosVolumes.indexOf(halakhos[1].toUpperCase());
    return `0:n:${String(volume).padStart(2, "0")}:${numbered(halakhos[2], halakhos[3])}:${tail}`;
  }

  // Some historical LM1 titles were imported with the prefix "lh1-066".
  const moharan = title.match(
    /^l[mh]([12])\s*-\s*(?:lesson\s*)?(\d+)([a-z]?)(?=\b|\s*-)/,
  );
  if (moharan)
    return `0:n:${String(Number(moharan[1]) - 1).padStart(2, "0")}:${numbered(moharan[2], moharan[3])}:${tail}`;

  const explicit = title.match(/\blesson\s+(\d+)([a-z]?)(?=\b|\s*-)/);
  if (explicit) return `0:n:00:${numbered(explicit[1], explicit[2])}:${tail}`;

  // Courses indexed by the actual Torah or saying rather than a recording number.
  const text = title.match(
    /^(?:sichos\s+haran(?:\s*-\s*wisdom)?\s*(?:-\s*)?(?:para\.?\s*)?|(?:2\s*)?likut(?:ey|ei)\s+moharan\s+)(\d+)([a-z]?)(?=\b|\s*-)/,
  );
  if (text) return `0:n:00:${numbered(text[1], text[2])}:${tail}`;

  return `1:${tail}`;
}

/** Month-level recommendations, not a halakhic calendar or class timetable. */
const TIME_ZONE = "Asia/Jerusalem";
const MONTHS = [
  ["Nissan", "Nisan", "Pesach and renewal"],
  ["Iyar", "Iyar", "Counting the Omer and Lag BaOmer"],
  ["Sivan", "Sivan", "Shavuos and receiving the Torah"],
  ["Tammuz", "Tamuz", "The Three Weeks"],
  ["Av", "Av", "Tisha B’Av and consolation"],
  ["Elul", "Elul", "Preparing for Rosh Hashanah"],
  ["Tishrei", "Tishri", "Rosh Hashanah, Yom Kippur and Sukkos"],
  ["Cheshvan", "Heshvan", "Bringing the holidays into daily life"],
  ["Kislev", "Kislev", "Chanukah and finding light"],
  ["Teves", "Tevet", "Asarah B’Teves and rebuilding"],
  ["Shevat", "Shevat", "Tu B’Shevat and growth"],
  ["Adar", "Adar", "Purim and joy"],
] as const;

export type TimelyTeachingMonth = {
  label: string;
  slug: string;
  href: string;
  theme: string;
};

function monthPresentation(index: number, label?: string): TimelyTeachingMonth {
  const [name, , theme] = MONTHS[index];
  const slug =
    index === 0
      ? "courses-nissan"
      : `courses-${String(index + 1).padStart(2, "0")}-${name.toLowerCase()}`;
  return { label: label ?? name, slug, href: `/courses/${slug}`, theme };
}

/**
 * Hebrew Intl dates turn over at civil midnight, not sunset. Recommendations
 * intentionally cover a whole month; consult a local calendar for exact dates.
 * Both Adar months share the existing Adar teachings collection in leap years.
 */
export function getTimelyTeachingWindow(date = new Date()) {
  const month = new Intl.DateTimeFormat("en-US-u-ca-hebrew", {
    month: "long",
    timeZone: TIME_ZONE,
  }).format(date);
  const index = month.startsWith("Adar")
    ? 11
    : MONTHS.findIndex(([, intlName]) => intlName === month);
  if (index < 0)
    throw new Error(`Unrecognized Hebrew calendar month: ${month}`);
  const isFirstAdar = month === "Adar I";
  return {
    currentMonth: monthPresentation(
      index,
      month.startsWith("Adar") ? month : undefined,
    ),
    nextMonth: isFirstAdar
      ? monthPresentation(11, "Adar II")
      : monthPresentation((index + 1) % MONTHS.length),
    dateLabel: new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
      timeZone: TIME_ZONE,
    }).format(date),
    timeZone: TIME_ZONE,
  };
}

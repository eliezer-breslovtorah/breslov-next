export const BROWSE_QUERY_KEYS = [
  "q",
  "teacher",
  "category",
  "collection",
  "topic",
  "format",
  "access",
  "duration",
  "publishedFrom",
  "publishedTo",
  "dedication",
  "sort",
  "page",
] as const;
export type BrowseQuery = Partial<
  Record<Exclude<(typeof BROWSE_QUERY_KEYS)[number], "page">, string>
> & { page?: string | number };
export function readBrowseQuery(
  raw: Record<string, string | string[] | undefined>,
  omit: readonly string[] = [],
): BrowseQuery {
  return Object.fromEntries(
    BROWSE_QUERY_KEYS.filter((key) => !omit.includes(key)).map((key) => [
      key,
      typeof raw[key] === "string" ? raw[key] : undefined,
    ]),
  );
}

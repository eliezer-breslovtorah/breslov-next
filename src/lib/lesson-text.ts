/** Format imported plain text without summarizing or changing the teaching. */
export function lessonTextParagraphs(source: string): string[] {
  return (
    source
      .replace(/\r\n?/g, "\n")
      .replace(/\u00a0/g, " ")
      .replace(/[\t ]+/g, " ")
      // WordPress flattened paragraph boundaries. These explicit labels and
      // chapter timestamps are safe boundaries, unlike arbitrary sentences.
      .replace(/ +(?=\*{0,3}(?:\d{1,2}:)?\d{1,2}:[0-5]\d\s*[-–—])/g, "\n\n")
      .replace(/ +(?=(?:Speaker:|TEXT:))/g, "\n\n")
      .split(/\n\s*\n/)
      .map((paragraph) =>
        paragraph
          .replace(/\s+/g, " ")
          .replace(/ +([,.;!?])/g, "$1")
          .replace(/\( +/g, "(")
          .replace(/ +\)/g, ")")
          .trim(),
      )
      .filter(Boolean)
  );
}

/** Keep short descriptions fully visible; long outlines remain expandable. */
export function lessonTextPreview(paragraphs: string[]) {
  if (paragraphs.join(" ").length <= 1800) {
    return { visible: paragraphs, more: [] as string[] };
  }
  let end = 1;
  let length = paragraphs[0]?.length || 0;
  while (end < paragraphs.length && length + paragraphs[end].length < 1200) {
    length += paragraphs[end].length;
    end++;
  }
  return { visible: paragraphs.slice(0, end), more: paragraphs.slice(end) };
}

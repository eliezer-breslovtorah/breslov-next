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
  // A few imports contain one uninterrupted paragraph. Split the preview at
  // a word boundary, retaining every word in the expanded remainder.
  if (paragraphs[0]?.length > 1400) {
    const boundary = paragraphs[0].lastIndexOf(" ", 1100);
    if (boundary > 0)
      return {
        visible: [paragraphs[0].slice(0, boundary)],
        more: [paragraphs[0].slice(boundary + 1), ...paragraphs.slice(1)],
      };
  }
  let end = 1;
  let length = paragraphs[0]?.length || 0;
  while (end < paragraphs.length && length + paragraphs[end].length < 1200) {
    length += paragraphs[end].length;
    end++;
  }
  return { visible: paragraphs.slice(0, end), more: paragraphs.slice(end) };
}

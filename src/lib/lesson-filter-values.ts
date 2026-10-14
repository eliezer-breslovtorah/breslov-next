/** Unknown/malformed durations must not look like short recordings. */
export function durationSeconds(value: unknown): number | null {
  if (typeof value !== "string" || value.length > 16) return null;
  const text = value.trim();
  const minutes = text.match(/^(\d+):([0-5]\d)$/);
  if (minutes) return Number(minutes[1]) * 60 + Number(minutes[2]);
  const hours = text.match(/^(\d+):([0-5]\d):([0-5]\d)$/);
  return hours
    ? Number(hours[1]) * 3600 + Number(hours[2]) * 60 + Number(hours[3])
    : null;
}
export function validPublicationDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(value + "T00:00:00Z");
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  );
}

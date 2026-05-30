/** Returns true if timeStart < timeEnd (lexicographic HH:MM comparison) */
export function isTimeRangeValid(start: string, end: string): boolean {
  if (!start || !end || !start.includes(':') || !end.includes(':')) return true;
  return start < end;
}

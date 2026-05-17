/** Форматирует локальную дату в YYYY-MM-DD без UTC-смещения */
export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Возвращает DayOfWeek (C# enum: 0=Sun, 1=Mon, ..., 6=Sat) для строки даты YYYY-MM-DD */
export function dateToDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00'); // полдень чтобы избежать timezone shift
  return d.getDay(); // JS getDay: 0=Sun, 1=Mon... (совпадает с C# DayOfWeek)
}

/** Возвращает дату (YYYY-MM-DD) для заданного дня недели относительно понедельника */
export function dayOfWeekToDate(mondayDate: string, dayOfWeek: number): string {
  const monday = new Date(mondayDate + 'T12:00:00');
  // dayOfWeek: 1=Mon, 2=Tue, ..., 6=Sat, 0=Sun
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const d = new Date(monday);
  d.setDate(monday.getDate() + offset);
  return formatLocalDate(d);
}

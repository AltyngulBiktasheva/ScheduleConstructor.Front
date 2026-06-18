/** Форматирует локальную дату в YYYY-MM-DD без UTC-смещения */
export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Возвращает 6 дат (пн–сб) для недели со сдвигом weekOffset от текущей */
export function getWeekDates(weekOffset: number): string[] {
  const now = new Date();
  const dow = now.getDay();
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + weekOffset * 7);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return formatLocalDate(d);
  });
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

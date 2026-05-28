/**
 * Утилиты для валидации и исправления дат в формах.
 */

type DateFormat = 'DD.MM.YYYY' | 'YYYY-MM-DD';

/** Количество дней в месяце с учётом високосного года */
function daysInMonth(month: number, year: number): number {
  if (month === 2) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return leap ? 29 : 28;
  }
  return [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
}

/** Парсит строку даты в {day, month, year} */
function parse(dateStr: string, format: DateFormat): { day: number; month: number; year: number } | null {
  const digits = dateStr.replace(/\D/g, '');
  // Нужно минимум 8 цифр для полной даты
  if (digits.length < 8) return null;

  if (format === 'DD.MM.YYYY') {
    return {
      day: parseInt(digits.slice(0, 2), 10),
      month: parseInt(digits.slice(2, 4), 10),
      year: parseInt(digits.slice(4, 8), 10),
    };
  }
  // YYYY-MM-DD
  return {
    year: parseInt(digits.slice(0, 4), 10),
    month: parseInt(digits.slice(4, 6), 10),
    day: parseInt(digits.slice(6, 8), 10),
  };
}

/** Форматирует компоненты даты обратно в строку */
function format(day: number, month: number, year: number, fmt: DateFormat): string {
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  const yyyy = String(year).padStart(4, '0');
  return fmt === 'DD.MM.YYYY' ? `${dd}.${mm}.${yyyy}` : `${yyyy}-${mm}-${dd}`;
}

/** Проверяет, что строка — валидная дата в указанном формате */
export function isValidDate(dateStr: string, fmt: DateFormat): boolean {
  const parsed = parse(dateStr, fmt);
  if (!parsed) return false;
  const { day, month, year } = parsed;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > daysInMonth(month, year)) return false;
  if (year < 1900 || year > 2100) return false;
  return true;
}

/**
 * Если дата невалидна — исправляет на ближайшую валидную.
 * Если строка неполная — возвращает как есть.
 */
export function clampToValidDate(dateStr: string, fmt: DateFormat): string {
  const parsed = parse(dateStr, fmt);
  if (!parsed) return dateStr; // неполная строка — не трогаем

  let { day, month, year } = parsed;

  // Кламп года
  year = Math.max(1900, Math.min(2100, year));

  // Кламп месяца
  month = Math.max(1, Math.min(12, month));

  // Кламп дня
  const maxDay = daysInMonth(month, year);
  day = Math.max(1, Math.min(maxDay, day));

  return format(day, month, year, fmt);
}

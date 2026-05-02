import axios from 'axios';

/**
 * Извлекает человекочитаемое сообщение об ошибке из любого типа исключения.
 * Обрабатывает Axios-ошибки (включая ответ сервера), стандартные Error, и неизвестные.
 */
export function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data) {
      if (typeof data === 'string' && data.trim()) return data.trim();
      if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        if (typeof obj.message === 'string' && obj.message) return obj.message;
        if (typeof obj.title === 'string' && obj.title) return obj.title;
      }
    }
    if (!err.response) return 'Нет связи с сервером';
    return `Ошибка сервера: ${err.response.status}`;
  }
  if (err instanceof Error) return err.message;
  return 'Произошла неизвестная ошибка';
}

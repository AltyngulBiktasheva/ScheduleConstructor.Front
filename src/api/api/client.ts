import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Можно добавить глобальную обработку ошибок, toast-уведомления и т.д.
    return Promise.reject(error);
  },
);

export default apiClient;

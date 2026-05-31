import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

api.interceptors.request.use((config) => {

  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;

});

let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,

  (error) => {

    if (
      error.response?.status === 401 &&
      !isRedirecting
    ) {

      isRedirecting = true;

      localStorage.removeItem('token');

      toast.error(
        'Session expired. Please login again.'
      );

      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }

    return Promise.reject(error);
  }
);

export default api;
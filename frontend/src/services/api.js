import axios from 'axios';

// Normalize baseURL so it always points to the backend /api prefix without trailing slashes or duplicate /api
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const cleanApiUrl = rawApiUrl.replace(/\/+$/, '');
const baseURL = cleanApiUrl.endsWith('/api') ? cleanApiUrl : `${cleanApiUrl}/api`;

const API = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hotel_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error formatting
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default API;

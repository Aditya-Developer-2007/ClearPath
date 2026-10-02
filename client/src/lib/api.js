import axios from 'axios';
import { users, approvals } from '../mocks';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginAPI = async (email) => {
  if (USE_MOCK) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = users.find(u => u.email === email);
        if (user) {
          console.log(`Resolved role: ${user.role}`);
          resolve({ data: { token: `mock-token-${user.id}`, user } });
        } else {
          reject(new Error('User not found'));
        }
      }, 300);
    });
  }
  return api.post('/login', { email });
};

export const getApprovalsAPI = async () => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: approvals });
      }, 300);
    });
  }
  return api.get('/approvals');
};

export default api;

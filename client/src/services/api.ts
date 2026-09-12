import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  register: (data: any) => api.post('/auth/register', data).then(res => res.data),
  login: (data: any) => api.post('/auth/login', data).then(res => res.data),
  me: () => api.get('/auth/me').then(res => res.data),
  logout: () => api.post('/auth/logout').then(res => res.data),
};

export const files = {
  upload: (data: FormData) => api.post('/files/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data),
  list: (folderId?: string) => api.get('/files', { params: { folderId } }).then(res => res.data),
  get: (id: string) => api.get(`/files/${id}`).then(res => res.data),
  downloadUrl: (id: string) => `/api/files/${id}/download`,
  update: (id: string, data: any) => api.patch(`/files/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/files/${id}`).then(res => res.data),
};

export const folders = {
  list: (parentId?: string) => api.get('/folders', { params: { parentId } }).then(res => res.data),
  create: (data: any) => api.post('/folders', data).then(res => res.data),
  update: (id: string, data: any) => api.patch(`/folders/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/folders/${id}`).then(res => res.data),
};

export const system = {
  health: () => api.get('/health').then(res => res.data),
};

export default api;

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 60000,
});

export const fetchMetadata = async (url) => {
  const response = await api.post('/api/video/metadata', { url });
  return response.data;
};

export const createClipJob = async (config) => {
  const response = await api.post('/api/video/generate', config);
  return response.data;
};

export const getJobStatus = async (jobId) => {
  const response = await api.get(`/api/jobs/${jobId}`);
  return response.data;
};

export const getDownloadUrl = (filename) => {
  const base = import.meta.env.VITE_API_URL || '';
  return `${base}/api/clips/download/${filename}`;
};

export const getStreamUrl = (jobId) => {
  const base = import.meta.env.VITE_API_URL || '';
  return `${base}/api/jobs/${jobId}/stream`;
};

export default api;

import axios, { AxiosResponse } from 'axios';
import { 
  Agent, 
  CreateAgentDto, 
  UpdateAgentDto, 
  Job, 
  CreateJobDto, 
  UpdateJobDto,
  PaginationParams,
  PaginatedResponse
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const agentsApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Agent>> => {
    const response = await api.get('/agents', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Agent> => {
    const response = await api.get(`/agents/${id}`);
    return response.data;
  },

  create: async (data: CreateAgentDto): Promise<Agent> => {
    const response = await api.post('/agents', data);
    return response.data;
  },

  update: async (id: string, data: UpdateAgentDto): Promise<Agent> => {
    const response = await api.patch(`/agents/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/agents/${id}`);
  },
};

export const jobsApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Job>> => {
    const response = await api.get('/jobs', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Job> => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },

  create: async (data: CreateJobDto): Promise<Job> => {
    const response = await api.post('/jobs', data);
    return response.data;
  },

  update: async (id: string, data: UpdateJobDto): Promise<Job> => {
    const response = await api.patch(`/jobs/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/jobs/${id}`);
  },
};

// 队列管理API
export const queueApi = {
  getStatus: async () => {
    const response = await api.get('/queue/status');
    return response.data;
  },

  trigger: async () => {
    const response = await api.post('/queue/trigger');
    return response.data;
  },

  matchJob: async (jobId: string) => {
    const response = await api.post(`/queue/match/${jobId}`);
    return response.data;
  },

  getMatchDetails: async (jobId: string) => {
    const response = await api.get(`/queue/match/${jobId}`);
    return response.data;
  },

  executeJob: async (jobId: string) => {
    const response = await api.post(`/queue/execute/${jobId}`);
    return response.data;
  },

  getJobResult: async (jobId: string) => {
    const response = await api.get(`/queue/result/${jobId}`);
    return response.data;
  }
};

export default api;
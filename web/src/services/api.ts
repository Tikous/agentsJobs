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
  timeout: 10000, // 恢复默认10秒超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// 为agent执行创建专门的axios实例，使用更长的超时时间
const agentExecutionApi = axios.create({
  baseURL: '/api',
  timeout: 70000, // agent执行需要更长时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 为两个axios实例添加相同的错误拦截器
const errorInterceptor = (error: any) => {
  console.error('API Error:', error.response?.data || error.message);
  return Promise.reject(error);
};

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  errorInterceptor
);

agentExecutionApi.interceptors.response.use(
  (response: AxiosResponse) => response,
  errorInterceptor
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
    const response = await agentExecutionApi.post(`/queue/execute/${jobId}`);
    return response.data;
  },

  executeJobWithAgent: async (jobId: string, agentId: string) => {
    const response = await agentExecutionApi.post(`/queue/execute/${jobId}/${agentId}`);
    return response.data;
  },

  getJobResult: async (jobId: string) => {
    const response = await api.get(`/queue/result/${jobId}`);
    return response.data;
  },

  completeJobWithAgent: async (jobId: string, agentId: string) => {
    const response = await api.post(`/queue/complete/${jobId}/${agentId}`);
    return response.data;
  }
};

export default api;
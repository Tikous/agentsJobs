import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { Job, CreateJobDto, UpdateJobDto, PaginationParams } from '@/types';
import { jobsApi } from '@/services/api';

interface JobsState {
  // 数据状态
  jobs: Job[];
  totalJobs: number;
  loading: boolean;
  error: string | null;
  
  // 分页状态
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  
  // 搜索和筛选状态
  searchText: string;
  filters: Record<string, unknown>;
  
  // 缓存状态
  lastFetch: number | null;
  cache: Map<string, Job>;
}

interface JobsActions {
  // 数据操作
  fetchJobs: (params?: PaginationParams) => Promise<void>;
  createJob: (data: CreateJobDto) => Promise<Job>;
  updateJob: (id: string, data: UpdateJobDto) => Promise<Job>;
  deleteJob: (id: string) => Promise<void>;
  getJobById: (id: string) => Promise<Job>;
  
  // 状态更新
  setPagination: (pagination: Partial<JobsState['pagination']>) => void;
  setSearchText: (text: string) => void;
  setFilters: (filters: Record<string, unknown>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 缓存操作
  invalidateCache: () => void;
  getCachedJob: (id: string) => Job | undefined;
  
  // 重置操作
  reset: () => void;
}

type JobsStore = JobsState & JobsActions;

const initialState: JobsState = {
  jobs: [],
  totalJobs: 0,
  loading: false,
  error: null,
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0,
  },
  searchText: '',
  filters: {},
  lastFetch: null,
  cache: new Map(),
};

export const useJobsStore = create<JobsStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      // 数据操作
      fetchJobs: async (params?: PaginationParams) => {
        const { pagination, searchText, filters } = get();
        
        set({ loading: true, error: null });

        try {
          const queryParams = {
            page: pagination.current,
            limit: pagination.pageSize,
            search: searchText,
            ...filters,
            ...params,
          };

          const response = await jobsApi.getAll(queryParams);
          
          let jobs: Job[];
          let total: number;
          
          if (Array.isArray(response)) {
            jobs = response;
            total = response.length;
          } else {
            jobs = response.data || [];
            total = response.total || 0;
          }

          // 更新缓存
          const cache = new Map(get().cache);
          jobs.forEach(job => cache.set(job.id, job));

          set({
            jobs,
            totalJobs: jobs.length,
            pagination: { ...pagination, total },
            lastFetch: Date.now(),
            cache,
            loading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '获取任务列表失败';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      createJob: async (data: CreateJobDto) => {
        set({ loading: true, error: null });
        
        try {
          const newJob = await jobsApi.create(data);
          
          const { jobs, cache } = get();
          const updatedCache = new Map(cache);
          updatedCache.set(newJob.id, newJob);
          
          set({
            jobs: [newJob, ...jobs],
            totalJobs: jobs.length + 1,
            cache: updatedCache,
            loading: false,
          });
          
          return newJob;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '创建任务失败';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      updateJob: async (id: string, data: UpdateJobDto) => {
        set({ loading: true, error: null });
        
        try {
          const updatedJob = await jobsApi.update(id, data);
          
          const { jobs, cache } = get();
          const updatedJobs = jobs.map(job => 
            job.id === id ? updatedJob : job
          );
          const updatedCache = new Map(cache);
          updatedCache.set(id, updatedJob);
          
          set({
            jobs: updatedJobs,
            cache: updatedCache,
            loading: false,
          });
          
          return updatedJob;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '更新任务失败';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      deleteJob: async (id: string) => {
        set({ loading: true, error: null });
        
        try {
          await jobsApi.delete(id);
          
          const { jobs, cache } = get();
          const updatedJobs = jobs.filter(job => job.id !== id);
          const updatedCache = new Map(cache);
          updatedCache.delete(id);
          
          set({
            jobs: updatedJobs,
            totalJobs: updatedJobs.length,
            cache: updatedCache,
            loading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '删除任务失败';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      getJobById: async (id: string) => {
        // 先检查缓存
        const cached = get().getCachedJob(id);
        if (cached) {
          return cached;
        }

        set({ loading: true, error: null });
        
        try {
          const job = await jobsApi.getById(id);
          
          const { cache } = get();
          const updatedCache = new Map(cache);
          updatedCache.set(id, job);
          
          set({ cache: updatedCache, loading: false });
          return job;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '获取任务详情失败';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      // 状态更新
      setPagination: (newPagination) => {
        const { pagination } = get();
        set({ pagination: { ...pagination, ...newPagination } });
      },

      setSearchText: (searchText) => {
        set({ searchText });
      },

      setFilters: (filters) => {
        set({ filters });
      },

      setLoading: (loading) => {
        set({ loading });
      },

      setError: (error) => {
        set({ error });
      },

      // 缓存操作
      invalidateCache: () => {
        set({ cache: new Map(), lastFetch: null });
      },

      getCachedJob: (id: string) => {
        return get().cache.get(id);
      },

      // 重置操作
      reset: () => {
        set(initialState);
      },
    })),
    {
      name: 'jobs-store',
    }
  )
);
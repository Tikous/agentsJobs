import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { Agent, CreateAgentDto, UpdateAgentDto, PaginationParams } from '@/types';
import { agentsApi } from '@/services/api';

interface AgentsState {
  // 数据状态
  agents: Agent[];
  totalAgents: number;
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
  cache: Map<string, Agent>;
}

interface AgentsActions {
  // 数据操作
  fetchAgents: (params?: PaginationParams) => Promise<void>;
  createAgent: (data: CreateAgentDto) => Promise<Agent>;
  updateAgent: (id: string, data: UpdateAgentDto) => Promise<Agent>;
  deleteAgent: (id: string) => Promise<void>;
  getAgentById: (id: string) => Promise<Agent>;
  
  // 状态更新
  setPagination: (pagination: Partial<AgentsState['pagination']>) => void;
  setSearchText: (text: string) => void;
  setFilters: (filters: Record<string, unknown>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 缓存操作
  invalidateCache: () => void;
  getCachedAgent: (id: string) => Agent | undefined;
  
  // 重置操作
  reset: () => void;
}

type AgentsStore = AgentsState & AgentsActions;

const initialState: AgentsState = {
  agents: [],
  totalAgents: 0,
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

export const useAgentsStore = create<AgentsStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      // 数据操作
      fetchAgents: async (params?: PaginationParams) => {
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

          const response = await agentsApi.getAll(queryParams);
          
          let agents: Agent[];
          let total: number;
          
          if (Array.isArray(response)) {
            agents = response;
            total = response.length;
          } else {
            agents = response.data || [];
            total = response.total || 0;
          }

          // 更新缓存
          const cache = new Map(get().cache);
          agents.forEach(agent => cache.set(agent.id, agent));

          set({
            agents,
            totalAgents: agents.length,
            pagination: { ...pagination, total },
            lastFetch: Date.now(),
            cache,
            loading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '获取智能体列表失败';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      createAgent: async (data: CreateAgentDto) => {
        set({ loading: true, error: null });
        
        try {
          const newAgent = await agentsApi.create(data);
          
          const { agents, cache } = get();
          const updatedCache = new Map(cache);
          updatedCache.set(newAgent.id, newAgent);
          
          set({
            agents: [newAgent, ...agents],
            totalAgents: agents.length + 1,
            cache: updatedCache,
            loading: false,
          });
          
          return newAgent;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '创建智能体失败';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      updateAgent: async (id: string, data: UpdateAgentDto) => {
        set({ loading: true, error: null });
        
        try {
          const updatedAgent = await agentsApi.update(id, data);
          
          const { agents, cache } = get();
          const updatedAgents = agents.map(agent => 
            agent.id === id ? updatedAgent : agent
          );
          const updatedCache = new Map(cache);
          updatedCache.set(id, updatedAgent);
          
          set({
            agents: updatedAgents,
            cache: updatedCache,
            loading: false,
          });
          
          return updatedAgent;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '更新智能体失败';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      deleteAgent: async (id: string) => {
        set({ loading: true, error: null });
        
        try {
          await agentsApi.delete(id);
          
          const { agents, cache } = get();
          const updatedAgents = agents.filter(agent => agent.id !== id);
          const updatedCache = new Map(cache);
          updatedCache.delete(id);
          
          set({
            agents: updatedAgents,
            totalAgents: updatedAgents.length,
            cache: updatedCache,
            loading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '删除智能体失败';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      getAgentById: async (id: string) => {
        // 先检查缓存
        const cached = get().getCachedAgent(id);
        if (cached) {
          return cached;
        }

        set({ loading: true, error: null });
        
        try {
          const agent = await agentsApi.getById(id);
          
          const { cache } = get();
          const updatedCache = new Map(cache);
          updatedCache.set(id, agent);
          
          set({ cache: updatedCache, loading: false });
          return agent;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '获取智能体详情失败';
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

      getCachedAgent: (id: string) => {
        return get().cache.get(id);
      },

      // 重置操作
      reset: () => {
        set(initialState);
      },
    })),
    {
      name: 'agents-store',
    }
  )
);
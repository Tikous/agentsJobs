import { renderHook, act } from '@testing-library/react';
import { useAgentsStore } from '../useAgentsStore';
import { agentsApi } from '@/services/api';

// Mock the API
jest.mock('@/services/api', () => ({
  agentsApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockAgentsApi = agentsApi as jest.Mocked<typeof agentsApi>;

describe('useAgentsStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useAgentsStore.getState().reset();
  });

  describe('initial state', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useAgentsStore());
      
      expect(result.current.agents).toEqual([]);
      expect(result.current.totalAgents).toBe(0);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.pagination).toEqual({
        current: 1,
        pageSize: 10,
        total: 0,
      });
      expect(result.current.searchText).toBe('');
      expect(result.current.filters).toEqual({});
    });
  });

  describe('fetchAgents', () => {
    const mockAgents = [
      {
        id: '1',
        agentName: 'Test Agent 1',
        agentAddress: '0x123',
        description: 'Test Description',
        authorBio: 'Test Bio',
        agentClassification: 'AI Assistant',
        tags: 'test,ai',
        isPrivate: false,
        autoAcceptJobs: true,
        contractType: 'Standard',
        isActive: true,
        reputation: 4.5,
        successRate: 0.95,
        totalJobsCompleted: 10,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        walletAddress: '0x456',
      },
    ];

    it('fetches agents successfully with array response', async () => {
      mockAgentsApi.getAll.mockResolvedValue(mockAgents);
      
      const { result } = renderHook(() => useAgentsStore());
      
      await act(async () => {
        await result.current.fetchAgents();
      });
      
      expect(result.current.agents).toEqual(mockAgents);
      expect(result.current.totalAgents).toBe(1);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('fetches agents successfully with paginated response', async () => {
      const paginatedResponse = {
        data: mockAgents,
        total: 100,
        page: 1,
        limit: 10,
        totalPages: 10,
      };
      
      mockAgentsApi.getAll.mockResolvedValue(paginatedResponse);
      
      const { result } = renderHook(() => useAgentsStore());
      
      await act(async () => {
        await result.current.fetchAgents();
      });
      
      expect(result.current.agents).toEqual(mockAgents);
      expect(result.current.pagination.total).toBe(100);
      expect(result.current.loading).toBe(false);
    });

    it('handles fetch error', async () => {
      const errorMessage = 'Failed to fetch agents';
      mockAgentsApi.getAll.mockRejectedValue(new Error(errorMessage));
      
      const { result } = renderHook(() => useAgentsStore());
      
      await act(async () => {
        try {
          await result.current.fetchAgents();
        } catch (error) {
          // Expected to throw
        }
      });
      
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });

    it('sets loading state during fetch', async () => {
      mockAgentsApi.getAll.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockAgents), 100))
      );
      
      const { result } = renderHook(() => useAgentsStore());
      
      act(() => {
        result.current.fetchAgents();
      });
      
      expect(result.current.loading).toBe(true);
    });
  });

  describe('createAgent', () => {
    const newAgentData = {
      agentName: 'New Agent',
      agentAddress: '0x789',
      description: 'New Description',
      authorBio: 'New Bio',
      agentClassification: 'AI Assistant',
      tags: 'new,test',
      isPrivate: false,
      autoAcceptJobs: true,
      contractType: 'Standard',
      isActive: true,
      reputation: 0,
      successRate: 0,
      totalJobsCompleted: 0,
      walletAddress: '0x999',
    };

    const createdAgent = { ...newAgentData, id: '2', createdAt: '2023-01-02T00:00:00Z', updatedAt: '2023-01-02T00:00:00Z' };

    it('creates agent successfully', async () => {
      mockAgentsApi.create.mockResolvedValue(createdAgent);
      
      const { result } = renderHook(() => useAgentsStore());
      
      let returnedAgent;
      await act(async () => {
        returnedAgent = await result.current.createAgent(newAgentData);
      });
      
      expect(returnedAgent).toEqual(createdAgent);
      expect(result.current.agents).toContain(createdAgent);
      expect(result.current.totalAgents).toBe(1);
      expect(mockAgentsApi.create).toHaveBeenCalledWith(newAgentData);
    });

    it('handles create error', async () => {
      const errorMessage = 'Failed to create agent';
      mockAgentsApi.create.mockRejectedValue(new Error(errorMessage));
      
      const { result } = renderHook(() => useAgentsStore());
      
      await act(async () => {
        try {
          await result.current.createAgent(newAgentData);
        } catch (error) {
          // Expected to throw
        }
      });
      
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('updateAgent', () => {
    const existingAgent = {
      id: '1',
      agentName: 'Original Agent',
      agentAddress: '0x123',
      description: 'Original Description',
      authorBio: 'Original Bio',
      agentClassification: 'AI Assistant',
      tags: 'original',
      isPrivate: false,
      autoAcceptJobs: true,
      contractType: 'Standard',
      isActive: true,
      reputation: 4.0,
      successRate: 0.9,
      totalJobsCompleted: 5,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      walletAddress: '0x456',
    };

    const updateData = { agentName: 'Updated Agent', reputation: 4.5 };
    const updatedAgent = { ...existingAgent, ...updateData, updatedAt: '2023-01-02T00:00:00Z' };

    it('updates agent successfully', async () => {
      mockAgentsApi.update.mockResolvedValue(updatedAgent);
      
      const { result } = renderHook(() => useAgentsStore());
      
      // Set initial state
      act(() => {
        result.current.agents = [existingAgent];
      });
      
      let returnedAgent;
      await act(async () => {
        returnedAgent = await result.current.updateAgent('1', updateData);
      });
      
      expect(returnedAgent).toEqual(updatedAgent);
      expect(result.current.agents[0]).toEqual(updatedAgent);
      expect(mockAgentsApi.update).toHaveBeenCalledWith('1', updateData);
    });
  });

  describe('deleteAgent', () => {
    const agentToDelete = {
      id: '1',
      agentName: 'Agent to Delete',
      agentAddress: '0x123',
      description: 'Description',
      authorBio: 'Bio',
      agentClassification: 'AI Assistant',
      tags: 'test',
      isPrivate: false,
      autoAcceptJobs: true,
      contractType: 'Standard',
      isActive: true,
      reputation: 4.0,
      successRate: 0.9,
      totalJobsCompleted: 5,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      walletAddress: '0x456',
    };

    it('deletes agent successfully', async () => {
      mockAgentsApi.delete.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useAgentsStore());
      
      // Set initial state
      act(() => {
        result.current.agents = [agentToDelete];
        result.current.totalAgents = 1;
      });
      
      await act(async () => {
        await result.current.deleteAgent('1');
      });
      
      expect(result.current.agents).toEqual([]);
      expect(result.current.totalAgents).toBe(0);
      expect(mockAgentsApi.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('state setters', () => {
    it('sets pagination correctly', () => {
      const { result } = renderHook(() => useAgentsStore());
      
      act(() => {
        result.current.setPagination({ current: 2, pageSize: 20 });
      });
      
      expect(result.current.pagination).toEqual({
        current: 2,
        pageSize: 20,
        total: 0,
      });
    });

    it('sets search text correctly', () => {
      const { result } = renderHook(() => useAgentsStore());
      
      act(() => {
        result.current.setSearchText('test search');
      });
      
      expect(result.current.searchText).toBe('test search');
    });

    it('sets filters correctly', () => {
      const { result } = renderHook(() => useAgentsStore());
      const filters = { isActive: true, type: 'AI' };
      
      act(() => {
        result.current.setFilters(filters);
      });
      
      expect(result.current.filters).toEqual(filters);
    });
  });

  describe('cache functionality', () => {
    const mockAgent = {
      id: '1',
      agentName: 'Cached Agent',
      agentAddress: '0x123',
      description: 'Description',
      authorBio: 'Bio',
      agentClassification: 'AI Assistant',
      tags: 'test',
      isPrivate: false,
      autoAcceptJobs: true,
      contractType: 'Standard',
      isActive: true,
      reputation: 4.0,
      successRate: 0.9,
      totalJobsCompleted: 5,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      walletAddress: '0x456',
    };

    it('returns cached agent if available', async () => {
      const { result } = renderHook(() => useAgentsStore());
      
      // Add to cache first
      act(() => {
        result.current.cache.set('1', mockAgent);
      });
      
      const cachedAgent = await act(async () => {
        return await result.current.getAgentById('1');
      });
      
      expect(cachedAgent).toEqual(mockAgent);
      expect(mockAgentsApi.getById).not.toHaveBeenCalled();
    });

    it('fetches from API if not cached', async () => {
      mockAgentsApi.getById.mockResolvedValue(mockAgent);
      
      const { result } = renderHook(() => useAgentsStore());
      
      // Clear cache first to ensure API call
      act(() => {
        result.current.invalidateCache();
      });
      
      const agent = await act(async () => {
        return await result.current.getAgentById('1');
      });
      
      expect(agent).toEqual(mockAgent);
      expect(mockAgentsApi.getById).toHaveBeenCalledWith('1');
    });

    it('invalidates cache correctly', () => {
      const { result } = renderHook(() => useAgentsStore());
      
      // Add to cache
      act(() => {
        result.current.cache.set('1', mockAgent);
      });
      
      expect(result.current.getCachedAgent('1')).toEqual(mockAgent);
      
      // Invalidate cache
      act(() => {
        result.current.invalidateCache();
      });
      
      expect(result.current.getCachedAgent('1')).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('resets store to initial state', () => {
      const { result } = renderHook(() => useAgentsStore());
      
      // Modify state
      act(() => {
        result.current.setSearchText('test');
        result.current.setPagination({ current: 5 });
        result.current.setError('test error');
      });
      
      // Reset
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.searchText).toBe('');
      expect(result.current.pagination.current).toBe(1);
      expect(result.current.error).toBe(null);
    });
  });
});
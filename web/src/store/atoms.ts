import { atom } from 'jotai';
import { Agent, Job } from '@/types';

// Agent相关atoms
export const agentsAtom = atom<Agent[]>([]);
export const agentsLoadingAtom = atom<boolean>(false);
export const agentsErrorAtom = atom<string | null>(null);

// Job相关atoms
export const jobsAtom = atom<Job[]>([]);
export const jobsLoadingAtom = atom<boolean>(false);
export const jobsErrorAtom = atom<string | null>(null);

// 搜索和筛选相关atoms
export const agentSearchAtom = atom<string>('');
export const jobSearchAtom = atom<string>('');
export const agentFiltersAtom = atom<Record<string, unknown>>({});
export const jobFiltersAtom = atom<Record<string, unknown>>({});

// 分页相关atoms
export const agentPaginationAtom = atom({
  current: 1,
  pageSize: 10,
  total: 0,
});

export const jobPaginationAtom = atom({
  current: 1,
  pageSize: 10,
  total: 0,
});

// UI相关atoms
export const sidebarOpenAtom = atom<boolean>(true);
export const themeAtom = atom<'light' | 'dark'>('light');

// 通知相关atoms
export const notificationsAtom = atom<Array<{
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: number;
}>>([]);

// 加载状态组合atom
export const isAnyLoadingAtom = atom((get) => 
  get(agentsLoadingAtom) || get(jobsLoadingAtom)
);
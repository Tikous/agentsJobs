import { useEffect, useRef } from 'react';
import { jobsApi } from '@/services/api';

interface UseJobStatusPollingProps {
  jobId: string;
  onStatusChange?: (status: string, job: any) => void;
  interval?: number;
  enabled?: boolean;
}

export const useJobStatusPolling = ({
  jobId,
  onStatusChange,
  interval = 3000, // 3秒轮询一次
  enabled = true
}: UseJobStatusPollingProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<string>('');

  useEffect(() => {
    if (!enabled || !jobId) return;

    const pollStatus = async () => {
      try {
        const job = await jobsApi.getById(jobId);
        
        // 只有状态改变时才触发回调
        if (job.status !== lastStatusRef.current) {
          lastStatusRef.current = job.status;
          onStatusChange?.(job.status, job);
        }

        // 如果任务完成或失败，停止轮询
        if (job.status === 'Completed' || job.status === 'Failed') {
          stopPolling();
        }
      } catch (error) {
        // 如果是404错误（任务已删除），停止轮询
        if (error.response?.status === 404) {
          console.log(`Job ${jobId} 已删除，停止轮询`);
          stopPolling();
          return;
        }
        console.error('轮询Job状态失败:', error);
      }
    };

    const startPolling = () => {
      // 立即执行一次
      pollStatus();
      // 设置定时器
      intervalRef.current = setInterval(pollStatus, interval);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startPolling();

    return () => {
      stopPolling();
    };
  }, [jobId, onStatusChange, interval, enabled]);

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return { stop };
};
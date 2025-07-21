import { useState, useCallback } from 'react';

interface UsePaginationParams {
  initialPage?: number;
  initialPageSize?: number;
}

interface UsePaginationReturn {
  current: number;
  pageSize: number;
  total: number;
  setCurrent: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotal: (total: number) => void;
  reset: () => void;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger: boolean;
    showQuickJumper: boolean;
    showTotal: (total: number, range: [number, number]) => string;
  };
}

export function usePagination({
  initialPage = 1,
  initialPageSize = 10,
}: UsePaginationParams = {}): UsePaginationReturn {
  const [current, setCurrent] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(0);

  const reset = useCallback(() => {
    setCurrent(initialPage);
    setPageSize(initialPageSize);
    setTotal(0);
  }, [initialPage, initialPageSize]);

  const pagination = {
    current,
    pageSize,
    total,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) =>
      `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
  };

  return {
    current,
    pageSize,
    total,
    setCurrent,
    setPageSize,
    setTotal,
    reset,
    pagination,
  };
}
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  it('has correct initial state with default values', () => {
    const { result } = renderHook(() => usePagination());
    
    expect(result.current.current).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.total).toBe(0);
  });

  it('accepts custom initial values', () => {
    const { result } = renderHook(() => 
      usePagination({ initialPage: 3, initialPageSize: 20 })
    );
    
    expect(result.current.current).toBe(3);
    expect(result.current.pageSize).toBe(20);
    expect(result.current.total).toBe(0);
  });

  it('updates current page correctly', () => {
    const { result } = renderHook(() => usePagination());
    
    act(() => {
      result.current.setCurrent(5);
    });
    
    expect(result.current.current).toBe(5);
  });

  it('updates page size correctly', () => {
    const { result } = renderHook(() => usePagination());
    
    act(() => {
      result.current.setPageSize(25);
    });
    
    expect(result.current.pageSize).toBe(25);
  });

  it('updates total correctly', () => {
    const { result } = renderHook(() => usePagination());
    
    act(() => {
      result.current.setTotal(100);
    });
    
    expect(result.current.total).toBe(100);
  });

  it('resets to initial values', () => {
    const { result } = renderHook(() => 
      usePagination({ initialPage: 2, initialPageSize: 15 })
    );
    
    // Modify values
    act(() => {
      result.current.setCurrent(10);
      result.current.setPageSize(50);
      result.current.setTotal(200);
    });
    
    expect(result.current.current).toBe(10);
    expect(result.current.pageSize).toBe(50);
    expect(result.current.total).toBe(200);
    
    // Reset
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.current).toBe(2);
    expect(result.current.pageSize).toBe(15);
    expect(result.current.total).toBe(0);
  });

  it('provides pagination object with correct structure', () => {
    const { result } = renderHook(() => usePagination());
    
    act(() => {
      result.current.setCurrent(3);
      result.current.setPageSize(20);
      result.current.setTotal(100);
    });
    
    const { pagination } = result.current;
    
    expect(pagination).toEqual({
      current: 3,
      pageSize: 20,
      total: 100,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: expect.any(Function),
    });
  });

  it('showTotal function works correctly', () => {
    const { result } = renderHook(() => usePagination());
    
    const { pagination } = result.current;
    const showTotalResult = pagination.showTotal(100, [11, 20]);
    
    expect(showTotalResult).toBe('第 11-20 条，共 100 条');
  });

  it('showTotal function handles different ranges', () => {
    const { result } = renderHook(() => usePagination());
    
    const { pagination } = result.current;
    
    // First page
    expect(pagination.showTotal(50, [1, 10])).toBe('第 1-10 条，共 50 条');
    
    // Last page (partial)
    expect(pagination.showTotal(25, [21, 25])).toBe('第 21-25 条，共 25 条');
    
    // Single item
    expect(pagination.showTotal(1, [1, 1])).toBe('第 1-1 条，共 1 条');
    
    // No items
    expect(pagination.showTotal(0, [0, 0])).toBe('第 0-0 条，共 0 条');
  });

  it('creates new pagination object when values change', () => {
    const { result } = renderHook(() => usePagination());
    
    const firstPagination = result.current.pagination;
    
    // Update total (should create new pagination object)
    act(() => {
      result.current.setTotal(50);
    });
    
    const secondPagination = result.current.pagination;
    
    // The showTotal function should exist on both objects
    expect(typeof firstPagination.showTotal).toBe('function');
    expect(typeof secondPagination.showTotal).toBe('function');
    
    // The pagination object itself should be different
    expect(firstPagination).not.toBe(secondPagination);
    
    // But the total should be updated
    expect(secondPagination.total).toBe(50);
    expect(firstPagination.total).toBe(0);
  });

  it('handles edge cases for page values', () => {
    const { result } = renderHook(() => usePagination());
    
    // Test with 0
    act(() => {
      result.current.setCurrent(0);
    });
    expect(result.current.current).toBe(0);
    
    // Test with negative
    act(() => {
      result.current.setCurrent(-1);
    });
    expect(result.current.current).toBe(-1);
    
    // Test with very large number
    act(() => {
      result.current.setCurrent(9999);
    });
    expect(result.current.current).toBe(9999);
  });

  it('handles edge cases for page size values', () => {
    const { result } = renderHook(() => usePagination());
    
    // Test with 1
    act(() => {
      result.current.setPageSize(1);
    });
    expect(result.current.pageSize).toBe(1);
    
    // Test with very large number
    act(() => {
      result.current.setPageSize(1000);
    });
    expect(result.current.pageSize).toBe(1000);
  });

  it('works with custom initial values and reset', () => {
    const customInitial = { initialPage: 5, initialPageSize: 25 };
    const { result } = renderHook(() => usePagination(customInitial));
    
    // Verify custom initial values
    expect(result.current.current).toBe(5);
    expect(result.current.pageSize).toBe(25);
    
    // Change values
    act(() => {
      result.current.setCurrent(10);
      result.current.setPageSize(50);
    });
    
    // Reset should go back to custom initial values
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.current).toBe(5);
    expect(result.current.pageSize).toBe(25);
  });
});
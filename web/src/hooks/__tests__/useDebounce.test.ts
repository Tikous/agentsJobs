import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

// Mock timers
jest.useFakeTimers();

describe('useDebounce', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('delays updating the debounced value', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Update the value
    rerender({ value: 'updated', delay: 500 });

    // Value should still be the old value
    expect(result.current).toBe('initial');

    // Fast-forward time by 400ms (less than delay)
    act(() => {
      jest.advanceTimersByTime(400);
    });

    // Value should still be the old value
    expect(result.current).toBe('initial');

    // Fast-forward time by 100ms more (total 500ms)
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Now value should be updated
    expect(result.current).toBe('updated');
  });

  it('resets the timer when value changes quickly', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // First update
    rerender({ value: 'first-update', delay: 500 });
    
    // Wait 300ms
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    expect(result.current).toBe('initial');

    // Second update (should reset timer)
    rerender({ value: 'second-update', delay: 500 });
    
    // Wait another 300ms (600ms total from first update, but only 300ms from second)
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Should still be initial because timer was reset
    expect(result.current).toBe('initial');

    // Wait 200ms more to complete the delay from second update
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    // Now should be the second update
    expect(result.current).toBe('second-update');
  });

  it('works with different data types', () => {
    // Test with numbers
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 1, delay: 300 } }
    );

    numberRerender({ value: 2, delay: 300 });
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    expect(numberResult.current).toBe(2);

    // Test with objects
    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: { a: 1 }, delay: 300 } }
    );

    const newObject = { a: 2 };
    objectRerender({ value: newObject, delay: 300 });
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    expect(objectResult.current).toBe(newObject);

    // Test with arrays
    const { result: arrayResult, rerender: arrayRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: [1, 2], delay: 300 } }
    );

    const newArray = [3, 4];
    arrayRerender({ value: newArray, delay: 300 });
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    expect(arrayResult.current).toBe(newArray);
  });

  it('works with different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } }
    );

    // Update with a shorter delay
    rerender({ value: 'updated', delay: 200 });
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    expect(result.current).toBe('updated');
  });

  it('cleans up timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    const { unmount } = renderHook(() => useDebounce('test', 500));
    
    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    clearTimeoutSpy.mockRestore();
  });

  it('handles zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 0 } }
    );

    rerender({ value: 'updated', delay: 0 });
    
    // Even with 0 delay, should wait for next tick
    act(() => {
      jest.advanceTimersByTime(0);
    });
    
    expect(result.current).toBe('updated');
  });

  it('handles rapid consecutive updates', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    // Rapid updates
    rerender({ value: 'update1', delay: 300 });
    rerender({ value: 'update2', delay: 300 });
    rerender({ value: 'update3', delay: 300 });
    rerender({ value: 'final', delay: 300 });
    
    // Wait for debounce
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Should only have the final value
    expect(result.current).toBe('final');
  });
});
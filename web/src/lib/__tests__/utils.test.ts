import { cn } from '../utils';

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    const result = cn('class1', 'class2', 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('handles conditional classes', () => {
    const condition = true;
    const result = cn('base-class', condition && 'conditional-class');
    expect(result).toBe('base-class conditional-class');
  });

  it('filters out falsy values', () => {
    const result = cn('class1', false, null, undefined, '', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('handles arrays of classes', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('handles objects with boolean values', () => {
    const result = cn({
      'class1': true,
      'class2': false,
      'class3': true,
    });
    expect(result).toBe('class1 class3');
  });

  it('merges Tailwind classes correctly (removes duplicates)', () => {
    // This tests the twMerge functionality
    const result = cn('px-4 py-2', 'px-6');
    expect(result).toBe('py-2 px-6');
  });

  it('handles complex Tailwind class merging', () => {
    const result = cn(
      'bg-red-500 text-white p-4',
      'bg-blue-500 p-6'
    );
    expect(result).toBe('text-white bg-blue-500 p-6');
  });

  it('handles empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('handles only falsy values', () => {
    const result = cn(false, null, undefined, '');
    expect(result).toBe('');
  });

  it('handles mixed input types', () => {
    const result = cn(
      'base',
      ['array1', 'array2'],
      { 'object1': true, 'object2': false },
      null,
      'final'
    );
    expect(result).toBe('base array1 array2 object1 final');
  });

  it('handles Tailwind responsive classes', () => {
    const result = cn(
      'text-sm md:text-base',
      'md:text-lg'
    );
    expect(result).toBe('text-sm md:text-lg');
  });

  it('handles Tailwind state classes', () => {
    const result = cn(
      'bg-white hover:bg-gray-100',
      'hover:bg-blue-100'
    );
    expect(result).toBe('bg-white hover:bg-blue-100');
  });

  it('preserves non-conflicting classes', () => {
    const result = cn(
      'text-white border rounded',
      'bg-blue-500 shadow-lg'
    );
    expect(result).toBe('text-white border rounded bg-blue-500 shadow-lg');
  });
});
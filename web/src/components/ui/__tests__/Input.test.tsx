import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md', 'border');
  });

  it('handles different input types', () => {
    const { rerender } = render(<Input type="text" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'text');

    rerender(<Input type="email" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    
    render(<Input onChange={handleChange} data-testid="input" />);
    const input = screen.getByTestId('input');

    await user.type(input, 'Hello');
    
    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('Hello');
  });

  it('handles focus and blur events', () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    
    render(<Input onFocus={handleFocus} onBlur={handleBlur} data-testid="input" />);
    const input = screen.getByTestId('input');

    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);

    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled data-testid="input" />);
    const input = screen.getByTestId('input');
    
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveClass('custom-input');
  });

  it('forwards other props to input element', () => {
    render(
      <Input 
        data-testid="input" 
        maxLength={10}
        required
        name="username"
      />
    );
    const input = screen.getByTestId('input');
    
    expect(input).toHaveAttribute('maxLength', '10');
    expect(input).toHaveAttribute('required');
    expect(input).toHaveAttribute('name', 'username');
  });

  it('handles controlled input', () => {
    const { rerender } = render(<Input value="initial" readOnly data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveValue('initial');

    rerender(<Input value="updated" readOnly data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveValue('updated');
  });
});
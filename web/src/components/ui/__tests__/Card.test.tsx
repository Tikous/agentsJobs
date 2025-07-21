import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders correctly', () => {
      render(<Card data-testid="card">Card Content</Card>);
      const card = screen.getByTestId('card');
      
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-white', 'shadow-sm');
      expect(card).toHaveTextContent('Card Content');
    });

    it('applies custom className', () => {
      render(<Card className="custom-card" data-testid="card" />);
      expect(screen.getByTestId('card')).toHaveClass('custom-card');
    });
  });

  describe('CardHeader', () => {
    it('renders correctly', () => {
      render(<CardHeader data-testid="header">Header Content</CardHeader>);
      const header = screen.getByTestId('header');
      
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
      expect(header).toHaveTextContent('Header Content');
    });
  });

  describe('CardTitle', () => {
    it('renders as h3 element', () => {
      render(<CardTitle data-testid="title">Test Title</CardTitle>);
      const title = screen.getByTestId('title');
      
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass('text-2xl', 'font-semibold');
      expect(title).toHaveTextContent('Test Title');
    });
  });

  describe('CardDescription', () => {
    it('renders as p element', () => {
      render(<CardDescription data-testid="description">Test Description</CardDescription>);
      const description = screen.getByTestId('description');
      
      expect(description).toBeInTheDocument();
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass('text-sm', 'text-gray-500');
      expect(description).toHaveTextContent('Test Description');
    });
  });

  describe('CardContent', () => {
    it('renders correctly', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('p-6', 'pt-0');
      expect(content).toHaveTextContent('Content');
    });
  });

  describe('CardFooter', () => {
    it('renders correctly', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
      expect(footer).toHaveTextContent('Footer');
    });
  });

  describe('Complete Card', () => {
    it('renders full card structure', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>
            Card content goes here
          </CardContent>
          <CardFooter>
            Card footer
          </CardFooter>
        </Card>
      );

      expect(screen.getByTestId('complete-card')).toBeInTheDocument();
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Description')).toBeInTheDocument();
      expect(screen.getByText('Card content goes here')).toBeInTheDocument();
      expect(screen.getByText('Card footer')).toBeInTheDocument();
    });
  });
});
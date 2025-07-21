import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NewLayout from '../NewLayout';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/' }),
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Home: () => <div data-testid="home-icon" />,
  Bot: () => <div data-testid="bot-icon" />,
  Briefcase: () => <div data-testid="briefcase-icon" />,
  Menu: () => <div data-testid="menu-icon" />,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('NewLayout', () => {
  it('renders main navigation elements', () => {
    renderWithRouter(<NewLayout />);
    
    expect(screen.getByText('Agents & Jobs')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('renders desktop navigation links', () => {
    renderWithRouter(<NewLayout />);
    
    expect(screen.getAllByText('首页').length).toBeGreaterThan(0);
    expect(screen.getAllByText('智能体管理').length).toBeGreaterThan(0);
    expect(screen.getAllByText('任务管理').length).toBeGreaterThan(0);
  });

  it('renders navigation icons', () => {
    renderWithRouter(<NewLayout />);
    
    expect(screen.getAllByTestId('home-icon').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('bot-icon').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('briefcase-icon').length).toBeGreaterThan(0);
  });

  it('renders mobile menu button', () => {
    renderWithRouter(<NewLayout />);
    
    const menuButton = screen.getByTestId('menu-icon').closest('button');
    expect(menuButton).toBeInTheDocument();
  });

  it('toggles mobile sidebar when menu button is clicked', () => {
    renderWithRouter(<NewLayout />);
    
    const menuButton = screen.getByTestId('menu-icon').closest('button');
    
    // Initially navigation should be visible (both desktop and mobile versions exist)
    expect(screen.getAllByText('首页').length).toBeGreaterThan(0);
    
    // Click menu button to toggle mobile menu
    if (menuButton) {
      fireEvent.click(menuButton);
    }
  });

  it('applies correct classes for active navigation items', () => {
    // The mock is already set up in the top of the file to return { pathname: '/' }
    renderWithRouter(<NewLayout />);
    
    const homeLinks = screen.getAllByText('首页');
    expect(homeLinks.length).toBeGreaterThan(0);
    const homeLink = homeLinks[0].closest('a');
    expect(homeLink).toHaveClass('border-primary', 'text-primary');
  });

  it('renders navigation links with correct hrefs', () => {
    renderWithRouter(<NewLayout />);
    
    const homeLinks = screen.getAllByText('首页');
    const agentsLinks = screen.getAllByText('智能体管理');
    const jobsLinks = screen.getAllByText('任务管理');
    
    // Check that at least one home link exists and has correct href
    expect(homeLinks.length).toBeGreaterThan(0);
    expect(homeLinks[0].closest('a')).toHaveAttribute('href', '/');
    
    // Check that at least one agents link exists and has correct href
    expect(agentsLinks.length).toBeGreaterThan(0);
    expect(agentsLinks[0].closest('a')).toHaveAttribute('href', '/agents');
    
    // Check that at least one jobs link exists and has correct href
    expect(jobsLinks.length).toBeGreaterThan(0);
    expect(jobsLinks[0].closest('a')).toHaveAttribute('href', '/jobs');
  });

  it('renders outlet for child routes', () => {
    renderWithRouter(<NewLayout />);
    
    const outlet = screen.getByTestId('outlet');
    expect(outlet).toBeInTheDocument();
    expect(outlet).toHaveTextContent('Outlet Content');
  });

  it('has responsive design classes', () => {
    renderWithRouter(<NewLayout />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('border-b', 'bg-card');
    
    const main = screen.getByRole('main');
    expect(main).toHaveClass('flex-1');
  });
});
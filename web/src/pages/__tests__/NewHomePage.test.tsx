import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NewHomePage from '../NewHomePage';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Bot: () => <div data-testid="bot-icon" />,
  Briefcase: () => <div data-testid="briefcase-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('NewHomePage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders main title and description', () => {
    renderWithRouter(<NewHomePage />);
    
    expect(screen.getByText('智能体与任务管理系统')).toBeInTheDocument();
    expect(screen.getByText('高效管理智能体和任务分配，提升工作效率')).toBeInTheDocument();
  });

  it('renders statistics cards', () => {
    renderWithRouter(<NewHomePage />);
    
    expect(screen.getByText('智能体总数')).toBeInTheDocument();
    expect(screen.getByText('任务总数')).toBeInTheDocument();
    expect(screen.getByText('已完成任务')).toBeInTheDocument();
    
    // Check for icons (there might be multiple due to navigation)
    expect(screen.getAllByTestId('bot-icon').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('briefcase-icon').length).toBeGreaterThan(0);
    expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
  });

  it('renders feature cards', () => {
    renderWithRouter(<NewHomePage />);
    
    expect(screen.getByText('功能特点')).toBeInTheDocument();
    expect(screen.getByText('快速开始')).toBeInTheDocument();
    
    // Check feature list items
    expect(screen.getByText('智能体的全生命周期管理')).toBeInTheDocument();
    expect(screen.getByText('任务的创建、分配和跟踪')).toBeInTheDocument();
    expect(screen.getByText('支持分页查询和高级筛选')).toBeInTheDocument();
  });

  it('renders quick start steps', () => {
    renderWithRouter(<NewHomePage />);
    
    expect(screen.getByText('1. 点击"智能体管理"创建和管理智能体')).toBeInTheDocument();
    expect(screen.getByText('2. 点击"任务管理"创建和分配任务')).toBeInTheDocument();
    expect(screen.getByText('3. 使用搜索和筛选功能快速定位数据')).toBeInTheDocument();
    expect(screen.getByText('4. 通过表格操作进行编辑和删除')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    renderWithRouter(<NewHomePage />);
    
    expect(screen.getByText('管理智能体')).toBeInTheDocument();
    expect(screen.getByText('管理任务')).toBeInTheDocument();
  });

  it('renders quick action buttons', () => {
    renderWithRouter(<NewHomePage />);
    
    expect(screen.getByText('新增智能体')).toBeInTheDocument();
    expect(screen.getByText('新增任务')).toBeInTheDocument();
    expect(screen.getByText('查看所有智能体')).toBeInTheDocument();
    expect(screen.getByText('查看所有任务')).toBeInTheDocument();
  });

  it('navigates to agents page when manage agents button is clicked', () => {
    renderWithRouter(<NewHomePage />);
    
    const manageAgentsButton = screen.getByText('管理智能体');
    fireEvent.click(manageAgentsButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/agents');
  });

  it('navigates to jobs page when manage jobs button is clicked', () => {
    renderWithRouter(<NewHomePage />);
    
    const manageJobsButton = screen.getByText('管理任务');
    fireEvent.click(manageJobsButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/jobs');
  });

  it('navigates to new agent page when new agent button is clicked', () => {
    renderWithRouter(<NewHomePage />);
    
    const newAgentButton = screen.getByText('新增智能体');
    fireEvent.click(newAgentButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/agents/new');
  });

  it('navigates to new job page when new job button is clicked', () => {
    renderWithRouter(<NewHomePage />);
    
    const newJobButton = screen.getByText('新增任务');
    fireEvent.click(newJobButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/jobs/new');
  });

  it('navigates to agents list when view all agents button is clicked', () => {
    renderWithRouter(<NewHomePage />);
    
    const viewAgentsButton = screen.getByText('查看所有智能体');
    fireEvent.click(viewAgentsButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/agents');
  });

  it('navigates to jobs list when view all jobs button is clicked', () => {
    renderWithRouter(<NewHomePage />);
    
    const viewJobsButton = screen.getByText('查看所有任务');
    fireEvent.click(viewJobsButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/jobs');
  });
});
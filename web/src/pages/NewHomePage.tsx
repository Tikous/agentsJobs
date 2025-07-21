import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Bot, Briefcase, CheckCircle, Plus } from 'lucide-react';
import { agentsApi, jobsApi } from '@/services/api';

const NewHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState({
    totalAgents: 0,
    totalJobs: 0,
    completedJobs: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const [agentsResponse, jobsResponse] = await Promise.all([
        agentsApi.getAll(),
        jobsApi.getAll(),
      ]);
      
      // 安全检查数据结构
      const agentsData = agentsResponse?.data || agentsResponse || [];
      const jobsData = jobsResponse?.data || jobsResponse || [];
      
      const completedJobs = Array.isArray(jobsData) 
        ? jobsData.filter(job => job.status === 'Completed').length 
        : 0;
      
      setStatistics({
        totalAgents: Array.isArray(agentsData) ? agentsData.length : 0,
        totalJobs: Array.isArray(jobsData) ? jobsData.length : 0,
        completedJobs,
      });
    } catch (error) {
      console.error('NewHomePage: 加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          智能体与任务管理系统
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          高效管理智能体和任务分配，提升工作效率
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">智能体总数</CardTitle>
            <Bot className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : statistics.totalAgents}</div>
            <p className="text-xs text-muted-foreground">当前注册的智能体数量</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">任务总数</CardTitle>
            <Briefcase className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : statistics.totalJobs}</div>
            <p className="text-xs text-muted-foreground">系统中的任务数量</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成任务</CardTitle>
            <CheckCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : statistics.completedJobs}</div>
            <p className="text-xs text-muted-foreground">成功完成的任务数量</p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>功能特点</CardTitle>
            <CardDescription>系统核心功能介绍</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <span className="text-sm">智能体的全生命周期管理</span>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
              <span className="text-sm">任务的创建、分配和跟踪</span>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
              <span className="text-sm">支持分页查询和高级筛选</span>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
              <span className="text-sm">实时状态更新和监控</span>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
              <span className="text-sm">完整的CRUD操作支持</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>快速开始</CardTitle>
            <CardDescription>跟随以下步骤快速上手</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm">
                1. 点击"智能体管理"创建和管理智能体
              </p>
              <p className="text-sm">
                2. 点击"任务管理"创建和分配任务
              </p>
              <p className="text-sm">
                3. 使用搜索和筛选功能快速定位数据
              </p>
              <p className="text-sm">
                4. 通过表格操作进行编辑和删除
              </p>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button 
                onClick={() => navigate('/agents')}
                className="flex-1"
              >
                <Bot className="w-4 h-4 mr-2" />
                管理智能体
              </Button>
              <Button 
                onClick={() => navigate('/jobs')}
                variant="outline"
                className="flex-1"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                管理任务
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>快捷操作</CardTitle>
          <CardDescription>常用功能快速入口</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/agents/new')}>
              <Plus className="w-4 h-4 mr-2" />
              新增智能体
            </Button>
            <Button onClick={() => navigate('/jobs/new')} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              新增任务
            </Button>
            <Button onClick={() => navigate('/agents')} variant="ghost">
              查看所有智能体
            </Button>
            <Button onClick={() => navigate('/jobs')} variant="ghost">
              查看所有任务
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewHomePage;
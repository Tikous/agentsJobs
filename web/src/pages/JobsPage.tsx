import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Space, 
  Popconfirm, 
  message, 
  Tag, 
  Typography,
  Tooltip,
  Row,
  Col,
  Select,
  Card
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Job, PaginationParams, Agent } from '@/types';
import { jobsApi, queueApi, agentsApi } from '@/services/api';
// 移除了轮询hook的引用
import MatchSuccessModal from '@/components/MatchSuccessModal';
import ExecuteJobModal from '@/components/ExecuteJobModal';

const { Title } = Typography;
const { Search } = Input;

const JobsPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<Partial<PaginationParams>>({});
  // 移除了轮询状态
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [matchedAgent, setMatchedAgent] = useState<Agent | null>(null);
  const [matchedJob, setMatchedJob] = useState<Job | null>(null);
  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [executeJobData, setExecuteJobData] = useState<{job: Job, agent: Agent, matchRecord: any} | null>(null);

  const loadJobs = useCallback(async (params?: Partial<PaginationParams>) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        ...filters,
        ...params,
      };
      
      const response = await jobsApi.getAll(queryParams);
      
      if (Array.isArray(response)) {
        setJobs(response);
        setPagination(prev => ({ ...prev, total: response.length }));
      } else {
        setJobs(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.total || 0,
          current: response.page || 1,
        }));
      }
    } catch (error) {
      message.error('加载任务列表失败');
      console.error('Load jobs error:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText, filters]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // 移除了自动状态轮询逻辑

  // 移除了状态改变回调

  const handleDelete = async (id: string) => {
    try {
      await jobsApi.delete(id);
      message.success('删除成功');
      loadJobs();
    } catch (error) {
      message.error('删除失败');
      console.error('Delete job error:', error);
    }
  };

  const handleTriggerMatch = async (jobId: string, isRetry = false) => {
    try {
      const loadingMessage = isRetry ? '正在重新匹配Agent...' : '正在匹配Agent...';
      message.loading(loadingMessage, 2);
      const matchResult = await queueApi.matchJob(jobId);
      
      if (matchResult && matchResult.agent && matchResult.job) {
        // 匹配成功，显示成功模态框
        setMatchedAgent(matchResult.agent);
        setMatchedJob(matchResult.job);
        setMatchInfo({
          matchScore: matchResult.matchScore || 0,
          categoryMatch: matchResult.agent.agentClassification === matchResult.job.category,
          budgetCompatible: matchResult.agent.price <= matchResult.job.maxBudget
        });
        setShowSuccessModal(true);
        message.success('匹配成功！');
      } else {
        message.success('已触发匹配，请稍后查看状态');
      }
      
      // 不再自动开始轮询
      
      // 刷新列表
      loadJobs();
    } catch (error) {
      message.error('触发匹配失败');
      console.error('Trigger match error:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (paginationConfig: { current?: number; pageSize?: number }) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current || prev.current,
      pageSize: paginationConfig.pageSize || prev.pageSize,
    }));
  };

  const handleShowExecuteModal = async (job: Job) => {
    try {
      const matchDetails = await queueApi.getMatchDetails(job.id);
      setExecuteJobData({
        job: matchDetails.job,
        agent: matchDetails.agent,
        matchRecord: matchDetails.matchRecord
      });
      setShowExecuteModal(true);
    } catch (error) {
      message.error('获取匹配详情失败');
      console.error('Get match details error:', error);
    }
  };


  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'Open': 'blue',
      'Matching': 'orange',
      'Matched': 'cyan',
      'In Progress': 'processing',
      'Completed': 'success',
      'Failed': 'error',
      'Cancelled': 'default',
    };
    return statusColors[status] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const priorityColors: { [key: string]: string } = {
      'High': 'red',
      'Medium': 'orange',
      'Low': 'green',
    };
    return priorityColors[priority] || 'default';
  };

  const columns = [
    {
      title: '任务标题',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      width: 180,
      fixed: 'left' as const,
      render: (text: string) => (
        <div style={{ fontWeight: 600, color: '#1a1a1a' }}>
          {text}
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (text: string) => (
        <Tag color="blue" style={{ margin: 0 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (description: string) => (
        <Tooltip placement="topLeft" title={description}>
          <span style={{ 
            display: 'block', 
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: '#666'
          }}>
            {description}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '预算',
      dataIndex: 'maxBudget',
      key: 'maxBudget',
      width: 100,
      render: (value: number) => (
        <span style={{ color: '#52c41a', fontWeight: 500 }}>
          ${(value || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)} style={{ margin: 0 }}>
          {priority}
        </Tag>
      ),
    },
    {
      title: '技能等级',
      dataIndex: 'skillLevel',
      key: 'skillLevel',
      width: 90,
      render: (text: string) => (
        <Tag color="purple" style={{ margin: 0 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      fixed: 'right' as const,
      render: (status: string) => (
        <Tooltip 
          title={status === 'Failed' ? '点击重新匹配按钮可再次尝试匹配Agent' : ''}
          placement="top"
        >
          <Tag 
            color={getStatusColor(status)} 
            style={{ 
              margin: 0,
              padding: '4px 8px',
              borderRadius: '12px'
            }}
          >
            {status}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: '付款方式',
      dataIndex: 'paymentType',
      key: 'paymentType',
      width: 90,
      render: (text: string) => (
        <span style={{ color: '#666', fontSize: '12px' }}>{text}</span>
      ),
    },
    {
      title: '公开性',
      dataIndex: 'isPublic',
      key: 'isPublic',
      width: 70,
      render: (isPublic: boolean) => (
        <Tag 
          color={isPublic ? 'green' : 'orange'} 
          style={{ 
            margin: 0,
            fontSize: '11px'
          }}
        >
          {isPublic ? '公开' : '私有'}
        </Tag>
      ),
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 100,
      render: (deadline: string) => 
        deadline ? (
          <span style={{ color: '#666', fontSize: '12px' }}>
            {new Date(deadline).toLocaleDateString()}
          </span>
        ) : (
          <span style={{ color: '#ccc', fontSize: '12px' }}>无</span>
        ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: unknown, record: Job) => (
        <Space size="small" className="table-actions" style={{ gap: 8 }}>
          {record.status === 'Open' && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleTriggerMatch(record.id, false)}
              style={{ padding: '0 8px', fontSize: '12px' }}
            >
              匹配
            </Button>
          )}
          {record.status === 'Matched' && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleShowExecuteModal(record)}
              style={{ 
                padding: '0 8px', 
                fontSize: '12px',
                background: '#52c41a',
                borderColor: '#52c41a'
              }}
            >
              执行
            </Button>
          )}
          {record.status === 'Failed' && (
            <Popconfirm
              title="确定要重新匹配？"
              description="将重新搜索合适的Agent"
              onConfirm={() => handleTriggerMatch(record.id, true)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="primary"
                size="small"
                danger
                style={{ padding: '0 8px', fontSize: '12px' }}
              >
                重试
              </Button>
            </Popconfirm>
          )}
          {(record.status === 'Completed' || record.status === 'Failed') && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/jobs/${record.id}/result`)}
              style={{ padding: '0', fontSize: '12px' }}
            />
          )}
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/jobs/${record.id}/edit`)}
            style={{ padding: '0', fontSize: '12px' }}
          />
          <Popconfirm
            title="确定要删除？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              style={{ padding: '0', fontSize: '12px' }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ 
      padding: '24px',
      backgroundColor: '#f5f7fa',
      minHeight: '100vh'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        padding: '0 0 16px 0',
        borderBottom: '1px solid #e8e8e8'
      }}>
        <Title level={2} style={{ 
          margin: 0, 
          color: '#1a1a1a',
          fontWeight: 600
        }}>
          任务管理
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/jobs/new')}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '8px'
          }}
        >
          新增任务
        </Button>
      </div>

      <Card 
        style={{ 
          marginBottom: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
        styles={{ body: { padding: '20px' } }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
              搜索任务
            </div>
            <Search
              placeholder="输入任务标题搜索..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && handleSearch('')}
              style={{ borderRadius: '6px' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
              任务状态
            </div>
            <Select
              placeholder="选择状态"
              allowClear
              style={{ width: '100%', borderRadius: '6px' }}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <Select.Option value="Open">待匹配</Select.Option>
              <Select.Option value="Matching">匹配中</Select.Option>
              <Select.Option value="Matched">已匹配</Select.Option>
              <Select.Option value="In Progress">进行中</Select.Option>
              <Select.Option value="Completed">已完成</Select.Option>
              <Select.Option value="Failed">失败</Select.Option>
              <Select.Option value="Cancelled">已取消</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
              优先级
            </div>
            <Select
              placeholder="选择优先级"
              allowClear
              style={{ width: '100%', borderRadius: '6px' }}
              onChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
            >
              <Select.Option value="High">高</Select.Option>
              <Select.Option value="Medium">中</Select.Option>
              <Select.Option value="Low">低</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
              公开性
            </div>
            <Select
              placeholder="选择公开性"
              allowClear
              style={{ width: '100%', borderRadius: '6px' }}
              onChange={(value) => setFilters(prev => ({ ...prev, isPublic: value }))}
            >
              <Select.Option value={true}>公开</Select.Option>
              <Select.Option value={false}>私有</Select.Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Card 
        style={{ 
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={columns}
          dataSource={jobs}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            style: {
              padding: '16px',
              margin: 0
            }
          }}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
          className="rounded-table"
        />
      </Card>

      {/* 移除了状态轮询组件 */}

      {/* 匹配成功模态框 */}
      <MatchSuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        agent={matchedAgent}
        job={matchedJob}
        matchInfo={matchInfo}
      />

      {/* 执行任务模态框 */}
      <ExecuteJobModal
        visible={showExecuteModal}
        onClose={() => {
          setShowExecuteModal(false);
          setExecuteJobData(null);
        }}
        job={executeJobData?.job || null}
        agent={executeJobData?.agent || null}
        matchRecord={executeJobData?.matchRecord}
        onExecuteComplete={loadJobs}
      />
    </div>
  );
};

// 移除了状态轮询组件

export default JobsPage;
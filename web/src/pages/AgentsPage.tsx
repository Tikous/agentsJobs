import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  SearchOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Agent, PaginationParams } from '@/types';
import { agentsApi } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';

const { Title } = Typography;
const { Search } = Input;

const AgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<Partial<PaginationParams>>({});
  
  const debouncedSearchText = useDebounce(searchText, 300);

  const loadAgents = useCallback(async (params?: Partial<PaginationParams>) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: debouncedSearchText,
        ...filters,
        ...params,
      };
      
      const response = await agentsApi.getAll(queryParams);
      
      if (Array.isArray(response)) {
        setAgents(response);
        setPagination(prev => ({ ...prev, total: response.length }));
      } else {
        setAgents(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.total || 0,
          current: response.page || 1,
        }));
      }
    } catch (error) {
      message.error('加载智能体列表失败');
      console.error('Load agents error:', error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, debouncedSearchText, filters]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await agentsApi.delete(id);
      message.success('删除成功');
      loadAgents();
    } catch (error) {
      message.error('删除失败');
      console.error('Delete agent error:', error);
    }
  }, [loadAgents]);

  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  const handleTableChange = useCallback((paginationConfig: { current?: number; pageSize?: number }) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current || prev.current,
      pageSize: paginationConfig.pageSize || prev.pageSize,
    }));
  }, []);

  const columns = useMemo(() => [
    {
      title: '智能体名称',
      dataIndex: 'agentName',
      key: 'agentName',
      width: 180,
      fixed: 'left' as const,
      render: (text: string) => (
        <div style={{ fontWeight: 600, color: '#1a1a1a' }}>
          {text}
        </div>
      ),
      sorter: (a: Agent, b: Agent) => a.agentName.localeCompare(b.agentName),
    },
    {
      title: '分类',
      dataIndex: 'agentClassification',
      key: 'agentClassification',
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
      title: '声誉',
      dataIndex: 'reputation',
      key: 'reputation',
      width: 80,
      render: (value: number) => (
        <span style={{ 
          color: '#52c41a', 
          fontWeight: 500,
          fontSize: '14px'
        }}>
          {(value || 0).toFixed(1)}
        </span>
      ),
      sorter: true,
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      width: 90,
      render: (value: number) => (
        <span style={{ 
          color: '#1890ff', 
          fontWeight: 500,
          fontSize: '14px'
        }}>
          {((value || 0) * 100).toFixed(1)}%
        </span>
      ),
      sorter: true,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (value: number) => (
        <span style={{ 
          color: '#fa8c16', 
          fontWeight: 500,
          fontSize: '14px'
        }}>
          ${(value || 0).toFixed(2)}
        </span>
      ),
      sorter: true,
    },
    {
      title: '完成任务',
      dataIndex: 'totalJobsCompleted',
      key: 'totalJobsCompleted',
      width: 90,
      render: (value: number) => (
        <span style={{ 
          color: '#722ed1', 
          fontWeight: 500,
          fontSize: '14px'
        }}>
          {value}
        </span>
      ),
      sorter: true,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Tag 
          color={isActive ? 'green' : 'red'} 
          style={{ 
            margin: 0,
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px'
          }}
        >
          {isActive ? '活跃' : '非活跃'}
        </Tag>
      ),
    },
    {
      title: '隐私',
      dataIndex: 'isPrivate',
      key: 'isPrivate',
      width: 70,
      render: (isPrivate: boolean) => (
        <Tag 
          color={isPrivate ? 'orange' : 'blue'} 
          style={{ 
            margin: 0,
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px'
          }}
        >
          {isPrivate ? '私有' : '公开'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: unknown, record: Agent) => (
        <Space size="small" className="table-actions" style={{ gap: 8 }}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/agents/${record.id}/edit`)}
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
  ], [navigate, handleDelete]);

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
          智能体管理
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/agents/new')}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '8px'
          }}
        >
          新增智能体
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
              搜索智能体
            </div>
            <Search
              placeholder="输入智能体名称搜索..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && handleSearch('')}
              style={{ borderRadius: '6px' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
              状态
            </div>
            <Select
              placeholder="选择状态"
              allowClear
              style={{ width: '100%', borderRadius: '6px' }}
              onChange={(value) => setFilters(prev => ({ ...prev, isActive: value }))}
            >
              <Select.Option value={true}>活跃</Select.Option>
              <Select.Option value={false}>非活跃</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
              隐私设置
            </div>
            <Select
              placeholder="选择隐私设置"
              allowClear
              style={{ width: '100%', borderRadius: '6px' }}
              onChange={(value) => setFilters(prev => ({ ...prev, isPrivate: value }))}
            >
              <Select.Option value={false}>公开</Select.Option>
              <Select.Option value={true}>私有</Select.Option>
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
          dataSource={agents}
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
    </div>
  );
};

export default AgentsPage;
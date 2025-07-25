import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Typography, 
  Button, 
  Space, 
  Tag, 
  Divider, 
  Alert,
  Spin
} from 'antd';
import { 
  ArrowLeftOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { Job } from '@/types';
import { jobsApi } from '@/services/api';

const { Title, Paragraph, Text } = Typography;

const JobResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  const loadJob = async (jobId: string) => {
    try {
      setLoading(true);
      const jobData = await jobsApi.getById(jobId);
      setJob(jobData);
    } catch (error) {
      console.error('加载任务详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadJob(id);
    }
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Failed': return 'error';
      case 'In Progress': return 'processing';
      case 'Matching': return 'warning';
      case 'Matched': return 'cyan';
      case 'Open': return 'blue';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircleOutlined />;
      case 'Failed': return <CloseCircleOutlined />;
      case 'In Progress': return <ClockCircleOutlined />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="page-container">
        <Alert
          message="任务不存在"
          description="未找到指定的任务"
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/jobs')}
          >
            返回任务列表
          </Button>
          <Title level={2} className="page-title">
            任务执行结果
          </Title>
        </Space>
      </div>

      <div className="form-container">
        {/* 任务基本信息 */}
        <Card title="任务信息" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <Title level={4}>{job.jobTitle || '无标题'}</Title>
              <Paragraph type="secondary">{job.description || '暂无描述'}</Paragraph>
              
              <Space wrap>
                <Text strong>状态:</Text>
                <Tag 
                  color={getStatusColor(job.status)} 
                  icon={getStatusIcon(job.status)}
                >
                  {job.status === 'Completed' ? '执行完成' :
                   job.status === 'Failed' ? '执行失败' :
                   job.status === 'In Progress' ? '执行中' :
                   job.status === 'Matching' ? '匹配中' :
                   job.status === 'Matched' ? '已匹配' :
                   job.status === 'Open' ? '开放中' : job.status}
                </Tag>
              </Space>

              <div style={{ marginTop: '16px' }}>
                <Text strong>分类:</Text> <Tag>{job.category || '未分类'}</Tag>
                <Text strong style={{ marginLeft: '16px' }}>优先级:</Text> <Tag>{job.priority || '普通'}</Tag>
                <Text strong style={{ marginLeft: '16px' }}>技能要求:</Text> <Tag>{job.skillLevel || '未设定'}</Tag>
              </div>

              <div style={{ marginTop: '8px' }}>
                <Text strong>标签:</Text> {job.tags || '无'}
              </div>

              {job.executedAt && (
                <div style={{ marginTop: '8px' }}>
                  <Text strong>执行时间:</Text> {new Date(job.executedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* 执行结果 */}
        {job.executionResult && (
          <Card title="执行结果" style={{ marginBottom: '16px' }}>
            {(() => {
              // 检查executionResult是否是多agent结果的格式
              if (typeof job.executionResult === 'object' && job.executionResult !== null) {
                const agentResults = Object.values(job.executionResult);
                
                // 如果是多agent结果格式
                if (agentResults.length > 0 && agentResults[0] && typeof agentResults[0] === 'object' && 'agentId' in agentResults[0]) {
                  return (
                    <div>
                      {agentResults.map((agentResult: any, index: number) => (
                        <Card 
                          key={agentResult.agentId || index}
                          size="small" 
                          style={{ marginBottom: '12px' }}
                          title={
                            <Space>
                              <Text strong>Agent: {agentResult.agentName || agentResult.agentId}</Text>
                              <Tag color={agentResult.status === 'Completed' ? 'success' : 'error'}>
                                {agentResult.status === 'Completed' ? '执行成功' : '执行失败'}
                              </Tag>
                              {agentResult.executedAt && (
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  {new Date(agentResult.executedAt).toLocaleString()}
                                </Text>
                              )}
                            </Space>
                          }
                        >
                          {agentResult.error ? (
                            <Alert
                              message={agentResult.error}
                              type="error"
                              size="small"
                              showIcon
                            />
                          ) : agentResult.result ? (
                            <div style={{ 
                              background: '#f5f5f5', 
                              padding: '12px', 
                              borderRadius: '6px',
                              maxHeight: '300px',
                              overflow: 'auto'
                            }}>
                              <ReactMarkdown>
                                {typeof agentResult.result === 'string' 
                                  ? agentResult.result 
                                  : JSON.stringify(agentResult.result, null, 2)
                                }
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <Text type="secondary">暂无执行结果</Text>
                          )}
                        </Card>
                      ))}
                    </div>
                  );
                }
              }
              
              // 兼容旧格式的单一执行结果
              return (
                <div style={{ 
                  background: '#fafafa', 
                  padding: '16px', 
                  borderRadius: '6px',
                  maxHeight: '600px',
                  overflow: 'auto'
                }}>
                  <ReactMarkdown>
                    {typeof job.executionResult === 'string' 
                      ? job.executionResult 
                      : JSON.stringify(job.executionResult, null, 2)
                    }
                  </ReactMarkdown>
                </div>
              );
            })()}
          </Card>
        )}

        {/* 执行错误 */}
        {job.status === 'Failed' && job.executionError && (
          <Card title="执行错误" style={{ marginBottom: '16px' }}>
            <Alert
              message="任务执行失败"
              description={job.executionError || '未知错误'}
              type="error"
              showIcon
            />
          </Card>
        )}

        {/* 任务详情 */}
        <Card title="任务详情">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <Text strong>交付物要求:</Text>
              <Paragraph style={{ marginTop: '8px' }}>{job.deliverables || '暂无要求'}</Paragraph>
            </div>
            
            <div>
              <Text strong>预算信息:</Text>
              <div style={{ marginTop: '8px' }}>
                <div>最大预算: ${(job.maxBudget || 0).toLocaleString()}</div>
                <div>付款方式: {job.paymentType || '未设定'}</div>
                {job.deadline && <div>截止时间: {new Date(job.deadline).toLocaleDateString()}</div>}
              </div>
            </div>
          </div>

          <Divider />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <Text strong>设置选项:</Text>
              <div style={{ marginTop: '8px' }}>
                <div>自动分配: {job.autoAssign ? '是' : '否'}</div>
                <div>允许竞标: {job.allowBidding ? '是' : '否'}</div>
                <div>启用托管: {job.escrowEnabled ? '是' : '否'}</div>
                <div>公开任务: {job.isPublic ? '是' : '否'}</div>
              </div>
            </div>
            
            <div>
              <Text strong>时间信息:</Text>
              <div style={{ marginTop: '8px' }}>
                <div>创建时间: {new Date(job.createdAt).toLocaleString()}</div>
                <div>更新时间: {new Date(job.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default JobResultPage;
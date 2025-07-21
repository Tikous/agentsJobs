import React from 'react';
import { Modal, Typography, Card, Tag, Space, Divider, Button } from 'antd';
import { CheckCircleOutlined, UserOutlined, DollarOutlined, TagsOutlined } from '@ant-design/icons';
import { Agent, Job } from '@/types';

const { Title, Text, Paragraph } = Typography;

interface MatchSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  agent: Agent | null;
  job: Job | null;
  matchInfo?: {
    matchScore: number;
    categoryMatch: boolean;
    budgetCompatible: boolean;
  };
}

const MatchSuccessModal: React.FC<MatchSuccessModalProps> = ({
  visible,
  onClose,
  agent,
  job,
  matchInfo
}) => {
  if (!agent || !job) return null;

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      style={{ top: 20 }}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <CheckCircleOutlined 
          style={{ 
            fontSize: '48px', 
            color: '#52c41a',
            marginBottom: '16px'
          }} 
        />
        <Title level={2} style={{ margin: 0, color: '#52c41a' }}>
          匹配成功！
        </Title>
        <Text type="secondary">
          已为您的任务找到合适的Agent
        </Text>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Card 
          title={
            <Space>
              <UserOutlined />
              <span>匹配的Agent</span>
            </Space>
          }
          size="small"
          style={{ marginBottom: '16px' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={4} style={{ margin: 0 }}>
                {agent.agentName}
              </Title>
              <Tag color="blue">{agent.agentClassification}</Tag>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <DollarOutlined style={{ color: '#fa8c16' }} />
                <Text strong style={{ color: '#fa8c16' }}>
                  ${(agent.price || 0).toFixed(2)}
                </Text>
              </Space>
              <Space>
                <Text type="secondary">声誉:</Text>
                <Text strong style={{ color: '#52c41a' }}>
                  {(agent.reputation || 0).toFixed(1)}/5.0
                </Text>
              </Space>
              <Space>
                <Text type="secondary">成功率:</Text>
                <Text strong style={{ color: '#1890ff' }}>
                  {((agent.successRate || 0) * 100).toFixed(1)}%
                </Text>
              </Space>
            </div>

            <div>
              <Text type="secondary">描述: </Text>
              <Paragraph ellipsis={{ rows: 2, expandable: true }}>
                {agent.description}
              </Paragraph>
            </div>

            <div>
              <Space>
                <TagsOutlined style={{ color: '#722ed1' }} />
                <Text type="secondary">标签:</Text>
              </Space>
              <div style={{ marginTop: '8px' }}>
                {agent.tags.split(',').map((tag, index) => (
                  <Tag key={index} color="purple" style={{ marginBottom: '4px' }}>
                    {tag.trim()}
                  </Tag>
                ))}
              </div>
            </div>
          </Space>
        </Card>

        <Card 
          title="任务描述"
          size="small"
          style={{ marginBottom: '16px' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Title level={4} style={{ margin: 0, marginBottom: '8px' }}>
                {job.jobTitle}
              </Title>
              <Tag color="geekblue">{job.category}</Tag>
              <Tag color="orange">{job.priority}</Tag>
            </div>
            
            <div>
              <Text type="secondary">预算: </Text>
              <Text strong style={{ color: '#52c41a' }}>
                ${(job.maxBudget || 0).toLocaleString()}
              </Text>
            </div>

            <div>
              <Text type="secondary">任务描述: </Text>
              <Paragraph ellipsis={{ rows: 3, expandable: true }}>
                {job.description}
              </Paragraph>
            </div>

            <div>
              <Text type="secondary">交付物: </Text>
              <Paragraph ellipsis={{ rows: 2, expandable: true }}>
                {job.deliverables}
              </Paragraph>
            </div>
          </Space>
        </Card>

        {matchInfo && (
          <Card title="匹配详情" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>标签匹配度:</Text>
                <Text strong style={{ color: '#1890ff' }}>
                  {((matchInfo?.matchScore || 0) * 100).toFixed(1)}%
                </Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>分类匹配:</Text>
                <Tag color={matchInfo.categoryMatch ? 'green' : 'red'}>
                  {matchInfo.categoryMatch ? '匹配' : '不匹配'}
                </Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>预算兼容:</Text>
                <Tag color={matchInfo.budgetCompatible ? 'green' : 'red'}>
                  {matchInfo.budgetCompatible ? '兼容' : '超预算'}
                </Tag>
              </div>
            </Space>
          </Card>
        )}
      </div>

      <Divider />

      <div style={{ textAlign: 'center' }}>
        <Space size="large">
          <Button size="large" onClick={onClose}>
            关闭
          </Button>
          <Button 
            type="primary" 
            size="large"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
            onClick={onClose}
          >
            查看执行进度
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default MatchSuccessModal;
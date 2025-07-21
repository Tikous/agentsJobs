import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  InputNumber, 
  Switch, 
  Button, 
  Card, 
  Typography, 
  message, 
  Row, 
  Col,
  Select,
  Space
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { CreateAgentDto, UpdateAgentDto } from '@/types';
import { agentsApi } from '@/services/api';
import { AGENT_CLASSIFICATIONS } from '@/constants/categories';

const { Title } = Typography;
const { TextArea } = Input;

const AgentFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  const loadAgent = async (agentId: string) => {
    setInitialLoading(true);
    try {
      const agent = await agentsApi.getById(agentId);
      form.setFieldsValue(agent);
    } catch (error) {
      message.error('加载智能体信息失败');
      console.error('Load agent error:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (isEdit && id) {
      loadAgent(id);
    }
  }, [isEdit, id]);

  const handleSubmit = async (values: CreateAgentDto | UpdateAgentDto) => {
    setLoading(true);
    try {
      // Remove empty walletAddress to avoid validation issues
      const submitData = { ...values };
      if (submitData.walletAddress === '') {
        delete submitData.walletAddress;
      }
      
      if (isEdit && id) {
        await agentsApi.update(id, submitData as UpdateAgentDto);
        message.success('更新成功');
      } else {
        await agentsApi.create(submitData as CreateAgentDto);
        message.success('创建成功');
      }
      navigate('/agents');
    } catch (error) {
      message.error(isEdit ? '更新失败' : '创建失败');
      console.error('Submit agent error:', error);
    } finally {
      setLoading(false);
    }
  };

  const contractTypeOptions = [
    'Standard',
    'Premium',
    'Enterprise',
    'Custom'
  ];

  const classificationOptions = AGENT_CLASSIFICATIONS;

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
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/agents')}
            style={{ borderRadius: '6px' }}
          >
            返回
          </Button>
          <Title level={2} style={{ 
            margin: 0, 
            color: '#1a1a1a',
            fontWeight: 600
          }}>
            {isEdit ? '编辑智能体' : '创建智能体'}
          </Title>
        </Space>
      </div>

      <Card 
        loading={initialLoading}
        style={{ 
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
        styles={{ body: { padding: '32px' } }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            isPrivate: false,
            autoAcceptJobs: true,
            isActive: true,
            reputation: 0,
            successRate: 0,
            totalJobsCompleted: 0,
            price: 0,
            contractType: 'Standard',
            agentClassification: 'AI/ML',
            tags: '',
            authorBio: '',
            walletAddress: ''
          }}
        >
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>智能体名称</span>
                name="agentName"
                rules={[
                  { required: true, message: '请输入智能体名称' },
                  { min: 2, max: 100, message: '名称长度应在2-100字符之间' }
                ]}
              >
                <Input 
                  placeholder="请输入智能体名称"
                  size="large"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>智能体地址</span>
                name="agentAddress"
                rules={[
                  { required: true, message: '请输入智能体地址' }
                ]}
              >
                <Input 
                  placeholder="请输入智能体URL地址" 
                  size="large"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>智能体分类</span>
                name="agentClassification"
                rules={[{ required: true, message: '请选择智能体分类' }]}
              >
                <Select 
                  placeholder="请选择分类"
                  size="large"
                  style={{ borderRadius: '8px' }}
                >
                  {classificationOptions.map(type => (
                    <Select.Option key={type} value={type}>{type}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>合约类型</span>
                name="contractType"
                rules={[{ required: true, message: '请选择合约类型' }]}
              >
                <Select 
                  placeholder="请选择合约类型"
                  size="large"
                  style={{ borderRadius: '8px' }}
                >
                  {contractTypeOptions.map(type => (
                    <Select.Option key={type} value={type}>{type}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>描述</span>
                name="description"
                rules={[
                  { required: true, message: '请输入描述' },
                  { max: 1000, message: '描述不能超过1000字符' }
                ]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="请输入智能体的详细描述"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>作者简介</span>
                name="authorBio"
                rules={[
                  { required: true, message: '请输入作者简介' },
                  { max: 500, message: '作者简介不能超过500字符' }
                ]}
              >
                <TextArea 
                  rows={3} 
                  placeholder="请输入作者简介"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>标签</span>
                name="tags"
                rules={[
                  { required: true, message: '请输入标签' },
                  { max: 200, message: '标签不能超过200字符' }
                ]}
              >
                <Input 
                  placeholder="请输入标签，用逗号分隔"
                  size="large"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>单次任务价格</span>
                name="price"
                rules={[
                  { required: true, message: '请输入价格' },
                  { type: 'number', min: 0, message: '价格不能为负数' }
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  addonAfter="USD"
                  style={{ 
                    width: '100%',
                    borderRadius: '8px',
                    height: '40px'
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>钱包地址</span>
                name="walletAddress"
              >
                <Input 
                  placeholder="钱包地址 (可选)" 
                  size="large"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>声誉</span>
                name="reputation"
                rules={[
                  { type: 'number', min: 0, max: 5, message: '声誉应在0-5之间' }
                ]}
              >
                <InputNumber
                  min={0}
                  max={5}
                  step={0.1}
                  placeholder="0.0"
                  style={{ 
                    width: '100%',
                    borderRadius: '8px',
                    height: '40px'
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>成功率</span>
                name="successRate"
                rules={[
                  { type: 'number', min: 0, max: 1, message: '成功率应在0-1之间' }
                ]}
              >
                <InputNumber
                  min={0}
                  max={1}
                  step={0.01}
                  placeholder="0.00"
                  style={{ 
                    width: '100%',
                    borderRadius: '8px',
                    height: '40px'
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>完成任务数</span>
                name="totalJobsCompleted"
                rules={[
                  { type: 'number', min: 0, message: '完成任务数不能为负数' }
                ]}
              >
                <InputNumber
                  min={0}
                  placeholder="0"
                  style={{ 
                    width: '100%',
                    borderRadius: '8px',
                    height: '40px'
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>是否私有</span>
                    name="isPrivate"
                    valuePropName="checked"
                  >
                    <Switch 
                      checkedChildren="私有" 
                      unCheckedChildren="公开"
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item
                    label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>自动接受任务</span>
                    name="autoAcceptJobs"
                    valuePropName="checked"
                  >
                    <Switch 
                      checkedChildren="开启" 
                      unCheckedChildren="关闭"
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item
                    label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>是否激活</span>
                    name="isActive"
                    valuePropName="checked"
                  >
                    <Switch 
                      checkedChildren="激活" 
                      unCheckedChildren="停用"
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: '40px', textAlign: 'center' }}>
            <Space size="large">
              <Button 
                onClick={() => navigate('/agents')}
                size="large"
                style={{ 
                  borderRadius: '8px',
                  padding: '0 24px'
                }}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SaveOutlined />}
                size="large"
                style={{ 
                  borderRadius: '8px',
                  padding: '0 32px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                {isEdit ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AgentFormPage;
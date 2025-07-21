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
  Space,
  DatePicker,
  Alert,
  Spin
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined, SaveOutlined, WalletOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { CreateJobDto, UpdateJobDto } from '@/types';
import { jobsApi, queueApi } from '@/services/api';
import { JOB_CATEGORIES } from '@/constants/categories';
import WalletConnection from '@/components/WalletConnection';
import { web3Service } from '@/services/web3';

const { Title } = Typography;
const { TextArea } = Input;

const JobFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [escrowLoading, setEscrowLoading] = useState(false);

  const loadJob = async (jobId: string) => {
    setInitialLoading(true);
    try {
      const job = await jobsApi.getById(jobId);
      const formData = {
        ...job,
        deadline: job.deadline ? dayjs(job.deadline) : undefined,
      };
      form.setFieldsValue(formData);
    } catch (error) {
      message.error('加载任务信息失败');
      console.error('Load job error:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (isEdit && id) {
      loadJob(id);
    }
  }, [isEdit, id]);

  // 钱包连接回调
  const handleWalletConnect = (address: string, balance: string) => {
    setWalletConnected(true);
    setWalletAddress(address);
    setWalletBalance(balance);
    
    // 自动填入钱包地址
    form.setFieldValue('walletAddress', address);
  };

  const handleWalletDisconnect = () => {
    setWalletConnected(false);
    setWalletAddress('');
    setWalletBalance('0');
    form.setFieldValue('walletAddress', '');
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      // 如果是新创建Job，需要验证钱包和预算
      if (!isEdit) {
        if (!walletConnected) {
          message.error('请先连接钱包');
          setLoading(false);
          return;
        }

        const maxBudget = values.maxBudget as number;
        if (!maxBudget || maxBudget <= 0) {
          message.error('请设置有效的预算金额');
          setLoading(false);
          return;
        }

        // 检查钱包余额是否足够 (简单检查是否有余额，具体金额由合约内部转换)
        const currentBalance = await web3Service.getBalance();
        if (parseFloat(currentBalance) <= 0) {
          message.error('钱包余额不足');
          setLoading(false);
          return;
        }
      }

      const submitData = {
        ...values,
        deadline: values.deadline && typeof values.deadline === 'object' && 'toISOString' in values.deadline 
          ? (values.deadline as { toISOString(): string }).toISOString() 
          : values.deadline,
        walletAddress: walletAddress || values.walletAddress,
      };

      // Handle budget field - only include if it's provided as a string
      if (values.budget && typeof values.budget === 'string' && values.budget.trim()) {
        try {
          submitData.budget = JSON.parse(values.budget);
        } catch (error) {
          // If JSON parsing fails, create a simple budget object
          submitData.budget = { currency: 'USD', amount: values.maxBudget };
        }
      }

      if (isEdit && id) {
        await jobsApi.update(id, submitData as UpdateJobDto);
        message.success('更新成功');
      } else {
        const createdJob = await jobsApi.create(submitData as CreateJobDto);
        message.success('任务创建成功');
        
        // 执行资金质押
        try {
          setEscrowLoading(true);
          message.loading('正在质押资金到合约...', 3);
          
          // 调用新的质押方法，传入前端JobId用于映射
          const result = await web3Service.stakeAndPostJob(createdJob.id);
          console.log('资金质押成功，交易哈希:', result.txHash, '合约JobId:', result.jobId);
          
          // 合约JobId已通过localStorage自动保存映射关系
          console.log('合约JobId已保存到localStorage映射:', result.jobId);
          
          message.success('资金质押成功！');
          
          // 自动触发匹配流程
          try {
            message.loading('正在匹配Agent...', 2);
            await queueApi.matchJob(createdJob.id);
            message.success('已触发自动匹配，请稍后查看执行结果');
          } catch (error) {
            console.error('触发匹配失败:', error);
            message.warning('任务创建成功，但自动匹配失败，请手动触发');
          }
        } catch (error) {
          console.error('资金质押失败:', error);
          message.error('资金质押失败: ' + (error instanceof Error ? error.message : '未知错误'));
          // 即使质押失败，也允许继续，用户可以后续手动处理
        } finally {
          setEscrowLoading(false);
        }
      }
      navigate('/jobs');
    } catch (error) {
      message.error(isEdit ? '更新失败' : '创建失败');
      console.error('Submit job error:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = JOB_CATEGORIES;

  const paymentTypeOptions = [
    'Fixed',
    'Hourly',
    'Milestone',
    'Commission'
  ];

  const priorityOptions = [
    'Low',
    'Medium', 
    'High',
    'Urgent'
  ];

  const skillLevelOptions = [
    'Beginner',
    'Intermediate',
    'Advanced',
    'Expert'
  ];

  const statusOptions = [
    'Open',
    'Matching',
    'Matched', 
    'In Progress',
    'Completed',
    'Cancelled',
    'Failed'
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
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/jobs')}
            style={{ borderRadius: '6px' }}
          >
            返回
          </Button>
          <Title level={2} style={{ 
            margin: 0, 
            color: '#1a1a1a',
            fontWeight: 600
          }}>
            {isEdit ? '编辑任务' : '创建任务'}
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
        {/* 钱包连接 - 仅在创建新任务时显示 */}
        {!isEdit && (
          <>
            <WalletConnection 
              onWalletConnect={handleWalletConnect}
              onWalletDisconnect={handleWalletDisconnect}
            />
            
            {!walletConnected && (
              <Alert
                message="连接钱包后才能创建任务"
                description="创建任务需要连接钱包来处理资金托管，请先连接您的MetaMask钱包。"
                type="warning"
                style={{ marginBottom: '16px' }}
                showIcon
              />
            )}
            
            {walletConnected && (
              <Alert
                message="钱包已连接"
                description={`钱包地址: ${walletAddress} | 余额: ${parseFloat(walletBalance).toFixed(4)} ETH`}
                type="success"
                style={{ marginBottom: '16px' }}
                showIcon
              />
            )}
          </>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            autoAssign: false,
            allowBidding: true,
            escrowEnabled: true,
            isPublic: true,
            status: 'Open',
            priority: 'Medium',
            paymentType: 'Fixed',
            skillLevel: 'Intermediate',
            maxBudget: 0,
            tags: '',
            walletAddress: ''
          }}
        >
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>任务标题</span>
                name="jobTitle"
                rules={[
                  { required: true, message: '请输入任务标题' },
                  { min: 2, max: 200, message: '标题长度应在2-200字符之间' }
                ]}
              >
                <Input 
                  placeholder="请输入任务标题"
                  size="large"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>任务分类</span>
                name="category"
                rules={[{ required: true, message: '请选择任务分类' }]}
              >
                <Select 
                  placeholder="请选择分类"
                  size="large"
                  style={{ borderRadius: '8px' }}
                >
                  {categoryOptions.map(category => (
                    <Select.Option key={category} value={category}>{category}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>任务描述</span>
                name="description"
                rules={[
                  { required: true, message: '请输入任务描述' },
                  { max: 2000, message: '描述不能超过2000字符' }
                ]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="请详细描述任务需求和要求"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>交付物</span>
                name="deliverables"
                rules={[
                  { required: true, message: '请输入交付物描述' },
                  { max: 1000, message: '交付物描述不能超过1000字符' }
                ]}
              >
                <TextArea 
                  rows={3} 
                  placeholder="请描述任务完成后的交付物"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>最大预算</span>
                name="maxBudget"
                rules={[
                  { required: true, message: '请输入最大预算' },
                  { type: 'number', min: 0, message: '预算不能为负数' }
                ]}
              >
                <InputNumber
                  min={0}
                  step={10}
                  placeholder="0"
                  size="large"
                  style={{ 
                    width: '100%',
                    borderRadius: '8px'
                  }}
                  addonBefore="$"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>付款方式</span>
                name="paymentType"
                rules={[{ required: true, message: '请选择付款方式' }]}
              >
                <Select 
                  placeholder="请选择付款方式"
                  size="large"
                  style={{ borderRadius: '8px' }}
                >
                  {paymentTypeOptions.map(type => (
                    <Select.Option key={type} value={type}>{type}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>截止时间</span>
                name="deadline"
              >
                <DatePicker 
                  style={{ 
                    width: '100%',
                    borderRadius: '8px',
                    height: '40px'
                  }}
                  placeholder="选择截止时间"
                  showTime
                  size="large"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>优先级</span>
                name="priority"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select 
                  placeholder="请选择优先级"
                  size="large"
                  style={{ borderRadius: '8px' }}
                >
                  {priorityOptions.map(priority => (
                    <Select.Option key={priority} value={priority}>{priority}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>技能等级</span>
                name="skillLevel"
                rules={[{ required: true, message: '请选择技能等级' }]}
              >
                <Select 
                  placeholder="请选择技能等级"
                  size="large"
                  style={{ borderRadius: '8px' }}
                >
                  {skillLevelOptions.map(level => (
                    <Select.Option key={level} value={level}>{level}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>任务状态</span>
                name="status"
                rules={[{ required: true, message: '请选择任务状态' }]}
              >
                <Select 
                  placeholder="请选择状态"
                  size="large"
                  style={{ borderRadius: '8px' }}
                >
                  {statusOptions.map(status => (
                    <Select.Option key={status} value={status}>{status}</Select.Option>
                  ))}
                </Select>
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

            <Col xs={24}>
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

            <Col xs={24}>
              <Form.Item
                label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>预算详情 (JSON格式)</span>
                name="budget"
              >
                <TextArea 
                  rows={2} 
                  placeholder='{"currency": "USD", "amount": 1000, "breakdown": "开发费用"}'
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={6}>
                  <Form.Item
                    label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>自动分配</span>
                    name="autoAssign"
                    valuePropName="checked"
                  >
                    <Switch 
                      checkedChildren="开启" 
                      unCheckedChildren="关闭"
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={6}>
                  <Form.Item
                    label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>允许竞标</span>
                    name="allowBidding"
                    valuePropName="checked"
                  >
                    <Switch 
                      checkedChildren="允许" 
                      unCheckedChildren="禁止"
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={6}>
                  <Form.Item
                    label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>启用托管</span>
                    name="escrowEnabled"
                    valuePropName="checked"
                  >
                    <Switch 
                      checkedChildren="启用" 
                      unCheckedChildren="禁用"
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={6}>
                  <Form.Item
                    label=<span style={{ fontWeight: 500, color: '#1a1a1a' }}>公开任务</span>
                    name="isPublic"
                    valuePropName="checked"
                  >
                    <Switch 
                      checkedChildren="公开" 
                      unCheckedChildren="私有"
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
                onClick={() => navigate('/jobs')}
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
                loading={loading || escrowLoading}
                disabled={!isEdit && !walletConnected}
                icon={escrowLoading ? <WalletOutlined /> : <SaveOutlined />}
                size="large"
                style={{ 
                  borderRadius: '8px',
                  padding: '0 32px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                {escrowLoading ? '质押资金中...' : (loading ? (isEdit ? '更新中...' : '创建中...') : (isEdit ? '更新' : '创建任务'))}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default JobFormPage;
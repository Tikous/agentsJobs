import React, { useState, useEffect, useRef } from 'react';
import { Modal, Typography, Card, Tag, Space, Divider, Button, message, Descriptions, Alert, Spin, List } from 'antd';
import { PlayCircleOutlined, UserOutlined, FileTextOutlined, CheckCircleOutlined, ExclamationCircleOutlined, WalletOutlined, TrophyOutlined } from '@ant-design/icons';
import { Agent, Job } from '@/types';
import { queueApi } from '@/services/api';
import { web3Service } from '@/services/web3';
import * as d3 from 'd3';

const { Title, Text, Paragraph } = Typography;

interface ChartNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'job' | 'agent';
  status?: string;
  isWinner?: boolean;
  group: number;
}

interface ChartLink {
  source: string;
  target: string;
}

interface AgentExecutionResult {
  jobId: string;
  jobTitle: string;
  status: 'Completed' | 'Failed';
  executionResult: any;
  executedAt: string;
  executionError: string | null;
  hasResult: boolean;
  agentId: string;
  paymentInfo?: {
    agentPayment: string;
    agentAddress: string;
    paymentTx: string;
    refundTx: string;
    paymentProcessedAt: string;
  };
  paymentError?: string;
}

interface ExtendedAgent extends Agent {
  executionResult?: {
    agentId: string;
    agentName: string;
    agentAddress: string;
    status: 'Completed' | 'Failed';
    result: any;
    executedAt: string;
    error: string | null;
  };
  matchScore?: number;
  rank?: number;
  isWinner?: boolean;
  status?: string;
}

interface ExecuteJobModalProps {
  visible: boolean;
  onClose: () => void;
  job: Job | null;
  agent: Agent | null;
  matchRecord?: {id: string, jobId: string, assignedAgentId: string, createdAt: string, matchCriteria: any};
  onExecute?: () => Promise<void>;
  onExecuteComplete?: () => void;
}

const ExecuteJobModal: React.FC<ExecuteJobModalProps> = ({
  visible,
  onClose,
  job,
  agent,
  matchRecord,
  onExecuteComplete
}) => {
  const [executingAgents, setExecutingAgents] = useState<Set<string>>(new Set()); // 记录正在执行的agent ids
  const [retryingAgents, setRetryingAgents] = useState<Map<string, number>>(new Map()); // 记录正在重试的agent和重试次数
  const [agentResults, setAgentResults] = useState<Map<string, AgentExecutionResult>>(new Map()); // 存储每个agent的执行结果
  const [loadingResult, setLoadingResult] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null); // 用户选择的获胜agent
  const [autoExecutionStarted, setAutoExecutionStarted] = useState(false); // 是否已开始自动执行
  const [agents, setAgents] = useState<ExtendedAgent[]>([]);
  const [jobMatchDetails, setJobMatchDetails] = useState<{job: Job, agents: ExtendedAgent[], matchRecords: any[]} | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // 获取job匹配详情和执行结果
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!visible || !job) {
        return;
      }

      try {
        setLoadingResult(true);
        
        // 获取匹配详情（包含多个agents）
        const matchDetails = await queueApi.getMatchDetails(job.id);
        setJobMatchDetails(matchDetails);
        const matchedAgents: ExtendedAgent[] = matchDetails.agents || [matchDetails.agent].filter(Boolean);
        setAgents(matchedAgents);
        
        // 从后端返回的agents数据中恢复已存储的执行结果
        const resultMap = new Map();
        matchedAgents.forEach((agent: ExtendedAgent) => {
          if (agent.executionResult) {
            // 将数据库中的执行结果转换为前端期望的格式
            const frontendResult = {
              jobId: job.id,
              jobTitle: job.jobTitle,
              status: agent.executionResult.status,
              executionResult: agent.executionResult.result,
              executedAt: agent.executionResult.executedAt,
              executionError: agent.executionResult.error,
              hasResult: agent.executionResult.status === 'Completed',
              agentId: agent.id
            };
            resultMap.set(agent.id, frontendResult);
          }
        });
        
        // 始终恢复已存储的执行结果（不管job状态如何）
        setAgentResults(resultMap);
        
        // 检查是否需要自动执行agents
        if ((job.status === 'Matched' || job.status === 'In Progress') && !autoExecutionStarted) {
          // 过滤掉已经有执行结果的agents，避免重复执行
          const agentsToExecute = matchedAgents.filter(agent => !agent.executionResult);
          
          if (agentsToExecute.length > 0) {
            setAutoExecutionStarted(true);
            executeAllAgents(agentsToExecute);
          } else {
            // 所有agents都已经执行完成，只是标记已开始自动执行以防重复
            setAutoExecutionStarted(true);
          }
        }
      } catch (error) {
        console.error('获取job详情失败:', error);
        // 如果获取失败，使用传入的agent作为fallback
        if (agent) {
          setAgents([agent]);
        }
      } finally {
        setLoadingResult(false);
      }
    };

    fetchJobDetails();
  }, [visible, job, agent]);  // Remove autoExecutionStarted from dependencies to avoid infinite loop

  // 自动执行所有agents
  const executeAllAgents = async (agentsToExecute: ExtendedAgent[]) => {
    if (!job || !agentsToExecute.length) return;
    
    console.log('开始自动执行所有agents:', agentsToExecute.map(a => a.id));
    
    // 并行执行所有agents
    const executionPromises = agentsToExecute.map(agent => executeAgent(agent));
    
    try {
      await Promise.allSettled(executionPromises);
      console.log('所有agents执行完成');
    } catch (error) {
      console.error('自动执行过程中出现错误:', error);
    }
  };

  // 执行单个agent（带重试机制）
  const executeAgent = async (selectedAgent: ExtendedAgent, retryCount = 0) => {
    if (!job || !selectedAgent) return;
    
    const maxRetries = 2; // 最多重试2次
    
    try {
      // 标记agent开始执行
      setExecutingAgents(prev => new Set([...Array.from(prev), selectedAgent.id]));
      
      console.log('执行Agent任务:', selectedAgent.id, job.id, retryCount > 0 ? `(重试 ${retryCount}/${maxRetries})` : '');
      
      const result = await queueApi.executeJobWithAgent(job.id, selectedAgent.id);
      console.log('Agent执行结果:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Agent执行失败');
      }
      
      const agentResult = result.result || result.agentResponse;

      // 保存agent的执行结果
      const executionResult: AgentExecutionResult = {
        jobId: job.id,
        jobTitle: job.jobTitle,
        status: 'Completed',
        executionResult: agentResult,
        executedAt: new Date().toISOString(),
        executionError: null,
        hasResult: true,
        agentId: selectedAgent.id
      };

      setAgentResults(prev => new Map(prev.set(selectedAgent.id, executionResult)));
      
      console.log(`Agent ${selectedAgent.id} 执行成功`);
      
      // 执行成功，移除执行状态和重试状态
      setExecutingAgents(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedAgent.id);
        return newSet;
      });
      setRetryingAgents(prev => {
        const newMap = new Map(prev);
        newMap.delete(selectedAgent.id);
        return newMap;
      });
      
    } catch (error) {
      console.error(`Agent ${selectedAgent.id} 执行失败:`, error);
      
      // 如果是超时错误且还有重试次数，则重试
      const isTimeoutError = error instanceof Error && (
        error.message.includes('timeout') || 
        error.message.includes('Network Error') ||
        error.message.includes('ECONNABORTED')
      );
      
      if (isTimeoutError && retryCount < maxRetries) {
        console.log(`Agent ${selectedAgent.id} 超时，准备重试 ${retryCount + 1}/${maxRetries}...`);
        
        // 记录重试状态
        setRetryingAgents(prev => new Map(prev.set(selectedAgent.id, retryCount + 1)));
        
        // 等待2秒后重试
        setTimeout(() => {
          executeAgent(selectedAgent, retryCount + 1);
        }, 2000);
        return; // 不移除执行状态，继续显示执行中
      }
      
      // 保存执行错误结果
      const errorResult: AgentExecutionResult = {
        jobId: job.id,
        jobTitle: job.jobTitle,
        status: 'Failed',
        executionResult: null,
        executedAt: new Date().toISOString(),
        executionError: error instanceof Error ? error.message : '未知错误',
        hasResult: false,
        agentId: selectedAgent.id
      };

      setAgentResults(prev => new Map(prev.set(selectedAgent.id, errorResult)));
      
      // 只有在不重试的情况下才移除执行状态和重试状态
      setExecutingAgents(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedAgent.id);
        return newSet;
      });
      setRetryingAgents(prev => {
        const newMap = new Map(prev);
        newMap.delete(selectedAgent.id);
        return newMap;
      });
    }
  };

  // 处理用户接受某个agent的执行结果
  const handleAcceptResult = async (selectedAgent: ExtendedAgent) => {
    if (!job || !selectedAgent) return;
    
    try {
      setSelectedWinner(selectedAgent.id);
      setPaymentProcessing(true);
      
      message.success(`已选择Agent: ${selectedAgent.agentName}的执行结果`);
      
      // 先完成job状态更新
      console.log('完成Job状态更新:', job.id, selectedAgent.id);
      const completeResult = await queueApi.completeJobWithAgent(job.id, selectedAgent.id);
      
      if (!completeResult.success) {
        throw new Error(completeResult.error || 'Job完成失败');
      }
      
      // 然后处理支付流程
      await handlePayment(selectedAgent);
      
      // 更新agents状态，标记获胜者
      setAgents((prevAgents: ExtendedAgent[]) => 
        prevAgents.map((a: ExtendedAgent) => ({
          ...a,
          isWinner: a.id === selectedAgent.id,
          status: a.id === selectedAgent.id ? 'winner' : 'available'
        }))
      );
      
      // 通知父组件执行完成
      if (onExecuteComplete) {
        onExecuteComplete();
      }
      
    } catch (error) {
      console.error('接受结果失败:', error);
      message.error('接受结果失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 处理支付流程
  const handlePayment = async (selectedAgent: ExtendedAgent) => {
    if (!job || !selectedAgent) return;
    
    try {
      setPaymentProcessing(true);
      message.loading('正在处理支付...', 3);
      
      // 检查是否需要连接钱包
      const connectedAddress = await web3Service.getConnectedAddress();
      if (!connectedAddress) {
        // 如果钱包未连接，尝试连接
        await web3Service.connectWallet();
      }
      
      // 计算支付金额 - 使用Agent的单次任务价格
      const agentPrice = selectedAgent.price || 0; // Agent的单次任务价格
      const stakeAmountUSDT = 0.5; // 合约固定质押金额
      
      // 检查Agent价格是否超过质押金额
      if (agentPrice > stakeAmountUSDT) {
        throw new Error(`Agent价格(${agentPrice} USDT)超过了质押金额(${stakeAmountUSDT} USDT)`);
      }
      
      const agentPayment = agentPrice; // Agent获得其设定的价格
      console.log(`质押金额: ${stakeAmountUSDT} USDT, Agent价格: ${agentPrice} USDT, Agent将获得: ${agentPayment} USDT`);
      
      // 从localStorage获取合约JobId映射
      const contractJobId = web3Service.getContractJobId(job.id);
      if (!contractJobId) {
        throw new Error('该Job没有关联的合约JobId，无法进行支付。请确保已完成资金质押。');
      }
      
      // 支付给Agent (假设Agent有walletAddress字段)
      const agentWalletAddress = selectedAgent.walletAddress || '0x0000000000000000000000000000000000000000'; // 临时地址
      
      console.log(`支付给Agent: 合约JobId=${contractJobId}, Agent=${agentWalletAddress}, 金额: ${agentPayment} USDT`);
      const paymentTx = await web3Service.payAgent(contractJobId, agentWalletAddress, agentPayment.toString());
      console.log('支付交易哈希:', paymentTx);
      
      // 退还剩余资金给Job发布者
      console.log(`退还剩余资金给Job发布者: ${job.walletAddress}, 合约JobId=${contractJobId}`);
      const refundTx = await web3Service.refundPublisher(contractJobId);
      console.log('退款交易哈希:', refundTx);
      
      message.success('支付和退款处理完成！');
      
      // 更新选中agent的执行结果，添加支付信息
      setAgentResults(prev => {
        const result = prev.get(selectedAgent.id);
        if (result) {
          const updatedResult = {
            ...result,
            paymentInfo: {
              agentPayment: agentPayment.toString(),
              agentAddress: agentWalletAddress,
              paymentTx,
              refundTx,
              paymentProcessedAt: new Date().toISOString()
            }
          };
          return new Map(prev.set(selectedAgent.id, updatedResult));
        }
        return prev;
      });
      
    } catch (error) {
      console.error('支付处理失败:', error);
      message.error('支付处理失败: ' + (error instanceof Error ? error.message : '未知错误'));
      
      // 即使支付失败，也要更新选中agent的执行结果
      setAgentResults(prev => {
        const result = prev.get(selectedAgent.id);
        if (result) {
          const updatedResult = {
            ...result,
            paymentError: error instanceof Error ? error.message : '支付处理失败'
          };
          return new Map(prev.set(selectedAgent.id, updatedResult));
        }
        return prev;
      });
    } finally {
      setPaymentProcessing(false);
    }
  };

  // D3可视化效果
  useEffect(() => {
    if (!visible || !job || agents.length === 0 || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 400;
    const height = 200;
    
    // 准备数据
    const nodes: ChartNode[] = [
      // Job 节点
      {
        id: job.id,
        name: job.jobTitle || 'Untitled Job',
        type: "job",
        group: 0,
      },
      // Agent 节点
      ...agents.map((agent: ExtendedAgent) => ({
        id: agent.id,
        name: agent.agentName || 'Unknown Agent',
        type: "agent" as const,
        status: agent.status,
        isWinner: selectedWinner === agent.id,
        group: selectedWinner === agent.id ? 1 : 2,
      })),
    ];

    const links: ChartLink[] = agents.map((agent: ExtendedAgent) => ({
      source: job.id,
      target: agent.id
    }));

    // 创建力导向图
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // 创建连线
    const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2);

    // 创建节点
    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d: ChartNode) => d.type === 'job' ? 20 : 15)
      .attr("fill", (d: ChartNode) => {
        if (d.type === 'job') return '#1890ff';
        if (d.isWinner) return '#52c41a';
        return '#fa8c16';
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // 添加标签
    const text = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d: ChartNode) => {
        const name = d.name || 'Unnamed';
        return name.length > 10 ? name.substring(0, 10) + '...' : name;
      })
      .attr("font-size", 10)
      .attr("text-anchor", "middle")
      .attr("dy", 3)
      .attr("fill", "#fff");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => (d.source as any).x)
        .attr("y1", (d: any) => (d.source as any).y)
        .attr("x2", (d: any) => (d.target as any).x)
        .attr("y2", (d: any) => (d.target as any).y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      text
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    return () => {
      simulation.stop();
    };
  }, [visible, job, agents, selectedWinner]);

  if (!job) return null;

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      style={{ top: 20 }}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <PlayCircleOutlined 
          style={{ 
            fontSize: '48px', 
            color: '#1890ff',
            marginBottom: '16px'
          }} 
        />
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          执行任务
        </Title>
        <Text type="secondary">
          确认执行以下任务配置
        </Text>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Card 
          title={
            <Space>
              <FileTextOutlined />
              <span>任务信息</span>
            </Space>
          }
          size="small"
          style={{ marginBottom: '16px' }}
        >
          <Descriptions size="small" column={2}>
            <Descriptions.Item label="任务标题">
              <Text strong>{job.jobTitle}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="分类">
              <Tag color="geekblue">{job.category}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="优先级">
              <Tag color="orange">{job.priority}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="技能要求">
              <Tag color="purple">{job.skillLevel}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="预算">
              <Text strong style={{ color: '#52c41a' }}>
                ${(job.maxBudget || 0).toLocaleString()}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="截止时间">
              {job.deadline ? new Date(job.deadline).toLocaleDateString() : '无'}
            </Descriptions.Item>
          </Descriptions>
          
          <Divider orientation="left" orientationMargin="0">任务描述</Divider>
          <Paragraph ellipsis={{ rows: 3, expandable: true }}>
            {job.description || '暂无描述'}
          </Paragraph>
          
          <Divider orientation="left" orientationMargin="0">交付要求</Divider>
          <Paragraph ellipsis={{ rows: 2, expandable: true }}>
            {job.deliverables || '暂无交付要求'}
          </Paragraph>

          <Divider orientation="left" orientationMargin="0">标签</Divider>
          <div>
            {(job.tags || '').split(',').filter(tag => tag.trim()).map((tag, index) => (
              <Tag key={index} style={{ marginBottom: '4px' }}>
                {tag.trim()}
              </Tag>
            ))}
          </div>
        </Card>

        {/* D3可视化图表 */}
        <Card 
          title={
            <Space>
              <UserOutlined />
              <span>匹配关系图</span>
            </Space>
          }
          size="small"
          style={{ marginBottom: '16px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <svg
              ref={svgRef}
              width={400}
              height={200}
              style={{ border: '1px solid #f0f0f0', borderRadius: '4px' }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              <Space size="large">
                <Space><div style={{ width: 12, height: 12, backgroundColor: '#1890ff', borderRadius: '50%' }} /> Job</Space>
                <Space><div style={{ width: 12, height: 12, backgroundColor: '#fa8c16', borderRadius: '50%' }} /> Agent</Space>
                <Space><div style={{ width: 12, height: 12, backgroundColor: '#52c41a', borderRadius: '50%' }} /> 获胜者</Space>
              </Space>
            </div>
          </div>
        </Card>

        {/* 匹配的Agents列表 */}
        <Card 
          title={
            <Space>
              <UserOutlined />
              <span>匹配的Agents ({agents.length})</span>
              {executingAgents.size > 0 && (
                <Tag color="processing" icon={<PlayCircleOutlined />}>
                  执行中 ({executingAgents.size})
                </Tag>
              )}
              {selectedWinner && (
                <Tag color="success" icon={<TrophyOutlined />}>
                  已选择获胜者
                </Tag>
              )}
            </Space>
          }
          size="small"
          style={{ marginBottom: '16px' }}
        >
          <List
            dataSource={agents || []}
            renderItem={(agent: ExtendedAgent, index: number) => {
              if (!agent || !agent.id) return null;
              const isExecuting = executingAgents.has(agent.id);
              const retryCount = retryingAgents.get(agent.id) || 0;
              const agentResult = agentResults.get(agent.id);
              const isSelected = selectedWinner === agent.id;
              const hasResult = agentResult && agentResult.hasResult;
              
              return (
              <List.Item
                key={agent.id}
                style={{
                  padding: '16px',
                  border: isSelected ? '2px solid #52c41a' : '1px solid #f0f0f0',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  backgroundColor: isSelected ? '#f6ffed' : '#fafafa'
                }}
                actions={[
                  // 显示执行状态或接受按钮
                  isExecuting ? (
                    <Button 
                      type="default"
                      size="small"
                      loading={true}
                      icon={<PlayCircleOutlined />}
                      disabled
                    >
                      {retryCount > 0 ? `重试中 ${retryCount}/2` : '执行中...'}
                    </Button>
                  ) : hasResult && !isSelected && !selectedWinner ? (
                    <Button 
                      type="primary"
                      size="small"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleAcceptResult(agent)}
                      style={{
                        backgroundColor: '#52c41a',
                        borderColor: '#52c41a'
                      }}
                    >
                      接受
                    </Button>
                  ) : isSelected ? (
                    <Button 
                      type="default"
                      size="small"
                      icon={<TrophyOutlined />}
                      disabled
                      style={{
                        backgroundColor: '#52c41a',
                        borderColor: '#52c41a',
                        color: '#fff'
                      }}
                    >
                      已选择
                    </Button>
                  ) : agentResult && !agentResult.hasResult ? (
                    <Button 
                      type="default"
                      size="small"
                      icon={<ExclamationCircleOutlined />}
                      disabled
                      danger
                    >
                      执行失败
                    </Button>
                  ) : null
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong style={{ fontSize: '16px' }}>
                        #{index + 1} {agent.agentName || 'Unknown Agent'}
                      </Text>
                      {agent.isWinner && <TrophyOutlined style={{ color: '#52c41a' }} />}
                      <Tag color="blue">{agent.agentClassification || 'Unknown'}</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space size="large">
                        <Text>
                          <strong>价格:</strong> 
                          <span style={{ color: '#fa8c16', marginLeft: '4px' }}>
                            ${(agent.price || 0).toFixed(2)}
                          </span>
                        </Text>
                        <Text>
                          <strong>声誉:</strong> 
                          <span style={{ color: '#52c41a', marginLeft: '4px' }}>
                            {(agent.reputation || 0).toFixed(1)}/5.0
                          </span>
                        </Text>
                        <Text>
                          <strong>成功率:</strong> 
                          <span style={{ color: '#1890ff', marginLeft: '4px' }}>
                            {((agent.successRate || 0) * 100).toFixed(1)}%
                          </span>
                        </Text>
                        {(agent as any).matchScore && typeof (agent as any).matchScore === 'number' && (
                          <Text>
                            <strong>匹配度:</strong> 
                            <span style={{ color: '#722ed1', marginLeft: '4px' }}>
                              {((agent as any).matchScore * 100).toFixed(1)}%
                            </span>
                          </Text>
                        )}
                      </Space>
                      
                      <div>
                        <Text type="secondary">Agent地址: </Text>
                        <Text code copyable style={{ fontSize: '12px' }}>
                          {agent.agentAddress || 'N/A'}
                        </Text>
                      </div>

                      <div>
                        <Text type="secondary">描述: </Text>
                        <Text 
                          ellipsis={{ 
                            tooltip: agent.description || '暂无描述'
                          }}
                          style={{ maxWidth: '100%', display: 'block' }}
                        >
                          {(agent.description || '').length > 100 ? 
                            (agent.description || '').substring(0, 100) + '...' : 
                            (agent.description || '暂无描述')
                          }
                        </Text>
                      </div>

                      <div>
                        <Text type="secondary">标签: </Text>
                        <div style={{ marginTop: '4px' }}>
                          {(agent.tags || '').split(',').slice(0, 3).map((tag, tagIndex) => (
                            tag.trim() && (
                              <Tag key={tagIndex} color="purple" style={{ marginBottom: '2px', fontSize: '12px' }}>
                                {tag.trim()}
                              </Tag>
                            )
                          ))}
                          {(agent.tags || '').split(',').length > 3 && (
                            <Tag color="default" style={{ fontSize: '12px' }}>
                              +{(agent.tags || '').split(',').length - 3}
                            </Tag>
                          )}
                        </div>
                      </div>

                      {/* 执行结果显示区域 */}
                      {agentResult && (
                        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e8e8e8' }}>
                          <div style={{ marginBottom: '8px' }}>
                            <Text strong>执行结果:</Text>
                            <Tag 
                              color={agentResult.status === 'Completed' ? 'success' : 'error'}
                              style={{ marginLeft: '8px' }}
                            >
                              {agentResult.status === 'Completed' ? '执行成功' : '执行失败'}
                            </Tag>
                            {agentResult.executedAt && (
                              <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>
                                {new Date(agentResult.executedAt).toLocaleString()}
                              </Text>
                            )}
                          </div>
                          
                          {agentResult.executionError ? (
                            <Alert
                              message={agentResult.executionError}
                              type="error"
                              showIcon
                            />
                          ) : agentResult.executionResult ? (
                            <div style={{ 
                              background: '#f5f5f5', 
                              padding: '8px', 
                              borderRadius: '4px',
                              maxHeight: '150px',
                              overflow: 'auto'
                            }}>
                              <pre style={{ 
                                margin: 0, 
                                whiteSpace: 'pre-wrap',
                                wordWrap: 'break-word',
                                fontSize: '12px'
                              }}>
                                {typeof agentResult.executionResult === 'string' 
                                  ? agentResult.executionResult 
                                  : JSON.stringify(agentResult.executionResult, null, 2)
                                }
                              </pre>
                            </div>
                          ) : null}

                          {/* 支付信息显示 */}
                          {agentResult.paymentInfo && (
                            <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#f0f9ff', borderRadius: '4px', border: '1px solid #91d5ff' }}>
                              <div style={{ marginBottom: '4px' }}>
                                <Text strong style={{ color: '#1890ff' }}>支付信息:</Text>
                              </div>
                              <div style={{ fontSize: '12px' }}>
                                <div>Agent支付: <Tag color="success">{agentResult.paymentInfo.agentPayment} ETH</Tag></div>
                                <div style={{ marginTop: '4px' }}>
                                  支付地址: {(agentResult.paymentInfo.agentAddress || '').slice(0, 6)}...{(agentResult.paymentInfo.agentAddress || '').slice(-4)}
                                </div>
                                <div style={{ marginTop: '4px' }}>
                                  处理时间: {agentResult.paymentInfo.paymentProcessedAt ? new Date(agentResult.paymentInfo.paymentProcessedAt).toLocaleString() : '未知'}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 支付错误信息 */}
                          {agentResult.paymentError && (
                            <div style={{ marginTop: '8px' }}>
                              <Alert
                                message="支付处理失败"
                                description={agentResult.paymentError}
                                type="warning"
                                showIcon
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </Space>
                  }
                />
              </List.Item>
              );
            }}
          />
        </Card>

        {matchRecord && (
          <Card title="匹配详情" size="small" style={{ marginBottom: '16px' }}>
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="匹配算法">
                {matchRecord.matchCriteria?.algorithm || 'Unknown'}
              </Descriptions.Item>
              <Descriptions.Item label="匹配时间">
                {matchRecord.createdAt ? new Date(matchRecord.createdAt).toLocaleString() : '未知'}
              </Descriptions.Item>
              <Descriptions.Item label="候选Agent数">
                {(matchRecord as any)?.totalAgents || 0}
              </Descriptions.Item>
              <Descriptions.Item label="匹配得分">
                {matchRecord.matchCriteria?.matchScore && typeof matchRecord.matchCriteria.matchScore === 'number' ? 
                  `${(matchRecord.matchCriteria.matchScore * 100).toFixed(1)}%` : 
                  'N/A'
                }
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

      </div>

      <Divider />

      <div style={{ textAlign: 'center' }}>
        <Space size="large">
          <Button size="large" onClick={() => {
            setAgentResults(new Map());
            setExecutingAgents(new Set());
            setRetryingAgents(new Map());
            setSelectedWinner(null);
            setAutoExecutionStarted(false);
            setLoadingResult(false);
            setAgents([]);
            setJobMatchDetails(null);
            onClose();
          }}>
            关闭
          </Button>
          {paymentProcessing && (
            <Button 
              size="large"
              loading={true}
              icon={<WalletOutlined />}
              style={{
                background: 'linear-gradient(135deg, #fa8c16 0%, #d48806 100%)',
                border: 'none',
                color: '#fff'
              }}
            >
              处理支付中...
            </Button>
          )}
        </Space>
      </div>
    </Modal>
  );
};

export default ExecuteJobModal;
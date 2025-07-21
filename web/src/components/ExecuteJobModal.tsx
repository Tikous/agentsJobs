import React, { useState, useEffect, useRef } from 'react';
import { Modal, Typography, Card, Tag, Space, Divider, Button, message, Descriptions, Alert, Spin, List } from 'antd';
import { PlayCircleOutlined, UserOutlined, FileTextOutlined, CheckCircleOutlined, ExclamationCircleOutlined, WalletOutlined, TrophyOutlined } from '@ant-design/icons';
import { Agent, Job } from '@/types';
import { queueApi } from '@/services/api';
import { web3Service } from '@/services/web3';
import * as d3 from 'd3';

const { Title, Text, Paragraph } = Typography;

interface ChartNode {
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

interface ExecuteJobModalProps {
  visible: boolean;
  onClose: () => void;
  job: Job | null;
  agent: Agent | null;
  matchRecord?: any;
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
  const [executing, setExecuting] = useState<string | null>(null); // 记录正在执行的agent id
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [loadingResult, setLoadingResult] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [jobMatchDetails, setJobMatchDetails] = useState<any>(null);
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
        setAgents(matchDetails.agents || [matchDetails.agent].filter(Boolean));
        
        // 如果job已完成，获取执行结果
        if (job.status === 'Completed' || job.status === 'Failed') {
          const result = await queueApi.getJobResult(job.id);
          if (result.hasResult) {
            setExecutionResult(result);
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
  }, [visible, job, agent]);

  const handleExecute = async (selectedAgent: Agent) => {
    if (!job || !selectedAgent) return;
    
    try {
      setExecuting(selectedAgent.id);
      
      // 直接调用Agent的地址
      const requestPayload = {
        message: job.description,
        context: {
          sessionId: `job_${job.id}_${Date.now()}`
        }
      };

      console.log('调用Agent:', selectedAgent.agentAddress, requestPayload);
      
      const response = await fetch(selectedAgent.agentAddress, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': '*/*'
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`Agent响应错误: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      let agentResult;
      try {
        agentResult = JSON.parse(responseText);
        console.log('Parsed agent result:', agentResult);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Agent响应格式不正确: ' + responseText);
      }

      // 设置执行结果
      setExecutionResult({
        jobId: job.id,
        jobTitle: job.jobTitle,
        status: 'Completed',
        executionResult: agentResult,
        executedAt: new Date().toISOString(),
        executionError: null,
        hasResult: true
      });

      message.success('任务执行成功！');
      
      // 自动处理支付流程
      await handlePayment(selectedAgent);
      
      // 更新agents状态，标记获胜者
      setAgents(prevAgents => 
        prevAgents.map(a => ({
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
      console.error('执行失败:', error);
      
      // 设置执行错误结果
      setExecutionResult({
        jobId: job.id,
        jobTitle: job.jobTitle,
        status: 'Failed',
        executionResult: null,
        executedAt: new Date().toISOString(),
        executionError: error instanceof Error ? error.message : '未知错误',
        hasResult: false
      });

      message.error('执行失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setExecuting(null);
    }
  };

  // 处理支付流程
  const handlePayment = async (selectedAgent: Agent) => {
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
      
      // 更新执行结果，添加支付信息
      setExecutionResult((prev: any) => prev ? {
        ...prev,
        paymentInfo: {
          agentPayment: agentPayment.toString(),
          agentAddress: agentWalletAddress,
          paymentTx,
          refundTx,
          paymentProcessedAt: new Date().toISOString()
        }
      } : prev);
      
    } catch (error) {
      console.error('支付处理失败:', error);
      message.error('支付处理失败: ' + (error instanceof Error ? error.message : '未知错误'));
      
      // 即使支付失败，也要更新执行结果
      setExecutionResult((prev: any) => prev ? {
        ...prev,
        paymentError: error instanceof Error ? error.message : '支付处理失败'
      } : prev);
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
        name: job.jobTitle,
        type: "job",
        group: 0,
      },
      // Agent 节点
      ...agents.map((agent) => ({
        id: agent.id,
        name: agent.agentName,
        type: "agent" as const,
        status: agent.status,
        isWinner: agent.isWinner || agent.status === "winner",
        group: agent.isWinner || agent.status === "winner" ? 1 : 2,
      })),
    ];

    const links: ChartLink[] = agents.map(agent => ({
      source: job.id,
      target: agent.id
    }));

    // 创建力导向图
    const simulation = d3.forceSimulation(nodes as any)
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
      .attr("r", (d: any) => d.type === 'job' ? 20 : 15)
      .attr("fill", (d: any) => {
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
      .text((d: any) => d.name.length > 10 ? d.name.substring(0, 10) + '...' : d.name)
      .attr("font-size", 10)
      .attr("text-anchor", "middle")
      .attr("dy", 3)
      .attr("fill", "#fff");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

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
  }, [visible, job, agents]);

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
            {job.description}
          </Paragraph>
          
          <Divider orientation="left" orientationMargin="0">交付要求</Divider>
          <Paragraph ellipsis={{ rows: 2, expandable: true }}>
            {job.deliverables}
          </Paragraph>

          <Divider orientation="left" orientationMargin="0">标签</Divider>
          <div>
            {job.tags.split(',').map((tag, index) => (
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
            </Space>
          }
          size="small"
          style={{ marginBottom: '16px' }}
        >
          <List
            dataSource={agents}
            renderItem={(agent, index) => (
              <List.Item
                key={agent.id}
                style={{
                  padding: '12px',
                  border: agent.isWinner ? '2px solid #52c41a' : '1px solid #f0f0f0',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  backgroundColor: agent.isWinner ? '#f6ffed' : '#fafafa'
                }}
                actions={[
                  job.status === 'Matched' && (
                    <Button 
                      type={agent.isWinner ? "default" : "primary"}
                      size="small"
                      loading={executing === agent.id}
                      icon={agent.isWinner ? <TrophyOutlined /> : <PlayCircleOutlined />}
                      onClick={() => handleExecute(agent)}
                      disabled={!!executing && executing !== agent.id}
                      style={{
                        backgroundColor: agent.isWinner ? '#52c41a' : undefined,
                        borderColor: agent.isWinner ? '#52c41a' : undefined,
                        color: agent.isWinner ? '#fff' : undefined
                      }}
                    >
                      {agent.isWinner ? '已获胜' : (executing === agent.id ? '执行中...' : '执行')}
                    </Button>
                  )
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong style={{ fontSize: '16px' }}>
                        #{index + 1} {agent.agentName}
                      </Text>
                      {agent.isWinner && <TrophyOutlined style={{ color: '#52c41a' }} />}
                      <Tag color="blue">{agent.agentClassification}</Tag>
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
                        {(agent as any).matchScore && (
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
                          {agent.agentAddress}
                        </Text>
                      </div>

                      <div>
                        <Text type="secondary">描述: </Text>
                        <Text ellipsis={{ tooltip: agent.description }}>
                          {agent.description.length > 100 ? 
                            agent.description.substring(0, 100) + '...' : 
                            agent.description
                          }
                        </Text>
                      </div>

                      <div>
                        <Text type="secondary">标签: </Text>
                        <div style={{ marginTop: '4px' }}>
                          {agent.tags.split(',').slice(0, 3).map((tag, tagIndex) => (
                            <Tag key={tagIndex} color="purple" style={{ marginBottom: '2px', fontSize: '12px' }}>
                              {tag.trim()}
                            </Tag>
                          ))}
                          {agent.tags.split(',').length > 3 && (
                            <Tag color="default" style={{ fontSize: '12px' }}>
                              +{agent.tags.split(',').length - 3}
                            </Tag>
                          )}
                        </div>
                      </div>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>

        {matchRecord && (
          <Card title="匹配详情" size="small" style={{ marginBottom: '16px' }}>
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="匹配算法">
                {matchRecord.matchCriteria?.algorithm || 'Unknown'}
              </Descriptions.Item>
              <Descriptions.Item label="匹配时间">
                {new Date(matchRecord.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="候选Agent数">
                {matchRecord.totalAgents}
              </Descriptions.Item>
              <Descriptions.Item label="匹配得分">
                {matchRecord.matchCriteria?.matchScore ? 
                  `${(matchRecord.matchCriteria.matchScore * 100).toFixed(1)}%` : 
                  'N/A'
                }
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* 执行结果展示 */}
        {(executionResult || loadingResult || job.status === 'Completed' || job.status === 'Failed') && (
          <Card 
            title={
              <Space>
                {(executionResult?.status === 'Completed' || job.status === 'Completed') ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                )}
                <span>执行结果</span>
              </Space>
            } 
            size="small"
          >
            {loadingResult ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '12px' }}>正在获取执行结果...</div>
              </div>
            ) : executionResult ? (
              <div>
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="执行状态">
                    <Tag color={(executionResult?.status === 'Completed' || job.status === 'Completed') ? 'success' : 'error'}>
                      {(executionResult?.status === 'Completed' || job.status === 'Completed') ? '执行成功' : '执行失败'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="执行时间">
                    {executionResult.executedAt ? new Date(executionResult.executedAt).toLocaleString() : '未知'}
                  </Descriptions.Item>
                </Descriptions>

                {executionResult.executionError ? (
                  <div>
                    <Divider orientation="left" orientationMargin="0">错误信息</Divider>
                    <Alert
                      message={executionResult.executionError}
                      type="error"
                      showIcon
                    />
                  </div>
                ) : executionResult.executionResult ? (
                  <div>
                    <Divider orientation="left" orientationMargin="0">Agent响应</Divider>
                    <div style={{ 
                      background: '#f5f5f5', 
                      padding: '12px', 
                      borderRadius: '6px',
                      maxHeight: '300px',
                      overflow: 'auto'
                    }}>
                      <pre style={{ 
                        margin: 0, 
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word'
                      }}>
                        {typeof executionResult.executionResult === 'string' 
                          ? executionResult.executionResult 
                          : JSON.stringify(executionResult.executionResult, null, 2)
                        }
                      </pre>
                    </div>
                  </div>
                ) : null}

                {/* 支付信息展示 */}
                {executionResult.paymentInfo && (
                  <div>
                    <Divider orientation="left" orientationMargin="0">
                      <Space>
                        <WalletOutlined style={{ color: '#52c41a' }} />
                        <span>支付信息</span>
                      </Space>
                    </Divider>
                    <Descriptions size="small" column={1}>
                      <Descriptions.Item label="Agent支付">
                        <Space>
                          <Tag color="success">{executionResult.paymentInfo.agentPayment} ETH</Tag>
                          <Text type="secondary">
                            → {executionResult.paymentInfo.agentAddress.slice(0, 6)}...{executionResult.paymentInfo.agentAddress.slice(-4)}
                          </Text>
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label="支付交易">
                        <Text code copyable style={{ fontSize: '12px' }}>
                          {executionResult.paymentInfo.paymentTx}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="退款交易">
                        <Text code copyable style={{ fontSize: '12px' }}>
                          {executionResult.paymentInfo.refundTx}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="处理时间">
                        {new Date(executionResult.paymentInfo.paymentProcessedAt).toLocaleString()}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                )}

                {/* 支付错误信息 */}
                {executionResult.paymentError && (
                  <div>
                    <Divider orientation="left" orientationMargin="0">支付错误</Divider>
                    <Alert
                      message="支付处理失败"
                      description={executionResult.paymentError}
                      type="warning"
                      showIcon
                    />
                  </div>
                )}
              </div>
            ) : (
              <Alert
                message="暂无执行结果"
                description="任务可能正在执行中，请稍后查看"
                type="info"
                showIcon
              />
            )}
          </Card>
        )}
      </div>

      <Divider />

      <div style={{ textAlign: 'center' }}>
        <Space size="large">
          <Button size="large" onClick={() => {
            setExecutionResult(null);
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
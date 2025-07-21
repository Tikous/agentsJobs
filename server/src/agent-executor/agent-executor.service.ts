import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { JobStatus } from '../common/enums/job-status.enum';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class AgentExecutorService {
  private readonly logger = new Logger(AgentExecutorService.name);

  constructor(
    private readonly httpService: HttpService,
    private prisma: PrismaService
  ) {}

  /**
   * 调用Agent执行任务
   */
  async executeJobWithAgent(jobId: string, agentId: string, customPayload?: { message?: string; context?: any }) {
    this.logger.log(`开始执行Job ${jobId} with Agent ${agentId}`, customPayload);

    try {
      // 获取Job和Agent信息
      const [job, agent] = await Promise.all([
        this.prisma.read.job.findUnique({ where: { id: jobId } }),
        this.prisma.read.agent.findUnique({ where: { id: agentId } })
      ]);

      if (!job || !agent) {
        throw new Error('Job或Agent不存在');
      }

      if (job.status !== JobStatus.MATCHED) {
        throw new Error(`Job状态不正确: ${job.status}`);
      }

      // 更新Job状态为工作中
      await this.prisma.write.job.update({
        where: { id: jobId },
        data: { status: JobStatus.IN_PROGRESS }
      });

      // 构造Agent API请求格式，优先使用自定义参数
      const requestPayload = {
        message: customPayload?.message || job.description,
        context: customPayload?.context || {
          sessionId: `job_${jobId}_${Date.now()}`
        }
      };

      this.logger.log(`调用Agent ${agent.agentAddress}`, requestPayload);

      // 调用Agent API (设置60秒超时，Agent可能需要更多时间)
      const response = await firstValueFrom(
        this.httpService.post(agent.agentAddress, requestPayload, {
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json'
          }
        }).pipe(timeout(60000))
      );

      this.logger.log(`Agent ${agentId} 响应:`, response.data);

      // 保存完整的Agent响应
      const executionResult = response.data;
      
      // 更新Agent的完成任务数
      await this.prisma.write.agent.update({
        where: { id: agentId },
        data: {
          totalJobsCompleted: {
            increment: 1
          }
        }
      });

      // 更新Job状态为完成，保存执行结果
      await this.prisma.write.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.COMPLETED,
          executionResult: executionResult, // 保存Agent的执行结果
          executedAt: new Date(),
          executionError: null
        }
      });

      // 更新匹配记录
      await this.prisma.write.jobDistributionRecord.updateMany({
        where: {
          jobId: jobId,
          assignedAgentId: agentId
        },
        data: {
          responseCount: 1
        }
      });

      this.logger.log(`Job ${jobId} 执行完成`);

      return {
        success: true,
        result: executionResult,
        executionTime: new Date(),
        agentResponse: response.data
      };

    } catch (error) {
      this.logger.error(`执行Job ${jobId} 失败: ${error.message}`, error.stack);

      // 更新Job状态为失败，记录错误信息
      await this.prisma.write.job.update({
        where: { id: jobId },
        data: { 
          status: JobStatus.FAILED,
          executionError: error.message,
          executedAt: new Date()
        }
      });

      return {
        success: false,
        error: error.message,
        executionTime: new Date()
      };
    }
  }

  /**
   * 获取已匹配等待执行的Jobs
   */
  async getMatchedJobs() {
    return this.prisma.read.jobDistributionRecord.findMany({
      where: {
        assignedAgentId: {
          not: null
        },
        job: {
          status: JobStatus.MATCHED
        }
      },
      include: {
        job: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  /**
   * 手动触发Job执行
   */
  async triggerJobExecution(jobId: string) {
    const matchRecord = await this.prisma.read.jobDistributionRecord.findFirst({
      where: {
        jobId: jobId
      }
    });

    if (!matchRecord || !matchRecord.assignedAgentId) {
      throw new Error('未找到匹配记录或未分配Agent');
    }

    // 检查Job状态
    const job = await this.prisma.read.job.findUnique({
      where: { id: jobId }
    });

    if (!job || job.status !== JobStatus.MATCHED) {
      throw new Error(`Job状态不正确: ${job?.status || 'NOT_FOUND'}`);
    }

    return this.executeJobWithAgent(jobId, matchRecord.assignedAgentId);
  }

  /**
   * 获取Job的匹配详情
   */
  async getJobMatchDetails(jobId: string) {
    const job = await this.prisma.read.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      throw new Error('Job不存在');
    }

    // 获取所有匹配记录
    const matchRecords = await this.prisma.read.jobDistributionRecord.findMany({
      where: { jobId },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (!matchRecords || matchRecords.length === 0) {
      throw new Error('未找到匹配记录');
    }

    // 获取所有匹配的agents
    const agentIds = matchRecords.map(record => record.assignedAgentId).filter((id): id is string => id !== null);
    const agents = await this.prisma.read.agent.findMany({
      where: { 
        id: {
          in: agentIds
        }
      }
    });

    if (!agents || agents.length === 0) {
      throw new Error('匹配的Agent不存在');
    }

    // 为agents添加匹配得分和排名信息
    const agentsWithMatchInfo = agents.map(agent => {
      const matchRecord = matchRecords.find(record => record.assignedAgentId === agent.id);
      const criteria = matchRecord?.matchCriteria as any;
      return {
        ...agent,
        matchScore: criteria?.matchScore || 0,
        rank: criteria?.rank || 999,
        isWinner: false, // 初始都不是winner
        status: 'available' // 初始状态
      };
    }).sort((a, b) => a.rank - b.rank); // 按排名排序

    return {
      job,
      agents: agentsWithMatchInfo, // 返回多个agents
      agent: agentsWithMatchInfo[0], // 保持向后兼容性
      matchRecords, // 返回所有匹配记录
      matchRecord: matchRecords[0], // 保持向后兼容性
      canExecute: job.status === JobStatus.MATCHED
    };
  }

  /**
   * 获取Job执行结果
   */
  async getJobExecutionResult(jobId: string) {
    const job = await this.prisma.read.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        jobTitle: true,
        status: true,
        executionResult: true,
        executedAt: true,
        executionError: true
      }
    });

    if (!job) {
      throw new Error('Job不存在');
    }

    return {
      jobId: job.id,
      jobTitle: job.jobTitle,
      status: job.status,
      executionResult: job.executionResult,
      executedAt: job.executedAt,
      executionError: job.executionError,
      hasResult: job.status === JobStatus.COMPLETED && job.executionResult !== null
    };
  }
}
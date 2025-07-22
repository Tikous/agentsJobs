import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MatchingService } from '../matching/matching.service';
import { AgentExecutorService } from '../agent-executor/agent-executor.service';
import { PrismaService } from '../prisma/prisma.service';
import { JobStatus } from '../common/enums/job-status.enum';

@Injectable()
export class JobQueueService {
  private readonly logger = new Logger(JobQueueService.name);

  constructor(
    private readonly matchingService: MatchingService,
    private readonly agentExecutorService: AgentExecutorService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * 每30秒检查一次等待匹配的Jobs
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processMatchingQueue() {
    try {
      const pendingJobs = await this.matchingService.getPendingJobs();
      
      if (pendingJobs.length === 0) {
        return;
      }

      this.logger.log(`发现 ${pendingJobs.length} 个等待匹配的Jobs`);

      // 并发处理多个Jobs（限制并发数为3）
      const promises = pendingJobs.slice(0, 3).map(job => 
        this.matchingService.matchAgentsForJob(job.id)
          .catch(error => {
            this.logger.error(`匹配Job ${job.id} 失败:`, error.message);
            return null;
          })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(result => result !== null).length;
      
      this.logger.log(`匹配完成: ${successCount}/${promises.length} 成功`);

    } catch (error) {
      this.logger.error('处理匹配队列时发生错误:', error.message);
    }
  }

  /**
   * 每60秒检查一次等待执行的Jobs (已禁用自动执行，改为手动执行)
   */
  // @Cron(CronExpression.EVERY_MINUTE)
  async processExecutionQueue() {
    try {
      const matchedJobs = await this.agentExecutorService.getMatchedJobs();
      
      if (matchedJobs.length === 0) {
        return;
      }

      this.logger.log(`发现 ${matchedJobs.length} 个等待执行的Jobs`);

      // 并发执行多个Jobs（限制并发数为2）
      const promises = matchedJobs.slice(0, 2)
        .filter(record => record.assignedAgentId) // 确保有分配的Agent
        .map(record => 
          this.agentExecutorService.executeJobWithAgent(record.jobId, record.assignedAgentId!)
            .catch(error => {
              this.logger.error(`执行Job ${record.jobId} 失败:`, error.message);
              return { success: false, error: error.message };
            })
        );

      const results = await Promise.all(promises);
      const successCount = results.filter(result => result.success).length;
      
      this.logger.log(`执行完成: ${successCount}/${promises.length} 成功`);

    } catch (error) {
      this.logger.error('处理执行队列时发生错误:', error.message);
    }
  }

  /**
   * 手动触发队列处理（仅处理匹配，不自动执行）
   */
  async manualTrigger() {
    this.logger.log('手动触发队列处理');
    
    // 只处理匹配队列，不自动执行
    await this.processMatchingQueue();
    
    return { message: '队列处理已触发' };
  }

  /**
   * 获取队列状态
   */
  async getQueueStatus() {
    const [pendingJobs, matchedJobs] = await Promise.all([
      this.matchingService.getPendingJobs(),
      this.agentExecutorService.getMatchedJobs()
    ]);

    return {
      pendingMatchingCount: pendingJobs.length,
      pendingExecutionCount: matchedJobs.length,
      lastUpdate: new Date()
    };
  }

  /**
   * 重试失败的Job匹配（重置状态为Open再进行匹配）
   */
  async retryJobMatching(jobId: string) {
    this.logger.log(`开始重试Job ${jobId} 的匹配`);
    
    try {
      // 获取Job信息
      const job = await this.prisma.read.job.findUnique({
        where: { id: jobId }
      });

      if (!job) {
        throw new Error('Job不存在');
      }

      // 如果是Failed状态，重置为Open状态以便重新匹配
      if (job.status === JobStatus.FAILED) {
        this.logger.log(`重置Job ${jobId} 状态从Failed到Open`);
        
        // 删除之前的失败匹配记录
        await this.prisma.write.jobDistributionRecord.deleteMany({
          where: { jobId: jobId }
        });

        // 重置Job状态为Open
        await this.prisma.write.job.update({
          where: { id: jobId },
          data: { status: JobStatus.OPEN }
        });
      }

      // 重新进行匹配
      const result = await this.matchingService.matchAgentsForJob(jobId);
      
      this.logger.log(`Job ${jobId} 重试匹配${result ? '成功' : '失败'}`);
      
      return result;

    } catch (error) {
      this.logger.error(`重试Job ${jobId} 匹配失败: ${error.message}`, error.stack);
      throw error;
    }
  }
}
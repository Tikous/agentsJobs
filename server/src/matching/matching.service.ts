import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobStatus } from '../common/enums/job-status.enum';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Fisher-Yates 洗牌算法
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * 计算标签匹配度
   */
  private calculateTagSimilarity(jobTags: string, agentTags: string): number {
    const jobTagsArray = jobTags.toLowerCase().split(',').map(tag => tag.trim());
    const agentTagsArray = agentTags.toLowerCase().split(',').map(tag => tag.trim());
    
    const intersection = jobTagsArray.filter(tag => agentTagsArray.includes(tag));
    const union = [...new Set([...jobTagsArray, ...agentTagsArray])];
    
    return intersection.length / union.length;
  }

  /**
   * 为Job匹配合适的Agents
   */
  async matchAgentsForJob(jobId: string) {
    this.logger.log(`开始为Job ${jobId} 匹配Agents`);

    try {
      // 获取Job信息
      const job = await this.prisma.read.job.findUnique({
        where: { id: jobId }
      });

      if (!job || job.status !== JobStatus.OPEN) {
        this.logger.warn(`Job ${jobId} 不存在或状态不是Open`);
        return null;
      }

      // 更新Job状态为匹配中
      await this.prisma.write.job.update({
        where: { id: jobId },
        data: { status: JobStatus.MATCHING }
      });

      // 查找可用的Agents
      // 注意：实际质押金额是固定的0.5 USDT，不是job.maxBudget
      const ACTUAL_STAKE_AMOUNT = 0.5; // 与合约中的0.5 USDT保持一致
      
      this.logger.log(`查找条件: category=${job.category}, maxPrice=${ACTUAL_STAKE_AMOUNT}`);
      
      const availableAgents = await this.prisma.read.agent.findMany({
        where: {
          isActive: true,
          isPrivate: false,
          agentClassification: job.category, // 基于分类匹配
          price: {
            lte: ACTUAL_STAKE_AMOUNT // 价格不超过实际质押金额
          }
        }
      });

      this.logger.log(`找到 ${availableAgents.length} 个符合条件的agents:`, 
        availableAgents.map(a => ({ id: a.id, name: a.agentName, category: a.agentClassification, price: a.price }))
      );

      if (availableAgents.length === 0) {
        this.logger.warn(`没有找到满足质押金额(${ACTUAL_STAKE_AMOUNT} USDT)和分类(${job.category})的Agents for job ${jobId}`);
        await this.prisma.write.job.update({
          where: { id: jobId },
          data: { status: JobStatus.FAILED }
        });
        return null;
      }

      // 先按洗牌算法打乱所有符合条件的agents
      const shuffledAgents = this.shuffleArray(availableAgents);

      // 然后根据tags标签和category进行打分
      const agentsWithScore = shuffledAgents.map(agent => ({
        ...agent,
        matchScore: this.calculateTagSimilarity(job.tags, agent.tags),
        categoryMatch: agent.agentClassification === job.category ? 1 : 0,
        budgetCompatible: agent.price <= ACTUAL_STAKE_AMOUNT ? 1 : 0 // 使用实际质押金额
      }));

      // 按综合得分排序：分类匹配 > 标签相似度 > 价格（升序）
      agentsWithScore.sort((a, b) => {
        // 首先按分类匹配排序
        if (b.categoryMatch !== a.categoryMatch) {
          return b.categoryMatch - a.categoryMatch;
        }
        // 然后按标签匹配度排序
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        // 最后按价格排序（价格低的优先）
        return a.price - b.price;
      });

      // 选择前3个Agent（已经经过洗牌和排序）
      const TOP_AGENTS_COUNT = Math.min(3, agentsWithScore.length);
      const selectedAgents = agentsWithScore.slice(0, TOP_AGENTS_COUNT);

      // 创建匹配记录 - 为每个agent创建单独的记录
      const matchRecords = await Promise.all(
        selectedAgents.map(async (agent, index) => {
          return this.prisma.write.jobDistributionRecord.create({
            data: {
              jobId: job.id,
              jobName: job.jobTitle,
              assignedAgentId: agent.id,
              assignedAgentName: agent.agentName,
              matchCriteria: {
                category: job.category,
                tags: job.tags,
                jobMaxBudget: job.maxBudget,
                actualStakeAmount: ACTUAL_STAKE_AMOUNT,
                agentPrice: agent.price,
                matchScore: agent.matchScore,
                categoryMatch: agent.categoryMatch,
                algorithm: 'shuffle_budget_category_tags',
                rank: index + 1 // 排名
              },
              totalAgents: availableAgents.length,
              assignedCount: selectedAgents.length,
              responseCount: 0
            }
          });
        })
      );

      // 更新Job状态为匹配成功
      await this.prisma.write.job.update({
        where: { id: jobId },
        data: { status: JobStatus.MATCHED }
      });

      this.logger.log(`Job ${jobId} 成功匹配到 ${selectedAgents.length} 个Agents`);

      return {
        job,
        agents: selectedAgents, // 返回多个agents
        matchRecords, // 返回多个匹配记录
        topAgent: selectedAgents[0] // 保留最佳agent的引用
      };

    } catch (error) {
      this.logger.error(`匹配过程发生错误: ${error.message}`, error.stack);
      
      // 更新Job状态为失败
      await this.prisma.write.job.update({
        where: { id: jobId },
        data: { status: JobStatus.FAILED }
      });
      
      throw error;
    }
  }

  /**
   * 获取等待匹配的Jobs
   */
  async getPendingJobs() {
    return this.prisma.read.job.findMany({
      where: {
        status: JobStatus.OPEN
      },
      orderBy: {
        createdAt: 'asc' // 先进先出
      }
    });
  }
}
import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JobQueueService } from './job-queue.service';
import { MatchingService } from '../matching/matching.service';
import { AgentExecutorService } from '../agent-executor/agent-executor.service';

@ApiTags('Job Queue')
@Controller('queue')
export class JobQueueController {
  constructor(
    private readonly jobQueueService: JobQueueService,
    private readonly matchingService: MatchingService,
    private readonly agentExecutorService: AgentExecutorService
  ) {}

  @Get('status')
  @ApiOperation({ summary: '获取队列状态' })
  @ApiResponse({ status: 200, description: '队列状态信息' })
  async getQueueStatus() {
    return this.jobQueueService.getQueueStatus();
  }

  @Post('trigger')
  @ApiOperation({ summary: '手动触发队列处理' })
  @ApiResponse({ status: 200, description: '队列处理已触发' })
  async triggerQueue() {
    return this.jobQueueService.manualTrigger();
  }

  @Post('match/:jobId')
  @ApiOperation({ summary: '手动匹配指定Job' })
  @ApiResponse({ status: 200, description: '匹配结果' })
  async matchJob(@Param('jobId') jobId: string) {
    const result = await this.jobQueueService.retryJobMatching(jobId);
    
    // 匹配成功后不自动执行，等待用户手动触发
    return result;
  }

  @Get('match/:jobId')
  @ApiOperation({ summary: '获取Job的匹配详情' })
  @ApiResponse({ status: 200, description: '匹配详情' })
  async getMatchDetails(@Param('jobId') jobId: string) {
    return this.agentExecutorService.getJobMatchDetails(jobId);
  }

  @Post('execute/:jobId')
  @ApiOperation({ summary: '手动执行指定Job' })
  @ApiResponse({ status: 200, description: '执行结果' })
  async executeJob(@Param('jobId') jobId: string) {
    return this.agentExecutorService.triggerJobExecution(jobId);
  }

  @Get('result/:jobId')
  @ApiOperation({ summary: '获取Job执行结果' })
  @ApiResponse({ status: 200, description: '执行结果详情' })
  async getJobResult(@Param('jobId') jobId: string) {
    return this.agentExecutorService.getJobExecutionResult(jobId);
  }
}
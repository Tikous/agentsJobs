import { Module } from '@nestjs/common';
import { JobQueueService } from './job-queue.service';
import { JobQueueController } from './job-queue.controller';
import { MatchingModule } from '../matching/matching.module';
import { AgentExecutorModule } from '../agent-executor/agent-executor.module';

@Module({
  imports: [MatchingModule, AgentExecutorModule],
  controllers: [JobQueueController],
  providers: [JobQueueService],
  exports: [JobQueueService],
})
export class JobQueueModule {}
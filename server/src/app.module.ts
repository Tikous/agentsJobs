import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AgentsModule } from './agents/agents.module';
import { JobsModule } from './jobs/jobs.module';
import { MatchingModule } from './matching/matching.module';
import { AgentExecutorModule } from './agent-executor/agent-executor.module';
import { JobQueueModule } from './job-queue/job-queue.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AgentsModule,
    JobsModule,
    MatchingModule,
    AgentExecutorModule,
    JobQueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

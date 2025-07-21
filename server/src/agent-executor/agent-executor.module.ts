import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AgentExecutorService } from './agent-executor.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    })
  ],
  providers: [AgentExecutorService],
  exports: [AgentExecutorService],
})
export class AgentExecutorModule {}
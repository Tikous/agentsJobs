import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
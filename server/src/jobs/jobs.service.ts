import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async create(createJobDto: CreateJobDto) {
    const { deadline, budget, ...rest } = createJobDto;

    return this.prisma.write.job.create({
      data: {
        ...rest,
        deadline: deadline ? new Date(deadline) : null,
        budget: budget || { currency: 'USD', amount: rest.maxBudget },
      },
    });
  }

  async findAll() {
    return this.prisma.read.job.findMany();
  }

  async findOne(id: string) {
    const job = await this.prisma.read.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    return job;
  }

  async update(id: string, updateJobDto: UpdateJobDto) {
    const { deadline, budget, ...rest } = updateJobDto;

    try {
      return await this.prisma.write.job.update({
        where: { id },
        data: {
          ...rest,
          ...(deadline && { deadline: new Date(deadline) }),
          ...(budget && { budget }),
        },
      });
    } catch (error) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      // 先检查job是否存在
      const job = await this.prisma.read.job.findUnique({
        where: { id },
      });

      if (!job) {
        throw new NotFoundException(`Job with ID ${id} not found`);
      }

      // 使用事务删除，先删除相关的分发记录
      return await this.prisma.write.$transaction(async (prisma) => {
        // 删除相关的JobDistributionAgent记录
        await prisma.jobDistributionAgent.deleteMany({
          where: {
            jobDistribution: {
              jobId: id
            }
          }
        });

        // 删除相关的JobDistributionRecord记录
        await prisma.jobDistributionRecord.deleteMany({
          where: { jobId: id }
        });

        // 最后删除Job记录
        return await prisma.job.delete({
          where: { id },
        });
      });
    } catch (error) {
      console.error('删除Job失败:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Job with ID ${id} not found or deletion failed`);
    }
  }
}

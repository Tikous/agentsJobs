import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  async create(createAgentDto: CreateAgentDto) {
    const agentData = {
      ...createAgentDto,
      price: createAgentDto.price ?? 0.0, // 默认价格为0
    };
    
    return this.prisma.write.agent.create({
      data: agentData,
    });
  }

  async findAll() {
    return this.prisma.read.agent.findMany();
  }

  async findOne(id: string) {
    const agent = await this.prisma.read.agent.findUnique({
      where: { id },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return agent;
  }

  async update(id: string, updateAgentDto: UpdateAgentDto) {
    try {
      const updateData = { ...updateAgentDto };
      if (updateData.price !== undefined && updateData.price !== null) {
        updateData.price = updateData.price;
      }
      
      return await this.prisma.write.agent.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.write.agent.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }
  }
}

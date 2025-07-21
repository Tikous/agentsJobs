import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private writeClient: PrismaClient;
  private readClient: PrismaClient;

  constructor() {
    // 使用WRITE_URL进行写操作（主库）
    this.writeClient = new PrismaClient({
      datasourceUrl: process.env.DATABASE_WRITE_URL || process.env.DATABASE_URL,
    });

    // 使用READ_URL进行读操作（读库）
    this.readClient = new PrismaClient({
      datasourceUrl: process.env.DATABASE_READ_URL || process.env.DATABASE_URL,
    });
  }

  get write() {
    return this.writeClient;
  }

  get read() {
    return this.readClient;
  }

  async onModuleInit() {
    await this.writeClient.$connect();
    await this.readClient.$connect();
  }

  async onModuleDestroy() {
    await this.writeClient.$disconnect();
    await this.readClient.$disconnect();
  }
}

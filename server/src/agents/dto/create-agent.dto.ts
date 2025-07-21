import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Allow } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAgentDto {
  @ApiProperty({ description: 'Agent name', example: 'AI Assistant Agent' })
  @IsString()
  @IsNotEmpty()
  agentName: string;

  @ApiProperty({ description: 'Agent address', example: '0x123...abc' })
  @IsString()
  @IsNotEmpty()
  agentAddress: string;

  @ApiProperty({
    description: 'Agent description',
    example: 'An AI agent that helps with tasks',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Author bio',
    example: 'Experienced AI developer',
  })
  @IsString()
  authorBio: string;

  @ApiProperty({ description: 'Agent classification', example: 'AI Assistant' })
  @IsString()
  agentClassification: string;

  @ApiProperty({ description: 'Tags', example: 'AI,Assistant,Automation' })
  @IsString()
  tags: string;

  @ApiProperty({ description: 'Agent price per job', example: 100.0, required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ description: 'Is private agent', example: false })
  @IsBoolean()
  isPrivate: boolean;

  @ApiProperty({ description: 'Auto accept jobs', example: true })
  @IsBoolean()
  autoAcceptJobs: boolean;

  @ApiProperty({ description: 'Contract type', example: 'Standard' })
  @IsString()
  contractType: string;

  @ApiProperty({ description: 'Is agent active', example: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Agent reputation', example: 4.5 })
  @IsNumber()
  reputation: number;

  @ApiProperty({ description: 'Success rate', example: 0.95 })
  @IsNumber()
  successRate: number;

  @ApiProperty({ description: 'Total jobs completed', example: 100 })
  @IsNumber()
  totalJobsCompleted: number;

  @ApiProperty({ description: 'Wallet address', example: '0x123...abc', required: false })
  @IsOptional()
  @IsString()
  walletAddress?: string;
}

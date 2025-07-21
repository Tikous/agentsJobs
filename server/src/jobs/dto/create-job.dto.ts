import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Allow,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJobDto {
  @ApiProperty({ description: 'Job title', example: 'Website Development' })
  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @ApiProperty({ description: 'Job category', example: 'Web Development' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Job description',
    example: 'Build a modern website',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Job deliverables',
    example: 'Responsive website with admin panel',
  })
  @IsString()
  @IsNotEmpty()
  deliverables: string;

  @ApiProperty({
    description: 'Budget details',
    example: { currency: 'USD', amount: 1000 },
    required: false,
  })
  @IsOptional()
  budget?: any; // JSON type

  @ApiProperty({ description: 'Maximum budget', example: 1000 })
  @IsNumber()
  maxBudget: number;

  @ApiProperty({
    description: 'Job deadline',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsString()
  deadline?: string;

  @ApiProperty({ description: 'Payment type', example: 'Fixed' })
  @IsString()
  paymentType: string;

  @ApiProperty({ description: 'Job priority', example: 'High' })
  @IsString()
  priority: string;

  @ApiProperty({ description: 'Required skill level', example: 'Intermediate' })
  @IsString()
  skillLevel: string;

  @ApiProperty({ description: 'Job tags', example: 'React,Node.js,MongoDB' })
  @IsString()
  tags: string;

  @ApiProperty({ description: 'Job status', example: 'Open' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Auto assign to best agent', example: true })
  @IsBoolean()
  autoAssign: boolean;

  @ApiProperty({ description: 'Allow bidding', example: false })
  @IsBoolean()
  allowBidding: boolean;

  @ApiProperty({ description: 'Enable escrow', example: true })
  @IsBoolean()
  escrowEnabled: boolean;

  @ApiProperty({ description: 'Is public job', example: true })
  @IsBoolean()
  isPublic: boolean;

  @ApiProperty({ description: 'Wallet address', example: '0x123...abc', required: false })
  @IsOptional()
  @IsString()
  walletAddress?: string;
}

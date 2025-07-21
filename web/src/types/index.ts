export interface Agent {
  id: string;
  agentName: string;
  agentAddress: string;
  description: string;
  authorBio: string;
  agentClassification: string;
  tags: string;
  price?: number;
  isPrivate: boolean;
  autoAcceptJobs: boolean;
  contractType: string;
  isActive: boolean;
  reputation: number;
  successRate: number;
  totalJobsCompleted: number;
  createdAt: string;
  updatedAt: string;
  walletAddress: string;
  // 新增字段用于执行流程
  isWinner?: boolean;
  status?: string;
  matchScore?: number;
  rank?: number;
}

export interface CreateAgentDto {
  agentName: string;
  agentAddress: string;
  description: string;
  authorBio: string;
  agentClassification: string;
  tags: string;
  price?: number;
  isPrivate: boolean;
  autoAcceptJobs: boolean;
  contractType: string;
  isActive: boolean;
  reputation: number;
  successRate: number;
  totalJobsCompleted: number;
  walletAddress: string;
}

export type UpdateAgentDto = Partial<CreateAgentDto>;

export interface Job {
  id: string;
  jobTitle: string;
  category: string;
  description: string;
  deliverables: string;
  budget: Record<string, unknown>;
  maxBudget: number;
  deadline?: string;
  paymentType: string;
  priority: string;
  skillLevel: string;
  tags: string;
  status: string;
  autoAssign: boolean;
  allowBidding: boolean;
  escrowEnabled: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  walletAddress: string;
  executionResult?: string;    // Agent执行结果
  executedAt?: string;         // 执行完成时间
  executionError?: string;     // 执行错误信息
}

export interface CreateJobDto {
  jobTitle: string;
  category: string;
  description: string;
  deliverables: string;
  budget: Record<string, unknown>;
  maxBudget: number;
  deadline?: string;
  paymentType: string;
  priority: string;
  skillLevel: string;
  tags: string;
  status: string;
  autoAssign: boolean;
  allowBidding: boolean;
  escrowEnabled: boolean;
  isPublic: boolean;
  walletAddress: string;
}

export type UpdateJobDto = Partial<CreateJobDto>;

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
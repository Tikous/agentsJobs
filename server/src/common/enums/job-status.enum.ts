export enum JobStatus {
  OPEN = 'Open',
  MATCHING = 'Matching',
  MATCHED = 'Matched', 
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  FAILED = 'Failed'
}

export const JOB_STATUS_LABELS = {
  [JobStatus.OPEN]: '开放中',
  [JobStatus.MATCHING]: '匹配中',
  [JobStatus.MATCHED]: '匹配成功',
  [JobStatus.IN_PROGRESS]: '工作中',
  [JobStatus.COMPLETED]: '执行完成',
  [JobStatus.CANCELLED]: '已取消',
  [JobStatus.FAILED]: '执行失败'
};

export const JOB_STATUS_FLOW = {
  [JobStatus.OPEN]: [JobStatus.MATCHING, JobStatus.CANCELLED],
  [JobStatus.MATCHING]: [JobStatus.MATCHED, JobStatus.FAILED, JobStatus.CANCELLED],
  [JobStatus.MATCHED]: [JobStatus.IN_PROGRESS, JobStatus.FAILED, JobStatus.CANCELLED],
  [JobStatus.IN_PROGRESS]: [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED],
  [JobStatus.COMPLETED]: [],
  [JobStatus.CANCELLED]: [],
  [JobStatus.FAILED]: [JobStatus.OPEN] // 可以重新开放
};
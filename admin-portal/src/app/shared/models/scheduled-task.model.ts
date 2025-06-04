export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  cronExpression: string;
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  taskType: string;
  parameters?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

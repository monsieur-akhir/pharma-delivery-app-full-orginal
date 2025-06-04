export interface SystemLog {
  id?: number;
  action: string;
  entity: string;
  entity_id?: number;
  user_id?: number;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at?: Date;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
}

export interface CreateSystemLogDto {
  action: string;
  entity: string;
  entity_id?: number;
  user_id?: number;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  level?: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
}

export interface SystemLogFilter {
  entity?: string;
  entity_id?: number;
  user_id?: number;
  level?: string;
  startDate?: Date;
  endDate?: Date;
}
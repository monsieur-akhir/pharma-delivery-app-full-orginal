export interface VideoChat {
  id: string;
  userId: string;
  pharmacyId?: string;
  doctorId?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  sessionId?: string;
  token?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

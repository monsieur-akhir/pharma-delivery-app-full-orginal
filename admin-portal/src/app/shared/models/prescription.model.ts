export interface Prescription {
  id: string;
  userId: string;
  orderId?: string;
  status: 'pending' | 'verified' | 'rejected';
  imageUrl: string;
  ocrText?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  expiryDate?: Date;
  prescribedMedications?: PrescribedMedication[];
}

export interface PrescribedMedication {
  id: string;
  prescriptionId: string;
  medicationName: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
}

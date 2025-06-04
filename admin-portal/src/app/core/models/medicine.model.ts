export enum MedicineCategory {
  PRESCRIPTION = 'PRESCRIPTION',
  OVER_THE_COUNTER = 'OVER_THE_COUNTER',
  SUPPLEMENT = 'SUPPLEMENT',
  EQUIPMENT = 'EQUIPMENT',
  COSMETIC = 'COSMETIC',
  OTHER = 'OTHER'
}

export enum MedicineStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONTINUED = 'DISCONTINUED'
}

export interface Medicine {
  id: number;
  name: string;
  genericName: string;
  description: string;
  category: MedicineCategory;
  manufacturer: string;
  dosage: string;
  price: number;
  imageUrl?: string;
  status: MedicineStatus;
  requiresPrescription: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicineListItem {
  id: number;
  name: string;
  genericName: string;
  category: MedicineCategory;
  price: number;
  status: MedicineStatus;
  requiresPrescription: boolean;
}

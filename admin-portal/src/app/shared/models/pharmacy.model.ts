export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  license: string;
  ownerId: string;
  status: 'pending' | 'active' | 'suspended' | 'closed';
  coverageArea: number;
  location?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  openingHours: {
    day: number;
    open: string;
    close: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

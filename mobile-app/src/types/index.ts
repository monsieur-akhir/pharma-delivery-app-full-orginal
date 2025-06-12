export interface Pharmacy {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isOpen?: boolean;
  rating?: number;
  phoneNumber?: string;
  openingHours?: string;
  imageUrl?: string;
}

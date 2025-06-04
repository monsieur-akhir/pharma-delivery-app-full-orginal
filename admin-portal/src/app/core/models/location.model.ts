export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number; // Unix timestamp or can be string if backend sends ISO
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  userId?: number;
  deliveryId?: string;
}

export interface ETAInfo {
  eta: number; // Estimated time of arrival in seconds
  etaFormatted: string; // Human-readable ETA
  distance: number; // Distance in kilometers
  // Add any other properties returned by the ETA endpoint
}

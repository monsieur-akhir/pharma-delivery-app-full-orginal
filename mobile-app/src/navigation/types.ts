// Define navigation parameter types
export type AppStackParamList = {
  Welcome: undefined;
  Auth: undefined;
  OTP: { phone: string };
  Main: undefined;
  HomeMain: undefined;
  PharmacyDetail: undefined;
  MedicineDetail: undefined;
  Cart: undefined;
  Checkout: undefined;
  ScanPrescription: undefined;
  PrescriptionDetail: undefined;
  VideoConsultation: undefined;
  Chat: undefined;
  TrackOrder: undefined;
  OrdersMain: undefined;
  OrderDetail: undefined;  PharmaciesMain: {
    latitude?: number;
    longitude?: number;
  };
  VideoChat: {
    roomId?: string;
    pharmacistId?: number;
    orderId?: number;
  };
  RemindersMain: undefined;
  AddReminder: undefined;
  ProfileMain: undefined;
  Prescriptions: undefined;
  PaymentMethods: undefined;
  AddPaymentMethod: undefined;
  Notifications: undefined;
  Settings: undefined;
};

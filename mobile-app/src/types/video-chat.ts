export interface VideoCallData {
  callId: string;
  pharmacistId: string;
  customerId: string;
  orderId?: string;
  status: 'waiting' | 'connected' | 'ended';
  startTime: Date;
  endTime?: Date;
}

export interface WebRTCStreamProps {
  streamURL: string;
  style?: any;
}

// Extend MediaStream interface for React Native WebRTC
declare global {
  interface MediaStream {
    toURL?: () => string;
  }
}

export interface VideoChatScreenProps {
  route: {
    params: {
      pharmacistId?: string;
      orderId?: string;
    };
  };
  navigation: any;
}
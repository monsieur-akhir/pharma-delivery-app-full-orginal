import api from './api.service';
import { store } from '../store';
import SimplePeer from 'simple-peer';
import io from 'socket.io-client';
import { API_URL } from '../config';

/**
 * Interface for consultation session
 */
export interface ConsultationSession {
  id: number;
  pharmacistId: number;
  pharmacistName: string;
  pharmacistAvatar?: string;
  userId: number;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  startTime?: string;
  endTime?: string;
  notes?: string;
  prescriptionId?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Service for handling video consultation functionality
 */
class VideoService {
  private socket!: ReturnType<typeof io>;  // '!' tells TypeScript this will be initialized
  private peer: SimplePeer.Instance | null = null;
  private stream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private onStreamCallbacks: ((stream: MediaStream) => void)[] = [];
  private onConnectCallbacks: (() => void)[] = [];
  private onDisconnectCallbacks: (() => void)[] = [];

  /**
   * Initialize socket connection for video chat
   */
  initializeSocket() {
    if (!this.socket) {
      this.socket = io(`${API_URL}`, {
        path: '/video-socket',
        auth: {
          token: store.getState().auth.token
        },
        transports: ['websocket']
      });

      this.setupSocketListeners();
    }
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Socket connected for video chat');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected from video chat');
      this.onDisconnectCallbacks.forEach(callback => callback());
    });

    this.socket.on('signal', (data: { signal: SimplePeer.SignalData }) => {
      if (this.peer && !this.peer.destroyed) {
        this.peer.signal(data.signal);
      }
    });

    this.socket.on('user-disconnected', () => {
      this.endCall();
      this.onDisconnectCallbacks.forEach(callback => callback());
    });
  }

  /**
   * Request a video consultation with a pharmacist
   * @param pharmacyId Pharmacy ID (optional)
   * @param prescriptionId Prescription ID (optional)
   */
  async requestConsultation(pharmacyId?: number, prescriptionId?: number) {
    try {
      const response = await api.post('/consultations/request', {
        pharmacyId,
        prescriptionId
      });
      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  }

  /**
   * Get user's active consultation or return null if none
   */
  async getActiveConsultation() {
    try {
      const response = await api.get('/consultations/active');
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 
          'status' in error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Start video call for a consultation
   * @param consultationId Consultation ID
   */
  async startVideoCall(consultationId: number) {
    try {
      this.initializeSocket();
      
      // Get local media stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Create peer connection
      this.peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream: this.stream
      });

      // Setup peer event listeners
      this.setupPeerListeners();

      // Join consultation room
      this.socket.emit('join-consultation', { consultationId });

      return this.stream;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Setup peer connection event listeners
   */
  private setupPeerListeners() {
    if (!this.peer) return;

    this.peer.on('signal', (data: SimplePeer.SignalData) => {
      this.socket.emit('signal', {
        signal: data,
        consultationId: (this.socket as any).consultationId
      });
    });

    this.peer.on('stream', (stream: MediaStream) => {
      this.remoteStream = stream;
      this.onStreamCallbacks.forEach(callback => callback(stream));
    });

    this.peer.on('connect', () => {
      console.log('Peer connection established');
      this.onConnectCallbacks.forEach(callback => callback());
    });

    this.peer.on('error', (err: Error) => {
      console.error('Peer connection error:', err);
      this.endCall();
    });
  }

  /**
   * End the current video call
   */
  endCall() {
    if (this.peer && !this.peer.destroyed) {
      this.peer.destroy();
      this.peer = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.socket) {
      this.socket.emit('leave-consultation');
    }
  }

  /**
   * Add callback for when remote stream is received
   * @param callback Function to call with remote stream
   */
  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onStreamCallbacks.push(callback);
    
    // If we already have a remote stream, call the callback immediately
    if (this.remoteStream) {
      callback(this.remoteStream);
    }
  }

  /**
   * Add callback for when peer connection is established
   * @param callback Function to call when connected
   */
  onConnect(callback: () => void) {
    this.onConnectCallbacks.push(callback);
  }

  /**
   * Add callback for when peer disconnects
   * @param callback Function to call when disconnected
   */
  onDisconnect(callback: () => void) {
    this.onDisconnectCallbacks.push(callback);
  }

  /**
   * Toggle mute state of local audio
   */
  toggleAudio() {
    if (this.stream) {
      const audioTrack = this.stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  /**
   * Toggle visibility of local video
   */
  toggleVideo() {
    if (this.stream) {
      const videoTrack = this.stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  /**
   * Switch camera between front and back (mobile only)
   */
  async switchCamera() {
    if (!this.stream) return false;
    
    const videoTrack = this.stream.getVideoTracks()[0];
    if (!videoTrack) return false;
    
    const settings = videoTrack.getSettings();
    const newFacingMode = settings.facingMode === 'user' ? 'environment' : 'user';
    
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: true
      });
      
      const newVideoTrack = newStream.getVideoTracks()[0];
      
      // Replace the track in the peer connection
      if (this.peer) {
        const sender = (this.peer as any)._senders.find((s: { track: MediaStreamTrack }) => s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(newVideoTrack);
        }
      }
      
      // Replace the track in our local stream
      this.stream.removeTrack(videoTrack);
      this.stream.addTrack(newVideoTrack);
      
      // Stop old track
      videoTrack.stop();
      
      return true;
    } catch (error) {
      console.error('Error switching camera:', error);
      return false;
    }
  }

  /**
   * Get user's consultation history
   */
  async getConsultationHistory() {
    try {
      const response = await api.get('/consultations/history');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * End a consultation session
   * @param consultationId Consultation ID
   * @param notes Optional notes about the consultation
   */
  async endConsultation(consultationId: number, notes?: string) {
    try {
      const response = await api.post(`/consultations/${consultationId}/end`, { notes });
      this.endCall();
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new VideoService();
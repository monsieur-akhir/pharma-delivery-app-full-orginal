import { Socket, io } from 'socket.io-client';
import Peer from 'simple-peer';
import { API_BASE_URL } from '../../config/constants';

// Interface for the video chat session
export interface VideoChatSession {
  roomId: string;
  participants: VideoChatParticipant[];
  startTime: Date;
}

export interface VideoChatParticipant {
  userId: number;
  username: string;
  isPharmacist: boolean;
  socketId: string;
  peer?: Peer.Instance;
  stream?: MediaStream;
}

export class VideoChatService {
  private socket: Socket | null = null;
  private localStream: MediaStream | null = null;
  private peers: Map<string, Peer.Instance> = new Map();
  private currentRoom: string | null = null;
  private userId: number | null = null;
  private username: string | null = null;
  private isPharmacist: boolean = false;
  
  // Event callbacks
  private onRemoteStreamAddedCallback: ((userId: number, stream: MediaStream) => void) | null = null;
  private onRemoteStreamRemovedCallback: ((userId: number) => void) | null = null;
  private onPharmacistJoinedCallback: ((pharmacist: VideoChatParticipant) => void) | null = null;
  private onPharmacistLeftCallback: (() => void) | null = null;
  private onConnectedCallback: (() => void) | null = null;
  private onDisconnectedCallback: (() => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;

  constructor() {}

  // Initialize the video chat service
  async initialize(userId: number, username: string, isPharmacist: boolean = false): Promise<void> {
    this.userId = userId;
    this.username = username;
    this.isPharmacist = isPharmacist;
    
    try {
      // Connect to the WebSocket server
      this.socket = io(`${API_BASE_URL}/video-chat`, {
        transports: ['websocket'],
        query: {
          userId: userId.toString(),
          username,
          isPharmacist: isPharmacist.toString(),
        },
      });
      
      // Set up socket event listeners
      this.setupSocketListeners();
      
      if (this.onConnectedCallback) {
        this.onConnectedCallback();
      }
    } catch (error) {
      console.error('Error initializing video chat service:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error as Error);
      }
    }
  }

  // Set up the local media stream (camera and microphone)
  async setupLocalStream(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error as Error);
      }
      throw error;
    }
  }

  // Create a new video chat room
  async createRoom(roomName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'));
        return;
      }
      
      this.socket.emit('create-room', { name: roomName, callType: 'pharmacist-consultation' }, (response: any) => {
        if (response.success) {
          this.currentRoom = response.roomId;
          resolve(response.roomId);
        } else {
          reject(new Error(response.message || 'Failed to create room'));
        }
      });
    });
  }

  // Join an existing video chat room
  async joinRoom(roomId: string): Promise<VideoChatSession> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'));
        return;
      }
      
      this.socket.emit('join-room', { roomId }, (response: any) => {
        if (response.success) {
          this.currentRoom = roomId;
          
          // Initiate WebRTC connections with existing participants
          this.initiatePeerConnections(response.room.users);
          
          const session: VideoChatSession = {
            roomId,
            participants: response.room.users.map((user: any) => ({
              userId: user.id,
              username: user.username,
              isPharmacist: user.isPharmacist,
              socketId: user.socketId,
            })),
            startTime: new Date(),
          };
          
          resolve(session);
        } else {
          reject(new Error(response.message || 'Failed to join room'));
        }
      });
    });
  }

  // Leave the current video chat room
  async leaveRoom(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.currentRoom) {
        resolve();
        return;
      }
      
      // Close all peer connections
      this.peers.forEach((peer) => {
        peer.destroy();
      });
      this.peers.clear();
      
      // Emit leave-room event to the server
      this.socket.emit('leave-room', {}, (response: any) => {
        if (response.success) {
          this.currentRoom = null;
          resolve();
        } else {
          reject(new Error(response.message || 'Failed to leave room'));
        }
      });
    });
  }

  // Toggle local audio (mute/unmute)
  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  // Toggle local video (show/hide)
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  // Switch camera (front/back) on mobile devices
  async switchCamera(): Promise<void> {
    if (!this.localStream) return;
    
    // Get current video track
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return;
    
    // Stop current track
    videoTrack.stop();
    
    // Find current facing mode
    const currentFacingMode = (videoTrack.getSettings().facingMode || 'user') === 'user' ? 'environment' : 'user';
    
    try {
      // Get new stream with opposite facing mode
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentFacingMode },
        audio: false,
      });
      
      // Replace track in local stream
      const newVideoTrack = newStream.getVideoTracks()[0];
      this.localStream.removeTrack(videoTrack);
      this.localStream.addTrack(newVideoTrack);
      
      // Replace track in all peer connections
      this.peers.forEach((peer) => {
        peer.replaceTrack(
          videoTrack,
          newVideoTrack,
          this.localStream as MediaStream
        );
      });
    } catch (error) {
      console.error('Error switching camera:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error as Error);
      }
    }
  }

  // Set up socket event listeners
  private setupSocketListeners(): void {
    if (!this.socket) return;
    
    // Handle user joined event
    this.socket.on('user-joined', (data: any) => {
      console.log('User joined:', data);
      
      // Create peer connection with the new user
      this.createPeer(data.socketId, true, data);
      
      // Notify if a pharmacist joined
      if (data.isPharmacist && this.onPharmacistJoinedCallback) {
        this.onPharmacistJoinedCallback({
          userId: data.userId,
          username: data.username,
          isPharmacist: true,
          socketId: data.socketId,
        });
      }
    });
    
    // Handle user left event
    this.socket.on('user-left', (data: any) => {
      console.log('User left:', data);
      
      // Close peer connection with the user who left
      const peer = this.peers.get(data.socketId);
      if (peer) {
        peer.destroy();
        this.peers.delete(data.socketId);
      }
      
      // Notify if a pharmacist left
      if (data.isPharmacist && this.onPharmacistLeftCallback) {
        this.onPharmacistLeftCallback();
      }
      
      // Notify remote stream removed
      if (this.onRemoteStreamRemovedCallback) {
        this.onRemoteStreamRemovedCallback(data.userId);
      }
    });
    
    // Handle WebRTC signaling
    this.socket.on('offer', (data: any) => {
      console.log('Received offer:', data);
      this.handleOffer(data);
    });
    
    this.socket.on('answer', (data: any) => {
      console.log('Received answer:', data);
      this.handleAnswer(data);
    });
    
    this.socket.on('ice-candidate', (data: any) => {
      console.log('Received ICE candidate:', data);
      this.handleIceCandidate(data);
    });
    
    // Handle when a pharmacist is assigned to the user
    this.socket.on('pharmacist-assigned', (data: any) => {
      console.log('Pharmacist assigned:', data);
    });
    
    // Handle pharmacist availability updates
    this.socket.on('pharmacist-status-update', (data: any) => {
      console.log('Pharmacist status update:', data);
    });
    
    // Handle errors
    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(new Error(error.message || 'Socket error'));
      }
    });
    
    // Handle disconnect
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      
      // Close all peer connections
      this.peers.forEach((peer) => {
        peer.destroy();
      });
      this.peers.clear();
      
      this.currentRoom = null;
      
      if (this.onDisconnectedCallback) {
        this.onDisconnectedCallback();
      }
    });
  }

  // Create a peer connection
  private createPeer(targetSocketId: string, initiator: boolean, userData?: any): Peer.Instance {
    console.log(`Creating peer, initiator: ${initiator}, target: ${targetSocketId}`);
    
    const peer = new Peer({
      initiator,
      trickle: true,
      stream: this.localStream || undefined,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      },
    });
    
    // Handle WebRTC signaling events
    peer.on('signal', (data) => {
      console.log('Signal generated:', data);
      if (initiator) {
        this.socket?.emit('offer', { target: targetSocketId, offer: data });
      } else {
        this.socket?.emit('answer', { target: targetSocketId, answer: data });
      }
    });
    
    peer.on('connect', () => {
      console.log('Peer connected:', targetSocketId);
    });
    
    peer.on('stream', (stream) => {
      console.log('Remote stream received:', stream);
      if (this.onRemoteStreamAddedCallback && userData) {
        this.onRemoteStreamAddedCallback(userData.userId, stream);
      }
    });
    
    peer.on('error', (err) => {
      console.error('Peer error:', err);
      if (this.onErrorCallback) {
        this.onErrorCallback(err);
      }
    });
    
    peer.on('close', () => {
      console.log('Peer connection closed:', targetSocketId);
      this.peers.delete(targetSocketId);
    });
    
    this.peers.set(targetSocketId, peer);
    return peer;
  }

  // Handle an offer from another peer
  private handleOffer(data: any): void {
    console.log('Handling offer from:', data.from);
    
    // Create a new peer as not the initiator
    const peer = this.createPeer(data.from, false, data.fromUser);
    
    // Signal the offer to the peer
    peer.signal(data.offer);
  }

  // Handle an answer from another peer
  private handleAnswer(data: any): void {
    console.log('Handling answer from:', data.from);
    
    // Get the peer by socket ID
    const peer = this.peers.get(data.from);
    if (peer) {
      // Signal the answer to the peer
      peer.signal(data.answer);
    } else {
      console.error('No peer found for socket ID:', data.from);
    }
  }

  // Handle an ICE candidate from another peer
  private handleIceCandidate(data: any): void {
    console.log('Handling ICE candidate from:', data.from);
    
    // Get the peer by socket ID
    const peer = this.peers.get(data.from);
    if (peer) {
      // Signal the ICE candidate to the peer
      peer.signal(data.candidate);
    } else {
      console.error('No peer found for socket ID:', data.from);
    }
  }

  // Initialize peer connections with existing room participants
  private initiatePeerConnections(users: any[]): void {
    users.forEach((user) => {
      // Don't create a connection with yourself
      if (user.id !== this.userId) {
        this.createPeer(user.socketId, true, user);
      }
    });
  }

  // Set the callback for when a remote stream is added
  setOnRemoteStreamAdded(callback: (userId: number, stream: MediaStream) => void): void {
    this.onRemoteStreamAddedCallback = callback;
  }

  // Set the callback for when a remote stream is removed
  setOnRemoteStreamRemoved(callback: (userId: number) => void): void {
    this.onRemoteStreamRemovedCallback = callback;
  }

  // Set the callback for when a pharmacist joins the call
  setOnPharmacistJoined(callback: (pharmacist: VideoChatParticipant) => void): void {
    this.onPharmacistJoinedCallback = callback;
  }

  // Set the callback for when a pharmacist leaves the call
  setOnPharmacistLeft(callback: () => void): void {
    this.onPharmacistLeftCallback = callback;
  }

  // Set the callback for when the socket is connected
  setOnConnected(callback: () => void): void {
    this.onConnectedCallback = callback;
  }

  // Set the callback for when the socket is disconnected
  setOnDisconnected(callback: () => void): void {
    this.onDisconnectedCallback = callback;
  }

  // Set the callback for errors
  setOnError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  // Clean up when the service is no longer needed
  cleanup(): void {
    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localStream = null;
    }
    
    // Close all peer connections
    this.peers.forEach((peer) => {
      peer.destroy();
    });
    this.peers.clear();
    
    // Disconnect the socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.currentRoom = null;
  }
}
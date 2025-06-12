import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RTCView } from 'react-native-webrtc';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../hooks/useAuth';
import { VideoChatService, VideoChatParticipant } from './video-chat.service';
import { Timeout } from '@/types/timer';

// Types for screen parameters
type VideoChatScreenParams = {
  pharmacistId?: number;
  orderId?: number;
  fromPharmacist?: boolean;
};

const VideoChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as VideoChatScreenParams;
  const { user } = useAuth();

  // References
  const videoChatServiceRef = useRef<VideoChatService | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<number, MediaStream>>(new Map());
  const [participants, setParticipants] = useState<VideoChatParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [pharmacistJoined, setPharmacistJoined] = useState(false);
  const [waitingForPharmacist, setWaitingForPharmacist] = useState(!params.fromPharmacist);
  const [callDuration, setCallDuration] = useState(0);
  const durationTimerRef = useRef<Timeout | null>(null);

  // Initialize video chat service
  useEffect(() => {
    const initializeVideoChat = async () => {
      try {
        // Create video chat service
        videoChatServiceRef.current = new VideoChatService();
        const videoChatService = videoChatServiceRef.current;

        // Set up event listeners
        videoChatService.setOnRemoteStreamAdded((userId, stream) => {
          console.log('Remote stream added from user:', userId);
          setRemoteStreams(prev => {
            const newStreams = new Map(prev);
            newStreams.set(userId, stream);
            return newStreams;
          });

          // If a pharmacist joined, update state
          const isFromPharmacist = participants.find(p => p.userId === userId)?.isPharmacist;
          if (isFromPharmacist) {
            setPharmacistJoined(true);
            setWaitingForPharmacist(false);

            // Start call duration timer
            if (!durationTimerRef.current) {
              durationTimerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
              }, 1000);
            }
          }
        });

        videoChatService.setOnRemoteStreamRemoved((userId) => {
          console.log('Remote stream removed from user:', userId);
          setRemoteStreams(prev => {
            const newStreams = new Map(prev);
            newStreams.delete(userId);
            return newStreams;
          });

          // If a pharmacist left, update state
          const isFromPharmacist = participants.find(p => p.userId === userId)?.isPharmacist;
          if (isFromPharmacist) {
            setPharmacistJoined(false);
            Alert.alert(
              'Pharmacist Left',
              'The pharmacist has left the consultation. Would you like to wait for another pharmacist or end the call?',
              [
                {
                  text: 'Wait',
                  onPress: () => setWaitingForPharmacist(true),
                },
                {
                  text: 'End Call',
                  onPress: () => endCall(),
                  style: 'cancel',
                },
              ]
            );
          }
        });

        videoChatService.setOnPharmacistJoined((pharmacist) => {
          console.log('Pharmacist joined:', pharmacist);
          setPharmacistJoined(true);
          setWaitingForPharmacist(false);
          setParticipants(prev => [...prev, pharmacist]);

          // Start call duration timer
          if (!durationTimerRef.current) {
            durationTimerRef.current = setInterval(() => {
              setCallDuration(prev => prev + 1);
            }, 1000);
          }
        });

        videoChatService.setOnPharmacistLeft(() => {
          console.log('Pharmacist left');
          setPharmacistJoined(false);

          // Clear call duration timer
          if (durationTimerRef.current) {
            clearInterval(durationTimerRef.current);
            durationTimerRef.current = null;
          }

          Alert.alert(
            'Pharmacist Left',
            'The pharmacist has left the consultation. Would you like to wait for another pharmacist or end the call?',
            [
              {
                text: 'Wait',
                onPress: () => setWaitingForPharmacist(true),
              },
              {
                text: 'End Call',
                onPress: () => endCall(),
                style: 'cancel',
              },
            ]
          );
        });

        videoChatService.setOnError((err) => {
          console.error('Video chat error:', err);
          setError(err.message);
        });

        // Initialize video chat service with user info
        if (user) {
          await videoChatService.initialize(
            user.id,
            user.username || user.fullName || 'User',
            params.fromPharmacist || false
          );
        }

        // Set up local media stream
        const stream = await videoChatService.setupLocalStream();
        localStreamRef.current = stream;
        setLocalStream(stream);

        // Create or join a room
        if (params.fromPharmacist && params.orderId) {
          // For pharmacists joining a specific consultation
          const roomName = `order-${params.orderId}`;
          setRoomId(roomName);
          await videoChatService.joinRoom(roomName);
        } else if (params.pharmacistId && user?.id) {
          // For customers wanting to talk to a specific pharmacist
          const roomName = `user-${user.id}-pharmacist-${params.pharmacistId}`;
          setRoomId(roomName);
          await videoChatService.joinRoom(roomName);
        } else if (user?.id) {
          // For customers requesting a consultation with any available pharmacist
          const roomName = `user-${user.id}-consultation`;
          const createdRoomId = await videoChatService.createRoom(roomName);
          setRoomId(createdRoomId);
          setWaitingForPharmacist(true);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Failed to initialize video chat:', err);
        setError(err.message || 'Failed to initialize video chat');
        setLoading(false);
      }
    };

    initializeVideoChat();

    // Cleanup function
    return () => {
      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // Clean up video chat service
      if (videoChatServiceRef.current) {
        videoChatServiceRef.current.cleanup();
      }

      // Clear duration timer
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, []);

  // Function to format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Function to toggle mute
  const toggleMute = () => {
    if (videoChatServiceRef.current) {
      videoChatServiceRef.current.toggleAudio(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  // Function to toggle video
  const toggleVideo = () => {
    if (videoChatServiceRef.current) {
      videoChatServiceRef.current.toggleVideo(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Function to switch camera
  const switchCamera = async () => {
    if (videoChatServiceRef.current) {
      try {
        await videoChatServiceRef.current.switchCamera();
      } catch (err: any) {
        console.error('Failed to switch camera:', err);
        Alert.alert('Error', 'Failed to switch camera');
      }
    }
  };

  // Function to end the call
  const endCall = async () => {
    try {
      if (videoChatServiceRef.current) {
        await videoChatServiceRef.current.leaveRoom();
      }

      // Clear duration timer
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }

      // Log call duration if we had a pharmacist join
      if (pharmacistJoined && roomId) {
        // Find the pharmacist participant
        const pharmacist = participants.find(p => p.isPharmacist);
        if (pharmacist) {
          try {
            // Log the call end with our backend API
            const response = await fetch('/api/video-chat/session/end', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user?.id,
                pharmacistId: pharmacist.userId,
                roomId,
                duration: callDuration,
              }),
            });

            if (!response.ok) {
              console.error('Failed to log call end:', await response.text());
            }
          } catch (err) {
            console.error('Failed to log call end:', err);
          }
        }
      }

      // Navigate back
      navigation.goBack();
    } catch (err: any) {
      console.error('Failed to end call:', err);
      Alert.alert('Error', 'Failed to end call');
    }
  };

  // Show loading screen
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Initializing video call...</Text>
      </View>
    );
  }

  // Show error screen
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get remote streams as array for rendering
  const remoteStreamsArray = Array.from(remoteStreams.values());

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {pharmacistJoined 
            ? 'Pharmacist Consultation'
            : waitingForPharmacist 
              ? 'Waiting for Pharmacist'
              : 'Video Chat'}
        </Text>
        {pharmacistJoined && (
          <Text style={styles.durationText}>
            {formatDuration(callDuration)}
          </Text>
        )}
      </View>

      {/* Video Streams */}
      <View style={styles.videoContainer}>
        {waitingForPharmacist ? (
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.waitingText}>
              Waiting for a pharmacist to join...
            </Text>
          </View>
        ) : remoteStreamsArray.length > 0 ? (
          <View style={styles.remoteVideoContainer}>
            {remoteStreamsArray.map((stream, index) => (
              <RTCView
                key={index}
                streamURL={stream.toURL?.() || ''}
                style={styles.remoteVideo}
                objectFit="cover"
              />
            ))}
          </View>
        ) : (
          <View style={styles.noRemoteStreamContainer}>
            <Ionicons name="videocam-off" size={48} color="#777" />
            <Text style={styles.noRemoteStreamText}>
              No one else is in the call
            </Text>
          </View>
        )}

        {/* Local Video (Picture-in-Picture) */}
        {localStream && (
          <View style={styles.localVideoContainer}>
            <RTCView
              streamURL={localStream.toURL?.() || ''}
              style={styles.localVideo}
              objectFit="cover"
              zOrder={1}
            />
          </View>
        )}
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={toggleMute}
        >
          <Ionicons
            name={isMuted ? 'mic-off' : 'mic'}
            size={24}
            color={isMuted ? '#FFF' : '#0066CC'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !isVideoEnabled && styles.controlButtonActive]}
          onPress={toggleVideo}
        >
          <Ionicons
            name={isVideoEnabled ? 'videocam' : 'videocam-off'}
            size={24}
            color={isVideoEnabled ? '#0066CC' : '#FFF'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={switchCamera}
        >
          <Ionicons name="camera-reverse" size={24} color="#0066CC" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={() => {
            Alert.alert(
              'End Call',
              'Are you sure you want to end this call?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'End Call',
                  onPress: endCall,
                  style: 'destructive',
                },
              ]
            );
          }}
        >
          <Ionicons name="call" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 24,
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  durationText: {
    fontSize: 16,
    color: '#666',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    position: 'relative',
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
  },
  waitingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
  },
  remoteVideoContainer: {
    flex: 1,
  },
  remoteVideo: {
    flex: 1,
  },
  noRemoteStreamContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
  },
  noRemoteStreamText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
  },
  localVideoContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 120,
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  localVideo: {
    flex: 1,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  controlButtonActive: {
    backgroundColor: '#0066CC',
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
  },
});

export default VideoChatScreen;
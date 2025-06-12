
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { RootState, AppDispatch } from '../store';
import { api } from '../services/api';

interface Consultation {
  id: number;
  pharmacistName: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt: string;
  duration: number;
  topic: string;
  pharmacyName: string;
}

const VideoConsultationScreen: React.FC = ({ navigation }: any) => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    loadConsultations();
    loadAvailableSlots();
  }, []);

  const loadConsultations = async () => {
    try {
      const response = await api.get('/api/video-chat/my-consultations');
      setConsultations(response.data);
    } catch (error) {
      console.error('Error loading consultations:', error);
      Alert.alert('Error', 'Failed to load consultations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      const response = await api.get('/api/video-chat/available-slots');
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Error loading slots:', error);
    }
  };

  const scheduleConsultation = async (slot: string) => {
    try {
      setIsScheduling(true);
      const response = await api.post('/api/video-chat/schedule', {
        scheduledAt: slot,
        topic: 'General consultation',
      });
      
      Alert.alert('Success', 'Consultation scheduled successfully');
      loadConsultations();
      loadAvailableSlots();
    } catch (error) {
      console.error('Error scheduling consultation:', error);
      Alert.alert('Error', 'Failed to schedule consultation');
    } finally {
      setIsScheduling(false);
    }
  };

  const joinConsultation = async (consultationId: number) => {
    try {
      const response = await api.post(`/api/video-chat/join/${consultationId}`);
      // Navigate to video chat screen with session details
      navigation.navigate('VideoChat', {
        sessionId: response.data.sessionId,
        consultationId,
      });
    } catch (error) {
      console.error('Error joining consultation:', error);
      Alert.alert('Error', 'Failed to join consultation');
    }
  };

  const renderConsultation = ({ item }: { item: Consultation }) => (
    <View style={styles.consultationCard}>
      <View style={styles.consultationHeader}>
        <Text style={styles.pharmacistName}>{item.pharmacistName}</Text>
        <View style={[
          styles.statusBadge,
          item.status === 'scheduled' && styles.statusScheduled,
          item.status === 'in_progress' && styles.statusInProgress,
          item.status === 'completed' && styles.statusCompleted,
          item.status === 'cancelled' && styles.statusCancelled,
        ]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>
      
      <Text style={styles.pharmacyName}>{item.pharmacyName}</Text>
      <Text style={styles.topic}>{item.topic}</Text>
      <Text style={styles.dateTime}>
        {new Date(item.scheduledAt).toLocaleString()}
      </Text>
      
      {item.status === 'scheduled' && (
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => joinConsultation(item.id)}
        >
          <MaterialIcons name="video-call" size={20} color="#fff" />
          <Text style={styles.joinButtonText}>Join Consultation</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAvailableSlot = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.slotCard}
      onPress={() => scheduleConsultation(item)}
      disabled={isScheduling}
    >
      <MaterialIcons name="schedule" size={20} color="#0C6B58" />
      <Text style={styles.slotTime}>
        {new Date(item).toLocaleString()}
      </Text>
      <MaterialIcons name="arrow-forward" size={20} color="#0C6B58" />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0C6B58" />
        <Text style={styles.loadingText}>Loading consultations...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#0C6B58" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Consultations</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Consultations</Text>
          {consultations.length > 0 ? (
            <FlatList
              data={consultations}
              renderItem={renderConsultation}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome5 name="video" size={50} color="#ccc" />
              <Text style={styles.emptyStateText}>No consultations scheduled</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Time Slots</Text>
          {availableSlots.length > 0 ? (
            <FlatList
              data={availableSlots}
              renderItem={renderAvailableSlot}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="schedule" size={50} color="#ccc" />
              <Text style={styles.emptyStateText}>No available slots</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  consultationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  consultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pharmacistName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusScheduled: {
    backgroundColor: '#e3f2fd',
  },
  statusInProgress: {
    backgroundColor: '#e8f5e8',
  },
  statusCompleted: {
    backgroundColor: '#f3e5f5',
  },
  statusCancelled: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  pharmacyName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  topic: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  dateTime: {
    fontSize: 14,
    color: '#0C6B58',
    fontWeight: '500',
    marginBottom: 12,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C6B58',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  slotTime: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default VideoConsultationScreen;


import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RootState, AppDispatch } from '../store';
import { getMyReminders, createReminder, updateReminder, deleteReminder, markReminderAsCompleted } from '../store/slices/reminderSlice';

interface Reminder {
  id: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: string;
  endDate?: string;
  isActive: boolean;
  notes?: string;
  nextDue: string;
  completedToday: boolean;
  streak: number;
  adherenceRate: number;
}

const RemindersScreen: React.FC = ({ navigation }: any) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(0);
  const [reminderForm, setReminderForm] = useState({
    medicationName: '',
    dosage: '',
    frequency: 'daily',
    times: ['08:00'],
    startDate: new Date(),
    endDate: null as Date | null,
    notes: '',
  });

  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.reminder);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const result = await dispatch(getMyReminders()).unwrap();
      setReminders(result);
    } catch (error) {
      console.error('Error loading reminders:', error);
      Alert.alert('Error', 'Failed to load reminders');
    }
  };

  const handleCreateReminder = async () => {
    try {
      const reminderData = {
        ...reminderForm,
        startDate: reminderForm.startDate.toISOString(),
        endDate: reminderForm.endDate?.toISOString(),
      };
      
      await dispatch(createReminder(reminderData)).unwrap();
      setIsModalVisible(false);
      resetForm();
      loadReminders();
      Alert.alert('Success', 'Reminder created successfully');
    } catch (error) {
      console.error('Error creating reminder:', error);
      Alert.alert('Error', 'Failed to create reminder');
    }
  };

  const handleUpdateReminder = async () => {
    if (!editingReminder) return;

    try {
      const reminderData = {
        ...reminderForm,
        startDate: reminderForm.startDate.toISOString(),
        endDate: reminderForm.endDate?.toISOString(),
      };
      
      await dispatch(updateReminder({ 
        id: editingReminder.id, 
        reminderData 
      })).unwrap();
      
      setIsModalVisible(false);
      setEditingReminder(null);
      resetForm();
      loadReminders();
      Alert.alert('Success', 'Reminder updated successfully');
    } catch (error) {
      console.error('Error updating reminder:', error);
      Alert.alert('Error', 'Failed to update reminder');
    }
  };

  const handleDeleteReminder = (reminderId: number) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteReminder(reminderId)).unwrap();
              loadReminders();
              Alert.alert('Success', 'Reminder deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete reminder');
            }
          },
        },
      ]
    );
  };

  const handleMarkCompleted = async (reminderId: number) => {
    try {
      await dispatch(markReminderAsCompleted(reminderId)).unwrap();
      loadReminders();
      Alert.alert('Great!', 'Medication marked as taken');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark medication as taken');
    }
  };

  const handleToggleReminder = async (reminder: Reminder) => {
    try {
      await dispatch(updateReminder({
        id: reminder.id,
        reminderData: { isActive: !reminder.isActive }
      })).unwrap();
      loadReminders();
    } catch (error) {
      Alert.alert('Error', 'Failed to update reminder');
    }
  };

  const openEditModal = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setReminderForm({
      medicationName: reminder.medicationName,
      dosage: reminder.dosage,
      frequency: reminder.frequency,
      times: reminder.times,
      startDate: new Date(reminder.startDate),
      endDate: reminder.endDate ? new Date(reminder.endDate) : null,
      notes: reminder.notes || '',
    });
    setIsModalVisible(true);
  };

  const resetForm = () => {
    setReminderForm({
      medicationName: '',
      dosage: '',
      frequency: 'daily',
      times: ['08:00'],
      startDate: new Date(),
      endDate: null,
      notes: '',
    });
    setEditingReminder(null);
  };

  const addTime = () => {
    setReminderForm({
      ...reminderForm,
      times: [...reminderForm.times, '12:00'],
    });
  };

  const removeTime = (index: number) => {
    const newTimes = reminderForm.times.filter((_, i) => i !== index);
    setReminderForm({
      ...reminderForm,
      times: newTimes,
    });
  };

  const updateTime = (index: number, time: string) => {
    const newTimes = [...reminderForm.times];
    newTimes[index] = time;
    setReminderForm({
      ...reminderForm,
      times: newTimes,
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNextDoseTime = (reminder: Reminder) => {
    if (!reminder.nextDue) return 'No upcoming dose';
    
    const nextDue = new Date(reminder.nextDue);
    const now = new Date();
    const diffMs = nextDue.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Overdue';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours < 1) {
      return `In ${diffMinutes} minutes`;
    } else if (diffHours < 24) {
      return `In ${diffHours}h ${diffMinutes}m`;
    } else {
      return nextDue.toLocaleDateString();
    }
  };

  const renderReminder = ({ item }: { item: Reminder }) => (
    <View style={styles.reminderCard}>
      <View style={styles.reminderHeader}>
        <View style={styles.reminderInfo}>
          <Text style={styles.medicationName}>{item.medicationName}</Text>
          <Text style={styles.dosage}>{item.dosage}</Text>
          <Text style={styles.frequency}>
            {item.frequency} at {item.times.map(formatTime).join(', ')}
          </Text>
        </View>
        <Switch
          value={item.isActive}
          onValueChange={() => handleToggleReminder(item)}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={item.isActive ? '#0C6B58' : '#f4f3f4'}
        />
      </View>

      <View style={styles.reminderStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Streak</Text>
          <Text style={styles.statValue}>{item.streak} days</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Adherence</Text>
          <Text style={styles.statValue}>{Math.round(item.adherenceRate)}%</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Next Dose</Text>
          <Text style={styles.statValue}>{getNextDoseTime(item)}</Text>
        </View>
      </View>

      <View style={styles.reminderActions}>
        {!item.completedToday && item.isActive && (
          <TouchableOpacity
            style={styles.takeButton}
            onPress={() => handleMarkCompleted(item.id)}
          >
            <MaterialIcons name="check" size={16} color="#fff" />
            <Text style={styles.takeButtonText}>Take Now</Text>
          </TouchableOpacity>
        )}
        
        {item.completedToday && (
          <View style={styles.completedBadge}>
            <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.completedText}>Taken Today</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditModal(item)}
        >
          <MaterialIcons name="edit" size={16} color="#0C6B58" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteReminder(item.id)}
        >
          <MaterialIcons name="delete" size={16} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0C6B58" />
        <Text style={styles.loadingText}>Loading reminders...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#0C6B58" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medication Reminders</Text>
        <TouchableOpacity onPress={() => setIsModalVisible(true)}>
          <MaterialIcons name="add" size={24} color="#0C6B58" />
        </TouchableOpacity>
      </View>

      {reminders.length > 0 ? (
        <FlatList
          data={reminders}
          renderItem={renderReminder}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <FontAwesome5 name="pills" size={64} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No Reminders Set</Text>
          <Text style={styles.emptyStateText}>
            Create your first medication reminder to stay on track
          </Text>
          <TouchableOpacity
            style={styles.createFirstButton}
            onPress={() => setIsModalVisible(true)}
          >
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.createFirstButtonText}>Create Reminder</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Create/Edit Reminder Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setIsModalVisible(false);
              resetForm();
            }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingReminder ? 'Edit Reminder' : 'New Reminder'}
            </Text>
            <TouchableOpacity
              onPress={editingReminder ? handleUpdateReminder : handleCreateReminder}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Medication Name *</Text>
              <TextInput
                style={styles.input}
                value={reminderForm.medicationName}
                onChangeText={(text) => setReminderForm({
                  ...reminderForm,
                  medicationName: text,
                })}
                placeholder="Enter medication name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dosage *</Text>
              <TextInput
                style={styles.input}
                value={reminderForm.dosage}
                onChangeText={(text) => setReminderForm({
                  ...reminderForm,
                  dosage: text,
                })}
                placeholder="e.g., 500mg, 2 tablets"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Frequency</Text>
              <View style={styles.frequencyButtons}>
                {['daily', 'twice-daily', 'three-times', 'as-needed'].map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyButton,
                      reminderForm.frequency === freq && styles.selectedFrequency,
                    ]}
                    onPress={() => setReminderForm({
                      ...reminderForm,
                      frequency: freq,
                    })}
                  >
                    <Text style={[
                      styles.frequencyButtonText,
                      reminderForm.frequency === freq && styles.selectedFrequencyText,
                    ]}>
                      {freq.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Times</Text>
              {reminderForm.times.map((time, index) => (
                <View key={index} style={styles.timeRow}>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => {
                      setSelectedTimeIndex(index);
                      setShowTimePicker(true);
                    }}
                  >
                    <Text style={styles.timeButtonText}>{formatTime(time)}</Text>
                  </TouchableOpacity>
                  {reminderForm.times.length > 1 && (
                    <TouchableOpacity onPress={() => removeTime(index)}>
                      <MaterialIcons name="remove-circle" size={24} color="#F44336" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addTimeButton} onPress={addTime}>
                <MaterialIcons name="add" size={20} color="#0C6B58" />
                <Text style={styles.addTimeText}>Add Time</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={reminderForm.notes}
                onChangeText={(text) => setReminderForm({
                  ...reminderForm,
                  notes: text,
                })}
                placeholder="Additional notes or instructions"
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {showTimePicker && (
            <DateTimePicker
              value={new Date(`2000-01-01T${reminderForm.times[selectedTimeIndex]}`)}
              mode="time"
              is24Hour={false}
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) {
                  const timeString = selectedTime.toTimeString().slice(0, 5);
                  updateTime(selectedTimeIndex, timeString);
                }
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    padding: 16,
  },
  reminderCard: {
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
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dosage: {
    fontSize: 14,
    color: '#0C6B58',
    fontWeight: '500',
    marginBottom: 2,
  },
  frequency: {
    fontSize: 14,
    color: '#666',
  },
  reminderStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  takeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  takeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  completedText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#ffebee',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C6B58',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  createFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveText: {
    fontSize: 16,
    color: '#0C6B58',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  frequencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  selectedFrequency: {
    backgroundColor: '#0C6B58',
    borderColor: '#0C6B58',
  },
  frequencyButtonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedFrequencyText: {
    color: '#fff',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#0C6B58',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addTimeText: {
    fontSize: 16,
    color: '#0C6B58',
    marginLeft: 8,
  },
});

export default RemindersScreen;

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface MedicineItemProps {
  medicine: {
    id: number;
    name: string;
    description: string;
  };
  onPress: () => void;
}

const MedicineItem: React.FC<MedicineItemProps> = ({ medicine, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.name}>{medicine.name}</Text>
      <Text style={styles.description}>{medicine.description}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
});

export default MedicineItem;

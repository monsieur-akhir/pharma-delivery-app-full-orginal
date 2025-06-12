import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

interface Medicine {
  id: number;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
}

interface MedicineItemProps {
  medicine: Medicine;
  onPress: (medicine: Medicine) => void;
}

const MedicineItem: React.FC<MedicineItemProps> = ({ medicine, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(medicine)}>
      <View style={styles.content}>
        <Text style={styles.name}>{medicine.name}</Text>
        <Text style={styles.price}>${medicine.price}</Text>
        {medicine.description && (
          <Text style={styles.description}>{medicine.description}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  price: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});

export default MedicineItem;
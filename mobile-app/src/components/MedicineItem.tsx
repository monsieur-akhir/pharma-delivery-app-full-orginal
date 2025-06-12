import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface MedicineItemProps {
  medicine: {
    id: string;
    name: string;
    price: number;
    dosage?: string;
    description?: string;
    requiresPrescription?: boolean;
  };
  onPress: () => void;
  onAddToCart?: () => void;
}

const MedicineItem: React.FC<MedicineItemProps> = ({ medicine, onPress, onAddToCart }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {medicine.requiresPrescription ? (
            <MaterialIcons name="local-pharmacy" size={32} color="#4A80F0" />
          ) : (
            <MaterialIcons name="healing" size={32} color="#ccc" />
          )}
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{medicine.name}</Text>
          {medicine.dosage && (
            <Text style={styles.dosage}>{medicine.dosage}</Text>
          )}
          {medicine.description && (
            <Text style={styles.description} numberOfLines={2}>
              {medicine.description}
            </Text>
          )}
          <Text style={styles.price}>{medicine.price.toLocaleString()} XOF</Text>
        </View>
        {onAddToCart && (
          <TouchableOpacity style={styles.addButton} onPress={onAddToCart}>
            <MaterialIcons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dosage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A80F0',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4A80F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MedicineItem;
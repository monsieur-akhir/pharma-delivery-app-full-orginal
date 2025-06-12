
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Medicine {
  id: number;
  name: string;
  description: string;
  price: number;
  inStock: boolean;
  requiresPrescription: boolean;
  imageUrl?: string;
  category: string;
  manufacturer: string;
}

interface MedicineItemProps {
  medicine: Medicine;
  onPress: () => void;
}

const MedicineItem: React.FC<MedicineItemProps> = ({ medicine, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        {medicine.imageUrl ? (
          <Image source={{ uri: medicine.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialIcons name="medication" size={32} color="#ccc" />
          </View>
        )}
        {medicine.requiresPrescription && (
          <View style={styles.prescriptionBadge}>
            <MaterialIcons name="receipt" size={12} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{medicine.name}</Text>
        <Text style={styles.manufacturer}>{medicine.manufacturer}</Text>
        <Text style={styles.description} numberOfLines={2}>{medicine.description}</Text>
        
        <View style={styles.footer}>
          <Text style={styles.price}>{medicine.price.toFixed(2)}€</Text>
          <View style={[styles.stockBadge, medicine.inStock ? styles.inStock : styles.outOfStock]}>
            <Text style={styles.stockText}>
              {medicine.inStock ? 'En stock' : 'Rupture'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prescriptionBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  manufacturer: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A80F0',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inStock: {
    backgroundColor: '#E8F5E8',
  },
  outOfStock: {
    backgroundColor: '#FFE8E8',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default MedicineItem;

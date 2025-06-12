import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Pharmacy } from '@/types';

interface PharmacyCardProps {
  pharmacy: Pharmacy;
  selected: boolean;
  onPress: () => void;
}

const PharmacyCard: React.FC<PharmacyCardProps> = ({ pharmacy, selected, onPress }) => {
  return (
    <TouchableOpacity 
      style={[styles.container, selected && styles.selected]} 
      onPress={onPress}
    >
      <View style={styles.content}>
        <Text style={styles.name}>{pharmacy.name}</Text>
        <Text style={styles.address}>{pharmacy.address}</Text>
        {pharmacy.isOpen && (
          <View style={styles.openBadge}>
            <Text style={styles.openText}>Open Now</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selected: {
    borderColor: '#4A80F0',
    borderWidth: 2,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  openBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  openText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
});

export default PharmacyCard;

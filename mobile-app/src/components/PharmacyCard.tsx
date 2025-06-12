
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Pharmacy {
  id: number;
  name: string;
  address: string;
  distance: number;
  isOpen: boolean;
  rating: number;
  reviewCount: number;
  deliveryFee: number;
  estimatedDeliveryTime: string;
}

interface PharmacyCardProps {
  pharmacy: Pharmacy;
  selected?: boolean;
  onPress: () => void;
}

const PharmacyCard: React.FC<PharmacyCardProps> = ({ pharmacy, selected, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.selectedContainer]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{pharmacy.name}</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, pharmacy.isOpen ? styles.openDot : styles.closedDot]} />
          <Text style={[styles.statusText, pharmacy.isOpen ? styles.openText : styles.closedText]}>
            {pharmacy.isOpen ? 'Ouvert' : 'Fermé'}
          </Text>
        </View>
      </View>

      <Text style={styles.address} numberOfLines={2}>{pharmacy.address}</Text>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <MaterialIcons name="star" size={14} color="#FFC107" />
          <Text style={styles.detailText}>
            {pharmacy.rating.toFixed(1)} ({pharmacy.reviewCount})
          </Text>
        </View>

        <View style={styles.detailItem}>
          <MaterialIcons name="location-on" size={14} color="#666" />
          <Text style={styles.detailText}>{pharmacy.distance.toFixed(1)} km</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.deliveryInfo}>
          <MaterialIcons name="delivery-dining" size={16} color="#4A80F0" />
          <Text style={styles.deliveryText}>
            {pharmacy.deliveryFee === 0 ? 'Gratuite' : `${pharmacy.deliveryFee}€`}
          </Text>
        </View>
        <Text style={styles.estimatedTime}>{pharmacy.estimatedDeliveryTime}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedContainer: {
    borderColor: '#4A80F0',
    backgroundColor: '#F0F7FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  openDot: {
    backgroundColor: '#10B981',
  },
  closedDot: {
    backgroundColor: '#F87171',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  openText: {
    color: '#10B981',
  },
  closedText: {
    color: '#F87171',
  },
  address: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 18,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: 12,
    color: '#4A80F0',
    fontWeight: '500',
    marginLeft: 4,
  },
  estimatedTime: {
    fontSize: 12,
    color: '#64748B',
  },
});

export default PharmacyCard;


import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { api } from '../services/api';

interface Pharmacy {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  rating: number;
  distance: number;
  isOpen: boolean;
  openingHours: {
    open: string;
    close: string;
  };
  services: string[];
  deliveryFee: number;
  estimatedDeliveryTime: number;
  medicineCount: number;
}

const PharmaciesScreen: React.FC = ({ navigation }: any) => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'deliveryTime'>('distance');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    openOnly: false,
    maxDistance: 10,
    minRating: 0,
    services: [] as string[],
  });

  useEffect(() => {
    loadPharmacies();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [pharmacies, searchQuery, sortBy, filters]);

  const loadPharmacies = async () => {
    try {
      const response = await api.get('/api/pharmacies', {
        params: {
          latitude: 5.3364, // Abidjan coordinates (should come from user location)
          longitude: -4.0267,
          radius: 20,
        },
      });
      setPharmacies(response.data);
    } catch (error) {
      console.error('Error loading pharmacies:', error);
      Alert.alert('Error', 'Failed to load pharmacies');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = pharmacies.filter(pharmacy => {
      // Search filter
      const matchesSearch = 
        pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pharmacy.address.toLowerCase().includes(searchQuery.toLowerCase());

      // Open filter
      const matchesOpen = !filters.openOnly || pharmacy.isOpen;

      // Distance filter
      const matchesDistance = pharmacy.distance <= filters.maxDistance;

      // Rating filter
      const matchesRating = pharmacy.rating >= filters.minRating;

      // Services filter
      const matchesServices = filters.services.length === 0 || 
        filters.services.some(service => pharmacy.services.includes(service));

      return matchesSearch && matchesOpen && matchesDistance && matchesRating && matchesServices;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return a.distance - b.distance;
        case 'rating':
          return b.rating - a.rating;
        case 'deliveryTime':
          return a.estimatedDeliveryTime - b.estimatedDeliveryTime;
        default:
          return 0;
      }
    });

    setFilteredPharmacies(filtered);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <MaterialIcons
          key={i}
          name={i <= rating ? 'star' : 'star-border'}
          size={16}
          color="#FFD700"
        />
      );
    }
    return stars;
  };

  const renderPharmacy = ({ item }: { item: Pharmacy }) => (
    <TouchableOpacity
      style={styles.pharmacyCard}
      onPress={() => navigation.navigate('PharmacyDetail', { pharmacyId: item.id })}
    >
      <View style={styles.pharmacyHeader}>
        <View style={styles.pharmacyInfo}>
          <Text style={styles.pharmacyName}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {renderStars(Math.floor(item.rating))}
            </View>
            <Text style={styles.ratingText}>({item.rating.toFixed(1)})</Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.isOpen ? '#4CAF50' : '#F44336' }
        ]}>
          <Text style={styles.statusText}>
            {item.isOpen ? 'Open' : 'Closed'}
          </Text>
        </View>
      </View>

      <Text style={styles.pharmacyAddress}>{item.address}</Text>

      <View style={styles.pharmacyDetails}>
        <View style={styles.detailItem}>
          <MaterialIcons name="location-on" size={16} color="#666" />
          <Text style={styles.detailText}>{item.distance.toFixed(1)} km</Text>
        </View>
        
        <View style={styles.detailItem}>
          <MaterialIcons name="schedule" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.estimatedDeliveryTime} min delivery
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <MaterialIcons name="local-shipping" size={16} color="#666" />
          <Text style={styles.detailText}>
            ${item.deliveryFee.toFixed(2)} delivery
          </Text>
        </View>
      </View>

      <View style={styles.servicesContainer}>
        {item.services.slice(0, 3).map((service, index) => (
          <View key={index} style={styles.serviceTag}>
            <Text style={styles.serviceTagText}>{service}</Text>
          </View>
        ))}
        {item.services.length > 3 && (
          <Text style={styles.moreServices}>+{item.services.length - 3} more</Text>
        )}
      </View>

      <View style={styles.pharmacyFooter}>
        <Text style={styles.medicineCount}>
          {item.medicineCount} medicines available
        </Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => Alert.alert('Call', `Calling ${item.phone}`)}
          >
            <MaterialIcons name="phone" size={16} color="#0C6B58" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.directionButton}
            onPress={() => navigation.navigate('PharmacyMap', {
              pharmacyId: item.id,
              latitude: 5.3364, // Should be pharmacy's actual coordinates
              longitude: -4.0267,
            })}
          >
            <MaterialIcons name="directions" size={16} color="#0C6B58" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const FilterModal = () => (
    <Modal
      visible={filterModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filters</Text>
          <TouchableOpacity onPress={() => {
            setFilters({
              openOnly: false,
              maxDistance: 10,
              minRating: 0,
              services: [],
            });
          }}>
            <Text style={styles.modalResetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          {/* Open Only Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Status</Text>
            <TouchableOpacity
              style={[
                styles.filterOption,
                filters.openOnly && styles.filterOptionSelected
              ]}
              onPress={() => setFilters({ ...filters, openOnly: !filters.openOnly })}
            >
              <Text style={[
                styles.filterOptionText,
                filters.openOnly && styles.filterOptionTextSelected
              ]}>
                Open pharmacies only
              </Text>
            </TouchableOpacity>
          </View>

          {/* Distance Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Maximum Distance: {filters.maxDistance} km</Text>
            <View style={styles.distanceOptions}>
              {[5, 10, 15, 20].map(distance => (
                <TouchableOpacity
                  key={distance}
                  style={[
                    styles.distanceOption,
                    filters.maxDistance === distance && styles.distanceOptionSelected
                  ]}
                  onPress={() => setFilters({ ...filters, maxDistance: distance })}
                >
                  <Text style={[
                    styles.distanceOptionText,
                    filters.maxDistance === distance && styles.distanceOptionTextSelected
                  ]}>
                    {distance} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Rating Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Minimum Rating</Text>
            <View style={styles.ratingOptions}>
              {[0, 3, 4, 4.5].map(rating => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingOption,
                    filters.minRating === rating && styles.ratingOptionSelected
                  ]}
                  onPress={() => setFilters({ ...filters, minRating: rating })}
                >
                  <Text style={[
                    styles.ratingOptionText,
                    filters.minRating === rating && styles.ratingOptionTextSelected
                  ]}>
                    {rating > 0 ? `${rating}+ stars` : 'Any rating'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => setFilterModalVisible(false)}
        >
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0C6B58" />
        <Text style={styles.loadingText}>Loading pharmacies...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#0C6B58" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pharmacies</Text>
        <TouchableOpacity onPress={() => navigation.navigate('PharmacyMap')}>
          <MaterialIcons name="map" size={24} color="#0C6B58" />
        </TouchableOpacity>
      </View>

      {/* Search and Sort */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search pharmacies..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <MaterialIcons name="filter-list" size={20} color="#0C6B58" />
        </TouchableOpacity>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {['distance', 'rating', 'deliveryTime'].map(option => (
          <TouchableOpacity
            key={option}
            style={[
              styles.sortOption,
              sortBy === option && styles.sortOptionSelected
            ]}
            onPress={() => setSortBy(option as any)}
          >
            <Text style={[
              styles.sortOptionText,
              sortBy === option && styles.sortOptionTextSelected
            ]}>
              {option === 'deliveryTime' ? 'Delivery Time' : 
               option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredPharmacies.length} pharmacies found
        </Text>
      </View>

      {/* Pharmacies List */}
      <FlatList
        data={filteredPharmacies}
        renderItem={renderPharmacy}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FontAwesome5 name="pills" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No pharmacies found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search or filters
            </Text>
          </View>
        }
      />

      <FilterModal />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  filterButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  sortOptionSelected: {
    backgroundColor: '#0C6B58',
  },
  sortOptionText: {
    fontSize: 12,
    color: '#666',
  },
  sortOptionTextSelected: {
    color: '#fff',
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  pharmacyCard: {
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
  pharmacyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pharmacyInfo: {
    flex: 1,
  },
  pharmacyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  pharmacyAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  pharmacyDetails: {
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
    color: '#666',
    marginLeft: 4,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  serviceTag: {
    backgroundColor: '#e6f7f4',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  serviceTagText: {
    fontSize: 12,
    color: '#0C6B58',
    fontWeight: '500',
  },
  moreServices: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  pharmacyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicineCount: {
    fontSize: 14,
    color: '#0C6B58',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  callButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#e6f7f4',
    marginRight: 8,
  },
  directionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#e6f7f4',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalResetText: {
    fontSize: 16,
    color: '#0C6B58',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  filterOptionSelected: {
    backgroundColor: '#0C6B58',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
  },
  filterOptionTextSelected: {
    color: '#fff',
  },
  distanceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  distanceOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  distanceOptionSelected: {
    backgroundColor: '#0C6B58',
  },
  distanceOptionText: {
    fontSize: 14,
    color: '#333',
  },
  distanceOptionTextSelected: {
    color: '#fff',
  },
  ratingOptions: {
    gap: 8,
  },
  ratingOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  ratingOptionSelected: {
    backgroundColor: '#0C6B58',
  },
  ratingOptionText: {
    fontSize: 14,
    color: '#333',
  },
  ratingOptionTextSelected: {
    color: '#fff',
  },
  applyButton: {
    backgroundColor: '#0C6B58',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default PharmaciesScreen;


import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { RootState, AppDispatch } from '../store';
import { getNearbyPharmacies, setSelectedPharmacy } from '../store/slices/medicineSlice';
import { getCurrentLocation } from '../store/slices/locationSlice';

interface Pharmacy {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  distance: number;
  isOpen: boolean;
  rating: number;
  reviewCount: number;
  deliveryFee: number;
  estimatedDeliveryTime: string;
  openingHours: {
    open: string;
    close: string;
  };
}

const PharmaciesScreen: React.FC = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filteredPharmacies, setFilteredPharmacies] = useState<Pharmacy[]>([]);

  const dispatch = useDispatch<AppDispatch>();
  const { pharmacies, isLoading } = useSelector((state: RootState) => state.medicine);
  const { currentLocation } = useSelector((state: RootState) => state.location);

  useEffect(() => {
    loadPharmacies();
  }, []);

  useEffect(() => {
    filterPharmacies();
  }, [searchQuery, pharmacies]);

  const loadPharmacies = async () => {
    try {
      if (!currentLocation) {
        const locationResult = await dispatch(getCurrentLocation()).unwrap();
        if (locationResult) {
          dispatch(getNearbyPharmacies({
            latitude: locationResult.latitude,
            longitude: locationResult.longitude,
            radius: 10
          }));
        }
      } else {
        dispatch(getNearbyPharmacies({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          radius: 10
        }));
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les pharmacies');
    }
  };

  const filterPharmacies = () => {
    if (!searchQuery) {
      setFilteredPharmacies(pharmacies);
    } else {
      const filtered = pharmacies.filter(pharmacy =>
        pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pharmacy.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPharmacies(filtered);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPharmacies();
    setRefreshing(false);
  };

  const handleSelectPharmacy = (pharmacy: Pharmacy) => {
    dispatch(setSelectedPharmacy(pharmacy));
    navigation.navigate('PharmacyDetail', { pharmacyId: pharmacy.id });
  };

  const renderPharmacyItem = ({ item }: { item: Pharmacy }) => (
    <TouchableOpacity
      style={styles.pharmacyCard}
      onPress={() => handleSelectPharmacy(item)}
    >
      <View style={styles.pharmacyHeader}>
        <View style={styles.pharmacyInfo}>
          <Text style={styles.pharmacyName}>{item.name}</Text>
          <Text style={styles.pharmacyAddress}>{item.address}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, item.isOpen ? styles.openDot : styles.closedDot]} />
          <Text style={[styles.statusText, item.isOpen ? styles.openText : styles.closedText]}>
            {item.isOpen ? 'Ouvert' : 'Fermé'}
          </Text>
        </View>
      </View>

      <View style={styles.pharmacyDetails}>
        <View style={styles.detailItem}>
          <MaterialIcons name="star" size={16} color="#FFC107" />
          <Text style={styles.detailText}>
            {item.rating.toFixed(1)} ({item.reviewCount} avis)
          </Text>
        </View>

        <View style={styles.detailItem}>
          <MaterialIcons name="location-on" size={16} color="#666" />
          <Text style={styles.detailText}>{item.distance.toFixed(1)} km</Text>
        </View>

        <View style={styles.detailItem}>
          <MaterialIcons name="delivery-dining" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.deliveryFee === 0 ? 'Livraison gratuite' : `${item.deliveryFee}€`}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <MaterialIcons name="schedule" size={16} color="#666" />
          <Text style={styles.detailText}>{item.estimatedDeliveryTime}</Text>
        </View>
      </View>

      <View style={styles.pharmacyActions}>
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => Alert.alert('Appel', `Appeler ${item.phone}`)}
        >
          <MaterialIcons name="phone" size={18} color="#0C6B58" />
          <Text style={styles.actionText}>Appeler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.directionsButton}
          onPress={() => navigation.navigate('PharmacyMap', {
            latitude: item.latitude,
            longitude: item.longitude
          })}
        >
          <MaterialIcons name="directions" size={18} color="#0C6B58" />
          <Text style={styles.actionText}>Itinéraire</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleSelectPharmacy(item)}
        >
          <MaterialIcons name="visibility" size={18} color="#fff" />
          <Text style={styles.viewButtonText}>Voir</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#0C6B58" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pharmacies</Text>
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => navigation.navigate('PharmacyMap')}
        >
          <MaterialIcons name="map" size={24} color="#0C6B58" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une pharmacie..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="clear" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0C6B58" />
          <Text style={styles.loadingText}>Chargement des pharmacies...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPharmacies}
          renderItem={renderPharmacyItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#0C6B58']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="store" size={50} color="#ccc" />
              <Text style={styles.emptyTitle}>Aucune pharmacie trouvée</Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Essayez avec un autre terme de recherche'
                  : 'Aucune pharmacie disponible dans votre zone'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  mapButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
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
    marginBottom: 12,
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
  pharmacyAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  openDot: {
    backgroundColor: '#4CAF50',
  },
  closedDot: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  openText: {
    color: '#4CAF50',
  },
  closedText: {
    color: '#F44336',
  },
  pharmacyDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  pharmacyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e6f7f4',
    borderRadius: 8,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e6f7f4',
    borderRadius: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#0C6B58',
    borderRadius: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#0C6B58',
    marginLeft: 4,
    fontWeight: '500',
  },
  viewButtonText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PharmaciesScreen;

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  RefreshControl
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '@/navigation/AppNavigator';
import { 
  searchMedicines, 
  setSearchQuery, 
  clearSearchResults,
  getNearbyPharmacies 
} from '@/store/slices/medicineSlice';
import { getCurrentLocation } from '@/store/slices/locationSlice';
import { AppDispatch, RootState } from '@/store';
import { Feather } from '@expo/vector-icons';
import MedicineItem from '../components/MedicineItem';
import PharmacyCard from '@/components/PharmacyCard';

type HomeScreenNavigationProp = StackNavigationProp<MainStackParamList, 'MainTabs'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const MedicineSearchScreen: React.FC<Props> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { 
    searchQuery, 
    searchResults, 
    pharmacies, 
    isLoading 
  } = useSelector((state: RootState) => state.medicine);
  const { currentLocation } = useSelector((state: RootState) => state.location);
  const { user } = useSelector((state: RootState) => state.auth);

  // Get user location and nearby pharmacies on component mount
  useEffect(() => {
    fetchLocationAndPharmacies();
  }, []);

  const fetchLocationAndPharmacies = async () => {
    try {
      const locationResult = await dispatch(getCurrentLocation()).unwrap();
      if (locationResult) {
        dispatch(getNearbyPharmacies({
          latitude: locationResult.latitude,
          longitude: locationResult.longitude,
          radius: 5 // 5km radius
        }));
      }
    } catch (error) {
      console.error('Failed to fetch location or pharmacies:', error);
    }
  };

  const handleSearch = (text: string) => {
    dispatch(setSearchQuery(text));
    
    if (text.length >= 2) {
      dispatch(searchMedicines(text));
    } else {
      dispatch(clearSearchResults());
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLocationAndPharmacies();
    setRefreshing(false);
  };

  const handleShowMap = () => {
    navigation.navigate('PharmacyMap', currentLocation);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.greeting}>Hello, {user?.firstName || 'there'}!</Text>
      <Text style={styles.subtitle}>Find your medications or nearby pharmacies</Text>
      
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search medicines..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Feather name="x" size={20} color="#64748B" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {currentLocation ? (
        <View style={styles.locationContainer}>
          <Feather name="map-pin" size={16} color="#4A80F0" />
          <Text style={styles.locationText} numberOfLines={1}>
            {currentLocation.address || 'Current location'}
          </Text>
          <TouchableOpacity onPress={handleShowMap} style={styles.mapButton}>
            <Text style={styles.mapButtonText}>View Map</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.enableLocationButton}
          onPress={() => dispatch(getCurrentLocation())}
        >
          <Feather name="map-pin" size={16} color="#fff" />
          <Text style={styles.enableLocationText}>Enable Location</Text>
        </TouchableOpacity>
      )}
      
      {/* Nearby Pharmacies Section */}
      {pharmacies.length > 0 && !searchQuery && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Pharmacies</Text>
            <TouchableOpacity onPress={handleShowMap}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={pharmacies.slice(0, 5)}
            renderItem={({ item }) => (
              <PharmacyCard 
                pharmacy={item} 
                selected={false} 
                onPress={() => navigation.navigate('PharmacyMap', { 
                  latitude: item.latitude, 
                  longitude: item.longitude 
                })} 
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pharmacyList}
          />
        </>
      )}

      {/* Display search results or featured products */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {searchQuery ? 'Search Results' : 'Featured Products'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A80F0" />
        </View>
      ) : (
        <FlatList
          data={searchResults.length > 0 ? searchResults : []}
          renderItem={({ item }) => (
            <MedicineItem 
              medicine={item} 
              onPress={() => {
                // Navigate to medicine detail or pharmacy selection
              }}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.contentContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {searchQuery ? (
                <>
                  <Feather name="search" size={50} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>No results found</Text>
                  <Text style={styles.emptyText}>Try a different search term or browse nearby pharmacies</Text>
                </>
              ) : (
                <>
                  <Feather name="package" size={50} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>Browse medications</Text>
                  <Text style={styles.emptyText}>Search for medications or visit a pharmacy</Text>
                </>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#4A80F0']}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  mapButton: {
    backgroundColor: '#F0F7FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  mapButtonText: {
    color: '#4A80F0',
    fontSize: 12,
    fontWeight: '500',
  },
  enableLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A80F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  enableLocationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4A80F0',
    fontWeight: '500',
  },
  pharmacyList: {
    paddingBottom: 16,
  },
  emptyContainer: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default MedicineSearchScreen;

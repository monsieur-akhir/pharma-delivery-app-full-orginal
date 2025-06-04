import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '@/navigation/AppNavigator';
import { getNearbyPharmacies, getPharmacyById, setSelectedPharmacy } from '@/store/slices/medicineSlice';
import { getCurrentLocation } from '@/store/slices/locationSlice';
import { AppDispatch, RootState } from '@/store';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import PharmacyCard from '@/components/PharmacyCard';

type PharmacyMapScreenNavigationProp = StackNavigationProp<MainStackParamList, 'PharmacyMap'>;
type PharmacyMapScreenRouteProp = RouteProp<MainStackParamList, 'PharmacyMap'>;

interface Props {
  navigation: PharmacyMapScreenNavigationProp;
  route: PharmacyMapScreenRouteProp;
}

const { width } = Dimensions.get('window');

const PharmacyMapScreen: React.FC<Props> = ({ navigation, route }) => {
  const [selectedMarkerId, setSelectedMarkerId] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = React.useRef<MapView>(null);
  
  const dispatch = useDispatch<AppDispatch>();
  const { pharmacies, selectedPharmacy, isLoading } = useSelector((state: RootState) => state.medicine);
  const { currentLocation } = useSelector((state: RootState) => state.location);
  
  // Get initial location
  const initialLocation = route.params || currentLocation || {
    latitude: 37.78825,
    longitude: -122.4324,
  };

  // Load nearby pharmacies on component mount
  useEffect(() => {
    if (!pharmacies.length) {
      loadNearbyPharmacies();
    }
    
    // If a specific pharmacy location was passed, select it
    if (route.params?.latitude && route.params?.longitude) {
      // Find the pharmacy that matches these coordinates
      const foundPharmacy = pharmacies.find(
        p => p.latitude === route.params?.latitude && p.longitude === route.params?.longitude
      );
      
      if (foundPharmacy) {
        handleSelectPharmacy(foundPharmacy.id);
      }
    }
  }, [route.params]);

  const loadNearbyPharmacies = async () => {
    try {
      // If we don't have current location, get it first
      if (!currentLocation) {
        const locationResult = await dispatch(getCurrentLocation()).unwrap();
        if (locationResult) {
          dispatch(getNearbyPharmacies({
            latitude: locationResult.latitude,
            longitude: locationResult.longitude,
            radius: 10 // 10km radius
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
      console.error('Failed to load nearby pharmacies:', error);
    }
  };

  const handleSelectPharmacy = async (id: number) => {
    setSelectedMarkerId(id);
    
    // Get detailed pharmacy info if needed
    await dispatch(getPharmacyById(id));
    
    // Find the pharmacy to center map on it
    const pharmacy = pharmacies.find(p => p.id === id);
    if (pharmacy && mapRef.current && mapReady) {
      mapRef.current.animateToRegion({
        latitude: pharmacy.latitude,
        longitude: pharmacy.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  const handleViewPharmacy = () => {
    if (selectedPharmacy) {
      // Navigate to pharmacy detail or medicine list
      dispatch(setSelectedPharmacy(selectedPharmacy));
      navigation.navigate('Cart');
    }
  };

  const handleMapReady = () => {
    setMapReady(true);
    
    // If there are pharmacies and a selected marker, center the map
    if (selectedMarkerId && mapRef.current) {
      const pharmacy = pharmacies.find(p => p.id === selectedMarkerId);
      if (pharmacy) {
        mapRef.current.animateToRegion({
          latitude: pharmacy.latitude,
          longitude: pharmacy.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      }
    }
  };

  if (isLoading && !pharmacies.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A80F0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton
        onMapReady={handleMapReady}
      >
        {pharmacies.map((pharmacy) => (
          <Marker
            key={pharmacy.id}
            coordinate={{
              latitude: pharmacy.latitude,
              longitude: pharmacy.longitude,
            }}
            title={pharmacy.name}
            description={pharmacy.address}
            onPress={() => handleSelectPharmacy(pharmacy.id)}
            pinColor={selectedMarkerId === pharmacy.id ? '#4A80F0' : '#F87171'}
          />
        ))}
      </MapView>
      
      {/* Current location button */}
      <TouchableOpacity 
        style={styles.locationButton}
        onPress={() => {
          if (currentLocation && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }, 500);
          } else {
            dispatch(getCurrentLocation());
          }
        }}
      >
        <Feather name="navigation" size={24} color="#4A80F0" />
      </TouchableOpacity>
      
      {/* Pharmacy list at bottom */}
      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.bottomSheetTitle}>
            {pharmacies.length} Pharmacies Nearby
          </Text>
        </View>
        
        <FlatList
          data={pharmacies}
          renderItem={({ item }) => (
            <PharmacyCard
              pharmacy={item}
              selected={selectedMarkerId === item.id}
              onPress={() => handleSelectPharmacy(item.id)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          pagingEnabled
          snapToInterval={width - 40}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pharmacyList}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / (width - 40)
            );
            if (pharmacies[index]) {
              handleSelectPharmacy(pharmacies[index].id);
            }
          }}
        />
      </View>
      
      {/* View pharmacy button */}
      {selectedPharmacy && (
        <TouchableOpacity style={styles.viewButton} onPress={handleViewPharmacy}>
          <Text style={styles.viewButtonText}>View Medicines</Text>
        </TouchableOpacity>
      )}
    </View>
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
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  locationButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomSheetHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  pharmacyList: {
    paddingHorizontal: 20,
  },
  viewButton: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    right: 20,
    backgroundColor: '#4A80F0',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default PharmacyMapScreen;

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';
import LocationTracker from '../location/LocationTracker';
import { API_URL } from '../config';

const DeliveryTrackingScreen = ({ 
  route, 
  navigation 
}) => {
  // Extract delivery info from route params
  const { 
    deliveryId, 
    orderId, 
    userId, 
    isDeliverer = false, 
    initialRegion = null,
    customerAddress = null,
    pharmacyAddress = null,
  } = route.params || {};

  // Map and location state
  const [region, setRegion] = useState(initialRegion || {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.015,
    longitudeDelta: 0.0121,
  });
  const [delivererLocation, setDelivererLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [pharmacyLocation, setPharmacyLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [eta, setEta] = useState(null);
  const [isTracking, setIsTracking] = useState(true);
  const [trackingStatus, setTrackingStatus] = useState('initializing');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs
  const mapRef = useRef(null);
  
  // Use the LocationTracker hook
  const locationTracker = LocationTracker({
    userId,
    deliveryId,
    isDeliverer,
    isActive: isTracking,
    onLocationUpdate: handleLocationUpdate,
    onStatusChange: handleTrackingStatusChange,
  });

  // Handle location updates
  function handleLocationUpdate(locationData) {
    console.log('Location update received:', locationData);
    
    const newLocation = {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      accuracy: locationData.accuracy,
      heading: locationData.heading,
      timestamp: locationData.timestamp,
    };
    
    // Update deliverer location
    setDelivererLocation(newLocation);
    
    // Add to route coordinates for drawing the path
    setRouteCoordinates(prevCoords => {
      if (prevCoords.length === 0) {
        return [newLocation];
      }
      
      // Only add points if they are different from the last one
      const lastCoord = prevCoords[prevCoords.length - 1];
      if (
        lastCoord.latitude !== newLocation.latitude ||
        lastCoord.longitude !== newLocation.longitude
      ) {
        return [...prevCoords, newLocation];
      }
      
      return prevCoords;
    });
    
    // If we're following the deliverer, move the map
    if (isTracking) {
      mapRef.current?.animateToRegion({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      }, 1000);
    }
  }

  // Handle tracking status changes
  function handleTrackingStatusChange(status) {
    console.log('Tracking status changed:', status);
    setTrackingStatus(status);
    
    // Update UI based on status
    switch (status) {
      case 'permission-denied':
        setErrorMessage('Location permission was denied');
        break;
      case 'background-permission-denied':
        setErrorMessage('Background location permission was denied');
        break;
      case 'tracking-error':
        setErrorMessage(locationTracker.errorMsg || 'Error tracking location');
        break;
      case 'tracking':
        setErrorMessage(null);
        break;
      default:
        break;
    }
  }

  // Fetch initial delivery data
  useEffect(() => {
    const fetchDeliveryData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch current location of deliverer
        const response = await fetch(`${API_URL}/api/location/current/${deliveryId}`);
        
        if (response.ok) {
          const locationData = await response.json();
          
          if (locationData) {
            setDelivererLocation({
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              timestamp: locationData.timestamp,
            });
            
            // Center map on deliverer location
            setRegion({
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              latitudeDelta: 0.015,
              longitudeDelta: 0.0121,
            });
          }
        }
        
        // Fetch customer location if available
        if (customerAddress && customerAddress.latitude && customerAddress.longitude) {
          setCustomerLocation({
            latitude: customerAddress.latitude,
            longitude: customerAddress.longitude,
          });
        } else {
          // Geocode the customer address if only text address is available
          // This would typically use a service like Google Maps Geocoding API
          console.log('Customer location needs geocoding');
        }
        
        // Fetch pharmacy location if available
        if (pharmacyAddress && pharmacyAddress.latitude && pharmacyAddress.longitude) {
          setPharmacyLocation({
            latitude: pharmacyAddress.latitude,
            longitude: pharmacyAddress.longitude,
          });
        } else {
          // Geocode the pharmacy address if only text address is available
          console.log('Pharmacy location needs geocoding');
        }
        
        // Fetch route history to show the path taken so far
        const historyResponse = await fetch(
          `${API_URL}/api/location/history/${deliveryId}?limit=50`
        );
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          
          if (historyData && historyData.length > 0) {
            const coordinates = historyData.map(point => ({
              latitude: point.latitude,
              longitude: point.longitude,
            }));
            
            setRouteCoordinates(coordinates);
          }
        }
        
        // Fetch ETA if customer location is available
        if (customerLocation) {
          await fetchETA();
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching delivery data:', error);
        setErrorMessage('Error loading delivery data');
        setIsLoading(false);
      }
    };
    
    fetchDeliveryData();
    
    // Refresh ETA periodically
    const etaInterval = setInterval(() => {
      if (customerLocation && delivererLocation) {
        fetchETA();
      }
    }, 60000); // Every minute
    
    return () => {
      clearInterval(etaInterval);
    };
  }, [deliveryId, customerAddress, pharmacyAddress]);

  // Fetch ETA to customer
  const fetchETA = async () => {
    try {
      if (!customerLocation || !delivererLocation) return;
      
      const response = await fetch(
        `${API_URL}/api/location/eta/${deliveryId}?destinationLat=${customerLocation.latitude}&destinationLng=${customerLocation.longitude}`
      );
      
      if (response.ok) {
        const etaData = await response.json();
        setEta(etaData.etaFormatted);
      }
    } catch (error) {
      console.error('Error fetching ETA:', error);
    }
  };

  // Toggle tracking/following mode
  const toggleTracking = () => {
    setIsTracking(prev => !prev);
  };

  // Center map on current location
  const centerOnCurrentLocation = async () => {
    if (delivererLocation) {
      mapRef.current?.animateToRegion({
        latitude: delivererLocation.latitude,
        longitude: delivererLocation.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
      }, 1000);
    }
  };

  // Show all delivery points (deliverer, customer, pharmacy)
  const showAllPoints = () => {
    if (!mapRef.current) return;
    
    const points = [
      delivererLocation,
      customerLocation,
      pharmacyLocation,
    ].filter(Boolean);
    
    if (points.length < 2) return;
    
    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0C6B58" />
        <Text style={styles.loadingText}>Loading delivery tracking...</Text>
      </View>
    );
  }

  // Render error state
  if (errorMessage) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="error-outline" size={48} color="#FF5252" />
        <Text style={styles.errorText}>{errorMessage}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            locationTracker.startTracking();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : null}
        initialRegion={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        onRegionChangeComplete={newRegion => {
          setRegion(newRegion);
        }}
      >
        {/* Pharmacy Marker */}
        {pharmacyLocation && (
          <Marker
            coordinate={pharmacyLocation}
            title="Pharmacy"
            description="Medication pickup location"
            pinColor="#4CAF50"
          >
            <View style={styles.markerContainer}>
              <FontAwesome5 name="clinic-medical" size={24} color="#4CAF50" />
            </View>
          </Marker>
        )}

        {/* Customer Marker */}
        {customerLocation && (
          <Marker
            coordinate={customerLocation}
            title="Delivery Address"
            description="Medication delivery location"
            pinColor="#2196F3"
          >
            <View style={styles.markerContainer}>
              <FontAwesome5 name="home" size={24} color="#2196F3" />
            </View>
          </Marker>
        )}

        {/* Deliverer Marker */}
        {delivererLocation && (
          <Marker
            coordinate={delivererLocation}
            title="Deliverer"
            description="Current deliverer location"
          >
            <View style={styles.markerContainer}>
              <FontAwesome5 name="motorcycle" size={24} color="#FF5722" />
            </View>
          </Marker>
        )}

        {/* Route Path */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor="#FF5722"
          />
        )}
      </MapView>

      {/* ETA Panel */}
      {eta && (
        <View style={styles.etaPanel}>
          <Text style={styles.etaTitle}>Estimated Arrival</Text>
          <Text style={styles.etaValue}>{eta}</Text>
        </View>
      )}

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={centerOnCurrentLocation}
        >
          <MaterialIcons name="my-location" size={24} color="#0C6B58" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, isTracking && styles.activeButton]}
          onPress={toggleTracking}
        >
          <MaterialIcons
            name={isTracking ? 'gps-fixed' : 'gps-not-fixed'}
            size={24}
            color={isTracking ? '#FFFFFF' : '#0C6B58'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={showAllPoints}
        >
          <MaterialIcons name="zoom-out-map" size={24} color="#0C6B58" />
        </TouchableOpacity>
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {isDeliverer
            ? 'You are delivering this order'
            : 'Tracking your delivery'}
        </Text>
        <Text style={styles.deliveryId}>Order #{orderId}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    color: '#FF5252',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#0C6B58',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 30,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 100,
    backgroundColor: 'transparent',
  },
  controlButton: {
    backgroundColor: '#FFFFFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  activeButton: {
    backgroundColor: '#0C6B58',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  etaPanel: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  etaTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  etaValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C6B58',
  },
  statusBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0C6B58',
    padding: 16,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deliveryId: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 4,
    opacity: 0.8,
  },
});

export default DeliveryTrackingScreen;
import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Platform, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.015;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

/**
 * DeliveryMap Component
 * A reusable map component for tracking deliveries
 */
const DeliveryMap = ({
  delivererLocation,
  customerLocation,
  pharmacyLocation,
  routeCoordinates = [],
  initialRegion = null,
  onRegionChange,
  showTraffic = false,
  isLoading = false,
  mapRef,
  style = {},
}) => {
  // Create default initial region if none provided
  const [region, setRegion] = useState(
    initialRegion || {
      latitude: pharmacyLocation?.latitude || customerLocation?.latitude || 37.78825,
      longitude: pharmacyLocation?.longitude || customerLocation?.longitude || -122.4324,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    }
  );

  // Update region when locations change
  useEffect(() => {
    if (delivererLocation) {
      setRegion({
        latitude: delivererLocation.latitude,
        longitude: delivererLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  }, []);

  // Fit all markers on the map
  const fitToMarkers = () => {
    if (!mapRef?.current) return;

    const markers = [
      delivererLocation,
      customerLocation,
      pharmacyLocation,
    ].filter(Boolean);

    if (markers.length > 1) {
      mapRef.current.fitToCoordinates(markers, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  // Fit markers when the map is ready
  useEffect(() => {
    const timeout = setTimeout(() => {
      fitToMarkers();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [delivererLocation, customerLocation, pharmacyLocation]);

  // Show loading indicator while map is preparing
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0C6B58" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : null}
        initialRegion={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        showsTraffic={showTraffic}
        onRegionChangeComplete={(newRegion) => {
          setRegion(newRegion);
          if (onRegionChange) {
            onRegionChange(newRegion);
          }
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
        {routeCoordinates && routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor="#FF5722"
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
});

export default DeliveryMap;
import { useState, useEffect, useRef } from 'react';
import { Platform, Alert, AppState } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { API_URL } from '../config';
import io from 'socket.io-client';

// Define task name for background location updates
const LOCATION_TRACKING = 'location-tracking';
const TRACKING_INTERVAL = 10000; // 10 seconds

// Define LocationTracker as a functional component
const LocationTracker = ({ 
  userId, 
  deliveryId, 
  isDeliverer = false, 
  onLocationUpdate = () => {}, 
  onStatusChange = () => {},
  minAccuracy = 100, // meters
  distanceInterval = 10, // meters
  isActive = false,
}) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState('idle');
  const [permissionStatus, setPermissionStatus] = useState(null);
  const socketRef = useRef(null);
  const appState = useRef(AppState.currentState);

  // Initialize socket connection
  useEffect(() => {
    if (isActive && userId && deliveryId) {
      // Connect to socket server
      socketRef.current = io(`${API_URL}/delivery-tracking`, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      // Socket event handlers
      socketRef.current.on('connect', () => {
        console.log('Socket connected');
        
        // Authenticate with the socket server
        socketRef.current.emit('authenticate', {
          userId,
          role: isDeliverer ? 'deliverer' : 'customer',
        });
      });

      socketRef.current.on('authenticate_result', (response) => {
        console.log('Authentication result:', response);
        
        // If we're a customer, subscribe to delivery updates
        if (!isDeliverer && response.status === 'authenticated') {
          socketRef.current.emit('subscribe_delivery', { deliveryId });
        }
      });

      socketRef.current.on('location_update_result', (response) => {
        console.log('Location update result:', response);
      });

      socketRef.current.on('location_updated', (locationData) => {
        // Handle incoming location update (primarily for customers)
        onLocationUpdate(locationData);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      // Clean up on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [isActive, userId, deliveryId, isDeliverer]);

  // Define background task to send location updates
  TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }) => {
    if (error) {
      console.error('Background location task error:', error);
      return;
    }
    if (data) {
      const { locations } = data;
      const location = locations[0];
      
      // Only send location if accuracy is good enough
      if (location.coords.accuracy <= minAccuracy) {
        await sendLocationUpdate(location);
      }
    }
  });

  // Function to send location update
  const sendLocationUpdate = async (location) => {
    if (!userId || !deliveryId || !location) return;
    
    try {
      // Create location update object
      const locationData = {
        userId,
        deliveryId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        speed: location.coords.speed,
        heading: location.coords.heading,
        timestamp: location.timestamp,
      };
      
      // If socket is connected, send via socket for real-time updates
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('update_location', locationData);
      } else {
        // Otherwise use REST API as fallback
        const response = await fetch(`${API_URL}/api/location/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(locationData),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
      }
      
      setLocation(location);
      onLocationUpdate(locationData);
    } catch (error) {
      console.error('Failed to send location update:', error);
    }
  };

  // Request location permissions
  const requestPermissions = async () => {
    try {
      let { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(foregroundStatus);
      
      if (foregroundStatus !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        onStatusChange('permission-denied');
        return false;
      }
      
      if (isDeliverer) {
        let { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        
        if (backgroundStatus !== 'granted') {
          Alert.alert(
            'Background location required',
            'This app requires background location access to track deliveries. Please enable background location in settings.',
            [{ text: 'OK' }]
          );
          setErrorMsg('Background location permission was denied');
          onStatusChange('background-permission-denied');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setErrorMsg(`Error requesting permissions: ${error.message}`);
      onStatusChange('permission-error');
      return false;
    }
  };

  // Start tracking location
  const startTracking = async () => {
    try {
      const hasPermission = await requestPermissions();
      
      if (!hasPermission) {
        return;
      }
      
      // Update status
      setTrackingStatus('tracking');
      onStatusChange('tracking');
      
      // Define tracking options
      const options = {
        accuracy: Location.Accuracy.High,
        timeInterval: TRACKING_INTERVAL,
        distanceInterval,
        deferredUpdatesInterval: TRACKING_INTERVAL,
        deferredUpdatesDistance: distanceInterval,
        showsBackgroundLocationIndicator: true,
        activityType: Location.ActivityType.AutomotiveNavigation,
        foregroundService: {
          notificationTitle: 'Location Tracking Active',
          notificationBody: 'Tracking your location for delivery',
          notificationColor: '#0C6B58',
        },
      };
      
      // For deliverer, use background tracking
      if (isDeliverer) {
        // Check if task is already defined
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING);
        
        if (hasStarted) {
          await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
        }
        
        // Start background location updates
        await Location.startLocationUpdatesAsync(LOCATION_TRACKING, options);
      } else {
        // For customer, just get current location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        setLocation(currentLocation);
      }
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setErrorMsg(`Error starting tracking: ${error.message}`);
      setTrackingStatus('error');
      onStatusChange('tracking-error');
    }
  };

  // Stop tracking location
  const stopTracking = async () => {
    try {
      // Check if task is already defined
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING);
      
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
      }
      
      setTrackingStatus('idle');
      onStatusChange('idle');
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  };

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App is going to background
        console.log('App is going to background');
      } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App is coming to foreground
        console.log('App is coming to foreground');
        
        // Check tracking status
        if (isActive && isDeliverer && trackingStatus === 'tracking') {
          Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING).then(hasStarted => {
            if (!hasStarted) {
              // Restart tracking if it was stopped
              startTracking();
            }
          });
        }
      }
      
      appState.current = nextAppState;
    });
    
    return () => {
      subscription.remove();
    };
  }, [isActive, isDeliverer, trackingStatus]);

  // Start or stop tracking based on active state
  useEffect(() => {
    if (isActive && userId && deliveryId) {
      startTracking();
    } else if (!isActive && trackingStatus === 'tracking') {
      stopTracking();
    }
    
    return () => {
      if (trackingStatus === 'tracking') {
        stopTracking();
      }
    };
  }, [isActive, userId, deliveryId]);

  return {
    location,
    trackingStatus,
    errorMsg,
    permissionStatus,
    startTracking,
    stopTracking,
  };
};

export default LocationTracker;
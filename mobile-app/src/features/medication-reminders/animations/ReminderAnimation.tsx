import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Vibration,
  Platform,
  Image,
} from 'react-native';

/**
 * Types of animations available for medication reminders
 */
export type AnimationType = 'pill' | 'liquid' | 'injection' | 'inhaler';

interface ReminderAnimationProps {
  type: AnimationType;
  reminderText: string;
  onComplete: () => void;
  onDismiss: () => void;
  medicationName: string;
  dosage: string;
  instructions?: string;
  color?: string;
}

/**
 * A component that displays an interactive animation for medication reminders
 */
const ReminderAnimation: React.FC<ReminderAnimationProps> = ({
  type,
  reminderText,
  onComplete,
  onDismiss,
  medicationName,
  dosage,
  instructions = '',
  color = '#FF5733',
}) => {
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Component state
  const [showInstructions, setShowInstructions] = useState(false);
  const [isTaken, setIsTaken] = useState(false);

  // Animation configurations based on medication type
  const getAnimationConfig = () => {
    switch (type) {
      case AnimationType.PILL:
        return {
          icon: require('../assets/pill-icon.png'), // This will be replaced later
          vibratePattern: [0, 100, 100, 100],
          animationDuration: 1000,
        };
      case AnimationType.LIQUID:
        return {
          icon: require('../assets/liquid-icon.png'), // This will be replaced later
          vibratePattern: [0, 200, 200, 200],
          animationDuration: 1500,
        };
      case AnimationType.INJECTION:
        return {
          icon: require('../assets/injection-icon.png'), // This will be replaced later
          vibratePattern: [0, 300, 200, 300],
          animationDuration: 1200,
        };
      case AnimationType.TOPICAL:
        return {
          icon: require('../assets/topical-icon.png'), // This will be replaced later
          vibratePattern: [0, 100, 100, 100, 100, 100],
          animationDuration: 900,
        };
      case AnimationType.INHALER:
        return {
          icon: require('../assets/inhaler-icon.png'), // This will be replaced later
          vibratePattern: [0, 200, 100, 200, 100, 200],
          animationDuration: 1300,
        };
      case AnimationType.TABLET:
        return {
          icon: require('../assets/pill-icon.png'), // This will be replaced later
          vibratePattern: [0, 100, 100, 100],
          animationDuration: 1000,
        };
      case AnimationType.CAPSULE:
        return {
          icon: require('../assets/pill-icon.png'), // This will be replaced later
          vibratePattern: [0, 100, 100, 100],
          animationDuration: 1000,
        };
      default:
        return {
          icon: require('../assets/pill-icon.png'), // This will be replaced later
          vibratePattern: [0, 100, 100, 100],
          animationDuration: 1000,
        };
    }
  };

  const config = getAnimationConfig();

  // Start animation when component mounts
  useEffect(() => {
    startAnimation();

    // Vibrate to get user attention
    if (Platform.OS !== 'web') {
      Vibration.vibrate(config.vibratePattern, true);
    }

    return () => {
      // Clean up vibration when component unmounts
      if (Platform.OS !== 'web') {
        Vibration.cancel();
      }
    };
  }, []);

  // Start all animations
  const startAnimation = () => {
    // Reset animation values
    pulseAnim.setValue(1);
    rotateAnim.setValue(0);
    scaleAnim.setValue(0);
    fadeAnim.setValue(0);

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: config.animationDuration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: config.animationDuration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    ).start();

    // Rotation animation for some medication types
    if (type === AnimationType.LIQUID || type === AnimationType.INJECTION) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: config.animationDuration * 2,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        { iterations: -1 }
      ).start();
    }

    // Scale up animation
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  // Handle marking medication as taken
  const handleTaken = () => {
    // Stop vibration
    if (Platform.OS !== 'web') {
      Vibration.cancel();
    }

    // Play completion animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      delay: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsTaken(true);
      onComplete();
    });
  };

  // Handle dismissing the reminder
  const handleDismiss = () => {
    // Stop vibration
    if (Platform.OS !== 'web') {
      Vibration.cancel();
    }

    // Play dismiss animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  // Calculate rotation for animated elements
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Component styling based on type
  const getTypeStyle = () => {
    switch (type) {
      case AnimationType.PILL:
        return {
          backgroundColor: color,
          borderRadius: 20,
          padding: 15,
        };
      case AnimationType.LIQUID:
        return {
          backgroundColor: '#4CA6FF',
          borderRadius: 15,
          padding: 15,
        };
      case AnimationType.INJECTION:
        return {
          backgroundColor: '#FF4CAA',
          borderRadius: 10,
          padding: 15,
        };
      case AnimationType.TOPICAL:
        return {
          backgroundColor: '#4CFF7B',
          borderRadius: 15,
          padding: 15,
        };
      case AnimationType.INHALER:
        return {
          backgroundColor: '#D94CFF',
          borderRadius: 15,
          padding: 15,
        };
      case AnimationType.TABLET:
        return {
          backgroundColor: color,
          borderRadius: 20,
          padding: 15,
        };
      case AnimationType.CAPSULE:
        return {
          backgroundColor: color,
          borderRadius: 20,
          padding: 15,
        };
      default:
        return {
          backgroundColor: color,
          borderRadius: 20,
          padding: 15,
        };
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Time for your medication</Text>
        <Text style={styles.reminderText}>{reminderText}</Text>

        <TouchableOpacity
          style={styles.medicationInfo}
          onPress={() => setShowInstructions(!showInstructions)}
        >
          <Text style={styles.medicationName}>{medicationName}</Text>
          <Text style={styles.dosage}>{dosage}</Text>

          {showInstructions && instructions ? (
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructions}>{instructions}</Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.iconContainer,
            getTypeStyle(),
            {
              transform: [
                { scale: pulseAnim },
                { rotate: rotate },
              ],
            },
          ]}
        >
          {/* We'll use a placeholder for now and replace with proper icons later */}
          <View style={styles.iconPlaceholder}>
            <Text style={styles.iconText}>
              {type.charAt(0).toUpperCase()}
            </Text>
          </View>
        </Animated.View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.dismissButton]}
            onPress={handleDismiss}
          >
            <Text style={styles.buttonText}>Dismiss</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.takenButton]}
            onPress={handleTaken}
          >
            <Text style={styles.buttonText}>Taken</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  reminderText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  medicationInfo: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    width: '100%',
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dosage: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  instructionsContainer: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#eaeaea',
    borderRadius: 8,
    width: '100%',
  },
  instructions: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    minWidth: 120,
    alignItems: 'center',
  },
  dismissButton: {
    backgroundColor: '#999',
  },
  takenButton: {
    backgroundColor: '#4CD964',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReminderAnimation;
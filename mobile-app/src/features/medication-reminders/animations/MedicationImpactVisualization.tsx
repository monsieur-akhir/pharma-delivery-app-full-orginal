import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { AnimationType } from './ReminderAnimation';

// Types of body systems that can be affected by medications
enum BodySystem {
  CARDIOVASCULAR = 'cardiovascular',
  RESPIRATORY = 'respiratory',
  NERVOUS = 'nervous',
  DIGESTIVE = 'digestive',
  IMMUNE = 'immune',
  ENDOCRINE = 'endocrine',
  MUSCULOSKELETAL = 'musculoskeletal',
}

interface MedicationEffect {
  description: string;
  bodySystem: BodySystem;
  timeframe: string;
  positiveEffect: boolean;
}

interface MedicationImpactVisualizationProps {
  medicationName: string;
  medicationType: AnimationType;
  effects: MedicationEffect[];
  adherence: number; // 0 to 1
  onClose: () => void;
}

/**
 * A component that visually demonstrates the impact of medication on the body
 */
const MedicationImpactVisualization: React.FC<MedicationImpactVisualizationProps> = ({
  medicationName,
  medicationType,
  effects,
  adherence,
  onClose,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const animProgress = useRef(new Animated.Value(0)).current;
  const [activeSystem, setActiveSystem] = useState<BodySystem | null>(null);
  
  // Progress animation based on adherence
  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: adherence,
      duration: 2000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [adherence]);
  
  // Group effects by body system
  const effectsBySystem = effects.reduce((acc, effect) => {
    if (!acc[effect.bodySystem]) {
      acc[effect.bodySystem] = [];
    }
    acc[effect.bodySystem].push(effect);
    return acc;
  }, {} as Record<BodySystem, MedicationEffect[]>);
  
  // Get title for body system
  const getSystemTitle = (system: BodySystem) => {
    switch (system) {
      case BodySystem.CARDIOVASCULAR:
        return 'Cardiovascular System';
      case BodySystem.RESPIRATORY:
        return 'Respiratory System';
      case BodySystem.NERVOUS:
        return 'Nervous System';
      case BodySystem.DIGESTIVE:
        return 'Digestive System';
      case BodySystem.IMMUNE:
        return 'Immune System';
      case BodySystem.ENDOCRINE:
        return 'Endocrine System';
      case BodySystem.MUSCULOSKELETAL:
        return 'Musculoskeletal System';
      default:
        return 'Unknown System';
    }
  };
  
  // Get icon for body system
  const getSystemIcon = (system: BodySystem) => {
    switch (system) {
      case BodySystem.CARDIOVASCULAR:
        return '❤️';
      case BodySystem.RESPIRATORY:
        return '🫁';
      case BodySystem.NERVOUS:
        return '🧠';
      case BodySystem.DIGESTIVE:
        return '�胃';
      case BodySystem.IMMUNE:
        return '🛡️';
      case BodySystem.ENDOCRINE:
        return '⚡';
      case BodySystem.MUSCULOSKELETAL:
        return '💪';
      default:
        return '❓';
    }
  };
  
  // Get color for body system
  const getSystemColor = (system: BodySystem) => {
    switch (system) {
      case BodySystem.CARDIOVASCULAR:
        return '#FF5733';
      case BodySystem.RESPIRATORY:
        return '#4CA6FF';
      case BodySystem.NERVOUS:
        return '#D94CFF';
      case BodySystem.DIGESTIVE:
        return '#FFC04C';
      case BodySystem.IMMUNE:
        return '#4CFF7B';
      case BodySystem.ENDOCRINE:
        return '#FF4CAA';
      case BodySystem.MUSCULOSKELETAL:
        return '#9B59B6';
      default:
        return '#999';
    }
  };
  
  // Toggle active system when system is clicked
  const toggleSystem = (system: BodySystem) => {
    if (activeSystem === system) {
      setActiveSystem(null);
    } else {
      setActiveSystem(system);
    }
  };
  
  // Get adherence message based on adherence percentage
  const getAdherenceMessage = () => {
    if (adherence >= 0.9) {
      return 'Excellent adherence! You\'re maximizing the benefits of your medication.';
    } else if (adherence >= 0.75) {
      return 'Good adherence. You\'re likely to see most of the benefits.';
    } else if (adherence >= 0.5) {
      return 'Moderate adherence. You may see some benefits, but consistency will help more.';
    } else {
      return 'Low adherence. The medication may not be as effective as intended. Try to be more consistent.';
    }
  };
  
  // Interpolate progress width based on adherence
  const progressWidth = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, screenWidth - 60], // Screen width minus padding
  });
  
  // Interpolate progress color based on adherence
  const progressColor = animProgress.interpolate({
    inputRange: [0, 0.5, 0.75, 1],
    outputRange: ['#FF3B30', '#FF9500', '#FFCC00', '#4CD964'],
  });
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How {medicationName} Affects Your Body</Text>
      
      <View style={styles.adherenceContainer}>
        <Text style={styles.adherenceTitle}>Your Treatment Effectiveness</Text>
        <View style={styles.progressContainer}>
          <Animated.View 
            style={[
              styles.progressBar,
              {
                width: progressWidth,
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>
        <Text style={styles.adherencePercentage}>
          {Math.round(adherence * 100)}% Effectiveness
        </Text>
        <Text style={styles.adherenceMessage}>
          {getAdherenceMessage()}
        </Text>
      </View>
      
      <ScrollView style={styles.systemsContainer}>
        <Text style={styles.sectionTitle}>Body Systems Affected</Text>
        
        {Object.keys(effectsBySystem).map((system) => (
          <TouchableOpacity
            key={system}
            style={[
              styles.systemCard,
              activeSystem === system && styles.activeSystemCard,
              { borderColor: getSystemColor(system as BodySystem) },
            ]}
            onPress={() => toggleSystem(system as BodySystem)}
          >
            <View style={styles.systemHeader}>
              <View style={styles.systemTitleContainer}>
                <Text style={styles.systemIcon}>
                  {getSystemIcon(system as BodySystem)}
                </Text>
                <Text style={styles.systemTitle}>
                  {getSystemTitle(system as BodySystem)}
                </Text>
              </View>
              <Text style={styles.expandIcon}>
                {activeSystem === system ? '▲' : '▼'}
              </Text>
            </View>
            
            {activeSystem === system && (
              <View style={styles.effectsContainer}>
                {effectsBySystem[system as BodySystem].map((effect, index) => (
                  <View 
                    key={index}
                    style={[
                      styles.effectItem,
                      {
                        backgroundColor: effect.positiveEffect 
                          ? 'rgba(76, 217, 100, 0.1)' 
                          : 'rgba(255, 59, 48, 0.1)',
                      },
                    ]}
                  >
                    <Text style={styles.effectIcon}>
                      {effect.positiveEffect ? '✅' : '⚠️'}
                    </Text>
                    <View style={styles.effectDetails}>
                      <Text style={styles.effectDescription}>
                        {effect.description}
                      </Text>
                      <Text style={styles.effectTimeframe}>
                        Timeframe: {effect.timeframe}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  adherenceContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  adherenceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  progressContainer: {
    height: 12,
    backgroundColor: '#eaeaea',
    borderRadius: 6,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  adherencePercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  adherenceMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    lineHeight: 20,
  },
  systemsContainer: {
    flex: 1,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  systemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  activeSystemCard: {
    shadowOpacity: 0.2,
    elevation: 3,
  },
  systemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  systemTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  systemIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  systemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  expandIcon: {
    fontSize: 14,
    color: '#666',
  },
  effectsContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  effectItem: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  effectIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  effectDetails: {
    flex: 1,
  },
  effectDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  effectTimeframe: {
    fontSize: 12,
    color: '#666',
  },
  closeButton: {
    backgroundColor: '#666',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MedicationImpactVisualization;
export { BodySystem };
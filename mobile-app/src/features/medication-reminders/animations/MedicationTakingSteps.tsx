import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { AnimationType } from './ReminderAnimation';

// The number of steps depends on the medication type
const getStepsForType = (type: AnimationType) => {
  switch (type) {
    case AnimationType.PILL:
      return [
        { text: 'Take pill from container', color: '#FF9500' },
        { text: 'Place pill in your mouth', color: '#FF5733' },
        { text: 'Drink water to swallow', color: '#4CA6FF' },
        { text: 'Done! Medication taken', color: '#4CD964' },
      ];
    case AnimationType.LIQUID:
      return [
        { text: 'Shake bottle well', color: '#FF9500' },
        { text: 'Measure liquid with dosing cup', color: '#FF5733' },
        { text: 'Take the medication', color: '#4CA6FF' },
        { text: 'Done! Medication taken', color: '#4CD964' },
      ];
    case AnimationType.INJECTION:
      return [
        { text: 'Prepare injection site', color: '#FF9500' },
        { text: 'Clean area with alcohol', color: '#FF5733' },
        { text: 'Administer injection', color: '#D94CFF' },
        { text: 'Dispose needle safely', color: '#4CA6FF' },
        { text: 'Done! Medication administered', color: '#4CD964' },
      ];
    case AnimationType.TOPICAL:
      return [
        { text: 'Clean the affected area', color: '#FF9500' },
        { text: 'Apply medication as directed', color: '#4CFF7B' },
        { text: 'Wash hands thoroughly', color: '#4CA6FF' },
        { text: 'Done! Medication applied', color: '#4CD964' },
      ];
    case AnimationType.INHALER:
      return [
        { text: 'Shake inhaler well', color: '#FF9500' },
        { text: 'Exhale completely', color: '#FF5733' },
        { text: 'Place inhaler in mouth', color: '#D94CFF' },
        { text: 'Inhale and hold breath', color: '#4CA6FF' },
        { text: 'Done! Medication inhaled', color: '#4CD964' },
      ];
    default:
      return [
        { text: 'Take medication', color: '#FF5733' },
        { text: 'Done! Medication taken', color: '#4CD964' },
      ];
  }
};

interface MedicationTakingStepsProps {
  type: AnimationType;
  onComplete: () => void;
  medicationName: string;
  dosage: string;
  instructions?: string;
}

/**
 * An interactive component that guides users through the steps of taking their medication
 */
const MedicationTakingSteps: React.FC<MedicationTakingStepsProps> = ({
  type,
  onComplete,
  medicationName,
  dosage,
  instructions = '',
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const steps = getStepsForType(type);
  
  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressWidth = Dimensions.get('window').width * 0.8;
  
  // Update progress animation when step changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep / (steps.length - 1),
      duration: 500,
      useNativeDriver: false,
      easing: Easing.inOut(Easing.ease),
    }).start();
    
    // Pulse animation when step changes
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Check if we've completed all steps
    if (currentStep === steps.length - 1 && !completed) {
      setCompleted(true);
      // Delay completion callback to allow user to see the final step
      setTimeout(onComplete, 2000);
    }
  }, [currentStep]);
  
  // Handle advancing to the next step
  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, progressWidth],
  });
  
  // Calculate the background color based on the current step
  const backgroundColor = steps[currentStep]?.color || '#FF5733';
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Take your medication</Text>
        <Text style={styles.medicationName}>{medicationName} - {dosage}</Text>
      </View>
      
      <View style={styles.stepsContainer}>
        <Animated.View 
          style={[
            styles.currentStepContainer,
            { backgroundColor },
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <TouchableWithoutFeedback onPress={handleNextStep} disabled={completed}>
            <View style={styles.stepContent}>
              <Text style={styles.stepNumber}>
                Step {currentStep + 1} of {steps.length}
              </Text>
              <Text style={styles.stepText}>
                {steps[currentStep]?.text}
              </Text>
              
              {currentStep < steps.length - 1 ? (
                <Text style={styles.tapPrompt}>
                  Tap to continue
                </Text>
              ) : (
                <Text style={styles.tapPrompt}>
                  ✓ Complete!
                </Text>
              )}
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
        
        <View style={styles.progressBarBackground}>
          <Animated.View 
            style={[
              styles.progressBarFill, 
              { width: progressBarWidth, backgroundColor }
            ]} 
          />
        </View>
        
        {instructions ? (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Special Instructions:</Text>
            <Text style={styles.instructionsText}>{instructions}</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  medicationName: {
    fontSize: 18,
    color: '#666',
  },
  stepsContainer: {
    flex: 1,
    alignItems: 'center',
  },
  currentStepContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    minHeight: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stepContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  stepNumber: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  stepText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
  },
  tapPrompt: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 10,
  },
  progressBarBackground: {
    height: 10,
    width: '80%',
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    width: 0,
  },
  instructionsContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default MedicationTakingSteps;
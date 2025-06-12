import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MedicationTakingStepsProps, MedicationType } from '@/types/animation';

const { width } = Dimensions.get('window');

const MedicationTakingSteps: React.FC<MedicationTakingStepsProps> = ({
  type,
  onComplete,
  medicationName,
  dosage,
  instructions,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepAnimation] = useState(new Animated.Value(0));

  const getSteps = () => {
    switch (type) {
      case 'pill':
        return [
          {
            icon: 'local-drink',
            title: 'Préparez un verre d\'eau',
            description: 'Remplissez un verre avec de l\'eau fraîche',
          },
          {
            icon: 'medication',
            title: 'Prenez le médicament',
            description: `Prenez ${dosage} de ${medicationName}`,
          },
          {
            icon: 'water-drop',
            title: 'Buvez avec de l\'eau',
            description: 'Avalez le médicament avec un grand verre d\'eau',
          },
          {
            icon: 'check-circle',
            title: 'Terminé !',
            description: 'Vous avez pris votre médicament avec succès',
          },
        ];
      case 'liquid':
        return [
          {
            icon: 'local-pharmacy',
            title: 'Préparez le médicament',
            description: 'Secouez bien le flacon si nécessaire',
          },
          {
            icon: 'straighten',
            title: 'Mesurez la dose',
            description: `Mesurez ${dosage} avec la cuillère ou seringue fournie`,
          },
          {
            icon: 'medication-liquid',
            title: 'Prenez le médicament',
            description: 'Avalez la dose mesurée',
          },
          {
            icon: 'check-circle',
            title: 'Terminé !',
            description: 'Vous avez pris votre médicament avec succès',
          },
        ];
      case 'injection':
        return [
          {
            icon: 'clean-hands',
            title: 'Lavez-vous les mains',
            description: 'Nettoyez soigneusement vos mains',
          },
          {
            icon: 'science',
            title: 'Préparez l\'injection',
            description: 'Vérifiez la dose et préparez la seringue',
          },
          {
            icon: 'medical-services',
            title: 'Administrez l\'injection',
            description: `Injectez ${dosage} selon les instructions`,
          },
          {
            icon: 'check-circle',
            title: 'Terminé !',
            description: 'Injection administrée avec succès',
          },
        ];
      case 'inhaler':
        return [
          {
            icon: 'air',
            title: 'Expirez complètement',
            description: 'Videz vos poumons avant d\'utiliser l\'inhalateur',
          },
          {
            icon: 'medical-services',
            title: 'Positionnez l\'inhalateur',
            description: 'Placez l\'embout dans votre bouche',
          },
          {
            icon: 'trending-up',
            title: 'Inhalez profondément',
            description: `Pressez et inhalez ${dosage}`,
          },
          {
            icon: 'check-circle',
            title: 'Terminé !',
            description: 'Médicament inhalé avec succès',
          },
        ];
      default:
        return [];
    }
  };

  const steps = getSteps();

  useEffect(() => {
    animateStep();
  }, [currentStep]);

  const animateStep = () => {
    stepAnimation.setValue(0);
    Animated.spring(stepAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const scale = stepAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const opacity = stepAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (steps.length === 0) {
    return null;
  }

  const currentStepData = steps[currentStep];

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index <= currentStep && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      <Animated.View
        style={[
          styles.stepContainer,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons
            name={currentStepData?.icon as any || 'medication'}
            size={64}
            color="#4A80F0"
          />
        </View>

        <Text style={styles.stepTitle}>{currentStepData?.title || ''}</Text>
        <Text style={styles.stepDescription}>{currentStepData?.description || ''}</Text>

        {instructions && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsLabel}>Instructions :</Text>
            <Text style={styles.instructions}>{instructions}</Text>
          </View>
        )}
      </Animated.View>

      <View style={styles.buttonContainer}>
        <Text style={styles.stepCounter}>
          Étape {currentStep + 1} sur {steps.length}
        </Text>

        <View style={[styles.nextButton, { borderRadius: 10 }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 6,
  },
  progressDotActive: {
    backgroundColor: '#4A80F0',
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  instructionsContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    width: '100%',
  },
  instructionsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A80F0',
    marginBottom: 8,
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  stepCounter: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: '#4A80F0',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
  },
});

export default MedicationTakingSteps;
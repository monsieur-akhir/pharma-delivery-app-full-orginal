import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions,
  Platform,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_NAME } from '../config';

const { width } = Dimensions.get('window');

interface WelcomeScreenProps {
  navigation: any;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  // Animation references
  const deliveryPersonPosition = useRef(new Animated.Value(-100)).current;
  const medicineOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
    // Start animations when component mounts
    animateDeliveryPerson();
    setTimeout(() => animateMedicines(), 1000);
    setTimeout(() => animateButton(), 1500);
  }, []);
  
  // Animate delivery person moving across the screen
  const animateDeliveryPerson = () => {
    Animated.timing(deliveryPersonPosition, {
      toValue: width - 100,
      duration: 3000,
      easing: Easing.cubic,
      useNativeDriver: true,
    }).start(() => {
      // Reset and repeat animation for continuous effect
      deliveryPersonPosition.setValue(-100);
      animateDeliveryPerson();
    });
  };
  
  // Animate medicines appearing
  const animateMedicines = () => {
    Animated.timing(medicineOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };
  
  // Animate button appearing
  const animateButton = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };
  
  // Navigate to authentication screen
  const handleGetStarted = () => {
    navigation.navigate('Auth');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>{APP_NAME}</Text>
        </View>
        
        <View style={styles.animationContainer}>
          {/* Animated delivery person */}
          <Animated.View
            style={[
              styles.deliveryPersonContainer,
              { transform: [{ translateX: deliveryPersonPosition }] },
            ]}
          >
            <Ionicons name="bicycle" size={40} color="#ff6b6b" />
            <View style={styles.deliveryPersonShadow} />
          </Animated.View>
          
          {/* Animated medicines */}
          <Animated.View
            style={[styles.medicinesContainer, { opacity: medicineOpacity }]}
          >
            <View style={styles.building}>
              <View style={styles.buildingDoor} />
              <View style={styles.buildingWindow} />
              <View style={styles.buildingWindow} />
            </View>
            
            <View style={styles.medicine}>
              <Ionicons name="medkit" size={24} color="#fff" />
            </View>
            
            <View style={styles.medicine} style={{ top: 50, left: 50 }}>
              <Ionicons name="bandage" size={24} color="#fff" />
            </View>
            
            <View style={styles.medicine} style={{ top: 100, left: 80 }}>
              <Ionicons name="fitness" size={24} color="#fff" />
            </View>
          </Animated.View>
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.mainText}>
            Vos médicaments livrés à votre porte
          </Text>
          <Text style={styles.subText}>
            Une application simple et sécurisée pour commander vos médicaments et les recevoir rapidement
          </Text>
        </View>
        
        <Animated.View
          style={[
            styles.buttonContainer,
            { transform: [{ scale: buttonScale }] },
          ]}
        >
          <TouchableOpacity
            style={styles.button}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Démarrer</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 20 : 40,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#33415c',
  },
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  deliveryPersonContainer: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
  },
  deliveryPersonShadow: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    height: 6,
    width: 30,
    borderRadius: 10,
  },
  medicinesContainer: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    position: 'relative',
  },
  building: {
    position: 'absolute',
    right: 20,
    bottom: 0,
    width: 80,
    height: 150,
    backgroundColor: '#e1e8f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  buildingDoor: {
    width: 30,
    height: 40,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    position: 'absolute',
    bottom: 0,
  },
  buildingWindow: {
    width: 20,
    height: 20,
    backgroundColor: '#94a3b8',
    borderRadius: 4,
    margin: 5,
  },
  medicine: {
    width: 40,
    height: 40,
    backgroundColor: '#667eea',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  textContainer: {
    marginBottom: 40,
  },
  mainText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#33415c',
    textAlign: 'center',
    marginBottom: 12,
  },
  subText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default WelcomeScreen;
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0C6B58', '#14A085', '#20D0A8']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Logo and App Name */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <MaterialIcons name="local-pharmacy" size={60} color="#fff" />
            </View>
            <Text style={styles.appName}>Medi-Delivery</Text>
            <Text style={styles.tagline}>Votre pharmacie, livrée à votre porte</Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <MaterialIcons name="medication" size={24} color="#fff" />
              <Text style={styles.featureText}>Médicaments authentiques</Text>
            </View>
            <View style={styles.feature}>
              <MaterialIcons name="delivery-dining" size={24} color="#fff" />
              <Text style={styles.featureText}>Livraison rapide</Text>
            </View>
            <View style={styles.feature}>
              <MaterialIcons name="verified" size={24} color="#fff" />
              <Text style={styles.featureText}>Pharmacies certifiées</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Auth')}
            >
              <Text style={styles.primaryButtonText}>Commencer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.secondaryButtonText}>J'ai déjà un compte</Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            En continuant, vous acceptez nos{' '}
            <Text style={styles.termsLink}>Conditions d'utilisation</Text> et notre{' '}
            <Text style={styles.termsLink}>Politique de confidentialité</Text>
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    alignItems: 'center',
    gap: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    width: '80%',
  },
  featureText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#0C6B58',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  terms: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
});

export default WelcomeScreen;

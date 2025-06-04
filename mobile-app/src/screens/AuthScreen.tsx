import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import authService from '../services/auth.service';
import * as RootNavigation from '../navigation/RootNavigation';
import { APP_NAME } from '../config';
import { Ionicons } from '@expo/vector-icons';

/**
 * Authentication Screen
 * Handles phone number verification with OTP
 */
const AuthScreen: React.FC = () => {
  // State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completingProfile, setCompletingProfile] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // Redux state
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  // Start countdown timer when OTP is sent
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  /**
   * Request OTP for the provided phone number
   */
  const handleRequestOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Numéro de téléphone invalide', 'Veuillez entrer un numéro de téléphone valide.');
      return;
    }

    try {
      setLoading(true);
      await authService.requestOtp(phoneNumber);
      setOtpSent(true);
      setCountdown(60); // 60 seconds countdown
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Erreur lors de l\'envoi du code OTP. Veuillez réessayer.'
      );
    }
  };

  /**
   * Verify OTP entered by the user
   */
  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert('Code OTP invalide', 'Veuillez entrer un code OTP valide.');
      return;
    }

    try {
      setLoading(true);
      const result = await authService.verifyOtp(phoneNumber, otp);
      
      if (result.isNewUser) {
        // New user needs to complete their profile
        setCompletingProfile(true);
      } else {
        // Existing user, navigate to main app
        RootNavigation.navigateToMain();
      }
      
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Code OTP invalide. Veuillez réessayer.'
      );
    }
  };

  /**
   * Complete new user's profile
   */
  const handleCompleteProfile = async () => {
    if (!fullName) {
      Alert.alert('Nom complet requis', 'Veuillez entrer votre nom complet.');
      return;
    }

    if (!email) {
      Alert.alert('Email requis', 'Veuillez entrer votre adresse email.');
      return;
    }

    try {
      setLoading(true);
      await authService.completeProfile({
        name: fullName,
        email,
      });
      
      // Profile completed, navigate to main app
      RootNavigation.navigateToMain();
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Erreur lors de la mise à jour du profil. Veuillez réessayer.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>{APP_NAME}</Text>
            <Text style={styles.tagline}>Votre pharmacie, livrée à votre porte</Text>
          </View>

          {!otpSent && !completingProfile ? (
            <View style={styles.formContainer}>
              <Text style={styles.title}>Connexion</Text>
              <Text style={styles.subtitle}>
                Entrez votre numéro de téléphone pour recevoir un code de vérification
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#667eea" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Numéro de téléphone"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  maxLength={15}
                />
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleRequestOtp}
                disabled={loading || isLoading}
              >
                {loading || isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Recevoir le code</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : otpSent && !completingProfile ? (
            <View style={styles.formContainer}>
              <Text style={styles.title}>Vérification</Text>
              <Text style={styles.subtitle}>
                Entrez le code à 6 chiffres envoyé au numéro {phoneNumber}
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#667eea" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Code OTP"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  maxLength={6}
                />
              </View>

              {countdown > 0 ? (
                <Text style={styles.countdown}>
                  Vous pouvez demander un nouveau code dans {countdown} secondes
                </Text>
              ) : (
                <TouchableOpacity onPress={handleRequestOtp}>
                  <Text style={styles.resendLink}>Renvoyer le code</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.button}
                onPress={handleVerifyOtp}
                disabled={loading || isLoading}
              >
                {loading || isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Vérifier</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setOtpSent(false)}
              >
                <Text style={styles.backButtonText}>Retour</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.title}>Compléter le profil</Text>
              <Text style={styles.subtitle}>
                Pour finaliser votre inscription, veuillez fournir les informations suivantes
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#667eea" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nom complet"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#667eea" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Adresse email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleCompleteProfile}
                disabled={loading || isLoading}
              >
                {loading || isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Continuer</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
    height: 50,
  },
  inputIcon: {
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 50,
    paddingRight: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  countdown: {
    textAlign: 'center',
    marginVertical: 8,
    color: '#6b7280',
    fontSize: 14,
  },
  resendLink: {
    textAlign: 'center',
    marginVertical: 8,
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  backButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
});

export default AuthScreen;
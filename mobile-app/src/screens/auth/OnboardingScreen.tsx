import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  Image, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '@/navigation/AppNavigator';
import { sendOtp, resetError } from '@/store/slices/authSlice';
import { AppDispatch, RootState } from '@/store';
import { Feather } from '@expo/vector-icons';

type OnboardingScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Onboarding'>;

interface Props {
  navigation: OnboardingScreenNavigationProp;
}

const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const handlePhoneChange = (text: string) => {
    // Only allow digits and plus sign
    const sanitizedText = text.replace(/[^0-9+]/g, '');
    setPhone(sanitizedText);
    setPhoneError('');
    
    if (error) {
      dispatch(resetError());
    }
  };

  const validatePhone = (): boolean => {
    // Basic validation: should start with + and contain 8-15 digits
    const phoneRegex = /^\+[0-9]{8,15}$/;
    
    if (!phone) {
      setPhoneError('Phone number is required');
      return false;
    }
    
    if (!phoneRegex.test(phone)) {
      setPhoneError('Enter a valid phone number with country code (e.g. +1234567890)');
      return false;
    }
    
    return true;
  };

  const handleContinue = async () => {
    if (!validatePhone()) {
      return;
    }

    try {
      await dispatch(sendOtp(phone)).unwrap();
      navigation.navigate('OtpVerification', { phone });
    } catch (err) {
      // Error is already handled by the slice
      Alert.alert('Error', error || 'Failed to send OTP. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Feather name="package" size={60} color="#4A80F0" />
            <Text style={styles.title}>Medi-Delivery</Text>
            <Text style={styles.subtitle}>Medications delivered to your doorstep</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.inputLabel}>Enter your phone number</Text>
            <View style={[styles.inputContainer, phoneError ? styles.inputError : null]}>
              <TextInput
                style={styles.input}
                placeholder="+1234567890"
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                autoFocus
              />
              {phone ? (
                <TouchableOpacity onPress={() => setPhone('')} style={styles.clearButton}>
                  <Feather name="x-circle" size={20} color="#999" />
                </TouchableOpacity>
              ) : null}
            </View>
            
            {phoneError ? (
              <Text style={styles.errorText}>{phoneError}</Text>
            ) : null}
            
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <Text style={styles.infoText}>
              We'll send you a one-time verification code to this number
            </Text>

            <TouchableOpacity
              style={[styles.button, isLoading ? styles.buttonDisabled : null]}
              onPress={handleContinue}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our{' '}
              <Text style={styles.link}>Terms of Service</Text> and{' '}
              <Text style={styles.link}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    height: 56,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  clearButton: {
    padding: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#4A80F0',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  link: {
    color: '#4A80F0',
    textDecorationLine: 'underline',
  },
});

export default OnboardingScreen;

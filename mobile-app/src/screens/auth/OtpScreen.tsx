import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import authService from '../../services/auth.service';
import { APP_NAME } from '../../config';

interface OtpScreenProps {
  route: {
    params: {
      phone: string;
    };
  };
  navigation: any;
}

const OtpScreen: React.FC<OtpScreenProps> = ({ route, navigation }) => {
  const { phone } = route.params;
  const dispatch = useDispatch();
  
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(60);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const inputRefs = useRef<Array<TextInput | null>>([]);
  
  // Start countdown timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [timer]);
  
  // Format phone number for display
  const formatPhone = (phoneNumber: string) => {
    // Basic formatting for display - adjust as needed
    if (phoneNumber.startsWith('+')) {
      const countryCode = phoneNumber.substring(0, 3);
      const restOfNumber = phoneNumber.substring(3);
      return `${countryCode} ${restOfNumber}`;
    }
    return phoneNumber;
  };
  
  // Handle OTP input change
  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    
    // Automatically move to next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Clear error message when user types
    if (errorMessage) setErrorMessage('');
  };
  
  // Handle key press for backspace
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  // Verify OTP code
  const verifyOtp = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setErrorMessage('Veuillez entrer les 6 chiffres du code');
      return;
    }
    
    setLoading(true);
    try {
      await authService.verifyOtp(phone, otpCode);
      setLoading(false);
      // Navigate to main app after successful verification
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      setLoading(false);
      setErrorMessage(error instanceof Error ? error.message : 'Échec de vérification du code OTP');
    }
  };
  
  // Resend OTP code
  const resendOtp = async () => {
    if (timer > 0) return;
    
    setIsResending(true);
    try {
      await authService.sendOtp(phone);
      setTimer(60);
      setOtp(Array(6).fill(''));
      Alert.alert(
        'Code envoyé',
        `Un nouveau code a été envoyé au ${formatPhone(phone)}`
      );
    } catch (error) {
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Impossible d\'envoyer un nouveau code'
      );
    } finally {
      setIsResending(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Vérification de code</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.description}>
            Nous avons envoyé un code de vérification à
          </Text>
          <Text style={styles.phoneNumber}>{formatPhone(phone)}</Text>
          
          <View style={styles.otpContainer}>
            {Array(6).fill(0).map((_, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  otp[index] ? styles.otpInputFilled : null,
                  errorMessage ? styles.otpInputError : null,
                ]}
                value={otp[index]}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>
          
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
          
          <TouchableOpacity
            style={[styles.resendContainer, timer > 0 && styles.resendDisabled]}
            onPress={resendOtp}
            disabled={timer > 0 || isResending}
          >
            {isResending ? (
              <ActivityIndicator size="small" color="#007BFF" />
            ) : (
              <Text style={[styles.resendText, timer > 0 && styles.resendTextDisabled]}>
                {timer > 0 
                  ? `Renvoyer le code (${timer}s)` 
                  : 'Renvoyer le code'}
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.verifyButton,
              otp.join('').length !== 6 && styles.verifyButtonDisabled,
            ]}
            onPress={verifyOtp}
            disabled={loading || otp.join('').length !== 6}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.verifyButtonText}>Vérifier</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginRight: 40,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333333',
    marginBottom: 32,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#F9F9F9',
  },
  otpInputFilled: {
    backgroundColor: '#FFFFFF',
    borderColor: '#007BFF',
  },
  otpInputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  resendContainer: {
    marginBottom: 32,
    padding: 8,
  },
  resendDisabled: {
    opacity: 0.6,
  },
  resendText: {
    color: '#007BFF',
    fontSize: 16,
  },
  resendTextDisabled: {
    color: '#999999',
  },
  verifyButton: {
    backgroundColor: '#007BFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  verifyButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OtpScreen;
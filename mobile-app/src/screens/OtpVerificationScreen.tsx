import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const RESEND_COOLDOWN_SECONDS = 30;

const OtpVerificationScreen = ({ route, navigation }: any) => {
  const { identifier } = route.params;
  const { verifyOtp, login, isLoading, error } = useAuth();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<Array<TextInput | null>>([]);
  
  useEffect(() => {
    // Focus first input when screen loads
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
    
    // Start countdown for resend button
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste of entire OTP
      const otpArray = text.split('').slice(0, 6);
      const newOtp = [...otp];
      
      otpArray.forEach((digit, i) => {
        if (i < 6) {
          newOtp[i] = digit;
        }
      });
      
      setOtp(newOtp);
      
      // Focus last field or submit if complete
      if (otpArray.length >= 6) {
        inputRefs.current[5]?.blur();
      } else {
        inputRefs.current[Math.min(index + otpArray.length, 5)]?.focus();
      }
    } else {
      // Handle single digit input
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);
      
      // Auto advance to next field
      if (text && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (canResend) {
      const success = await login(identifier);
      if (success) {
        setCanResend(false);
        setCountdown(RESEND_COOLDOWN_SECONDS);
        
        // Restart countdown
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setCanResend(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6 || !/^\d+$/.test(otpValue)) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP you received');
      return;
    }
    
    const success = await verifyOtp(identifier, otpValue);
    
    if (success) {
      // Navigation will happen automatically via AuthContext
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Verification Code</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit verification code to
            </Text>
            <Text style={styles.identifier}>{identifier}</Text>
          </View>
          
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[styles.otpInput, digit ? styles.otpInputFilled : {}]}
                maxLength={6} // Allow paste of full OTP
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                editable={!isLoading}
                selectTextOnFocus
              />
            ))}
          </View>
          
          {error && <Text style={styles.errorText}>{error}</Text>}
          
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleVerifyOtp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity
              onPress={handleResendOtp}
              disabled={!canResend || isLoading}
            >
              <Text
                style={[
                  styles.resendButton,
                  (!canResend || isLoading) && styles.resendButtonDisabled,
                ]}
              >
                {canResend ? 'Resend code' : `Resend in ${countdown}s`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  identifier: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C6B58',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  otpInputFilled: {
    backgroundColor: '#e6f7f4',
    borderColor: '#0C6B58',
    borderWidth: 1,
  },
  errorText: {
    color: '#ff4d4d',
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0C6B58',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a0d8cf',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  resendText: {
    color: '#666',
    fontSize: 14,
  },
  resendButton: {
    color: '#0C6B58',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resendButtonDisabled: {
    color: '#a0d8cf',
  },
});

export default OtpVerificationScreen;
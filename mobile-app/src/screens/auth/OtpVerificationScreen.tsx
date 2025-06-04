import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '@/navigation/AppNavigator';
import { verifyOtp, sendOtp, resetError } from '@/store/slices/authSlice';
import { AppDispatch, RootState } from '@/store';
import { Feather } from '@expo/vector-icons';

type OtpVerificationScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'OtpVerification'>;
type OtpVerificationScreenRouteProp = RouteProp<AuthStackParamList, 'OtpVerification'>;

interface Props {
  navigation: OtpVerificationScreenNavigationProp;
  route: OtpVerificationScreenRouteProp;
}

const OtpVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phone } = route.params;
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [resendDisabled, setResendDisabled] = useState(true);
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

  // Start countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setResendDisabled(false);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown]);

  const handleOtpChange = (text: string, index: number) => {
    // Update the specific digit
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = text;
    setOtpDigits(newOtpDigits);
    
    // Combine all digits to get the complete OTP
    const newOtp = newOtpDigits.join('');
    setOtp(newOtp);
    
    // Auto focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto submit if all digits are entered
    if (newOtp.length === 6) {
      handleVerify(newOtp);
    }
    
    if (error) {
      dispatch(resetError());
    }
  };

  const handleBackspace = (index: number) => {
    if (index > 0 && !otpDigits[index]) {
      // If current input is empty, focus previous input
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    try {
      await dispatch(sendOtp(phone)).unwrap();
      setCountdown(30);
      setResendDisabled(true);
      setOtp('');
      setOtpDigits(['', '', '', '', '', '']);
      Alert.alert('Success', 'OTP has been resent to your phone number.');
    } catch (err) {
      Alert.alert('Error', error || 'Failed to resend OTP. Please try again.');
    }
  };

  const handleVerify = async (code = otp) => {
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP sent to your phone.');
      return;
    }

    try {
      await dispatch(verifyOtp({ phone, code })).unwrap();
      // Navigation will be handled by the AppNavigator
    } catch (err) {
      // Error is already handled by the slice
      Alert.alert('Error', error || 'Failed to verify OTP. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.title}>Verification</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>Enter the 6-digit code sent to</Text>
          <Text style={styles.phone}>{phone}</Text>

          <View style={styles.otpContainer}>
            {otpDigits.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[styles.otpInput, digit ? styles.filledInput : {}]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text.replace(/[^0-9]/g, ''), index)}
                keyboardType="number-pad"
                maxLength={1}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace') {
                    handleBackspace(index);
                  }
                }}
                autoFocus={index === 0}
              />
            ))}
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.button, isLoading || otp.length !== 6 ? styles.buttonDisabled : null]}
            onPress={() => handleVerify()}
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            {resendDisabled ? (
              <Text style={styles.countdown}>Resend in {countdown}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 8,
    textAlign: 'center',
  },
  phone: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    color: '#1E293B',
    backgroundColor: '#fff',
  },
  filledInput: {
    borderColor: '#4A80F0',
    backgroundColor: '#F0F7FF',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4A80F0',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  resendText: {
    fontSize: 14,
    color: '#64748B',
  },
  resendLink: {
    fontSize: 14,
    color: '#4A80F0',
    fontWeight: '600',
  },
  countdown: {
    fontSize: 14,
    color: '#94A3B8',
  },
});

export default OtpVerificationScreen;

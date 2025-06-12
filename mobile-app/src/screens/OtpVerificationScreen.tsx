
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

const { width } = Dimensions.get('window');

const OtpVerificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { verifyOtp, resendOtp, isLoading } = useAuth();
  
  const { identifier } = route.params as { identifier: string };
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newOtp.every(digit => digit !== '') && text) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      Alert.alert('Erreur', 'Veuillez entrer le code à 6 chiffres');
      return;
    }

    try {
      const success = await verifyOtp(identifier, code);
      if (success) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Code OTP invalide');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    try {
      await resendOtp(identifier);
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      Alert.alert('Succès', 'Un nouveau code a été envoyé');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de renvoyer le code');
    }
  };

  const formatPhone = (phone: string) => {
    if (phone.includes('@')) return phone; // Email
    // Format phone number for display
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return `****${cleaned.slice(-4)}`;
    }
    return phone;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#0C6B58" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vérification</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="sms" size={64} color="#0C6B58" />
        </View>

        <Text style={styles.title}>Entrez le code de vérification</Text>
        <Text style={styles.subtitle}>
          Nous avons envoyé un code à 6 chiffres à {formatPhone(identifier)}
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : null,
              ]}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(key, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
              editable={!isLoading}
            />
          ))}
        </View>

        {countdown > 0 ? (
          <Text style={styles.countdown}>
            Renvoyer le code dans {countdown}s
          </Text>
        ) : (
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendOtp}
            disabled={!canResend || isLoading}
          >
            <Text style={styles.resendButtonText}>Renvoyer le code</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.verifyButton,
            (otp.some(digit => !digit) || isLoading) && styles.disabledButton
          ]}
          onPress={() => handleVerifyOtp()}
          disabled={otp.some(digit => !digit) || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Vérifier</Text>
          )}
        </TouchableOpacity>

        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>Vous n'avez pas reçu le code ?</Text>
          <TouchableOpacity onPress={() => Alert.alert('Aide', 'Contactez le support si vous continuez à avoir des problèmes.')}>
            <Text style={styles.helpLink}>Besoin d'aide ?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: (width - 100) / 6,
    height: 50,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#fff',
  },
  otpInputFilled: {
    borderColor: '#0C6B58',
    backgroundColor: '#f0faf8',
  },
  countdown: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: 30,
  },
  resendButtonText: {
    fontSize: 16,
    color: '#0C6B58',
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#0C6B58',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpContainer: {
    alignItems: 'center',
    gap: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
  },
  helpLink: {
    fontSize: 14,
    color: '#0C6B58',
    fontWeight: '600',
  },
});

export default OtpVerificationScreen;

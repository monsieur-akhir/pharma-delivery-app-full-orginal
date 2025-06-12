
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SIZES } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api.service';

enum PaymentMethodType {
  CARD = 'CARD',
  MOBILE_MONEY = 'MOBILE_MONEY',
}

enum MobileMoneyProvider {
  MTN = 'MTN',
  ORANGE = 'ORANGE',
  MOOV = 'MOOV',
  WAVE = 'WAVE',
}

interface CardData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

interface MobileMoneyData {
  provider: MobileMoneyProvider;
  phoneNumber: string;
  accountName: string;
}

const AddPaymentMethodScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<PaymentMethodType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Card form states
  const [cardData, setCardData] = useState<CardData>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  // Mobile Money form states
  const [mobileMoneyData, setMobileMoneyData] = useState<MobileMoneyData>({
    provider: MobileMoneyProvider.MTN,
    phoneNumber: '',
    accountName: '',
  });

  const [setAsDefault, setSetAsDefault] = useState(false);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ').substr(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const validateCard = (): boolean => {
    const { cardNumber, expiryDate, cvv, cardholderName } = cardData;
    
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      Alert.alert('Error', 'Please enter a valid card number');
      return false;
    }
    
    if (!expiryDate || expiryDate.length < 5) {
      Alert.alert('Error', 'Please enter a valid expiry date');
      return false;
    }
    
    if (!cvv || cvv.length < 3) {
      Alert.alert('Error', 'Please enter a valid CVV');
      return false;
    }
    
    if (!cardholderName.trim()) {
      Alert.alert('Error', 'Please enter the cardholder name');
      return false;
    }
    
    return true;
  };

  const validateMobileMoney = (): boolean => {
    const { phoneNumber, accountName } = mobileMoneyData;
    
    if (!phoneNumber || phoneNumber.length < 8) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }
    
    if (!accountName.trim()) {
      Alert.alert('Error', 'Please enter the account name');
      return false;
    }
    
    return true;
  };

  const handleAddPaymentMethod = async () => {
    try {
      setIsLoading(true);

      let isValid = false;
      let payload: any = {
        type: selectedType,
        isDefault: setAsDefault,
      };

      if (selectedType === PaymentMethodType.CARD) {
        isValid = validateCard();
        if (isValid) {
          payload = {
            ...payload,
            cardNumber: cardData.cardNumber.replace(/\s/g, ''),
            expiryDate: cardData.expiryDate,
            cvv: cardData.cvv,
            cardholderName: cardData.cardholderName,
          };
        }
      } else if (selectedType === PaymentMethodType.MOBILE_MONEY) {
        isValid = validateMobileMoney();
        if (isValid) {
          payload = {
            ...payload,
            provider: mobileMoneyData.provider,
            phoneNumber: mobileMoneyData.phoneNumber,
            accountName: mobileMoneyData.accountName,
          };
        }
      }

      if (!isValid) {
        setIsLoading(false);
        return;
      }

      const response = await api.post('/api/payments/methods', payload);

      if (response.data.status === 'success') {
        Alert.alert(
          'Success',
          'Payment method added successfully',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Failed to add payment method');
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      Alert.alert('Error', 'Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPaymentMethodSelection = () => (
    <View style={styles.selectionContainer}>
      <Text style={styles.sectionTitle}>Select Payment Method Type</Text>
      
      <TouchableOpacity
        style={[
          styles.methodTypeCard,
          selectedType === PaymentMethodType.CARD && styles.selectedCard,
        ]}
        onPress={() => setSelectedType(PaymentMethodType.CARD)}
      >
        <View style={styles.methodTypeContent}>
          <Icon 
            name="card-outline" 
            size={24} 
            color={selectedType === PaymentMethodType.CARD ? COLORS.primary : COLORS.gray} 
          />
          <View style={styles.methodTypeInfo}>
            <Text style={[
              styles.methodTypeName,
              selectedType === PaymentMethodType.CARD && styles.selectedText,
            ]}>
              Credit/Debit Card
            </Text>
            <Text style={styles.methodTypeDescription}>
              Visa, Mastercard, American Express
            </Text>
          </View>
        </View>
        {selectedType === PaymentMethodType.CARD && (
          <Icon name="checkmark-circle" size={20} color={COLORS.primary} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.methodTypeCard,
          selectedType === PaymentMethodType.MOBILE_MONEY && styles.selectedCard,
        ]}
        onPress={() => setSelectedType(PaymentMethodType.MOBILE_MONEY)}
      >
        <View style={styles.methodTypeContent}>
          <Icon 
            name="phone-portrait-outline" 
            size={24} 
            color={selectedType === PaymentMethodType.MOBILE_MONEY ? COLORS.primary : COLORS.gray} 
          />
          <View style={styles.methodTypeInfo}>
            <Text style={[
              styles.methodTypeName,
              selectedType === PaymentMethodType.MOBILE_MONEY && styles.selectedText,
            ]}>
              Mobile Money
            </Text>
            <Text style={styles.methodTypeDescription}>
              MTN, Orange, Moov, Wave
            </Text>
          </View>
        </View>
        {selectedType === PaymentMethodType.MOBILE_MONEY && (
          <Icon name="checkmark-circle" size={20} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderCardForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>Card Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Cardholder Name</Text>
        <TextInput
          style={styles.textInput}
          value={cardData.cardholderName}
          onChangeText={(text) => setCardData(prev => ({ ...prev, cardholderName: text }))}
          placeholder="John Doe"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Card Number</Text>
        <TextInput
          style={styles.textInput}
          value={cardData.cardNumber}
          onChangeText={(text) => setCardData(prev => ({ ...prev, cardNumber: formatCardNumber(text) }))}
          placeholder="1234 5678 9012 3456"
          keyboardType="numeric"
          maxLength={19}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: SIZES.base }]}>
          <Text style={styles.inputLabel}>Expiry Date</Text>
          <TextInput
            style={styles.textInput}
            value={cardData.expiryDate}
            onChangeText={(text) => setCardData(prev => ({ ...prev, expiryDate: formatExpiryDate(text) }))}
            placeholder="MM/YY"
            keyboardType="numeric"
            maxLength={5}
          />
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: SIZES.base }]}>
          <Text style={styles.inputLabel}>CVV</Text>
          <TextInput
            style={styles.textInput}
            value={cardData.cvv}
            onChangeText={(text) => setCardData(prev => ({ ...prev, cvv: text.replace(/\D/g, '') }))}
            placeholder="123"
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
          />
        </View>
      </View>
    </View>
  );

  const renderMobileMoneyForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>Mobile Money Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Provider</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.providerScroll}>
          {Object.values(MobileMoneyProvider).map((provider) => (
            <TouchableOpacity
              key={provider}
              style={[
                styles.providerChip,
                mobileMoneyData.provider === provider && styles.selectedProviderChip,
              ]}
              onPress={() => setMobileMoneyData(prev => ({ ...prev, provider }))}
            >
              <Text style={[
                styles.providerText,
                mobileMoneyData.provider === provider && styles.selectedProviderText,
              ]}>
                {provider}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={styles.textInput}
          value={mobileMoneyData.phoneNumber}
          onChangeText={(text) => setMobileMoneyData(prev => ({ ...prev, phoneNumber: text.replace(/\D/g, '') }))}
          placeholder="70123456"
          keyboardType="phone-pad"
          maxLength={8}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Account Name</Text>
        <TextInput
          style={styles.textInput}
          value={mobileMoneyData.accountName}
          onChangeText={(text) => setMobileMoneyData(prev => ({ ...prev, accountName: text }))}
          placeholder="John Doe"
          autoCapitalize="words"
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Payment Method</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderPaymentMethodSelection()}
        
        {selectedType === PaymentMethodType.CARD && renderCardForm()}
        {selectedType === PaymentMethodType.MOBILE_MONEY && renderMobileMoneyForm()}

        {selectedType && (
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.defaultOption}
              onPress={() => setSetAsDefault(!setAsDefault)}
            >
              <Icon 
                name={setAsDefault ? "checkbox" : "square-outline"} 
                size={20} 
                color={COLORS.primary} 
              />
              <Text style={styles.defaultText}>Set as default payment method</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {selectedType && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.addButton, isLoading && styles.disabledButton]}
            onPress={handleAddPaymentMethod}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.addButtonText}>Add Payment Method</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: SIZES.base,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: SIZES.padding,
  },
  selectionContainer: {
    marginBottom: SIZES.padding * 2,
  },
  sectionTitle: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  methodTypeCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.base,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCard: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F7FF',
  },
  methodTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodTypeInfo: {
    marginLeft: SIZES.padding,
    flex: 1,
  },
  methodTypeName: {
    fontSize: SIZES.font,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  selectedText: {
    color: COLORS.primary,
  },
  methodTypeDescription: {
    fontSize: SIZES.small,
    color: COLORS.gray,
  },
  formContainer: {
    marginBottom: SIZES.padding * 2,
  },
  inputGroup: {
    marginBottom: SIZES.padding,
  },
  inputLabel: {
    fontSize: SIZES.font,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    fontSize: SIZES.font,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerScroll: {
    marginVertical: SIZES.base,
  },
  providerChip: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    marginRight: SIZES.base,
  },
  selectedProviderChip: {
    backgroundColor: COLORS.primary,
  },
  providerText: {
    fontSize: SIZES.font,
    color: COLORS.text,
    fontWeight: '500',
  },
  selectedProviderText: {
    color: COLORS.white,
  },
  optionsContainer: {
    marginBottom: SIZES.padding * 2,
  },
  defaultOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.base,
  },
  defaultText: {
    marginLeft: SIZES.base,
    fontSize: SIZES.font,
    color: COLORS.text,
  },
  footer: {
    padding: SIZES.padding,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  disabledButton: {
    opacity: 0.7,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: SIZES.font,
    fontWeight: 'bold',
  },
});

export default AddPaymentMethodScreen;

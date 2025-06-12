import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StripeProvider, CardField, useStripe } from '@stripe/stripe-react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { COLORS, SIZES } from '../config/constants';

const CardPaymentScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { orderId, amount } = route.params;
  const { confirmPayment } = useStripe();

  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'succeeded' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create a payment intent when the screen loads
  useEffect(() => {
    const createIntent = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user?.id, orderId, amount }),
        });

        const data = await response.json();
        if (data.status === 'success') {
          setClientSecret(data.clientSecret);
        } else {
          setErrorMessage(data.message || 'Failed to initialize payment');
        }
      } catch (error) {
        console.error('Error creating payment intent:', error);
        setErrorMessage('Network error. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    createIntent();
  }, []);

  // Handle the payment submission
  const handlePayPress = async () => {
    if (!cardComplete) {
      Alert.alert('Error', 'Please complete your card information');
      return;
    }

    if (!clientSecret) {
      Alert.alert('Error', 'Payment not initialized. Please try again.');
      return;
    }

    try {
      setPaymentStatus('processing');
      setIsLoading(true);

      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        console.error('Payment confirmation error:', error);
        setErrorMessage(error.message);
        setPaymentStatus('failed');
      } else if (paymentIntent) {
        setPaymentStatus('succeeded');

        // Navigate to the order success screen
        Alert.alert(
          'Payment Successful',
          'Your payment has been processed successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('OrderDetails', { orderId }),
            },
          ]
        );
      }
    } catch (e) {
      console.error('Payment error:', e);
      setErrorMessage('An unexpected error occurred.');
      setPaymentStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StripeProvider publishableKey="your-publishable-key">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Card Payment</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {isLoading && !errorMessage && paymentStatus === 'idle' ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Initializing payment...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle-outline" size={64} color={COLORS.error} />
              <Text style={styles.errorTitle}>Payment Error</Text>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Payment Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Order ID:</Text>
                  <Text style={styles.summaryValue}>{orderId}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Amount:</Text>
                  <Text style={styles.summaryValue}>{amount.toLocaleString()} XOF</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Card Information</Text>
              <View style={styles.cardContainer}>
                <CardField
                  postalCodeEnabled={false}
                  placeholders={{
                    number: '4242 4242 4242 4242',
                  }}
                  cardStyle={{
                    backgroundColor: COLORS.lightGray2,
                    borderRadius: SIZES.radius,
                    borderWidth: 1,
                    borderColor: COLORS.lightGray,
                  }}
                  style={{
                    width: '100%',
                    height: 50,
                    marginVertical: 5,
                  }}
                  onCardChange={(cardDetails) => {
                    setCardComplete(cardDetails.complete);
                  }}
                />
              </View>

              <View style={styles.securityNote}>
                <Icon name="lock-closed-outline" size={16} color={COLORS.gray} />
                <Text style={styles.securityText}>
                  Your payment information is secure and encrypted
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.payButton,
                  (!cardComplete || isLoading || paymentStatus === 'processing') && styles.disabledButton,
                ]}
                onPress={handlePayPress}
                disabled={!cardComplete || isLoading || paymentStatus === 'processing'}
              >
                {isLoading || paymentStatus === 'processing' ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.payButtonText}>Pay {amount.toLocaleString()} XOF</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
  },
  backButton: {
    marginRight: SIZES.padding,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.padding,
    fontSize: SIZES.font,
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    marginTop: SIZES.padding,
    marginBottom: SIZES.base,
    color: COLORS.text,
  },
  summaryContainer: {
    backgroundColor: COLORS.lightGray2,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
  },
  summaryTitle: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    marginBottom: SIZES.base,
    color: COLORS.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  summaryLabel: {
    color: COLORS.gray,
    fontSize: SIZES.font,
  },
  summaryValue: {
    fontWeight: 'bold',
    fontSize: SIZES.font,
    color: COLORS.text,
  },
  cardContainer: {
    marginVertical: SIZES.padding,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 5,
  },
  cardStyle: {
    backgroundColor: COLORS.lightGray2,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
  },
  securityText: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    marginLeft: 5,
  },
  payButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: SIZES.font,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: COLORS.gray,
    opacity: 0.6,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  errorTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.error,
    marginTop: SIZES.padding,
    marginBottom: SIZES.base,
  },
  errorMessage: {
    fontSize: SIZES.font,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding * 2,
    borderRadius: SIZES.radius,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: SIZES.font,
    fontWeight: '500',
  },
});

export default CardPaymentScreen;
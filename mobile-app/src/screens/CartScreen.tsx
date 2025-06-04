import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  Alert,
  ScrollView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '@/navigation/AppNavigator';
import { 
  removeFromCart, 
  updateCartItemQuantity, 
  setDeliveryType,
  setDeliveryAddress,
  createOrder
} from '@/store/slices/orderSlice';
import { getCurrentLocation } from '@/store/slices/locationSlice';
import { AppDispatch, RootState } from '@/store';
import { Feather } from '@expo/vector-icons';

type CartScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Cart'>;

interface Props {
  navigation: CartScreenNavigationProp;
}

const CartScreen: React.FC<Props> = ({ navigation }) => {
  const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const { cart, isLoading } = useSelector((state: RootState) => state.order);
  const { selectedPharmacy } = useSelector((state: RootState) => state.medicine);
  const { currentLocation } = useSelector((state: RootState) => state.location);
  
  // Calculate subtotal, tax, and total
  const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = cart.deliveryType === 'HOME_DELIVERY' && selectedPharmacy ? selectedPharmacy.deliveryFee : 0;
  const total = subtotal + deliveryFee;
  
  // Check if any item requires prescription
  const requiresPrescription = cart.items.some(item => item.requiresPrescription);

  useEffect(() => {
    // If we don't have the user's location, get it
    if (!currentLocation) {
      dispatch(getCurrentLocation());
    }
    
    // If we don't have a delivery address yet, set the current location as delivery address
    if (!cart.deliveryAddress && currentLocation) {
      dispatch(setDeliveryAddress(currentLocation));
    }
  }, [currentLocation]);

  const handleRemoveItem = (medicineId: number) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => dispatch(removeFromCart(medicineId)) }
      ]
    );
  };

  const handleQuantityChange = (medicineId: number, quantity: number) => {
    if (quantity < 1) return;
    dispatch(updateCartItemQuantity({ medicineId, quantity }));
  };

  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before proceeding.');
      return;
    }
    
    if (!cart.deliveryType) {
      setShowDeliveryOptions(true);
      return;
    }
    
    if (!cart.deliveryAddress) {
      Alert.alert('Delivery Address', 'Please set a delivery address.');
      return;
    }
    
    try {
      const orderData = {
        pharmacyId: cart.pharmacyId,
        items: cart.items,
        deliveryAddress: cart.deliveryAddress,
        deliveryType: cart.deliveryType,
      };
      
      const order = await dispatch(createOrder(orderData)).unwrap();
      
      if (requiresPrescription) {
        // Navigate to prescription upload
        navigation.navigate('PrescriptionUpload', { orderId: order.id });
      } else {
        // Navigate to payment
        navigation.navigate('Payment', { orderId: order.id });
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      Alert.alert('Error', 'Failed to create order. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemContent}>
        <View>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
          {item.requiresPrescription && (
            <View style={styles.prescriptionBadge}>
              <Feather name="file-text" size={12} color="#4A80F0" />
              <Text style={styles.prescriptionText}>Requires Prescription</Text>
            </View>
          )}
        </View>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.medicineId, item.quantity - 1)}
          >
            <Feather name="minus" size={16} color="#64748B" />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{item.quantity}</Text>
          
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.medicineId, item.quantity + 1)}
          >
            <Feather name="plus" size={16} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => handleRemoveItem(item.medicineId)}
      >
        <Feather name="trash-2" size={20} color="#F87171" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Pharmacy info */}
        {selectedPharmacy && (
          <View style={styles.pharmacyContainer}>
            <Text style={styles.pharmacyName}>{selectedPharmacy.name}</Text>
            <Text style={styles.pharmacyAddress}>{selectedPharmacy.address}</Text>
            
            <View style={styles.pharmacyInfoRow}>
              {selectedPharmacy.isOpen() ? (
                <View style={styles.statusBadge}>
                  <View style={[styles.statusDot, styles.statusOpen]} />
                  <Text style={styles.statusText}>Open Now</Text>
                </View>
              ) : (
                <View style={styles.statusBadge}>
                  <View style={[styles.statusDot, styles.statusClosed]} />
                  <Text style={styles.statusText}>Closed</Text>
                </View>
              )}
              
              <View style={styles.ratingBadge}>
                <Feather name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingText}>
                  {selectedPharmacy.rating.toFixed(1)} ({selectedPharmacy.reviewCount})
                </Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Cart items */}
        <Text style={styles.sectionTitle}>Items in Cart</Text>
        {cart.items.length > 0 ? (
          <FlatList
            data={cart.items}
            renderItem={renderItem}
            keyExtractor={(item) => item.medicineId.toString()}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyCart}>
            <Feather name="shopping-cart" size={50} color="#CBD5E1" />
            <Text style={styles.emptyCartText}>Your cart is empty</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Delivery options */}
        {showDeliveryOptions && cart.items.length > 0 && (
          <View style={styles.deliveryOptions}>
            <Text style={styles.sectionTitle}>Delivery Options</Text>
            
            <TouchableOpacity
              style={[
                styles.deliveryOption,
                cart.deliveryType === 'HOME_DELIVERY' && styles.selectedOption
              ]}
              onPress={() => dispatch(setDeliveryType('HOME_DELIVERY'))}
            >
              <View style={styles.deliveryOptionContent}>
                <Feather 
                  name="home" 
                  size={20} 
                  color={cart.deliveryType === 'HOME_DELIVERY' ? '#4A80F0' : '#64748B'} 
                />
                <View style={styles.deliveryOptionText}>
                  <Text style={styles.deliveryOptionTitle}>Home Delivery</Text>
                  <Text style={styles.deliveryOptionSubtitle}>
                    Delivered to your address
                  </Text>
                </View>
              </View>
              <Text style={styles.deliveryFee}>
                {selectedPharmacy?.deliveryFee 
                  ? `$${selectedPharmacy.deliveryFee.toFixed(2)}` 
                  : 'Free'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.deliveryOption,
                cart.deliveryType === 'PICKUP' && styles.selectedOption
              ]}
              onPress={() => dispatch(setDeliveryType('PICKUP'))}
            >
              <View style={styles.deliveryOptionContent}>
                <Feather 
                  name="shopping-bag" 
                  size={20} 
                  color={cart.deliveryType === 'PICKUP' ? '#4A80F0' : '#64748B'} 
                />
                <View style={styles.deliveryOptionText}>
                  <Text style={styles.deliveryOptionTitle}>Pickup</Text>
                  <Text style={styles.deliveryOptionSubtitle}>
                    Collect from the pharmacy
                  </Text>
                </View>
              </View>
              <Text style={styles.deliveryFee}>Free</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Order summary */}
        {cart.items.length > 0 && (
          <View style={styles.summary}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>Total</Text>
              <Text style={styles.summaryTotalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        )}
        
        {/* Prescription notice */}
        {requiresPrescription && cart.items.length > 0 && (
          <View style={styles.prescriptionNotice}>
            <Feather name="alert-circle" size={20} color="#4A80F0" />
            <Text style={styles.prescriptionNoticeText}>
              Some items require a prescription. You'll need to upload it after checkout.
            </Text>
          </View>
        )}
      </ScrollView>
      
      {/* Checkout button */}
      {cart.items.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.checkoutButton, isLoading && styles.disabledButton]}
            onPress={handleCheckout}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.checkoutButtonText}>Processing...</Text>
            ) : (
              <Text style={styles.checkoutButtonText}>
                {cart.deliveryType 
                  ? `Checkout • $${total.toFixed(2)}` 
                  : 'Continue to Delivery Options'}
              </Text>
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
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  pharmacyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pharmacyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  pharmacyAddress: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  pharmacyInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusOpen: {
    backgroundColor: '#10B981',
  },
  statusClosed: {
    backgroundColor: '#F87171',
  },
  statusText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    marginTop: 8,
  },
  cartItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 4,
    maxWidth: 200,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A80F0',
    marginBottom: 4,
  },
  prescriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  prescriptionText: {
    fontSize: 12,
    color: '#4A80F0',
    fontWeight: '500',
    marginLeft: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  removeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginTop: 8,
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyCartText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#4A80F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deliveryOptions: {
    marginBottom: 16,
  },
  deliveryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedOption: {
    borderColor: '#4A80F0',
    backgroundColor: '#F0F7FF',
  },
  deliveryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryOptionText: {
    marginLeft: 12,
  },
  deliveryOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 2,
  },
  deliveryOptionSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  deliveryFee: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A80F0',
  },
  summary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A80F0',
  },
  prescriptionNotice: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 100,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  prescriptionNoticeText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
  },
  checkoutButton: {
    backgroundColor: '#4A80F0',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CartScreen;

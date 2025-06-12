
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { COLORS, SIZES } from '../constants';

interface Medicine {
  id: number;
  name: string;
  generic_name?: string;
  dosage: string;
  form: string;
  manufacturer: string;
  description: string;
  indications: string[];
  contraindications: string[];
  side_effects: string[];
  dosage_instructions: string;
  storage_conditions: string;
  active_ingredients: string[];
  requires_prescription: boolean;
  category: string;
  image_url?: string;
  price?: number;
  stock_quantity?: number;
  pharmacy_id?: number;
}

interface PharmacyStock {
  pharmacy_id: number;
  pharmacy_name: string;
  pharmacy_address: string;
  pharmacy_phone: string;
  stock_quantity: number;
  price: number;
  distance: number;
  is_available: boolean;
}

const MedicineDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { medicineId } = route.params as { medicineId: number };

  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [pharmacyStocks, setPharmacyStocks] = useState<PharmacyStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'details' | 'availability'>('details');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchMedicineDetails();
    fetchPharmacyAvailability();
  }, [medicineId]);

  const fetchMedicineDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/medicines/${medicineId}`);
      
      if (response.data.status === 'success') {
        setMedicine(response.data.data);
      } else {
        Alert.alert('Error', 'Failed to load medicine details');
      }
    } catch (error) {
      console.error('Error fetching medicine details:', error);
      Alert.alert('Error', 'Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPharmacyAvailability = async () => {
    try {
      const response = await api.get(`/api/medicines/${medicineId}/availability`);
      
      if (response.data.status === 'success') {
        setPharmacyStocks(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching pharmacy availability:', error);
    }
  };

  const handleAddToCart = async (pharmacyId: number, price: number) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to add items to cart');
      return;
    }

    try {
      const response = await api.post('/api/cart/add', {
        medicine_id: medicineId,
        pharmacy_id: pharmacyId,
        quantity: quantity,
        price: price,
      });

      if (response.data.status === 'success') {
        Alert.alert('Success', 'Item added to cart successfully');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const handleBuyNow = (pharmacyId: number, price: number) => {
    // Navigate to checkout with this single item
    navigation.navigate('Checkout', {
      items: [{
        medicine_id: medicineId,
        pharmacy_id: pharmacyId,
        quantity: quantity,
        price: price,
      }]
    });
  };

  const handlePharmacySelect = (pharmacy: PharmacyStock) => {
    navigation.navigate('PharmacyDetail', { 
      pharmacyId: pharmacy.pharmacy_id,
      medicineId: medicineId 
    });
  };

  const renderTabButton = (tab: 'details' | 'availability', label: string) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        selectedTab === tab && styles.activeTabButton
      ]}
      onPress={() => setSelectedTab(tab)}
    >
      <Text style={[
        styles.tabButtonText,
        selectedTab === tab && styles.activeTabButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderDetailsTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Basic Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Generic Name:</Text>
          <Text style={styles.infoValue}>{medicine?.generic_name || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dosage:</Text>
          <Text style={styles.infoValue}>{medicine?.dosage}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Form:</Text>
          <Text style={styles.infoValue}>{medicine?.form}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Manufacturer:</Text>
          <Text style={styles.infoValue}>{medicine?.manufacturer}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Category:</Text>
          <Text style={styles.infoValue}>{medicine?.category}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Prescription Required:</Text>
          <Text style={[
            styles.infoValue,
            { color: medicine?.requires_prescription ? COLORS.error : COLORS.success }
          ]}>
            {medicine?.requires_prescription ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>

      {/* Description */}
      {medicine?.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{medicine.description}</Text>
        </View>
      )}

      {/* Active Ingredients */}
      {medicine?.active_ingredients && medicine.active_ingredients.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Ingredients</Text>
          {medicine.active_ingredients.map((ingredient, index) => (
            <View key={index} style={styles.listItem}>
              <Icon name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.listItemText}>{ingredient}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Indications */}
      {medicine?.indications && medicine.indications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indications</Text>
          {medicine.indications.map((indication, index) => (
            <View key={index} style={styles.listItem}>
              <Icon name="medical" size={16} color={COLORS.primary} />
              <Text style={styles.listItemText}>{indication}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Contraindications */}
      {medicine?.contraindications && medicine.contraindications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contraindications</Text>
          {medicine.contraindications.map((contraindication, index) => (
            <View key={index} style={styles.listItem}>
              <Icon name="warning" size={16} color={COLORS.error} />
              <Text style={styles.listItemText}>{contraindication}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Side Effects */}
      {medicine?.side_effects && medicine.side_effects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Side Effects</Text>
          {medicine.side_effects.map((sideEffect, index) => (
            <View key={index} style={styles.listItem}>
              <Icon name="alert-circle" size={16} color={COLORS.warning} />
              <Text style={styles.listItemText}>{sideEffect}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Dosage Instructions */}
      {medicine?.dosage_instructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dosage Instructions</Text>
          <Text style={styles.descriptionText}>{medicine.dosage_instructions}</Text>
        </View>
      )}

      {/* Storage Conditions */}
      {medicine?.storage_conditions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage Conditions</Text>
          <Text style={styles.descriptionText}>{medicine.storage_conditions}</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderAvailabilityTab = () => (
    <ScrollView style={styles.tabContent}>
      {pharmacyStocks.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available at {pharmacyStocks.length} Pharmacies</Text>
          {pharmacyStocks.map((stock, index) => (
            <TouchableOpacity
              key={index}
              style={styles.pharmacyCard}
              onPress={() => handlePharmacySelect(stock)}
            >
              <View style={styles.pharmacyInfo}>
                <Text style={styles.pharmacyName}>{stock.pharmacy_name}</Text>
                <Text style={styles.pharmacyAddress}>{stock.pharmacy_address}</Text>
                <View style={styles.pharmacyMeta}>
                  <View style={styles.distanceContainer}>
                    <Icon name="location-outline" size={16} color={COLORS.gray} />
                    <Text style={styles.distance}>{stock.distance.toFixed(1)} km</Text>
                  </View>
                  <View style={styles.stockContainer}>
                    <Icon 
                      name={stock.stock_quantity > 0 ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={stock.stock_quantity > 0 ? COLORS.success : COLORS.error} 
                    />
                    <Text style={[
                      styles.stockText,
                      { color: stock.stock_quantity > 0 ? COLORS.success : COLORS.error }
                    ]}>
                      {stock.stock_quantity > 0 ? `${stock.stock_quantity} in stock` : 'Out of stock'}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.pharmacyActions}>
                <Text style={styles.price}>{stock.price.toLocaleString()} XOF</Text>
                
                {stock.stock_quantity > 0 && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.addToCartButton}
                      onPress={() => handleAddToCart(stock.pharmacy_id, stock.price)}
                    >
                      <Icon name="cart-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.buyNowButton}
                      onPress={() => handleBuyNow(stock.pharmacy_id, stock.price)}
                    >
                      <Text style={styles.buyNowText}>Buy Now</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Icon name="storefront-outline" size={64} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>Not Available</Text>
          <Text style={styles.emptyMessage}>
            This medicine is currently not available at any nearby pharmacies.
          </Text>
        </View>
      )}
    </ScrollView>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading medicine details...</Text>
      </SafeAreaView>
    );
  }

  if (!medicine) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorTitle}>Medicine Not Found</Text>
        <Text style={styles.errorMessage}>
          The medicine you're looking for could not be found.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIconButton}>
          <Icon name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{medicine.name}</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Icon name="share-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Medicine Header */}
      <View style={styles.medicineHeader}>
        {medicine.image_url ? (
          <Image source={{ uri: medicine.image_url }} style={styles.medicineImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon name="medical" size={48} color={COLORS.gray} />
          </View>
        )}
        
        <View style={styles.medicineInfo}>
          <Text style={styles.medicineName}>{medicine.name}</Text>
          <Text style={styles.medicineGeneric}>{medicine.generic_name}</Text>
          <Text style={styles.medicineDosage}>{medicine.dosage} • {medicine.form}</Text>
          <Text style={styles.medicineManufacturer}>by {medicine.manufacturer}</Text>
          
          {medicine.requires_prescription && (
            <View style={styles.prescriptionBadge}>
              <Icon name="document-text" size={16} color={COLORS.white} />
              <Text style={styles.prescriptionText}>Prescription Required</Text>
            </View>
          )}
        </View>
      </View>

      {/* Quantity Selector */}
      <View style={styles.quantityContainer}>
        <Text style={styles.quantityLabel}>Quantity:</Text>
        <View style={styles.quantitySelector}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Icon name="remove" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.quantityValue}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(quantity + 1)}
          >
            <Icon name="add" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {renderTabButton('details', 'Details')}
        {renderTabButton('availability', 'Availability')}
      </View>

      {/* Tab Content */}
      {selectedTab === 'details' ? renderDetailsTab() : renderAvailabilityTab()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: SIZES.padding,
    fontSize: SIZES.font,
    color: COLORS.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
    backgroundColor: COLORS.white,
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
  backButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding * 2,
    borderRadius: SIZES.radius,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: SIZES.font,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backIconButton: {
    padding: SIZES.base,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  shareButton: {
    padding: SIZES.base,
  },
  medicineHeader: {
    flexDirection: 'row',
    padding: SIZES.padding,
    backgroundColor: COLORS.lightGray2,
  },
  medicineImage: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.white,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicineInfo: {
    flex: 1,
    marginLeft: SIZES.padding,
  },
  medicineName: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  medicineGeneric: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    marginBottom: 4,
  },
  medicineDosage: {
    fontSize: SIZES.small,
    color: COLORS.text,
    marginBottom: 4,
  },
  medicineManufacturer: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    marginBottom: SIZES.base,
  },
  prescriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: SIZES.base,
    paddingVertical: 4,
    borderRadius: SIZES.radius,
    alignSelf: 'flex-start',
    gap: 4,
  },
  prescriptionText: {
    fontSize: SIZES.small,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  quantityLabel: {
    fontSize: SIZES.font,
    color: COLORS.text,
    fontWeight: '500',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray2,
    borderRadius: SIZES.radius,
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    color: COLORS.text,
    minWidth: 40,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SIZES.padding,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: SIZES.font,
    color: COLORS.gray,
  },
  activeTabButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
  },
  section: {
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  sectionTitle: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: SIZES.base,
  },
  infoLabel: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    width: 120,
  },
  infoValue: {
    fontSize: SIZES.small,
    color: COLORS.text,
    flex: 1,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: SIZES.small,
    color: COLORS.text,
    lineHeight: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
    gap: SIZES.base,
  },
  listItemText: {
    fontSize: SIZES.small,
    color: COLORS.text,
    flex: 1,
  },
  pharmacyCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.base,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  pharmacyInfo: {
    marginBottom: SIZES.base,
  },
  pharmacyName: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  pharmacyAddress: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    marginBottom: SIZES.base,
  },
  pharmacyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distance: {
    fontSize: SIZES.small,
    color: COLORS.gray,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockText: {
    fontSize: SIZES.small,
    fontWeight: '500',
  },
  pharmacyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SIZES.base,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightPrimary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
    gap: 4,
  },
  addToCartText: {
    fontSize: SIZES.small,
    color: COLORS.primary,
    fontWeight: '500',
  },
  buyNowButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
  },
  buyNowText: {
    fontSize: SIZES.small,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding * 3,
  },
  emptyTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.padding,
    marginBottom: SIZES.base,
  },
  emptyMessage: {
    fontSize: SIZES.font,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: SIZES.padding,
  },
});

export default MedicineDetailScreen;

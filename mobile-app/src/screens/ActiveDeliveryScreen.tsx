
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Linking,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import deliveryService from '../services/delivery.service';
import locationService from '../services/location.service';

interface ActiveDeliveryScreenProps {
  route: any;
  navigation: any;
}

interface DeliveryDetails {
  id: number;
  orderId: number;
  status: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupLocation: { latitude: number; longitude: number };
  deliveryLocation: { latitude: number; longitude: number };
  estimatedTime: string;
  items: any[];
  instructions?: string;
}

const ActiveDeliveryScreen: React.FC<ActiveDeliveryScreenProps> = ({ route, navigation }) => {
  const { deliveryId } = route.params;
  const mapRef = useRef<MapView>(null);

  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [selectedIssueType, setSelectedIssueType] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);

  const issueTypes = [
    { id: 'customer_unavailable', label: 'Client indisponible' },
    { id: 'wrong_address', label: 'Adresse incorrecte' },
    { id: 'pharmacy_closed', label: 'Pharmacie fermée' },
    { id: 'medication_unavailable', label: 'Médicament indisponible' },
    { id: 'vehicle_issue', label: 'Problème de véhicule' },
    { id: 'other', label: 'Autre' },
  ];

  useEffect(() => {
    loadDeliveryDetails();
    startLocationTracking();

    return () => {
      locationService.stopLocationTracking();
    };
  }, []);

  const loadDeliveryDetails = async () => {
    try {
      const details = await deliveryService.getDeliveryDetails(deliveryId);
      setDelivery(details);
      
      // Obtenir l'itinéraire
      if (details.pickupLocation && details.deliveryLocation) {
        const route = await locationService.getRoute(
          details.pickupLocation.latitude,
          details.pickupLocation.longitude,
          details.deliveryLocation.latitude,
          details.deliveryLocation.longitude
        );
        
        if (route.features && route.features[0]) {
          const coordinates = route.features[0].geometry.coordinates.map((coord: number[]) => ({
            latitude: coord[1],
            longitude: coord[0],
          }));
          setRouteCoordinates(coordinates);
        }
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les détails de la livraison');
    } finally {
      setIsLoading(false);
    }
  };

  const startLocationTracking = async () => {
    try {
      await locationService.startLocationTracking(deliveryId);
      
      // Mise à jour de la position toutes les 5 secondes
      const locationInterval = setInterval(async () => {
        const location = await locationService.getCurrentLocation();
        if (location) {
          setCurrentLocation(location);
        }
      }, 5000);

      return () => clearInterval(locationInterval);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de démarrer le suivi GPS');
    }
  };

  const updateDeliveryStatus = async (newStatus: string) => {
    try {
      await deliveryService.updateDeliveryStatus(deliveryId, newStatus);
      
      if (delivery) {
        setDelivery({ ...delivery, status: newStatus });
      }

      // Actions spécifiques selon le statut
      switch (newStatus) {
        case 'arrived_at_pharmacy':
          Alert.alert('Arrivé', 'Vous êtes arrivé à la pharmacie');
          break;
        case 'picked_up':
          Alert.alert('Récupéré', 'Médicaments récupérés avec succès');
          break;
        case 'arrived_at_customer':
          Alert.alert('Arrivé', 'Vous êtes arrivé chez le client');
          setShowCodeModal(true);
          break;
        case 'delivered':
          Alert.alert('Livraison terminée', 'Félicitations ! Livraison complétée avec succès');
          navigation.goBack();
          break;
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  const openNavigation = (destination: 'pickup' | 'delivery') => {
    if (!delivery) return;

    const location = destination === 'pickup' 
      ? delivery.pickupLocation 
      : delivery.deliveryLocation;
    
    const address = destination === 'pickup' 
      ? delivery.pickupAddress 
      : delivery.deliveryAddress;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}&destination_place_id=${encodeURIComponent(address)}`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la navigation GPS');
    });
  };

  const callCustomer = () => {
    if (delivery?.customerPhone) {
      Linking.openURL(`tel:${delivery.customerPhone}`);
    }
  };

  const reportIssue = async () => {
    if (!selectedIssueType || !issueDescription.trim()) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type de problème et ajouter une description');
      return;
    }

    try {
      await deliveryService.reportIssue(deliveryId, selectedIssueType, issueDescription);
      setShowIssueModal(false);
      setIssueDescription('');
      setSelectedIssueType('');
      Alert.alert('Signalement envoyé', 'Le problème a été signalé à l\'équipe support');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de signaler le problème');
    }
  };

  const verifyDeliveryCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le code de vérification');
      return;
    }

    try {
      await deliveryService.verifyDeliveryCode(deliveryId, verificationCode);
      setShowCodeModal(false);
      setVerificationCode('');
      await updateDeliveryStatus('delivered');
    } catch (error) {
      Alert.alert('Code invalide', 'Le code de vérification est incorrect');
    }
  };

  const sendVerificationCode = async () => {
    try {
      await deliveryService.sendVerificationCode(deliveryId);
      Alert.alert('Code envoyé', 'Un code de vérification a été envoyé au client');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le code de vérification');
    }
  };

  const getStatusActions = () => {
    if (!delivery) return [];

    switch (delivery.status) {
      case 'accepted':
        return [
          {
            title: 'Naviguer vers pharmacie',
            icon: 'navigation',
            action: () => openNavigation('pickup'),
            color: '#2196F3',
          },
          {
            title: 'Arrivé à la pharmacie',
            icon: 'location-on',
            action: () => updateDeliveryStatus('arrived_at_pharmacy'),
            color: '#4CAF50',
          },
        ];
      case 'arrived_at_pharmacy':
        return [
          {
            title: 'Médicaments récupérés',
            icon: 'check',
            action: () => updateDeliveryStatus('picked_up'),
            color: '#4CAF50',
          },
        ];
      case 'picked_up':
        return [
          {
            title: 'Naviguer vers client',
            icon: 'navigation',
            action: () => openNavigation('delivery'),
            color: '#2196F3',
          },
          {
            title: 'Arrivé chez le client',
            icon: 'location-on',
            action: () => updateDeliveryStatus('arrived_at_customer'),
            color: '#4CAF50',
          },
        ];
      case 'arrived_at_customer':
        return [
          {
            title: 'Envoyer code de vérification',
            icon: 'sms',
            action: sendVerificationCode,
            color: '#FF9800',
          },
          {
            title: 'Finaliser livraison',
            icon: 'done-all',
            action: () => setShowCodeModal(true),
            color: '#4CAF50',
          },
        ];
      default:
        return [];
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <MaterialIcons name="local-shipping" size={64} color="#0C6B58" />
          <Text style={styles.loadingText}>Chargement de la livraison...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!delivery) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={64} color="#F44336" />
          <Text style={styles.errorText}>Livraison introuvable</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Livraison #{delivery.orderId}</Text>
        <TouchableOpacity onPress={() => setShowIssueModal(true)}>
          <MaterialIcons name="report-problem" size={24} color="#FF9800" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          showsUserLocation={true}
          showsMyLocationButton={true}
          initialRegion={{
            latitude: delivery.pickupLocation.latitude,
            longitude: delivery.pickupLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* Pharmacie */}
          <Marker
            coordinate={delivery.pickupLocation}
            title="Pharmacie"
            description={delivery.pickupAddress}
            pinColor="#4CAF50"
          />

          {/* Client */}
          <Marker
            coordinate={delivery.deliveryLocation}
            title="Client"
            description={delivery.deliveryAddress}
            pinColor="#2196F3"
          />

          {/* Itinéraire */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={4}
              strokeColor="#0C6B58"
            />
          )}
        </MapView>
      </View>

      {/* Info Panel */}
      <View style={styles.infoPanel}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Status */}
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {getStatusLabel(delivery.status)}
            </Text>
          </View>

          {/* Customer Info */}
          <View style={styles.customerContainer}>
            <View style={styles.customerInfo}>
              <FontAwesome5 name="user" size={16} color="#666" />
              <Text style={styles.customerName}>{delivery.customerName}</Text>
            </View>
            <TouchableOpacity onPress={callCustomer} style={styles.phoneButton}>
              <MaterialIcons name="phone" size={20} color="#0C6B58" />
            </TouchableOpacity>
          </View>

          {/* Addresses */}
          <View style={styles.addressContainer}>
            <View style={styles.addressRow}>
              <MaterialIcons name="store" size={16} color="#4CAF50" />
              <Text style={styles.addressText}>{delivery.pickupAddress}</Text>
            </View>
            <View style={styles.addressRow}>
              <MaterialIcons name="location-on" size={16} color="#2196F3" />
              <Text style={styles.addressText}>{delivery.deliveryAddress}</Text>
            </View>
          </View>

          {/* Items */}
          <View style={styles.itemsContainer}>
            <Text style={styles.itemsTitle}>Médicaments ({delivery.items.length})</Text>
            {delivery.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              </View>
            ))}
          </View>

          {/* Instructions */}
          {delivery.instructions && (
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>Instructions spéciales</Text>
              <Text style={styles.instructionsText}>{delivery.instructions}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {getStatusActions().map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionButton, { backgroundColor: action.color }]}
                onPress={action.action}
              >
                <MaterialIcons name={action.icon} size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Issue Modal */}
      <Modal visible={showIssueModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Signaler un problème</Text>
              <TouchableOpacity onPress={() => setShowIssueModal(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalLabel}>Type de problème</Text>
              {issueTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.issueTypeButton,
                    selectedIssueType === type.id && styles.issueTypeButtonSelected,
                  ]}
                  onPress={() => setSelectedIssueType(type.id)}
                >
                  <Text style={[
                    styles.issueTypeText,
                    selectedIssueType === type.id && styles.issueTypeTextSelected,
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={styles.modalLabel}>Description</Text>
              <TextInput
                style={styles.textInput}
                value={issueDescription}
                onChangeText={setIssueDescription}
                placeholder="Décrivez le problème en détail..."
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity style={styles.submitButton} onPress={reportIssue}>
                <Text style={styles.submitButtonText}>Signaler</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Verification Code Modal */}
      <Modal visible={showCodeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Code de vérification</Text>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalDescription}>
                Demandez au client de vous communiquer le code de vérification qu'il a reçu par SMS.
              </Text>

              <TextInput
                style={styles.codeInput}
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="Code de vérification"
                keyboardType="number-pad"
                maxLength={6}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCodeModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={verifyDeliveryCode}
                >
                  <Text style={styles.verifyButtonText}>Vérifier</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getStatusLabel = (status: string) => {
  const labels: { [key: string]: string } = {
    'accepted': 'Acceptée',
    'en_route_to_pharmacy': 'En route vers la pharmacie',
    'arrived_at_pharmacy': 'Arrivé à la pharmacie',
    'picked_up': 'Médicaments récupérés',
    'en_route_to_customer': 'En route vers le client',
    'arrived_at_customer': 'Arrivé chez le client',
    'delivered': 'Livrée',
  };
  return labels[status] || status;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#0C6B58',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  infoPanel: {
    maxHeight: '50%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  customerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerName: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  phoneButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
  },
  addressContainer: {
    marginBottom: 20,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  itemsContainer: {
    marginBottom: 20,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C6B58',
  },
  instructionsContainer: {
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionsContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  issueTypeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  issueTypeButtonSelected: {
    borderColor: '#0C6B58',
    backgroundColor: '#E8F5E8',
  },
  issueTypeText: {
    fontSize: 14,
    color: '#666',
  },
  issueTypeTextSelected: {
    color: '#0C6B58',
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#0C6B58',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButton: {
    flex: 1,
    backgroundColor: '#0C6B58',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ActiveDeliveryScreen;

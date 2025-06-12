
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import deliveryService from '../services/delivery.service';

const DeliveryDetailsScreen = ({ route, navigation }) => {
  const { deliveryId } = route.params;
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [selectedIssueType, setSelectedIssueType] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [proofPhoto, setProofPhoto] = useState(null);

  const issueTypes = [
    { id: 'customer_absent', label: 'Client absent' },
    { id: 'wrong_address', label: 'Adresse incorrecte' },
    { id: 'access_denied', label: 'Accès refusé' },
    { id: 'medication_damaged', label: 'Médicament endommagé' },
    { id: 'customer_refused', label: 'Client a refusé la livraison' },
    { id: 'other', label: 'Autre' },
  ];

  useEffect(() => {
    loadDeliveryDetails();
  }, [deliveryId]);

  const loadDeliveryDetails = async () => {
    try {
      setLoading(true);
      const details = await deliveryService.getDeliveryDetails(deliveryId);
      setDelivery(details);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les détails de la livraison.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (status: string, extraData?: any) => {
    try {
      setActionLoading(true);
      await deliveryService.updateDeliveryStatus(deliveryId, status, extraData?.notes);
      
      if (extraData?.action) {
        await extraData.action();
      }
      
      await loadDeliveryDetails();
      
      Alert.alert('Succès', `Statut mis à jour: ${getStatusLabel(status)}`);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArrivedAtPharmacy = () => {
    updateDeliveryStatus('arrived_at_pharmacy', {
      action: () => deliveryService.markArrivedAtPharmacy(deliveryId)
    });
  };

  const handlePickedUp = () => {
    updateDeliveryStatus('picked_up', {
      action: () => deliveryService.markMedicationPickedUp(deliveryId, delivery.items)
    });
  };

  const handleArrivedAtCustomer = () => {
    updateDeliveryStatus('arrived_at_customer', {
      action: () => deliveryService.markArrivedAtCustomer(deliveryId)
    });
  };

  const handleSendVerificationCode = async () => {
    try {
      await deliveryService.sendVerificationCode(deliveryId);
      setShowCodeModal(true);
      Alert.alert('Code envoyé', 'Un code de vérification a été envoyé au client.');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le code de vérification.');
    }
  };

  const handleVerifyCode = async () => {
    try {
      await deliveryService.verifyDeliveryCode(deliveryId, verificationCode);
      setShowCodeModal(false);
      setVerificationCode('');
      
      if (proofPhoto) {
        await deliveryService.uploadDeliveryProof(deliveryId, proofPhoto);
      }
      
      await updateDeliveryStatus('delivered');
      Alert.alert('Succès', 'Livraison terminée avec succès!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', 'Code de vérification incorrect.');
    }
  };

  const takeProofPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'L\'accès à la caméra est nécessaire.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProofPhoto(result.assets[0].uri);
    }
  };

  const callCustomer = () => {
    if (delivery?.customerPhone) {
      Linking.openURL(`tel:${delivery.customerPhone}`);
    }
  };

  const openMaps = (address: string) => {
    const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const handleReportIssue = async () => {
    if (!selectedIssueType || !issueDescription.trim()) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type de problème et ajouter une description.');
      return;
    }

    try {
      await deliveryService.reportIssue(deliveryId, selectedIssueType, issueDescription);
      setShowIssueModal(false);
      setIssueDescription('');
      setSelectedIssueType('');
      Alert.alert('Signalement envoyé', 'Le problème a été signalé à l\'équipe support.');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de signaler le problème.');
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'assigned': 'Assignée',
      'accepted': 'Acceptée',
      'en_route_to_pharmacy': 'En route vers la pharmacie',
      'arrived_at_pharmacy': 'Arrivé à la pharmacie',
      'picked_up': 'Récupéré',
      'en_route_to_customer': 'En route vers le client',
      'arrived_at_customer': 'Arrivé chez le client',
      'delivered': 'Livrée',
      'cancelled': 'Annulée',
    };
    return labels[status] || status;
  };

  const getNextActions = () => {
    if (!delivery) return [];

    switch (delivery.status) {
      case 'accepted':
        return [
          {
            label: 'Partir vers la pharmacie',
            action: () => updateDeliveryStatus('en_route_to_pharmacy'),
            color: '#0C6B58',
            icon: 'navigation',
          },
        ];
      case 'en_route_to_pharmacy':
        return [
          {
            label: 'Arrivé à la pharmacie',
            action: handleArrivedAtPharmacy,
            color: '#4CAF50',
            icon: 'store',
          },
        ];
      case 'arrived_at_pharmacy':
        return [
          {
            label: 'Médicaments récupérés',
            action: handlePickedUp,
            color: '#FF9800',
            icon: 'check-circle',
          },
        ];
      case 'picked_up':
        return [
          {
            label: 'Partir vers le client',
            action: () => updateDeliveryStatus('en_route_to_customer'),
            color: '#2196F3',
            icon: 'navigation',
          },
        ];
      case 'en_route_to_customer':
        return [
          {
            label: 'Arrivé chez le client',
            action: handleArrivedAtCustomer,
            color: '#9C27B0',
            icon: 'location-on',
          },
        ];
      case 'arrived_at_customer':
        return [
          {
            label: 'Envoyer code de vérification',
            action: handleSendVerificationCode,
            color: '#FF5722',
            icon: 'sms',
          },
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0C6B58" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Livraison introuvable</Text>
      </View>
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
          <MaterialIcons name="report-problem" size={24} color="#FF5722" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusLabel}>Statut actuel</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{getStatusLabel(delivery.status)}</Text>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome5 name="user" size={20} color="#0C6B58" />
            <Text style={styles.cardTitle}>Informations client</Text>
          </View>
          <View style={styles.customerRow}>
            <Text style={styles.customerName}>{delivery.customerName}</Text>
            <TouchableOpacity style={styles.phoneButton} onPress={callCustomer}>
              <MaterialIcons name="phone" size={20} color="#0C6B58" />
            </TouchableOpacity>
          </View>
          <Text style={styles.customerPhone}>{delivery.customerPhone}</Text>
        </View>

        {/* Addresses */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="location-on" size={20} color="#0C6B58" />
            <Text style={styles.cardTitle}>Adresses</Text>
          </View>
          
          <View style={styles.addressRow}>
            <View style={styles.addressIcon}>
              <MaterialIcons name="store" size={16} color="#4CAF50" />
            </View>
            <View style={styles.addressContent}>
              <Text style={styles.addressLabel}>Retrait - Pharmacie</Text>
              <Text style={styles.addressText}>{delivery.pickupAddress}</Text>
              <TouchableOpacity 
                style={styles.mapsButton}
                onPress={() => openMaps(delivery.pickupAddress)}
              >
                <Text style={styles.mapsButtonText}>Ouvrir dans Maps</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.addressDivider} />

          <View style={styles.addressRow}>
            <View style={styles.addressIcon}>
              <MaterialIcons name="home" size={16} color="#2196F3" />
            </View>
            <View style={styles.addressContent}>
              <Text style={styles.addressLabel}>Livraison - Client</Text>
              <Text style={styles.addressText}>{delivery.deliveryAddress}</Text>
              <TouchableOpacity 
                style={styles.mapsButton}
                onPress={() => openMaps(delivery.deliveryAddress)}
              >
                <Text style={styles.mapsButtonText}>Ouvrir dans Maps</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome5 name="pills" size={20} color="#0C6B58" />
            <Text style={styles.cardTitle}>Médicaments ({delivery.items?.length || 0})</Text>
          </View>
          {delivery.items?.map((item, index) => (
            <View key={index} style={styles.medicineItem}>
              <Text style={styles.medicineName}>{item.medicineName}</Text>
              <Text style={styles.medicineDetails}>
                Quantité: {item.quantity} | {item.price} CFA
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>{delivery.totalAmount} CFA</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsCard}>
          {getNextActions().map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionButton, { backgroundColor: action.color }]}
              onPress={action.action}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIcons name={action.icon} size={24} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>{action.label}</Text>
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Proof Photo */}
        {(delivery.status === 'arrived_at_customer' || proofPhoto) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="camera-alt" size={20} color="#0C6B58" />
              <Text style={styles.cardTitle}>Preuve de livraison</Text>
            </View>
            {proofPhoto ? (
              <Image source={{ uri: proofPhoto }} style={styles.proofImage} />
            ) : (
              <TouchableOpacity style={styles.photoButton} onPress={takeProofPhoto}>
                <MaterialIcons name="add-a-photo" size={48} color="#666" />
                <Text style={styles.photoButtonText}>Prendre une photo</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Issue Report Modal */}
      <Modal visible={showIssueModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Signaler un problème</Text>
            
            <Text style={styles.inputLabel}>Type de problème</Text>
            <View style={styles.issueTypes}>
              {issueTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.issueTypeItem,
                    selectedIssueType === type.id && styles.selectedIssueType
                  ]}
                  onPress={() => setSelectedIssueType(type.id)}
                >
                  <Text style={[
                    styles.issueTypeText,
                    selectedIssueType === type.id && styles.selectedIssueTypeText
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.textArea}
              value={issueDescription}
              onChangeText={setIssueDescription}
              placeholder="Décrivez le problème en détail..."
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowIssueModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleReportIssue}
              >
                <Text style={styles.submitButtonText}>Signaler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Verification Code Modal */}
      <Modal visible={showCodeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Code de vérification</Text>
            <Text style={styles.modalSubtitle}>
              Demandez le code au client et saisissez-le ci-dessous
            </Text>
            
            <TextInput
              style={styles.codeInput}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="Code à 4 chiffres"
              keyboardType="numeric"
              maxLength={4}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCodeModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleVerifyCode}
                disabled={verificationCode.length !== 4}
              >
                <Text style={styles.submitButtonText}>Vérifier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF5252',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0C6B58',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  phoneButton: {
    backgroundColor: '#E8F5E8',
    padding: 8,
    borderRadius: 20,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
  },
  addressRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  addressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  mapsButton: {
    alignSelf: 'flex-start',
  },
  mapsButtonText: {
    fontSize: 14,
    color: '#0C6B58',
    textDecorationLine: 'underline',
  },
  addressDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  medicineItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  medicineDetails: {
    fontSize: 14,
    color: '#666',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C6B58',
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  photoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  photoButtonText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  proofImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  issueTypes: {
    marginBottom: 16,
  },
  issueTypeItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedIssueType: {
    borderColor: '#0C6B58',
    backgroundColor: '#E8F5E8',
  },
  issueTypeText: {
    fontSize: 14,
    color: '#666',
  },
  selectedIssueTypeText: {
    color: '#0C6B58',
    fontWeight: '500',
  },
  textArea: {
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
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  submitButton: {
    backgroundColor: '#0C6B58',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DeliveryDetailsScreen;

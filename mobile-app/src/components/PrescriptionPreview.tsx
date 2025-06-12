
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface PrescriptionPreviewProps {
  imageUri: string;
  onRemove: () => void;
}

const PrescriptionPreview: React.FC<PrescriptionPreviewProps> = ({
  imageUri,
  onRemove,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <MaterialIcons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.info}>
        <MaterialIcons name="check-circle" size={20} color="#10B981" />
        <Text style={styles.infoText}>Prescription sélectionnée</Text>
      </View>
      
      <Text style={styles.helpText}>
        Assurez-vous que tous les détails sont clairement visibles avant de continuer.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
});

export default PrescriptionPreview;

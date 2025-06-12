import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Props {
  imageUri: string;
  onRemove: () => void;
}

const PrescriptionPreview: React.FC<Props> = ({ imageUri, onRemove }) => {
  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
        <Feather name="x" size={20} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.label}>Prescription Preview</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 24,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#EF4444',
    borderRadius: 20,
    padding: 6,
  },
  label: {
    marginTop: 8,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
});

export default PrescriptionPreview;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PrescriptionsScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Prescriptions Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PrescriptionsScreen;

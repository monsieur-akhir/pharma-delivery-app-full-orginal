import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AddPaymentMethodScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Add Payment Method Screen</Text>
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

export default AddPaymentMethodScreen;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TrackOrderScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Track Order Screen</Text>
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

export default TrackOrderScreen;

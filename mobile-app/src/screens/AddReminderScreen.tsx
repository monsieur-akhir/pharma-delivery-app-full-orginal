import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AddReminderScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Add Reminder Screen</Text>
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

export default AddReminderScreen;

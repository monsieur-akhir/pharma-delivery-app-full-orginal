import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={50} color="#0C6B58" />
          </View>
          <Text style={styles.userName}>{user?.username || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
        </View>
        
        <View style={styles.menuItems}>
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="edit" size={24} color="#666" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="notifications" size={24} color="#666" />
            <Text style={styles.menuText}>Notifications</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="help" size={24} color="#666" />
            <Text style={styles.menuText}>Help & Support</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="privacy-tip" size={24} color="#666" />
            <Text style={styles.menuText}>Privacy Policy</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#ff4d4d" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#0C6B58',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e6f7f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  menuItems: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ff4d4d',
  },
  logoutText: {
    fontSize: 16,
    color: '#ff4d4d',
    marginLeft: 10,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
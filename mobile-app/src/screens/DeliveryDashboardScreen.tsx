
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Switch,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import deliveryService from '../services/delivery.service';
import authService from '../services/auth.service';

interface DeliveryTask {
  id: number;
  orderId: number;
  status: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDeliveryTime: string;
  totalAmount: number;
  distance: number;
  items: any[];
  priority: 'low' | 'medium' | 'high';
}

const DeliveryDashboardScreen = ({ navigation }) => {
  const [activeDeliveries, setActiveDeliveries] = useState<DeliveryTask[]>([]);
  const [availableDeliveries, setAvailableDeliveries] = useState<DeliveryTask[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'active' | 'available'>('active');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    todayEarnings: 0,
    rating: 0,
    completionRate: 0,
  });
  const [filterDistance, setFilterDistance] = useState<number>(10);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadActiveDeliveries(),
        loadAvailableDeliveries(),
        loadStats(),
        loadOnlineStatus(),
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveDeliveries = async () => {
    try {
      const deliveries = await deliveryService.getAssignedDeliveries('active');
      setActiveDeliveries(deliveries);
    } catch (error) {
      console.error('Erreur lors du chargement des livraisons actives:', error);
    }
  };

  const loadAvailableDeliveries = async () => {
    try {
      const deliveries = await deliveryService.getAvailableDeliveries();
      setAvailableDeliveries(deliveries);
    } catch (error) {
      console.error('Erreur lors du chargement des livraisons disponibles:', error);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await deliveryService.getDelivererStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const loadOnlineStatus = async () => {
    try {
      const status = await deliveryService.getOnlineStatus();
      setIsOnline(status.isOnline);
    } catch (error) {
      console.error('Erreur lors du chargement du statut en ligne:', error);
    }
  };

  const toggleOnlineStatus = async (value: boolean) => {
    try {
      await deliveryService.updateOnlineStatus(value);
      setIsOnline(value);
      
      if (value) {
        Alert.alert(
          'En ligne',
          'Vous êtes maintenant en ligne et pouvez recevoir de nouvelles livraisons.'
        );
        loadAvailableDeliveries();
      } else {
        Alert.alert(
          'Hors ligne',
          'Vous êtes maintenant hors ligne. Vous ne recevrez plus de nouvelles livraisons.'
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut en ligne.');
    }
  };

  const acceptDelivery = async (deliveryId: number) => {
    try {
      await deliveryService.acceptDelivery(deliveryId);
      Alert.alert('Succès', 'Livraison acceptée avec succès!');
      loadData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'accepter cette livraison.');
    }
  };

  const loadNotifications = async () => {
    try {
      const notifs = await deliveryService.getDelivererNotifications();
      setNotifications(notifs);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await deliveryService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  };

  const filterDeliveries = (deliveries: DeliveryTask[]) => {
    return deliveries.filter(delivery => {
      // Filtre par distance
      if (delivery.distance > filterDistance) return false;
      
      // Filtre par priorité
      if (filterPriority !== 'all' && delivery.priority !== filterPriority) return false;
      
      return true;
    }).sort((a, b) => {
      // Tri par priorité puis par distance
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Priorité décroissante
      }
      
      return a.distance - b.distance; // Distance croissante
    });
  };

  const startDelivery = (delivery: DeliveryTask) => {
    navigation.navigate('DeliveryTracking', {
      deliveryId: delivery.id,
      orderId: delivery.orderId,
      isDeliverer: true,
      customerAddress: delivery.deliveryAddress,
      pharmacyAddress: delivery.pickupAddress,
    });
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF5252';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const renderDeliveryCard = ({ item }: { item: DeliveryTask }) => (
    <TouchableOpacity 
      style={styles.deliveryCard}
      onPress={() => {
        if (selectedTab === 'active') {
          startDelivery(item);
        }
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.priorityBadge}>
          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
          <Text style={styles.priorityText}>#{item.orderId}</Text>
        </View>
        <Text style={styles.deliveryTime}>{item.estimatedDeliveryTime}</Text>
      </View>

      <View style={styles.customerInfo}>
        <FontAwesome5 name="user" size={16} color="#666" />
        <Text style={styles.customerName}>{item.customerName}</Text>
        <TouchableOpacity style={styles.phoneButton}>
          <MaterialIcons name="phone" size={16} color="#0C6B58" />
        </TouchableOpacity>
      </View>

      <View style={styles.addressInfo}>
        <View style={styles.addressRow}>
          <MaterialIcons name="store" size={16} color="#4CAF50" />
          <Text style={styles.addressText} numberOfLines={2}>
            Retrait: {item.pickupAddress}
          </Text>
        </View>
        <View style={styles.addressRow}>
          <MaterialIcons name="location-on" size={16} color="#2196F3" />
          <Text style={styles.addressText} numberOfLines={2}>
            Livraison: {item.deliveryAddress}
          </Text>
        </View>
      </View>

      <View style={styles.deliveryFooter}>
        <View style={styles.deliveryStats}>
          <Text style={styles.distance}>{item.distance.toFixed(1)} km</Text>
          <Text style={styles.amount}>{item.totalAmount.toFixed(2)} CFA</Text>
        </View>
        
        {selectedTab === 'available' ? (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => acceptDelivery(item.id)}
          >
            <Text style={styles.acceptButtonText}>Accepter</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.trackButton}>
            <MaterialIcons name="navigation" size={20} color="#0C6B58" />
            <Text style={styles.trackButtonText}>Suivre</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Bonjour!</Text>
          <Text style={styles.username}>{authService.getCurrentUser()?.fullName}</Text>
        </View>
        
        <View style={styles.headerRight}>
          <View style={styles.onlineToggle}>
            <Text style={[styles.statusText, { color: isOnline ? '#4CAF50' : '#9E9E9E' }]}>
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={toggleOnlineStatus}
              trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
              thumbColor={isOnline ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.todayDeliveries}</Text>
          <Text style={styles.statLabel}>Aujourd'hui</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.todayEarnings.toFixed(0)} CFA</Text>
          <Text style={styles.statLabel}>Gains</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.rating.toFixed(1)} ⭐</Text>
          <Text style={styles.statLabel}>Note</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.completionRate}%</Text>
          <Text style={styles.statLabel}>Taux</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'active' && styles.activeTab]}
          onPress={() => setSelectedTab('active')}
        >
          <Text style={[styles.tabText, selectedTab === 'active' && styles.activeTabText]}>
            Actives ({activeDeliveries.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'available' && styles.activeTab]}
          onPress={() => setSelectedTab('available')}
        >
          <Text style={[styles.tabText, selectedTab === 'available' && styles.activeTabText]}>
            Disponibles ({availableDeliveries.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Deliveries List */}
      <FlatList
        data={selectedTab === 'active' ? activeDeliveries : availableDeliveries}
        renderItem={renderDeliveryCard}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons 
              name={selectedTab === 'active' ? 'local-shipping' : 'inbox'} 
              size={64} 
              color="#E0E0E0" 
            />
            <Text style={styles.emptyText}>
              {selectedTab === 'active' 
                ? 'Aucune livraison active' 
                : isOnline 
                  ? 'Aucune livraison disponible'
                  : 'Passez en ligne pour voir les livraisons disponibles'
              }
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C6B58',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#0C6B58',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  deliveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  deliveryTime: {
    fontSize: 12,
    color: '#666',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  customerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  phoneButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
  },
  addressInfo: {
    gap: 8,
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryStats: {
    flexDirection: 'row',
    gap: 16,
  },
  distance: {
    fontSize: 14,
    color: '#666',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C6B58',
  },
  acceptButton: {
    backgroundColor: '#0C6B58',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  trackButtonText: {
    color: '#0C6B58',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default DeliveryDashboardScreen;

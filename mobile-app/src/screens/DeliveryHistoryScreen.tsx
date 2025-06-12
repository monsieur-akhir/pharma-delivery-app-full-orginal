
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import deliveryService from '../services/delivery.service';

interface DeliveryHistoryItem {
  id: number;
  orderId: number;
  customerName: string;
  deliveryAddress: string;
  completedAt: string;
  totalAmount: number;
  status: string;
  rating?: number;
  earnings: number;
}

const DeliveryHistoryScreen = ({ navigation }) => {
  const [deliveries, setDeliveries] = useState<DeliveryHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async (pageNumber: number = 1, refresh: boolean = false) => {
    try {
      if (pageNumber === 1 && !refresh) {
        setLoading(true);
      } else if (pageNumber > 1) {
        setLoadingMore(true);
      }

      const response = await deliveryService.getDeliveryHistory(pageNumber, 20);
      
      if (pageNumber === 1 || refresh) {
        setDeliveries(response.deliveries);
      } else {
        setDeliveries(prev => [...prev, ...response.deliveries]);
      }
      
      setHasMore(response.hasMore);
      setPage(pageNumber);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory(1, true);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      loadHistory(page + 1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#4CAF50';
      case 'cancelled': return '#FF5252';
      case 'returned': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'delivered': 'Livrée',
      'cancelled': 'Annulée',
      'returned': 'Retournée',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderDeliveryItem = ({ item }: { item: DeliveryHistoryItem }) => (
    <TouchableOpacity 
      style={styles.deliveryCard}
      onPress={() => navigation.navigate('DeliveryDetails', { deliveryId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>#{item.orderId}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>{formatDate(item.completedAt)}</Text>
      </View>

      <View style={styles.customerInfo}>
        <FontAwesome5 name="user" size={14} color="#666" />
        <Text style={styles.customerName}>{item.customerName}</Text>
      </View>

      <View style={styles.addressInfo}>
        <MaterialIcons name="location-on" size={14} color="#666" />
        <Text style={styles.addressText} numberOfLines={2}>
          {item.deliveryAddress}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.earnings}>
          <Text style={styles.earningsLabel}>Gain:</Text>
          <Text style={styles.earningsAmount}>{item.earnings.toFixed(2)} CFA</Text>
        </View>
        
        {item.rating && (
          <View style={styles.rating}>
            <MaterialIcons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#0C6B58" />
        <Text style={styles.footerText}>Chargement...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0C6B58" />
        <Text style={styles.loadingText}>Chargement de l'historique...</Text>
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
        <Text style={styles.headerTitle}>Historique des livraisons</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={deliveries}
        renderItem={renderDeliveryItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="history" size={64} color="#E0E0E0" />
            <Text style={styles.emptyText}>Aucune livraison dans l'historique</Text>
            <Text style={styles.emptySubText}>
              Vos livraisons terminées apparaîtront ici
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
  listContainer: {
    padding: 20,
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
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earnings: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#666',
  },
  earningsAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C6B58',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default DeliveryHistoryScreen;

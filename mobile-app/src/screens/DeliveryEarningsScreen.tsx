
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import deliveryService from '../services/delivery.service';

const { width } = Dimensions.get('window');

const DeliveryEarningsScreen = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const periods = [
    { key: 'today', label: "Aujourd'hui" },
    { key: 'week', label: 'Cette semaine' },
    { key: 'month', label: 'Ce mois' },
  ];

  useEffect(() => {
    loadEarnings();
  }, [selectedPeriod]);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const data = await deliveryService.getEarnings(selectedPeriod);
      setEarnings(data);
    } catch (error) {
      console.error('Erreur lors du chargement des gains:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarnings();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} CFA`;
  };

  const getChartData = () => {
    if (!earnings?.chartData) {
      return {
        labels: [],
        datasets: [{ data: [] }],
      };
    }

    return {
      labels: earnings.chartData.labels,
      datasets: [
        {
          data: earnings.chartData.values,
          color: (opacity = 1) => `rgba(12, 107, 88, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  const getBarChartData = () => {
    if (!earnings?.deliveryStats) {
      return {
        labels: [],
        datasets: [{ data: [] }],
      };
    }

    return {
      labels: earnings.deliveryStats.labels,
      datasets: [
        {
          data: earnings.deliveryStats.values,
        },
      ],
    };
  };

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(12, 107, 88, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#0C6B58',
    },
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0C6B58" />
        <Text style={styles.loadingText}>Chargement des gains...</Text>
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
        <Text style={styles.headerTitle}>Mes gains</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.selectedPeriodButton,
              ]}
              onPress={() => setSelectedPeriod(period.key as any)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.key && styles.selectedPeriodButtonText,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <MaterialIcons name="attach-money" size={24} color="#0C6B58" />
            </View>
            <Text style={styles.summaryValue}>
              {formatCurrency(earnings?.totalEarnings || 0)}
            </Text>
            <Text style={styles.summaryLabel}>Gains totaux</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <FontAwesome5 name="shipping-fast" size={20} color="#2196F3" />
            </View>
            <Text style={styles.summaryValue}>{earnings?.totalDeliveries || 0}</Text>
            <Text style={styles.summaryLabel}>Livraisons</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.summaryValue}>
              {formatCurrency(earnings?.averageEarningsPerDelivery || 0)}
            </Text>
            <Text style={styles.summaryLabel}>Moyenne/livraison</Text>
          </View>
        </View>

        {/* Earnings Chart */}
        {earnings?.chartData && earnings.chartData.values.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Évolution des gains</Text>
            <LineChart
              data={getChartData()}
              width={width - 60}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Delivery Stats Chart */}
        {earnings?.deliveryStats && earnings.deliveryStats.values.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Livraisons par jour</Text>
            <BarChart
              data={getBarChartData()}
              width={width - 60}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
            />
          </View>
        )}

        {/* Performance Metrics */}
        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Indicateurs de performance</Text>
          
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <MaterialIcons name="star" size={20} color="#FFD700" />
              <Text style={styles.metricLabel}>Note moyenne</Text>
              <Text style={styles.metricValue}>
                {(earnings?.averageRating || 0).toFixed(1)} ⭐
              </Text>
            </View>
            
            <View style={styles.metricItem}>
              <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.metricLabel}>Taux de réussite</Text>
              <Text style={styles.metricValue}>
                {(earnings?.successRate || 0)}%
              </Text>
            </View>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <MaterialIcons name="schedule" size={20} color="#FF9800" />
              <Text style={styles.metricLabel}>Temps moyen</Text>
              <Text style={styles.metricValue}>
                {earnings?.averageDeliveryTime || 0} min
              </Text>
            </View>
            
            <View style={styles.metricItem}>
              <FontAwesome5 name="route" size={16} color="#2196F3" />
              <Text style={styles.metricLabel}>Distance totale</Text>
              <Text style={styles.metricValue}>
                {(earnings?.totalDistance || 0).toFixed(1)} km
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Earnings */}
        <View style={styles.recentCard}>
          <Text style={styles.recentTitle}>Dernières livraisons</Text>
          {earnings?.recentDeliveries?.map((delivery, index) => (
            <View key={index} style={styles.recentItem}>
              <View style={styles.recentLeft}>
                <Text style={styles.recentOrderId}>#{delivery.orderId}</Text>
                <Text style={styles.recentDate}>
                  {new Date(delivery.completedAt).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <Text style={styles.recentEarning}>
                {formatCurrency(delivery.earnings)}
              </Text>
            </View>
          ))}
          
          {(!earnings?.recentDeliveries || earnings.recentDeliveries.length === 0) && (
            <Text style={styles.noRecentText}>Aucune livraison récente</Text>
          )}
        </View>

        {/* Goals Section */}
        {earnings?.goals && (
          <View style={styles.goalsCard}>
            <Text style={styles.goalsTitle}>Objectifs</Text>
            
            <View style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalLabel}>Objectif de gains</Text>
                <Text style={styles.goalProgress}>
                  {formatCurrency(earnings.goals.current)} / {formatCurrency(earnings.goals.target)}
                </Text>
              </View>
              <View style={styles.goalBar}>
                <View 
                  style={[
                    styles.goalFill,
                    { width: `${Math.min((earnings.goals.current / earnings.goals.target) * 100, 100)}%` }
                  ]}
                />
              </View>
              <Text style={styles.goalPercentage}>
                {((earnings.goals.current / earnings.goals.target) * 100).toFixed(0)}% atteint
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedPeriodButton: {
    backgroundColor: '#0C6B58',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedPeriodButtonText: {
    color: '#FFFFFF',
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  recentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  recentLeft: {
    flex: 1,
  },
  recentOrderId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  recentDate: {
    fontSize: 12,
    color: '#666',
  },
  recentEarning: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0C6B58',
  },
  noRecentText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  goalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  goalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  goalItem: {
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 14,
    color: '#333',
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0C6B58',
  },
  goalBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 4,
  },
  goalFill: {
    height: '100%',
    backgroundColor: '#0C6B58',
    borderRadius: 4,
  },
  goalPercentage: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default DeliveryEarningsScreen;

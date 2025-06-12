
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import deliveryService from '../services/delivery.service';

interface EarningsData {
  today: number;
  week: number;
  month: number;
  total: number;
  deliveries: {
    today: number;
    week: number;
    month: number;
    total: number;
  };
  averagePerDelivery: number;
  weeklyData: number[];
  monthlyData: number[];
  categoryBreakdown: {
    standard: number;
    express: number;
    priority: number;
  };
}

interface DeliveryHistory {
  id: number;
  orderId: number;
  date: string;
  customerName: string;
  amount: number;
  commission: number;
  distance: number;
  duration: number;
  type: 'standard' | 'express' | 'priority';
}

const DeliveryEarningsScreen = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [history, setHistory] = useState<DeliveryHistory[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'history' | 'analytics'>('overview');

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [earningsData, historyData] = await Promise.all([
        deliveryService.getEarnings(selectedPeriod),
        deliveryService.getDeliveryHistory(1, 50),
      ]);
      
      setEarnings(earningsData);
      setHistory(historyData);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les données des gains');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const getChartData = () => {
    if (!earnings) return null;

    const data = selectedPeriod === 'week' ? earnings.weeklyData : earnings.monthlyData;
    const labels = selectedPeriod === 'week' 
      ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
      : ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];

    return {
      labels,
      datasets: [{
        data: data.length > 0 ? data : [0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(12, 107, 88, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const getPieChartData = () => {
    if (!earnings) return [];

    return [
      {
        name: 'Standard',
        amount: earnings.categoryBreakdown.standard,
        color: '#4CAF50',
        legendFontColor: '#333',
        legendFontSize: 15,
      },
      {
        name: 'Express',
        amount: earnings.categoryBreakdown.express,
        color: '#FF9800',
        legendFontColor: '#333',
        legendFontSize: 15,
      },
      {
        name: 'Priorité',
        amount: earnings.categoryBreakdown.priority,
        color: '#F44336',
        legendFontColor: '#333',
        legendFontSize: 15,
      },
    ];
  };

  const renderOverview = () => (
    <ScrollView
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['today', 'week', 'month'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive,
            ]}>
              {period === 'today' ? 'Aujourd\'hui' : period === 'week' ? 'Semaine' : 'Mois'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <MaterialIcons name="attach-money" size={24} color="#4CAF50" />
          <Text style={styles.statValue}>
            {earnings?.[selectedPeriod]?.toFixed(0) || '0'} CFA
          </Text>
          <Text style={styles.statLabel}>Gains</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialIcons name="local-shipping" size={24} color="#2196F3" />
          <Text style={styles.statValue}>
            {earnings?.deliveries[selectedPeriod] || 0}
          </Text>
          <Text style={styles.statLabel}>Livraisons</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialIcons name="trending-up" size={24} color="#FF9800" />
          <Text style={styles.statValue}>
            {earnings?.averagePerDelivery?.toFixed(0) || '0'} CFA
          </Text>
          <Text style={styles.statLabel}>Moy./Livraison</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialIcons name="star" size={24} color="#9C27B0" />
          <Text style={styles.statValue}>4.8</Text>
          <Text style={styles.statLabel}>Note moyenne</Text>
        </View>
      </View>

      {/* Chart */}
      {getChartData() && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Évolution des gains</Text>
          <LineChart
            data={getChartData()!}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(12, 107, 88, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#0C6B58',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Category Breakdown */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Répartition par type</Text>
        <PieChart
          data={getPieChartData()}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.historyContainer}>
        {history.map((delivery) => (
          <View key={delivery.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <View style={styles.historyInfo}>
                <Text style={styles.historyOrderId}>#{delivery.orderId}</Text>
                <Text style={styles.historyCustomer}>{delivery.customerName}</Text>
              </View>
              <View style={styles.historyAmount}>
                <Text style={styles.historyEarnings}>+{delivery.commission} CFA</Text>
                <Text style={styles.historyDate}>{new Date(delivery.date).toLocaleDateString()}</Text>
              </View>
            </View>
            
            <View style={styles.historyDetails}>
              <View style={styles.historyDetailItem}>
                <MaterialIcons name="navigation" size={16} color="#666" />
                <Text style={styles.historyDetailText}>{delivery.distance.toFixed(1)} km</Text>
              </View>
              <View style={styles.historyDetailItem}>
                <MaterialIcons name="access-time" size={16} color="#666" />
                <Text style={styles.historyDetailText}>{delivery.duration} min</Text>
              </View>
              <View style={[styles.typeTag, styles[`type${delivery.type.charAt(0).toUpperCase() + delivery.type.slice(1)}`]]}>
                <Text style={styles.typeTagText}>
                  {delivery.type === 'standard' ? 'Standard' : 
                   delivery.type === 'express' ? 'Express' : 'Priorité'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderAnalytics = () => (
    <ScrollView
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Performance Metrics */}
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>Métriques de performance</Text>
        
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <MaterialIcons name="speed" size={24} color="#4CAF50" />
            <Text style={styles.metricTitle}>Efficacité</Text>
          </View>
          <View style={styles.metricValues}>
            <Text style={styles.metricValue}>92%</Text>
            <Text style={styles.metricLabel}>Taux de livraison</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <MaterialIcons name="timer" size={24} color="#2196F3" />
            <Text style={styles.metricTitle}>Temps moyen</Text>
          </View>
          <View style={styles.metricValues}>
            <Text style={styles.metricValue}>28 min</Text>
            <Text style={styles.metricLabel}>Par livraison</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <MaterialIcons name="thumb-up" size={24} color="#FF9800" />
            <Text style={styles.metricTitle}>Satisfaction</Text>
          </View>
          <View style={styles.metricValues}>
            <Text style={styles.metricValue}>4.8/5</Text>
            <Text style={styles.metricLabel}>Note clients</Text>
          </View>
        </View>
      </View>

      {/* Goals */}
      <View style={styles.goalsContainer}>
        <Text style={styles.sectionTitle}>Objectifs du mois</Text>
        
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>Gains mensuel</Text>
            <Text style={styles.goalProgress}>78%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '78%' }]} />
          </View>
          <Text style={styles.goalText}>156,000 / 200,000 CFA</Text>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>Livraisons</Text>
            <Text style={styles.goalProgress}>85%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '85%' }]} />
          </View>
          <Text style={styles.goalText}>85 / 100 livraisons</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gains & Statistiques</Text>
        <TouchableOpacity>
          <MaterialIcons name="more-vert" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {[
          { key: 'overview', label: 'Aperçu', icon: 'dashboard' },
          { key: 'history', label: 'Historique', icon: 'history' },
          { key: 'analytics', label: 'Analyses', icon: 'analytics' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <MaterialIcons 
              name={tab.icon} 
              size={20} 
              color={selectedTab === tab.key ? '#0C6B58' : '#666'} 
            />
            <Text style={[
              styles.tabText,
              selectedTab === tab.key && styles.tabTextActive,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <MaterialIcons name="attach-money" size={64} color="#0C6B58" />
            <Text style={styles.loadingText}>Chargement des données...</Text>
          </View>
        ) : (
          <>
            {selectedTab === 'overview' && renderOverview()}
            {selectedTab === 'history' && renderHistory()}
            {selectedTab === 'analytics' && renderAnalytics()}
          </>
        )}
      </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#0C6B58',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#0C6B58',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  periodSelector: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#0C6B58',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  historyContainer: {
    padding: 20,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyOrderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  historyCustomer: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  historyAmount: {
    alignItems: 'flex-end',
  },
  historyEarnings: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  historyDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  historyDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyDetailText: {
    fontSize: 12,
    color: '#666',
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  typeStandard: {
    backgroundColor: '#E8F5E8',
  },
  typeExpress: {
    backgroundColor: '#FFF3E0',
  },
  typePriority: {
    backgroundColor: '#FFEBEE',
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
  },
  metricsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  metricValues: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0C6B58',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  goalsContainer: {
    padding: 20,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  goalProgress: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C6B58',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0C6B58',
    borderRadius: 4,
  },
  goalText: {
    fontSize: 14,
    color: '#666',
  },
});

export default DeliveryEarningsScreen;

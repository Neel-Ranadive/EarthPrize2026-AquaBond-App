// ScanLogViewer.tsx - Medical log display component

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl
} from 'react-native';
import { ScanResult, scanLogManager } from './scanLog';

interface ScanLogViewerProps {
  onSelectScan?: (scan: ScanResult) => void;
}

export const ScanLogViewer: React.FC<ScanLogViewerProps> = ({ onSelectScan }) => {
  const [logs, setLogs] = useState<ScanResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | '7days' | '30days'>('all');

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const loadLogs = async () => {
    setRefreshing(true);
    await scanLogManager.loadLogs();
    
    let filteredLogs = scanLogManager.getLogs();
    if (filter === '7days') {
      filteredLogs = scanLogManager.getRecentLogs(7);
    } else if (filter === '30days') {
      filteredLogs = scanLogManager.getRecentLogs(30);
    }
    
    setLogs(filteredLogs);
    setRefreshing(false);
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      excellent: '#10B981',
      good: '#3B82F6',
      fair: '#F59E0B',
      poor: '#EF4444',
      unsafe: '#991B1B'
    };
    return colors[status] || '#6B7280';
  };

  const renderScanCard = ({ item }: { item: ScanResult }) => (
    <TouchableOpacity 
      style={styles.scanCard}
      onPress={() => onSelectScan?.(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.interpretation.status) }
          ]}
        >
          <Text style={styles.statusText}>{item.interpretation.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.colorIndicator}>
        <View
          style={[
            styles.colorBox,
            {
              backgroundColor: `rgb(${item.colorData.r}, ${item.colorData.g}, ${item.colorData.b})`
            }
          ]}
        />
        <Text style={styles.rgbText}>
          RGB({item.colorData.r}, {item.colorData.g}, {item.colorData.b})
        </Text>
      </View>

      <Text style={styles.summary}>{item.interpretation.summary}</Text>

      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Clarity</Text>
          <Text style={styles.metricValue}>
            {item.qualityMetrics.clarity.toFixed(1)}%
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Turbidity</Text>
          <Text style={styles.metricValue}>
            {item.qualityMetrics.turbidity.toFixed(1)}%
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Purity</Text>
          <Text style={styles.metricValue}>
            {item.qualityMetrics.purity.toFixed(1)}%
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Safe</Text>
          <Text style={[
            styles.metricValue,
            { color: item.interpretation.safeForDrinking ? '#10B981' : '#EF4444' }
          ]}>
            {item.interpretation.safeForDrinking ? 'YES' : 'NO'}
          </Text>
        </View>
      </View>

      {item.interpretation.recommendations.length > 0 && (
        <View style={styles.recommendationsSection}>
          <Text style={styles.recommendationsTitle}>Recommendations:</Text>
          {item.interpretation.recommendations.map((rec, idx) => (
            <Text key={idx} style={styles.recommendationItem}>
              • {rec}
            </Text>
          ))}
        </View>
      )}

      {item.imageUri && (
        <Image
          source={{ uri: item.imageUri }}
          style={styles.scanImage}
        />
      )}

      {item.location && (
        <Text style={styles.location}>
          📍 {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
        </Text>
      )}

      {item.notes && (
        <Text style={styles.notes}>Note: {item.notes}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Water Quality Scan Log</Text>

      <View style={styles.filterButtons}>
        {(['all', '7days', '30days'] as const).map(filterType => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterButton,
              filter === filterType && styles.filterButtonActive
            ]}
            onPress={() => setFilter(filterType)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === filterType && styles.filterButtonTextActive
              ]}
            >
              {filterType === 'all' ? 'All' : filterType === '7days' ? 'Last 7 Days' : 'Last 30 Days'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {logs.length > 0 && renderStatistics()}

      <FlatList
        data={logs}
        renderItem={renderScanCard}
        keyExtractor={item => item.id}
        style={styles.logList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadLogs} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No scans recorded yet</Text>
        }
      />
    </View>
  );

  function renderStatistics() {
    const stats = scanLogManager.getStatistics(logs);
    if (!stats) return null;

    return (
      <View style={styles.statisticsCard}>
        <Text style={styles.statisticsTitle}>Summary Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Scans</Text>
            <Text style={styles.statValue}>{stats.totalScans}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Safe Water</Text>
            <Text style={styles.statValue}>{stats.safeCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Avg Clarity</Text>
            <Text style={styles.statValue}>{stats.averageClarity.toFixed(1)}%</Text>
          </View>
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
  },
  filterButtonText: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  statisticsCard: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statisticsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  logList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timestamp: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  colorIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorBox: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rgbText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  summary: {
    fontSize: 13,
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  recommendationsSection: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  recommendationsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 6,
  },
  recommendationItem: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
  },
  scanImage: {
    width: '100%',
    height: 150,
    borderRadius: 6,
    marginBottom: 12,
  },
  location: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  notes: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 32,
    fontSize: 14,
  },
});
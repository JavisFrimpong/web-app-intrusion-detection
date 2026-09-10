import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchDetectionHistory,
  fetchTrafficStats,
  clearDetectionHistory
} from '../services/api';

const EMPTY_STATS = {
  metrics: { totalCount: 0, benignCount: 0, threatCount: 0, alertsCount: 0 },
  attackDistribution: [],
  threatCategories: [],
  trafficTimeline: []
};

/**
 * Polls the real backend (/history + /stats) for live detection data.
 * There is no offline fallback data here on purpose: if the backend or
 * the flow capture engine isn't running, this hook reports that honestly
 * via `isOnline: false` rather than inventing numbers to fill the screen.
 */
export const useDetectionHistory = (pollInterval = 4000) => {
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Keep track of threats we've already shown alerts for in this session
  const alertedThreatIds = useRef(new Set());

  const fetchData = useCallback(async () => {
    const [historyRes, statsRes] = await Promise.all([
      fetchDetectionHistory(50),
      fetchTrafficStats(),
    ]);

    if (historyRes.success && statsRes.success) {
      setIsOnline(true);
      setHistory(historyRes.history);
      setAlerts(historyRes.alerts);
      setStats(statsRes.data);
      setLoading(false);

      // Fire a toast event ONLY if live monitoring is currently ACTIVE
      const isMonitoringActive = sessionStorage.getItem('ids_monitoring_active') === 'true';
      if (isMonitoringActive && historyRes.history.length > 0) {
        const threats = [...historyRes.history]
          .reverse()
          .filter(item => item.prediction !== 0 && item.status === 'Blocked');

        threats.forEach(threat => {
          if (!alertedThreatIds.current.has(threat.id)) {
            alertedThreatIds.current.add(threat.id);
            window.dispatchEvent(
              new CustomEvent('ids-new-threat', { detail: threat })
            );
          }
        });
      }
    } else {
      // Backend unreachable — report that state truthfully, no mock data.
      setIsOnline(false);
      setHistory([]);
      setAlerts([]);
      setStats(EMPTY_STATS);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (pollInterval > 0) {
      const interval = setInterval(fetchData, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, pollInterval]);

  const clearHistory = async () => {
    if (!isOnline) return { success: false, error: 'Backend is offline.' };
    const clearRes = await clearDetectionHistory();
    if (clearRes.success) {
      await fetchData();
    }
    return clearRes;
  };

  return {
    history,
    alerts,
    stats,
    isOnline,
    loading,
    clearHistory,
    totalCount: stats.metrics.totalCount,
    benignCount: stats.metrics.benignCount,
    threatCount: stats.metrics.threatCount,
    alertsCount: stats.metrics.alertsCount,
    recheckHistory: fetchData
  };
};

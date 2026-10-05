import { useState, useEffect, useCallback } from 'react';
import { fetchSystemStatus } from '../services/api';

export const useSystemStatus = (pollInterval = 30000) => {
  const [statusState, setStatusState] = useState({
    loading: true,
    isOnline: false,
    model: 'Random Forest',
    system: 'Intrusion Detection System',
    status: 'checking',
    mlReady: false,
    featureCount: 0,
    lastChecked: null,
    error: null,
  });

  const checkStatus = useCallback(async () => {
    setStatusState(prev => ({ ...prev, loading: true }));
    const result = await fetchSystemStatus();
    
    if (result.success && result.isOnline) {
      setStatusState({
        loading: false,
        isOnline: true,
        model: result.data.model || 'Random Forest',
        system: result.data.system || 'Intrusion Detection System',
        status: result.data.status || 'active',
        mlReady: Boolean(result.data.ml_ready),
        featureCount: result.data.feature_count || 0,
        lastChecked: new Date(),
        error: null,
      });
    } else {
      setStatusState({
        loading: false,
        isOnline: false,
        model: 'Random Forest (CICIDS2017)',
        system: 'Intrusion Detection System',
        status: 'offline',
        mlReady: false,
        featureCount: 0,
        lastChecked: new Date(),
        error: result.error || 'Flask API endpoint unreachable',
      });
    }
  }, []);

  useEffect(() => {
    checkStatus();
    if (pollInterval > 0) {
      const interval = setInterval(checkStatus, pollInterval);
      return () => clearInterval(interval);
    }
  }, [checkStatus, pollInterval]);

  return { ...statusState, recheckStatus: checkStatus };
};

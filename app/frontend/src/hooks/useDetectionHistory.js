import { useState, useEffect } from 'react';
import { MOCK_RECENT_DETECTIONS } from '../utils/presetData';

const LOCAL_STORAGE_KEY = 'ids_detection_history_v1';

export const useDetectionHistory = () => {
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse detection history from storage', e);
      }
    }
    return MOCK_RECENT_DETECTIONS;
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const addDetection = (newDetection) => {
    const formattedItem = {
      id: `DET-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toISOString(),
      sourceIp: newDetection.sourceIp || '192.168.1.' + Math.floor(2 + Math.random() * 250),
      destIp: '10.0.0.4',
      destPort: newDetection.destPort || newDetection.rawInputs?.Destination_Port || 80,
      attackType: newDetection.attack_type || (newDetection.prediction === 0 ? 'BENIGN' : 'Attack'),
      prediction: newDetection.prediction ?? (newDetection.attack_type === 'BENIGN' ? 0 : 1),
      confidence: newDetection.confidence || 95.0,
      protocol: newDetection.protocol || 'TCP/IP',
      status: newDetection.prediction === 0 || newDetection.attack_type === 'BENIGN' ? 'Clean' : 'Blocked',
    };

    setHistory(prev => [formattedItem, ...prev]);
    return formattedItem;
  };

  const clearHistory = () => {
    setHistory(MOCK_RECENT_DETECTIONS);
  };

  return {
    history,
    addDetection,
    clearHistory,
    totalCount: history.length,
    benignCount: history.filter(h => h.prediction === 0 || h.attackType === 'BENIGN').length,
    threatCount: history.filter(h => h.prediction === 1 || h.attackType !== 'BENIGN').length,
  };
};

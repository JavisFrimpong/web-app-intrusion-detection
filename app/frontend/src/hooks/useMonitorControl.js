import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMonitorStatus, startMonitoring, stopMonitoring } from '../services/api';

/**
 * Tracks whether the flow capture engine is running on the server, and
 * exposes start/stop actions. This is the "power switch" the client uses
 * instead of running flow_monitor.py from a terminal.
 */
export const useMonitorControl = (pollInterval = 5000) => {
  const [running, setRunning] = useState(false);
  const [uptimeSeconds, setUptimeSeconds] = useState(null);
  const [target, setTarget] = useState(null);
  const [checking, setChecking] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState(null);
  const [backendReachable, setBackendReachable] = useState(false);
  const mounted = useRef(true);

  const refreshStatus = useCallback(async () => {
    const res = await fetchMonitorStatus();
    if (!mounted.current) return;
    setBackendReachable(res.isOnline);
    setRunning(!!res.data?.running);
    setUptimeSeconds(res.data?.uptime_seconds ?? null);
    setTarget(res.data?.target ?? null);
    setChecking(false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    refreshStatus();
    const interval = setInterval(refreshStatus, pollInterval);
    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, [refreshStatus, pollInterval]);

  const start = async (targetInput = '') => {
    setActionPending(true);
    setError(null);
    const res = await startMonitoring(targetInput);
    if (res.success) {
      await refreshStatus();
    } else {
      setError(res.error || 'Could not start monitoring.');
    }
    setActionPending(false);
    return res;
  };

  const stop = async () => {
    setActionPending(true);
    setError(null);
    const res = await stopMonitoring();
    if (res.success) {
      await refreshStatus();
    } else {
      setError(res.error || 'Could not stop monitoring.');
    }
    setActionPending(false);
    return res;
  };

  return { running, uptimeSeconds, target, checking, actionPending, error, backendReachable, start, stop, refreshStatus };
};

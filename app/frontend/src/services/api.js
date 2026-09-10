import axios from 'axios';

// Default API Base URL
const DEFAULT_BASE_URL = 'http://127.0.0.1:5000/api';

export const getStoredApiUrl = () => {
  return localStorage.getItem('ids_api_url') || DEFAULT_BASE_URL;
};

export const setStoredApiUrl = (url) => {
  localStorage.setItem('ids_api_url', url);
};

// Create Axios Instance
const createApiClient = () => {
  const baseURL = getStoredApiUrl();
  return axios.create({
    baseURL,
    timeout: 20000,
    withCredentials: true, // sends the login session cookie with every request
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
};

// ---------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------

export const signup = async (email, password, username, company) => {
  const api = createApiClient();
  try {
    const response = await api.post('/auth/signup', { email, password, name: username, username, company });
    return { success: true, ...response.data, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

export const resendCode = async (email) => {
  const api = createApiClient();
  try {
    const response = await api.post('/auth/resend-code', { email });
    return { success: true, ...response.data, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

export const verifyCode = async (email, code) => {
  const api = createApiClient();
  try {
    const response = await api.post('/auth/verify', { email, code });
    return { success: true, ...response.data, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

export const login = async (email, password) => {
  const api = createApiClient();
  try {
    const response = await api.post('/auth/login', { email, password });
    return { success: true, ...response.data, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

export const logout = async () => {
  const api = createApiClient();
  try {
    await api.post('/auth/logout');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

export const fetchCurrentUser = async () => {
  const api = createApiClient();
  try {
    const response = await api.get('/auth/me');
    return { authenticated: true, email: response.data.email };
  } catch (error) {
    return { authenticated: false };
  }
};

/**
 * Fetch Backend System Status
 * Endpoint: GET /status
 * Expected response: { model: "Random Forest", system: "Intrusion Detection System", status: "active" }
 */
export const fetchSystemStatus = async () => {
  const api = createApiClient();
  try {
    const response = await api.get('/status');
    return {
      success: true,
      data: response.data,
      isOnline: true,
    };
  } catch (error) {
    console.warn('Backend API connection failed:', error.message);
    return {
      success: false,
      error: error.message,
      isOnline: false,
      data: {
        model: 'Random Forest (CICIDS2017)',
        system: 'Intrusion Detection System',
        status: 'offline',
        details: 'Flask API unreachable at ' + getStoredApiUrl(),
      },
    };
  }
};

/**
 * Fetch captured network traffic flow history from backend database.
 * This is real data written by the flow capture engine (flow_monitor.py)
 * as it processes live packets — every row here corresponds to an
 * actual flow that was sniffed, feature-extracted, and classified.
 * Endpoint: GET /history
 */
export const fetchDetectionHistory = async (limit = 100) => {
  const api = createApiClient();
  try {
    const response = await api.get(`/history?limit=${limit}`);
    return {
      success: true,
      history: response.data.history || [],
      alerts: response.data.alerts || [],
      isOnline: true,
    };
  } catch (error) {
    console.warn('Backend API history fetch failed:', error.message);
    return {
      success: false,
      error: error.message,
      history: [],
      alerts: [],
      isOnline: false,
    };
  }
};

/**
 * Fetch aggregated traffic telemetry stats for dashboard visual charts.
 * Computed server-side directly from the predictions table.
 * Endpoint: GET /stats
 */
export const fetchTrafficStats = async () => {
  const api = createApiClient();
  try {
    const response = await api.get('/stats');
    return {
      success: true,
      data: response.data,
      isOnline: true,
    };
  } catch (error) {
    console.warn('Backend API stats fetch failed:', error.message);
    return {
      success: false,
      error: error.message,
      isOnline: false,
    };
  }
};

/**
 * Check whether the flow capture engine is currently running on the server.
 * Endpoint: GET /monitor/status
 */
export const fetchMonitorStatus = async () => {
  const api = createApiClient();
  try {
    const response = await api.get('/monitor/status');
    return { success: true, data: response.data, isOnline: true };
  } catch (error) {
    return { success: false, error: error.message, isOnline: false, data: { running: false } };
  }
};

/**
 * Start the flow capture engine (flow_capture.py) as a background process
 * on the server. If a target (domain, URL, or IP) is provided, capture is
 * scoped to just that target's traffic instead of everything on the host.
 * Endpoint: POST /monitor/start
 */
export const startMonitoring = async (target = '') => {
  const api = createApiClient();
  try {
    const response = await api.post('/monitor/start', { target });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

/**
 * Stop the flow capture engine. Endpoint: POST /monitor/stop
 */
export const stopMonitoring = async () => {
  const api = createApiClient();
  try {
    const response = await api.post('/monitor/stop');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

/**
 * Clear all stored predictions and alerts from backend database.
 * Endpoint: POST /history/clear
 */
export const clearDetectionHistory = async () => {
  const api = createApiClient();
  try {
    const response = await api.post('/history/clear');
    return {
      success: true,
      message: response.data.message || 'History cleared.',
      isOnline: true,
    };
  } catch (error) {
    console.error('Backend API history clear failed:', error.message);
    return {
      success: false,
      error: error.message,
      isOnline: false,
    };
  }
};

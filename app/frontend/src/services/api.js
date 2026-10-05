import axios from 'axios';

// Default API Base URL
const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://aegis-ids-api.onrender.com/api' : 'http://127.0.0.1:5000/api');

export const getStoredApiUrl = () => {
  const stored = localStorage.getItem('ids_api_url');

  // Ignore old localhost overrides after deployment.
  if (import.meta.env.PROD && stored && /localhost|127\.0\.0\.1/.test(stored)) {
    return DEFAULT_BASE_URL;
  }

  return stored || DEFAULT_BASE_URL;
};

export const setStoredApiUrl = (url) => {
  localStorage.setItem('ids_api_url', url);
};

// Create Axios Instance
const createApiClient = () => {
  const baseURL = getStoredApiUrl();
  const token = localStorage.getItem('aegis_auth_token');
  return axios.create({
    baseURL,
    timeout: 20000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

const saveToken = (token) => {
  if (token) localStorage.setItem('aegis_auth_token', token);
};

const saveUser = (user) => {
  if (user) localStorage.setItem('aegis_user_profile', JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem('aegis_auth_token');
  localStorage.removeItem('aegis_user_profile');
};

// ---------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------

export const signup = async (email, password, username, company) => {
  const api = createApiClient();
  try {
    const response = await api.post('/auth/signup', { email, password, name: username, username, company });
    saveToken(response.data.token);
    saveUser(response.data.user);
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
    saveToken(response.data.token);
    saveUser(response.data.user);
    return { success: true, ...response.data, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

export const forgotPassword = async (email) => {
  const api = createApiClient();
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return { success: true, ...response.data, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

export const resetPassword = async (email, code, newPassword) => {
  const api = createApiClient();
  try {
    const response = await api.post('/auth/reset-password', {
      email,
      code,
      new_password: newPassword,
    });
    return { success: true, ...response.data, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

export const login = async (email, password) => {
  const api = createApiClient();
  try {
    const response = await api.post('/auth/login', { email, password });
    saveToken(response.data.token);
    saveUser(response.data.user);
    return { success: true, ...response.data, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

export const logout = async () => {
  const api = createApiClient();
  try {
    await api.post('/auth/logout');
    clearSession();
    return { success: true };
  } catch (error) {
    clearSession();
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

export const fetchCurrentUser = async () => {
  const api = createApiClient();
  try {
    const response = await api.get('/auth/me');
    saveUser(response.data.user);
    return { authenticated: true, user: response.data.user };
  } catch (error) {
    if (error.response?.status === 401) clearSession();
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


// ---------------------------------------------------------------------
// Per-account Windows sensor configuration
// ---------------------------------------------------------------------

export const fetchSensorConfig = async () => {
  const api = createApiClient();
  try {
    const response = await api.get('/auth/sensor-config');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

export const regenerateSensorToken = async () => {
  const api = createApiClient();
  try {
    const response = await api.post('/auth/sensor-config');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
};


// ---------------------------------------------------------------------
// Monitored websites
// ---------------------------------------------------------------------

export const fetchWebsites = async () => {
  const api = createApiClient();
  try {
    const response = await api.get('/websites');
    return { success: true, websites: response.data.websites || [] };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message, websites: [] };
  }
};

export const addWebsite = async (domain, label = '') => {
  const api = createApiClient();
  try {
    const response = await api.post('/websites', { domain, label });
    return { success: true, website: response.data.website };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

export const connectWebsite = async (websiteId) => {
  const api = createApiClient();
  try {
    const response = await api.post(`/websites/${websiteId}/connect`);
    return { success: true, ...response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      details: error.response?.data?.details,
    };
  }
};

export const deleteWebsite = async (websiteId) => {
  const api = createApiClient();
  try {
    await api.delete(`/websites/${websiteId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

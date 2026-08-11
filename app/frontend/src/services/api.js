import axios from 'axios';

// Default API Base URL as per requirements
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
    timeout: 8000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
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
    console.warn('Backend API connection failed, using fallback status:', error.message);
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
 * Send Network Traffic Data for ML Prediction
 * Endpoint: POST /predict
 * Expected response: { prediction: 0|1, attack_type: "BENIGN" | "DoS", confidence: number }
 */
export const predictTrafficData = async (trafficData) => {
  const api = createApiClient();
  try {
    const response = await api.post('/predict', trafficData);
    return {
      success: true,
      data: response.data,
      isOnline: true,
    };
  } catch (error) {
    console.warn('Backend API prediction request failed, generating intelligent simulation fallback:', error.message);
    
    // Simulate fallback logic if Flask server is not running during local testing
    const simulatedResult = generateSimulatedPrediction(trafficData);
    
    return {
      success: true,
      data: simulatedResult,
      isOnline: false,
      simulated: true,
      message: 'Result generated via local fallback classifier (Flask server unreachable)',
    };
  }
};

/**
 * Helper to generate realistic predictions based on traffic features for offline demo mode
 */
function generateSimulatedPrediction(trafficData) {
  // Simple heuristic checks on trafficData inputs if provided
  const dstPort = parseInt(trafficData?.Destination_Port || trafficData?.dst_port || 80, 10);
  const flowDuration = parseFloat(trafficData?.Flow_Duration || 5000);
  const pktLenMean = parseFloat(trafficData?.Packet_Length_Mean || 350);
  const synCount = parseInt(trafficData?.SYN_Flag_Count || 0, 10);
  const presetType = trafficData?._presetType;

  if (presetType === 'dos' || synCount > 50 || (flowDuration > 100000 && pktLenMean > 1200)) {
    return {
      prediction: 1,
      attack_type: 'DoS / DDoS SYN Flood',
      confidence: 96.42,
    };
  } else if (presetType === 'portscan' || dstPort === 22 || dstPort === 3389 || (trafficData?.Total_Fwd_Packets > 200 && dstPort > 10000)) {
    return {
      prediction: 1,
      attack_type: 'PortScan Probe',
      confidence: 94.18,
    };
  } else if (presetType === 'sql_injection' || presetType === 'web_attack') {
    return {
      prediction: 1,
      attack_type: 'Web Attack - SQL Injection',
      confidence: 98.75,
    };
  } else if (presetType === 'bruteforce') {
    return {
      prediction: 1,
      attack_type: 'Brute Force (SSH/FTP)',
      confidence: 91.30,
    };
  } else if (presetType === 'botnet') {
    return {
      prediction: 1,
      attack_type: 'Botnet Command & Control',
      confidence: 89.65,
    };
  }

  // Default Benign traffic prediction
  return {
    prediction: 0,
    attack_type: 'BENIGN',
    confidence: Number((84 + Math.random() * 14).toFixed(2)),
  };
}

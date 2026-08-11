import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  Play, 
  Sparkles, 
  RotateCcw, 
  FileCode, 
  Sliders, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { predictTrafficData } from '../../services/api';
import { TRAFFIC_PRESETS } from '../../utils/presetData';
import { useDetectionHistory } from '../../hooks/useDetectionHistory';
import PredictionCard from '../../components/PredictionCard/PredictionCard';
import Loader from '../../components/Loader/Loader';

const DEFAULT_FORM = {
  _presetType: 'custom',
  Destination_Port: 80,
  Flow_Duration: 3450,
  Total_Fwd_Packets: 4,
  Total_Backward_Packets: 5,
  Total_Length_of_Fwd_Packets: 280,
  Total_Length_of_Bwd_Packets: 1250,
  Fwd_Packet_Length_Max: 140,
  Fwd_Packet_Length_Min: 40,
  Bwd_Packet_Length_Max: 500,
  Bwd_Packet_Length_Min: 60,
  Flow_Bytes_s: 443478.26,
  Flow_Packets_s: 2608.7,
  Flow_IAT_Mean: 431.25,
  SYN_Flag_Count: 1,
  ACK_Flag_Count: 5,
  Packet_Length_Mean: 170,
};

export default function ThreatDetection() {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [selectedPresetId, setSelectedPresetId] = useState('custom');
  const [rawJsonInput, setRawJsonInput] = useState('');
  const [activeTab, setActiveTab] = useState('preset'); // 'preset' | 'form' | 'json'
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [isSimulatedResponse, setIsSimulatedResponse] = useState(false);
  const { addDetection } = useDetectionHistory();

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setFormData({ ...preset.data });
    setRawJsonInput(JSON.stringify(preset.data, null, 2));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      _presetType: 'custom',
      [field]: value === '' ? '' : Number(value)
    }));
    setSelectedPresetId('custom');
  };

  const handleReset = () => {
    setFormData(DEFAULT_FORM);
    setSelectedPresetId('custom');
    setRawJsonInput('');
    setPredictionResult(null);
  };

  const handleAnalyzeTraffic = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setPredictionResult(null);

    let payload = formData;
    if (activeTab === 'json' && rawJsonInput.trim()) {
      try {
        payload = JSON.parse(rawJsonInput);
      } catch (err) {
        alert('Invalid JSON input formatting. Please fix syntax errors.');
        setLoading(false);
        return;
      }
    }

    // Call API (or intelligent fallback)
    const response = await predictTrafficData(payload);
    
    // Artificial small delay for polished loader experience
    setTimeout(() => {
      setLoading(false);
      if (response.success && response.data) {
        const result = {
          ...response.data,
          timestamp: new Date().toISOString(),
          destPort: payload.Destination_Port || payload.dst_port || 80,
          rawInputs: payload,
        };
        setPredictionResult(result);
        setIsSimulatedResponse(!!response.simulated || !response.isOnline);
        
        // Log into central history
        addDetection(result);
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
              REAL-TIME ML INFERENCE ENGINE
            </span>
            <h1 className="text-2xl font-black text-slate-100">
              Submit Network Traffic Data for Classification
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
              Test traffic flow vectors against the Random Forest ML classifier. Choose a 1-click CICIDS2017 attack vector preset or input custom flow parameters.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto font-mono text-xs">
            <button
              onClick={() => setActiveTab('preset')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'preset' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Presets
            </button>
            <button
              onClick={() => setActiveTab('form')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'form' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Custom Features
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'json' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw JSON
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Preset Selector / Feature Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* TAB 1: PRESETS */}
          {activeTab === 'preset' && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Select Pre-Configured Attack Vector
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  1-Click Test Scenarios
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {TRAFFIC_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  const isBenign = preset.category === 'BENIGN';

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`text-left p-4 rounded-xl border transition-all flex items-start justify-between ${
                        isSelected
                          ? 'bg-slate-900/90 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/30'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-slate-100">
                            {preset.name}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border uppercase ${
                            isBenign 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}>
                            {preset.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-sans">
                          {preset.description}
                        </p>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'border-cyan-400 bg-cyan-500 text-slate-950' : 'border-slate-700'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 fill-cyan-400 text-slate-950" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL FORM FIELDS */}
          {activeTab === 'form' && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  CICIDS2017 Flow Parameters
                </h3>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-cyan-400 font-mono flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Defaults
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                {Object.keys(DEFAULT_FORM)
                  .filter(key => !key.startsWith('_'))
                  .map((key) => (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] text-slate-400 truncate block" title={key}>
                        {key.replace(/_/g, ' ')}
                      </label>
                      <input
                        type="number"
                        value={formData[key] ?? ''}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 3: RAW JSON INPUT */}
          {activeTab === 'json' && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  Raw JSON Feature Payload
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Direct POST Body to /api/predict
                </span>
              </div>

              <textarea
                rows={10}
                value={rawJsonInput || JSON.stringify(formData, null, 2)}
                onChange={(e) => setRawJsonInput(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          )}

          {/* Submit Action Bar */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleAnalyzeTraffic}
              disabled={loading}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Analyze Traffic Vector</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              title="Reset All Inputs"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Prediction Result Card / Loading (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-20 space-y-4">
            
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              Classification Output Window
            </span>

            {loading ? (
              <Loader text="Executing Random Forest inference on flow features..." />
            ) : predictionResult ? (
              <PredictionCard 
                predictionResult={predictionResult} 
                simulated={isSimulatedResponse}
              />
            ) : (
              <div className="glass-panel p-8 rounded-2xl border border-slate-800/80 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-200 font-mono">
                    AWAITING TRAFFIC INPUT
                  </h4>
                  <p className="text-xs text-slate-400 font-sans max-w-xs mx-auto">
                    Select a preset or custom flow parameters on the left, then click <strong className="text-cyan-400">Analyze Traffic Vector</strong> to trigger ML prediction.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Helper Note */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-1 font-mono">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Backend REST API Integration</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Requests are sent to <code className="text-cyan-300">POST http://127.0.0.1:5000/api/predict</code>. Returns JSON containing prediction class (0/1), attack_type string, and confidence percentage.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

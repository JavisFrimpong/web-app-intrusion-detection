import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import ThreatDetection from './pages/ThreatDetection/ThreatDetection';
import TrafficAnalysis from './pages/TrafficAnalysis/TrafficAnalysis';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="threat-detection" element={<ThreatDetection />} />
          <Route path="traffic-analysis" element={<TrafficAnalysis />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import ThreatDetection from './pages/ThreatDetection/ThreatDetection';
import TrafficAnalysis from './pages/TrafficAnalysis/TrafficAnalysis';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';
import Landing from './pages/Landing/Landing';
import { isAuthenticated } from './services/authService';

// Protected Route Guard Component
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/landing" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Enterprise SaaS Landing Page */}
        <Route path="/landing" element={<Landing />} />

        {/* Protected Client SOC Dashboard Console */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="threat-detection" element={<ThreatDetection />} />
          <Route path="traffic-analysis" element={<TrafficAnalysis />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback Redirect */}
        <Route path="*" element={<Navigate to={isAuthenticated() ? "/" : "/landing"} replace />} />
      </Routes>
    </Router>
  );
}

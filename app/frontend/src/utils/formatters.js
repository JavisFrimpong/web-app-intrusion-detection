/**
 * Helper utilities for formatting cybersecurity data, confidence meters, and timestamps
 */

export const formatConfidence = (val) => {
  if (val === undefined || val === null) return '0.00%';
  const num = typeof val === 'number' ? val : parseFloat(val);
  return `${num.toFixed(2)}%`;
};

export const formatTimestamp = (dateStr = null) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + 
    ' ' + d.toLocaleDateString();
};

export const getThreatSeverity = (attackType, confidence = 100) => {
  if (!attackType || attackType.toUpperCase() === 'BENIGN' || attackType === '0') {
    return {
      level: 'BENIGN',
      color: 'green',
      bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
      iconColor: '#10b981',
      description: 'Standard safe network traffic. No malicious patterns detected.',
    };
  }

  const typeUpper = attackType.toUpperCase();
  if (typeUpper.includes('DOS') || typeUpper.includes('DDOS') || typeUpper.includes('BOTNET')) {
    return {
      level: 'CRITICAL',
      color: 'red',
      bgClass: 'bg-red-500/10 text-red-400 border-red-500/30',
      badgeClass: 'bg-red-500/20 text-red-300 border-red-500/50',
      iconColor: '#ef4444',
      description: 'High impact Denial of Service attack or Botnet flow pattern.',
    };
  }

  if (typeUpper.includes('SQL') || typeUpper.includes('WEB') || typeUpper.includes('INJECTION')) {
    return {
      level: 'HIGH',
      color: 'rose',
      bgClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
      iconColor: '#f43f5e',
      description: 'Malicious Web Attack or SQL Injection vector targetting web app.',
    };
  }

  if (typeUpper.includes('PORTSCAN') || typeUpper.includes('SCAN') || typeUpper.includes('PROBE')) {
    return {
      level: 'MEDIUM',
      color: 'amber',
      bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
      iconColor: '#f59e0b',
      description: 'Reconnaissance scanning pattern trying to discover exposed ports.',
    };
  }

  return {
    level: 'ATTACK',
    color: 'red',
    bgClass: 'bg-red-500/10 text-red-400 border-red-500/30',
    badgeClass: 'bg-red-500/20 text-red-300 border-red-500/50',
    iconColor: '#ef4444',
    description: 'Anomalous traffic flagged by ML model.',
  };
};

/**
 * Translates a raw ML/heuristic label (e.g. "PORTSCAN, DDOS
 * (heuristic-confirmed pattern across multiple flows)") into a short,
 * plain-language sentence a non-technical client can act on. This never
 * replaces the technical label — it's shown alongside it.
 */
export const getPlainSummary = (attackType) => {
  if (!attackType) return 'No unusual activity — traffic looks normal.';
  const type = attackType.toUpperCase();

  if (type.includes('UNCERTAIN')) {
    return "Unusual traffic, but not enough evidence to be sure — worth a look.";
  }
  if (type.includes('LOW-SUPPORT')) {
    return 'A rare, unfamiliar pattern was flagged for manual review.';
  }
  if (type === 'BENIGN' || (type.includes('BENIGN') && !type.includes('DOS'))) {
    return 'Normal, safe traffic — no action needed.';
  }
  if (type.includes('DDOS') || type.includes('DOS') || type.includes('FLOOD') || type.includes('BOTNET')) {
    return "Your site is being flooded with traffic — this looks like an attack trying to knock it offline.";
  }
  if (type.includes('SQL') || type.includes('WEB') || type.includes('INJECTION')) {
    return 'Someone attempted to break in through a form or link on your site.';
  }
  if (type.includes('PORTSCAN') || type.includes('SCAN') || type.includes('PROBE')) {
    return 'Someone is scanning your site, looking for weak points.';
  }
  if (type.includes('BRUTE') || type.includes('FORCE')) {
    return 'Repeated login attempts detected — someone may be trying to guess a password.';
  }
  return 'Suspicious activity was detected and blocked.';
};

export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

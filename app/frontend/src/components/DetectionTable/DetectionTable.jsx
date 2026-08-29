import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Download,
  Clock
} from 'lucide-react';
import { formatTimestamp, formatConfidence } from '../../utils/formatters';
import { exportToCSV } from '../../utils/reportExporter';

export default function DetectionTable({ detections = [], limit = null, title = "Recent Detections History" }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = limit || 8;

  const filteredDetections = useMemo(() => {
    return detections.filter(item => {
      const matchesSearch = 
        (item.id && item.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.sourceIp && item.sourceIp.includes(searchTerm)) ||
        (item.attackType && item.attackType.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.protocol && item.protocol.toLowerCase().includes(searchTerm.toLowerCase()));

      if (filterType === 'ALL') return matchesSearch;
      if (filterType === 'BENIGN') return matchesSearch && (item.prediction === 0 || item.attackType === 'BENIGN');
      if (filterType === 'ATTACKS') return matchesSearch && (item.prediction === 1 || item.attackType !== 'BENIGN');
      return matchesSearch;
    });
  }, [detections, searchTerm, filterType]);

  const totalPages = Math.ceil(filteredDetections.length / pageSize) || 1;
  const paginatedItems = limit 
    ? filteredDetections.slice(0, limit)
    : filteredDetections.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCSV = () => {
    exportToCSV(filteredDetections, 'SOC_Detection_Logs.csv');
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800/80 p-5 space-y-4">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            {title}
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Recorded flow telemetry and ML classification predictions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search IP, ID, Attack..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 sm:w-44 lg:w-56 font-mono"
            />
          </div>

          {/* Category Filter dropdown */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500/50"
          >
            <option value="ALL">All Traffic</option>
            <option value="BENIGN">BENIGN Only</option>
            <option value="ATTACKS">Attacks Only</option>
          </select>

          {!limit && (
            <button
              onClick={handleExportCSV}
              title="Export filtered logs to CSV"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors shrink-0"
            >
              <Download className="w-4 h-4 shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Table Structure */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <th className="py-3 px-4">Event ID</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Source IP</th>
              <th className="py-3 px-4">Dst Port</th>
              <th className="py-3 px-4">Attack Classification</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 text-xs">
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item, idx) => {
                const isBenign = item.prediction === 0 || item.attackType === 'BENIGN';
                return (
                  <tr 
                    key={item.id || idx}
                    className="hover:bg-slate-900/60 transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {item.id}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {formatTimestamp(item.timestamp)}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-200">
                      {item.sourceIp}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      :{item.destPort || 80}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {isBenign ? (
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span className={`font-semibold ${isBenign ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.attackType}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-200">
                      {formatConfidence(item.confidence)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className={`px-2.5 py-1 text-[10px] font-extrabold font-mono rounded-full border uppercase ${
                        isBenign
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                      }`}>
                        {item.status || (isBenign ? 'CLEAN' : 'BLOCKED')}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-500 font-mono text-xs">
                  No detection events matching search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!limit && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs font-mono text-slate-400">
          <span>
            Page {currentPage} of {totalPages} ({filteredDetections.length} total events)
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

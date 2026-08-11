import React from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from 'recharts';

export default function AttackPieChart({ data }) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="#070a14" strokeWidth={2} />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              backgroundColor: '#090d16',
              borderColor: '#1e293b',
              borderRadius: '12px',
              color: '#f8fafc',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
          />

          <Legend 
            verticalAlign="bottom" 
            height={36} 
            formatter={(value) => <span className="text-slate-300 text-xs font-mono">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

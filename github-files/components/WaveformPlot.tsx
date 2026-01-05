
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SignalData } from '../types';

interface WaveformPlotProps {
  data: SignalData[];
  isBreach: boolean;
  aliceName?: string;
  bobName?: string;
}

const WaveformPlot: React.FC<WaveformPlotProps> = ({ data, isBreach, aliceName, bobName }) => {
  return (
    <div className={`h-full w-full rounded-xl p-4 transition-colors duration-500 ${isBreach ? 'bg-red-950/20' : 'bg-zinc-900/40'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="time" hide />
          <YAxis domain={[-2, 2]} stroke="#666" fontSize={10} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111', border: '1px solid #444' }}
            itemStyle={{ fontSize: '12px' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          <Line 
            type="monotone" 
            dataKey="alice" 
            stroke="#f7931a" 
            strokeWidth={2} 
            dot={false} 
            isAnimationActive={false} 
            name={aliceName || "Alice (Source)"}
          />
          <Line 
            type="monotone" 
            dataKey="bob" 
            stroke={isBreach ? "#ef4444" : "#22c55e"} 
            strokeWidth={2} 
            dot={false} 
            isAnimationActive={false} 
            name={bobName || "Bob (Receiver)"}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WaveformPlot;

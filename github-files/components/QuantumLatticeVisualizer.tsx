
import React, { useMemo, useEffect, useState } from 'react';

interface QuantumLatticeVisualizerProps {
  progress: number;
  isBreach: boolean;
  entanglementQuality: number;
}

const QuantumLatticeVisualizer: React.FC<QuantumLatticeVisualizerProps> = ({ progress, isBreach, entanglementQuality }) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let frame: number;
    const animate = () => {
      setTime(t => t + 0.05);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const points = useMemo(() => {
    const grid = [];
    const size = 12;
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        grid.push({ x, y });
      }
    }
    return grid;
  }, []);

  return (
    <div className={`h-full w-full rounded-[3.5rem] p-8 transition-all duration-1000 relative overflow-hidden flex flex-col items-center justify-center ${isBreach ? 'bg-red-950/30' : 'bg-black/60'}`}>
      <div className="absolute top-8 left-10 z-10">
        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em]">Quantum State HUD</h4>
        <div className="flex gap-2 items-center mt-2">
           <div className={`w-2 h-2 rounded-full ${isBreach ? 'bg-red-500 animate-ping' : 'bg-green-500 shadow-[0_0_10px_#22c55e]'}`}></div>
           <span className="text-[9px] font-black text-white mono uppercase tracking-widest">
             {isBreach ? 'COHERENCE_BREACH' : 'LATTICE_STABLE'} // Q-Phase: {(time % (Math.PI * 2)).toFixed(4)}
           </span>
        </div>
      </div>

      <svg width="100%" height="100%" viewBox="0 0 240 240" className="opacity-80">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Connection Lines */}
        {points.map((p, i) => {
          const neighbor = points[i + 1];
          if (!neighbor || neighbor.x === 0) return null;
          
          const wave = Math.sin(time + (p.x * 0.5) + (p.y * 0.5)) * 2;
          const x1 = 20 + p.x * 18 + wave;
          const y1 = 20 + p.y * 18 + wave;
          const x2 = 20 + neighbor.x * 18 + wave;
          const y2 = 20 + neighbor.y * 18 + wave;

          return (
            <line 
              key={`line-${i}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isBreach ? "#ef4444" : "#f7931a"}
              strokeWidth="0.3"
              strokeOpacity={0.2 + (Math.sin(time + i) * 0.1)}
            />
          );
        })}

        {/* Shard Particles */}
        {points.map((p, i) => {
          const noise = Math.sin(time + p.x + p.y) * 4;
          const r = isBreach ? 2 + Math.random() * 2 : 1 + (progress / 100);
          const color = isBreach ? "#ef4444" : progress > 50 ? "#3b82f6" : "#f7931a";
          
          return (
            <circle 
              key={i}
              cx={20 + p.x * 18 + noise}
              cy={20 + p.y * 18 + noise}
              r={r}
              fill={color}
              filter="url(#glow)"
              style={{ opacity: entanglementQuality * (0.3 + (Math.sin(time + i) * 0.5)) }}
            />
          );
        })}
      </svg>

      <div className="absolute bottom-8 right-10 flex flex-col items-end gap-1 opacity-40">
        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Coherence Probability</span>
        <span className="text-xl font-black text-white mono">{(entanglementQuality * 100).toFixed(2)}%</span>
      </div>
    </div>
  );
};

export default QuantumLatticeVisualizer;


import React from 'react';

interface LatticeLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'massive';
  variant?: 'gold' | 'white' | 'monochrome';
}

const LatticeLogo: React.FC<LatticeLogoProps> = ({ className = '', size = 'md', variant = 'gold' }) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    massive: 'w-48 h-48'
  };

  const gradientId = `gold-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`${sizeMap[size]} ${className} relative flex items-center justify-center shrink-0`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#C5A059" />
            <stop offset="100%" stopColor="#8E6E37" />
          </linearGradient>
          <filter id="lattice-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Hexagonal Outer Frame */}
        <path 
          d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" 
          fill="none" 
          stroke={variant === 'gold' ? `url(#${gradientId})` : variant === 'white' ? 'white' : 'currentColor'} 
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* The Interlocked "SL" Core */}
        <g transform="translate(15, 15) scale(0.7)">
          {/* Stylized 'L' */}
          <path 
            d="M30 10 L30 80 L80 80" 
            fill="none" 
            stroke={variant === 'gold' ? `url(#${gradientId})` : 'white'} 
            strokeWidth="10" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            opacity="0.9"
          />
          {/* Stylized 'S' that interlocks */}
          <path 
            d="M80 10 L40 10 C35 10 30 15 30 20 L30 30 C30 35 35 40 40 40 L70 40 C75 40 80 45 80 50 L80 60 C80 65 75 70 70 70 L20 70" 
            fill="none" 
            stroke={variant === 'gold' ? `url(#${gradientId})` : 'white'} 
            strokeWidth="10" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </g>

        {/* The Singularity Center Point */}
        <circle 
          cx="50" cy="50" r="4" 
          fill={variant === 'gold' ? '#FDE68A' : 'white'} 
          className="animate-pulse"
        />
      </svg>
    </div>
  );
};

export default LatticeLogo;

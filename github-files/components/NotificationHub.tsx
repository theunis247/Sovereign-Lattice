
import React from 'react';
import { Notification } from '../types';

interface NotificationHubProps {
  notifications: Notification[];
}

const NotificationHub: React.FC<NotificationHubProps> = ({ notifications }) => {
  return (
    <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-3 max-w-sm pointer-events-none">
      {notifications.map((n) => (
        <div 
          key={n.id} 
          className={`pointer-events-auto p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex flex-col gap-1 animate-in slide-in-from-right-8 duration-300 ${
            n.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-500' :
            n.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
            n.type === 'warning' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' :
            n.type === 'security' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
            'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest">{n.title}</span>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              n.type === 'success' ? 'bg-green-500' :
              n.type === 'error' ? 'bg-red-500' :
              n.type === 'warning' ? 'bg-orange-500' :
              n.type === 'security' ? 'bg-purple-500' :
              'bg-blue-500'
            }`}></div>
          </div>
          <p className="text-[11px] font-medium leading-tight text-white/80">{n.message}</p>
        </div>
      ))}
    </div>
  );
};

export default NotificationHub;

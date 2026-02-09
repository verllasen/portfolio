import { type FC, type ReactNode, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { playNotificationSound } from '../utils/sound';
import { MusicPlayer } from './MusicPlayer';

export const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  const { notifications, removeNotification } = useGameStore();
  const prevCount = useRef(0);

  useEffect(() => {
    if (notifications.length > prevCount.current) {
      const latest = notifications[notifications.length - 1];
      playNotificationSound(latest.type);
    }
    prevCount.current = notifications.length;
  }, [notifications]);

  return (
    <div className="relative min-h-screen w-full bg-background text-white overflow-hidden font-sans selection:bg-primary/30">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-accent/10 rounded-full blur-[100px]" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
      </div>

      {/* Scanline Effect */}
      <div className="absolute inset-0 z-[1] pointer-events-none opacity-[0.02] bg-white/5 mix-blend-overlay" />

      {/* Drag Region */}
      <div 
        className="fixed top-0 left-0 right-0 h-8 z-[9999] pointer-events-auto"
        style={{ WebkitAppRegion: 'drag' } as any}
      />

      {/* Main Content */}
      <main className="relative z-10 w-full h-full flex flex-col overflow-y-auto custom-scrollbar">
        {children}
      </main>

      <MusicPlayer />

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
         <AnimatePresence>
           {notifications.map(n => (
             <motion.div
               key={n.id}
               layout
               initial={{ opacity: 0, x: 50, scale: 0.9 }}
               animate={{ opacity: 1, x: 0, scale: 1 }}
               exit={{ opacity: 0, x: 50, scale: 0.9 }}
               className="pointer-events-auto min-w-[300px] max-w-sm glass-card p-4 rounded-xl border border-white/10 shadow-2xl flex items-start gap-3 relative overflow-hidden"
             >
               <div className={`absolute inset-0 opacity-10 ${
                 n.type === 'success' ? 'bg-green-500' :
                 n.type === 'error' ? 'bg-red-500' :
                 n.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
               }`} />
               
               <div className={`mt-1 ${
                 n.type === 'success' ? 'text-green-400' :
                 n.type === 'error' ? 'text-red-400' :
                 n.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'
               }`}>
                 {n.type === 'success' && <CheckCircle size={20} />}
                 {n.type === 'error' && <AlertCircle size={20} />}
                 {n.type === 'warning' && <AlertTriangle size={20} />}
                 {n.type === 'info' && <Info size={20} />}
               </div>

               <div className="flex-1">
                 <h4 className="font-bold text-white text-sm">{n.title}</h4>
                 <p className="text-white/60 text-xs mt-1">{n.message}</p>
               </div>

               <button 
                 onClick={() => removeNotification(n.id)}
                 className="absolute top-2 right-2 p-1 text-white/40 hover:text-white transition-colors z-10 hover:bg-white/10 rounded-full"
               >
                 <X size={14} />
               </button>
             </motion.div>
           ))}
         </AnimatePresence>
       </div>
    </div>
  );
};

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Square, X } from 'lucide-react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import { useStore } from './store/useStore';
import appLogo from './assets/avatar.jpg';

function TitleBar() {
  const minimize = () => window.electronAPI?.windowMinimize();
  const maximize = () => window.electronAPI?.windowMaximize();
  const close = () => window.electronAPI?.windowClose();

  return (
    <div className="absolute top-0 left-0 right-0 h-12 flex justify-between items-center select-none z-50 px-6 bg-[#000000]" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="text-[11px] text-zinc-500 font-medium tracking-widest uppercase flex items-center gap-2">
        FRIENDLY WORKSPACE
      </div>
      <div className="flex h-full items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button onClick={minimize} className="w-7 h-7 rounded-full hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
          <Minus size={14} />
        </button>
        <button onClick={maximize} className="w-7 h-7 rounded-full hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
          <Square size={12} />
        </button>
        <button onClick={close} className="w-7 h-7 rounded-full hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center text-zinc-400 transition-colors">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 bg-black flex flex-col items-center justify-center z-40"
    >
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-32 h-32 rounded-3xl overflow-hidden shadow-2xl border border-[#333] mb-8"
      >
        <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center"
      >
        <div className="w-48 h-1 bg-[#111] rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="h-full bg-white"
          />
        </div>
        <p className="text-[#666] text-sm mt-4 font-medium tracking-widest uppercase">Инициализация...</p>
      </motion.div>
    </motion.div>
  );
}

function App() {
  const { isAuthenticated, isAppLoaded, setAppLoaded } = useStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoaded(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-black">
      <TitleBar />
      <AnimatePresence mode="wait">
        {!isAppLoaded ? (
          <SplashScreen key="splash" />
        ) : isAuthenticated ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Dashboard />
          </motion.div>
        ) : (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Auth />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
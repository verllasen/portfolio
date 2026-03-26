import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Square, X } from 'lucide-react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import { useStore } from './store/useStore';
import appLogo from './assets/avatar.jpg';

// Custom titlebar for Windows desktop version
const TitleBar = () => {
  // Try to detect if we are in Electron. We'll show the title bar just in case
  const isElectron = true; // Force show since we build an exe
  if (!isElectron) return null;

  const handleMinimize = () => {
    if ((window as any).electron?.minimize) (window as any).electron.minimize();
    else if ((window as any).electronAPI?.windowMinimize) (window as any).electronAPI.windowMinimize();
  };

  const handleMaximize = () => {
    if ((window as any).electron?.maximize) (window as any).electron.maximize();
    else if ((window as any).electronAPI?.windowMaximize) (window as any).electronAPI.windowMaximize();
  };

  const handleClose = () => {
    if ((window as any).electron?.close) (window as any).electron.close();
    else if ((window as any).electronAPI?.windowClose) (window as any).electronAPI.windowClose();
  };
  
  return (
    <div className="h-8 w-full bg-[#0a0a0a] flex justify-between items-center fixed top-0 left-0 z-50 select-none" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="flex items-center px-3 gap-2">
        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-black rounded-full"></div>
        </div>
        <span className="text-xs text-[#888] font-medium tracking-wider">FRIENDLY</span>
      </div>
      <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button 
          onClick={handleMinimize}
          className="w-12 h-full flex items-center justify-center text-[#888] hover:bg-[#222] hover:text-white transition-colors"
        >
          <Minus size={16} />
        </button>
        <button 
          onClick={handleMaximize}
          className="w-12 h-full flex items-center justify-center text-[#888] hover:bg-[#222] hover:text-white transition-colors"
        >
          <Square size={14} />
        </button>
        <button 
          onClick={handleClose}
          className="w-12 h-full flex items-center justify-center text-[#888] hover:bg-red-500 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

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
    <div className="h-screen w-screen relative overflow-hidden bg-black" style={{ WebkitAppRegion: 'drag' } as any}>
      <TitleBar />
      <div style={{ WebkitAppRegion: 'no-drag', height: '100%', width: '100%', paddingTop: '32px' } as any} className="absolute inset-0">
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
    </div>
  );
}

export default App;
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Code } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500); // Small delay before unmounting
          return 100;
        }
        return prev + Math.random() * 5; // Random increment
      });
    }, 100);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex flex-col items-center justify-center z-50">
      <div className="relative mb-12">
        {/* Animated Icons */}
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
          className="relative z-10 p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-white/10 backdrop-blur-xl"
        >
          <Code size={64} className="text-blue-400" />
        </motion.div>
        
        {/* Background glow */}
        <div className="absolute inset-0 bg-blue-500/30 blur-[50px] rounded-full" />
      </div>

      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-8"
      >
        IT STUDIO
      </motion.h1>

      {/* Progress Bar */}
      <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden mb-4">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="h-6 text-white/50 font-mono text-sm">
        {progress < 30 && "Инициализация модулей..."}
        {progress >= 30 && progress < 60 && "Загрузка ассетов..."}
        {progress >= 60 && progress < 90 && "Подключение к серверу..."}
        {progress >= 90 && "Запуск системы..."}
      </div>
    </div>
  );
};

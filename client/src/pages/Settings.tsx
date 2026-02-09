import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Volume2, Monitor } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export const Settings: React.FC = () => {
  const { setView, deleteStudio, team, settings, updateSettings } = useGameStore();

  const handleDelete = () => {
    if (confirm('Вы уверены, что хотите удалить студию? Это действие необратимо.')) {
      deleteStudio();
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setView('menu')}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-3xl font-bold text-white">Настройки</h1>
        </div>

        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Monitor size={20} className="text-primary" /> Графика и Интерфейс
            </h2>
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <span className="text-white/80">Полноэкранный режим</span>
                 <button 
                   onClick={() => updateSettings({ fullscreen: !settings.fullscreen })}
                   className={`w-12 h-6 rounded-full relative transition-colors ${settings.fullscreen ? 'bg-primary/20' : 'bg-white/10'}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 rounded-full bg-primary transition-all ${settings.fullscreen ? 'right-1' : 'left-1'}`} />
                 </button>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-white/80">Анимации интерфейса</span>
                 <button 
                   onClick={() => updateSettings({ animations: !settings.animations })}
                   className={`w-12 h-6 rounded-full relative transition-colors ${settings.animations ? 'bg-primary/20' : 'bg-white/10'}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 rounded-full bg-primary transition-all ${settings.animations ? 'right-1' : 'left-1'}`} />
                 </button>
               </div>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Volume2 size={20} className="text-secondary" /> Звук
            </h2>
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <span className="text-white/80">Звуки ({settings.soundVolume}%)</span>
                 <input 
                   type="range" 
                   min="0" max="100" step="1"
                   value={settings.soundVolume}
                   onChange={(e) => updateSettings({ soundVolume: parseInt(e.target.value) })}
                   className="accent-secondary w-32" 
                 />
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-white/80">Музыка ({settings.musicVolume}%)</span>
                 <input 
                   type="range" 
                   min="0" max="100" step="1"
                   value={settings.musicVolume}
                   onChange={(e) => updateSettings({ musicVolume: parseInt(e.target.value) })}
                   className="accent-secondary w-32" 
                 />
               </div>
            </div>
          </div>

          {team && (
            <div className="glass p-6 rounded-2xl border border-red-500/30">
              <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                <Trash2 size={20} /> Опасная Зона
              </h2>
              <p className="text-white/50 text-sm mb-4">
                Удаление студии приведет к полной потере прогресса, сотрудников и достижений.
              </p>
              <button 
                onClick={handleDelete}
                className="px-6 py-3 bg-red-500/10 border border-red-500/50 text-red-400 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all w-full"
              >
                Удалить Студию "{team.name}"
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

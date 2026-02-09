import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, ChevronRight, Upload, Image as ImageIcon } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export const ProfileSetup: React.FC = () => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  
  const { createProfile, isLoading, isConnected, registrationError } = useGameStore();
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 1024 * 1024) { // 1MB limit
            alert('Файл слишком большой. Максимальный размер 1МБ');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'avatar') setAvatar(reader.result as string);
            else setBanner(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isLoading) {
      createProfile(name, avatar || undefined, banner || undefined);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4 relative overflow-hidden">
      {/* Background Preview */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
          {banner && <img src={banner} className="w-full h-full object-cover blur-sm" />}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass rounded-2xl p-8 border border-white/10 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="relative w-24 h-24 mx-auto mb-4 group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <div className={`w-full h-full rounded-full flex items-center justify-center border-2 border-dashed border-white/20 overflow-hidden ${avatar ? 'border-none' : 'bg-blue-500/20'}`}>
                    {avatar ? (
                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User size={40} className="text-blue-400" />
                    )}
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload size={20} className="text-white" />
                </div>
                <input 
                    type="file" 
                    ref={avatarInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'avatar')}
                />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Создание Профиля</h1>
            <p className="text-white/50">Как вас будут называть в мире IT?</p>
            {!isConnected && (
                <div className="mt-4 p-2 bg-red-500/20 text-red-400 text-xs rounded-lg border border-red-500/50 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Подключение к серверу...
                </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-white/50 mb-2">Никнейм</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите имя..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                maxLength={15}
                required
              />
              {registrationError && (
                <div className="text-red-400 text-sm mt-2 flex items-center gap-2 animate-shake">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {registrationError}
                </div>
              )}
            </div>

            <div>
               <label className="block text-sm text-white/50 mb-2 flex justify-between items-center">
                   <span>Баннер профиля (Опционально)</span>
                   {banner && <button type="button" onClick={() => setBanner(null)} className="text-xs text-red-400 hover:text-red-300">Удалить</button>}
               </label>
               <div 
                   className="w-full h-24 bg-white/5 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors overflow-hidden relative"
                   onClick={() => bannerInputRef.current?.click()}
               >
                   {banner ? (
                       <img src={banner} className="w-full h-full object-cover" />
                   ) : (
                       <>
                           <ImageIcon size={24} className="text-white/30 mb-2" />
                           <span className="text-xs text-white/30">Нажмите для загрузки</span>
                       </>
                   )}
                   <input 
                        type="file" 
                        ref={bannerInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'banner')}
                   />
               </div>
            </div>

            <button
              type="submit"
              disabled={!name.trim() || isLoading || !isConnected}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    <span>Проверка...</span>
                  </>
              ) : (
                  <>
                    <span>Продолжить</span>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

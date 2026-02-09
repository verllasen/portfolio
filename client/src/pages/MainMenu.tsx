import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Users, Code2, Trophy, Settings, UserPlus, Play, X, Search, Edit, Music, Plus, LogOut, Lock, Building2 } from 'lucide-react';

const ROLE_REQUIREMENTS = {
  'Junior': { level: 1, missions: 0 },
  'Middle': { level: 5, missions: 10 },
  'Senior': { level: 15, missions: 50 },
  'TeamLead': { level: 30, missions: 100 },
  'Architect': { level: 50, missions: 200 },
};
import { useGameStore } from '../store/useGameStore';
import type { Friend } from '../types';

const AVATARS = [
  'bg-gradient-to-br from-blue-500 to-purple-500',
  'bg-gradient-to-br from-green-400 to-blue-500',
  'bg-gradient-to-br from-pink-500 to-rose-500',
  'bg-gradient-to-br from-yellow-400 to-orange-500',
  'bg-gradient-to-br from-indigo-500 to-cyan-500',
  'bg-gradient-to-br from-gray-700 to-gray-900',
];

const BANNERS = [
  'bg-gradient-to-r from-blue-900 to-slate-900',
  'bg-gradient-to-r from-emerald-900 to-slate-900',
  'bg-gradient-to-r from-purple-900 to-slate-900',
  'bg-gradient-to-r from-rose-900 to-slate-900',
];

export const MainMenu: React.FC = () => {
  const { 
    setView, 
    joinTeam, 
    currentUser, 
    friends, 
    friendRequests,
    addFriendByCode, 
    acceptFriendRequest,
    rejectFriendRequest,
    inviteToStudio,
    team, 
    updateProfile,
    logout,
    studioInvites,
    acceptStudioInvite,
    rejectStudioInvite
  } = useGameStore();
  const [mode, setMode] = useState<'initial' | 'join'>('initial');
  const [name, setName] = useState('');
  const [inputCode, setInputCode] = useState('');

  const [isJoining, setIsJoining] = useState(false);
  
  // Friends Modal State
  const [showFriends, setShowFriends] = useState(false);
  const [friendInput, setFriendInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null); // For viewing profile
  
  // Profile Modal State
  const [showProfile, setShowProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // File Upload State
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);
  
  // Banner Settings
  const [bannerScale, setBannerScale] = useState(1);
  const [bannerPosition, setBannerPosition] = useState(50); // 0-100%

  // Initialize state from current user
  React.useEffect(() => {
    if (currentUser) {
        if (currentUser.bannerScale) setBannerScale(currentUser.bannerScale);
        if (currentUser.bannerPosition) setBannerPosition(currentUser.bannerPosition);
    }
  }, [currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 2.5 * 1024 * 1024) { // 2.5MB limit
              alert('Файл слишком большой. Максимальный размер 2.5МБ');
              return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
              if (type === 'avatar') updateProfile({ avatar: reader.result as string });
              else updateProfile({ banner: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleCreate = () => {
    setView('create-studio');
  };

  const handleJoin = () => {
    if (name || (currentUser && inputCode)) {
      setIsJoining(true);
      joinTeam(name, inputCode);
      // Reset loading state after 3 seconds if no response (simple timeout)
      setTimeout(() => setIsJoining(false), 3000);
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (friendInput.trim() && !isSearching) {
      setIsSearching(true);
      try {
        await addFriendByCode(friendInput.trim());
        setFriendInput('');
      } finally {
        setIsSearching(false);
      }
    }
  };

  const currentBanner = currentUser?.banner || BANNERS[0];
  const currentAvatar = currentUser?.avatar || AVATARS[0];
  
  // Helper to determine if we should render image or div
  const renderAvatar = (src: string, sizeClass: string = "w-10 h-10") => {
      if (src.startsWith('data:image')) {
          return <img src={src} alt="Avatar" className={`${sizeClass} rounded-full object-cover border border-white/20`} />;
      }
      return (
        <div className={`${sizeClass} rounded-full ${src} flex items-center justify-center text-white font-bold border border-white/20`}>
           {currentUser?.name[0].toUpperCase()}
        </div>
      );
  };

  const renderBanner = (src: string, heightClass: string = "h-32") => {
      if (src.startsWith('data:image')) {
          // Use saved settings or defaults
          const scale = currentUser?.bannerScale || 1;
          const pos = currentUser?.bannerPosition !== undefined ? currentUser.bannerPosition : 50;
          
          return (
            <div className={`${heightClass} w-full overflow-hidden relative`}>
                <img 
                    src={src} 
                    alt="Banner" 
                    className="w-full h-full object-cover transition-all duration-200"
                    style={{ 
                        objectPosition: `center ${pos}%`,
                        transform: `scale(${scale})`
                    }} 
                />
            </div>
          );
      }
      return <div className={`${heightClass} w-full ${src} relative`} />;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative">
      {/* Top Left Profile Widget */}
      {currentUser && (
        <div className="absolute top-8 left-8">
           <button 
             onClick={() => setShowProfile(true)}
             className="glass-card p-2 pr-6 rounded-full flex items-center gap-3 hover:bg-white/10 transition-all border border-white/10 group"
           >
             {renderAvatar(currentAvatar)}
             <div className="text-left">
                 <div className="text-white font-bold text-sm group-hover:text-primary transition-colors">{currentUser.name}</div>
                 <div className="text-white/40 text-xs">Lvl {currentUser.stats?.level || 1} • {currentUser.title || 'Junior'}</div>
               </div>
             </button>
        </div>
      )}

      {/* Top Right Buttons */}
      <div className="absolute top-8 right-8 flex gap-4">
        <button 
          onClick={() => useGameStore.getState().togglePlayer()}
          className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors" 
          title="Музыкальный плеер"
        >
          <Music size={20} className="text-white/60" />
        </button>

        <button 
          onClick={() => setShowFriends(true)}
          className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors" 
          title="Друзья"
        >
          <div className="relative">
            <UserPlus size={20} className="text-white/60" />
            {friends.length > 0 && (
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full text-[10px] text-black font-bold flex items-center justify-center">
                {friends.length}
              </div>
            )}
          </div>
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <Code2 className="w-16 h-16 text-primary drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]" />
        </div>
        <h1 className="text-6xl font-bold font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary text-glow">
          ITeam Tycoon
        </h1>
        <p className="text-white/50 mt-4 text-lg tracking-widest uppercase">
          Создай Свою IT Империю
        </p>
      </motion.div>

      <div className="w-full max-w-md">
        {mode === 'initial' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Show Continue only if user has a team */}
            {team ? (
              <div className="bg-white/5 p-6 rounded-xl border border-white/10 mb-8 text-center">
                 <div className="text-white/60 mb-2">Студия</div>
                 <div className="text-2xl font-bold text-white mb-4">{team.name}</div>
                 <button 
                   onClick={() => setView('lobby')}
                   className="w-full py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
                 >
                   Войти в Офис
                 </button>
              </div>
            ) : (
              // If no team, show Create/Join options
              <div className="space-y-4">
                <button 
                  onClick={handleCreate}
                  className="w-full group relative p-6 glass-card rounded-xl flex items-center gap-4 transition-all hover:scale-[1.02] hover:bg-white/5"
                >
                  <div className="p-4 rounded-full bg-primary/20 text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                    <Terminal size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white">Новая Студия</h3>
                    <p className="text-white/40 text-sm">Начать карьеру с нуля</p>
                  </div>
                </button>

                <button 
                  onClick={() => setMode('join')}
                  className="w-full group relative p-6 glass-card rounded-xl flex items-center gap-4 transition-all hover:scale-[1.02] hover:bg-white/5"
                >
                  <div className="p-4 rounded-full bg-secondary/20 text-secondary group-hover:bg-secondary group-hover:text-black transition-colors">
                    <Users size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white">Вступить в Студию</h3>
                    <p className="text-white/40 text-sm">Присоединиться по коду</p>
                  </div>
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button 
                onClick={() => setView('leaderboard')}
                className="p-4 glass-card rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors"
              >
                <Trophy size={20} className="text-yellow-400" />
                <span className="text-sm font-medium text-white/80">Лидеры</span>
              </button>
              <button 
                onClick={() => setView('settings')}
                className="p-4 glass-card rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors"
              >
                <Settings size={20} className="text-gray-400" />
                <span className="text-sm font-medium text-white/80">Настройки</span>
              </button>
            </div>
          </motion.div>
        )}

        {mode === 'join' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass p-8 rounded-2xl space-y-6"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              Подключение к Студии
            </h2>
            
            <div className="space-y-4">
              {/* Only ask for name if user doesn't have one, but here we assume user has profile */}
              {!currentUser && (
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Ваш Псевдоним</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all font-mono"
                    placeholder="Neo"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Код Доступа</label>
                <input 
                  type="text" 
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-secondary focus:shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all font-mono uppercase"
                  placeholder="Например: X7K9"
                  maxLength={6}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setMode('initial')}
                className="flex-1 py-3 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition-colors"
              >
                Назад
              </button>
              <button 
                onClick={handleJoin}
                disabled={!inputCode || (!currentUser && !name) || isJoining}
                className="flex-1 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-bold shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isJoining ? 'Подключение...' : 'Подключиться'} {isJoining ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Play size={16} />}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Friends Modal */}
      <AnimatePresence>
        {showProfile && currentUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121212]/95 backdrop-blur-xl w-full max-w-5xl max-h-[90vh] rounded-2xl border border-white/10 shadow-2xl relative flex flex-col overflow-hidden"
            >
              {/* Scrollable Content */}
              <div className="overflow-y-auto custom-scrollbar flex-1">
                  {/* Banner */}
                  <div className="relative">
                     {renderBanner(currentBanner, "h-48")}
                     <div className="absolute top-4 right-4 flex gap-2 z-50">
                       <button 
                         onClick={() => setIsEditing(!isEditing)}
                         className={`p-2 rounded-full backdrop-blur-md transition-colors ${isEditing ? 'bg-primary text-black' : 'bg-black/30 text-white hover:bg-white/20'}`}
                       >
                         <Edit size={16} />
                       </button>
                       <button 
                         onClick={() => setShowProfile(false)}
                         className="p-2 rounded-full bg-black/30 text-white hover:bg-white/20 backdrop-blur-md transition-colors"
                       >
                         <X size={16} />
                       </button>
                    </div>
                  </div>

                  <div className="px-8 pb-8">
                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column: Identity & Stats */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Avatar & Identity */}
                            <div className="relative -mt-16 mb-4">
                               <div className="flex justify-between items-end mb-4">
                                   {renderAvatar(currentAvatar, "w-32 h-32 border-4 border-[#121212] shadow-lg")}
                                   {team && (
                                     <div className="mb-4 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-xs font-mono text-white/60">
                                       {team.name}
                                     </div>
                                   )}
                               </div>
                               
                               <div>
                                   <h3 className="text-3xl font-bold text-white mb-1 break-words">{currentUser.name}</h3>
                                   <div className="flex flex-wrap items-center gap-2 text-white/50 text-sm">
                                     <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase">
                                       {currentUser.title || 'Junior'}
                                     </span>
                                     {currentUser.role && currentUser.role !== 'Freelancer' && (
                                       <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/10 text-xs font-bold uppercase">
                                         {currentUser.role}
                                       </span>
                                     )}
                                     <span>•</span>
                                     <span className="font-mono">ID: {currentUser.id}</span>
                                   </div>
                               </div>
                            </div>

                            {/* Stats Grid - Vertical Layout for Sidebar */}
                            <div className="grid grid-cols-2 gap-3">
                               <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center group hover:bg-white/10 transition-colors">
                                 <div className="text-white/40 text-[10px] uppercase mb-1">Уровень</div>
                                 <div className="text-xl font-mono font-bold text-white group-hover:scale-110 transition-transform">{currentUser.stats?.level || 1}</div>
                               </div>
                               <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center group hover:bg-white/10 transition-colors">
                                 <div className="text-white/40 text-[10px] uppercase mb-1">Опыт</div>
                                 <div className="text-xl font-mono font-bold text-primary group-hover:scale-110 transition-transform">{currentUser.stats?.xp || 0}</div>
                               </div>
                               <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center group hover:bg-white/10 transition-colors">
                                 <div className="text-white/40 text-[10px] uppercase mb-1">Миссии</div>
                                 <div className="text-xl font-mono font-bold text-green-400 group-hover:scale-110 transition-transform">{currentUser.stats?.completedMissions || 0}</div>
                               </div>
                               <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center group hover:bg-white/10 transition-colors">
                                 <div className="text-white/40 text-[10px] uppercase mb-1">КПД</div>
                                 <div className="text-xl font-mono font-bold text-purple-400 group-hover:scale-110 transition-transform">{currentUser.stats?.productivity || 100}%</div>
                               </div>
                            </div>
                            
                            {/* Logout Button (Desktop Sidebar) */}
                            <div className="hidden lg:block pt-4 border-t border-white/10">
                                <button 
                                    onClick={() => {
                                        if (confirm('Вы уверены, что хотите выйти? Вам придется создать новый профиль или войти заново.')) {
                                            logout();
                                            setShowProfile(false);
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-sm font-bold"
                                >
                                    <LogOut size={16} />
                                    Выйти из аккаунта
                                </button>
                            </div>
                        </div>

                        {/* Right Column: Content & Editing */}
                        <div className="lg:col-span-8 space-y-6 lg:pt-8">
                             {/* Edit Forms */}
                             {isEditing && (
                               <motion.div 
                                 initial={{ opacity: 0, height: 0 }}
                                 animate={{ opacity: 1, height: 'auto' }}
                                 className="mb-6 space-y-6 bg-black/20 p-6 rounded-2xl border border-white/5"
                               >
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div>
                                       <label className="text-xs text-white/40 uppercase mb-3 block font-bold">Выберите Аватар</label>
                                       <div className="grid grid-cols-5 gap-2">
                                         <div 
                                             className="aspect-square rounded-full border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-white transition-colors"
                                             onClick={() => avatarInputRef.current?.click()}
                                             title="Загрузить свое фото"
                                         >
                                             <UserPlus size={20} className="text-white/50" />
                                         </div>
                                         <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                                         {AVATARS.map((avatar) => (
                                           <button
                                             key={avatar}
                                             onClick={() => updateProfile({ avatar })}
                                             className={`aspect-square rounded-full ${avatar} ${currentAvatar === avatar ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-100'}`}
                                           />
                                         ))}
                                       </div>
                                     </div>
                                     <div>
                                       <label className="text-xs text-white/40 uppercase mb-3 block font-bold">Выберите Баннер</label>
                                       <div className="grid grid-cols-3 gap-2">
                                         <div 
                                             className="h-12 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-white transition-colors"
                                             onClick={() => bannerInputRef.current?.click()}
                                             title="Загрузить свой баннер"
                                         >
                                             <UserPlus size={20} className="text-white/50" />
                                         </div>
                                         <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
                                         {BANNERS.map((banner) => (
                                           <button
                                             key={banner}
                                             onClick={() => updateProfile({ banner })}
                                             className={`h-12 rounded-lg ${banner} ${currentBanner === banner ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-100'}`}
                                           />
                                         ))}
                                       </div>
                                     </div>
                                 </div>
                                 
                                 <div className="pt-4 border-t border-white/5">
                                   <label className="text-xs text-white/40 uppercase mb-3 block font-bold">Настройки Баннера</label>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                       <div>
                                           <div className="flex justify-between text-[10px] text-white/40 mb-1">
                                               <span>Масштаб</span>
                                               <span>{Math.round(bannerScale * 100)}%</span>
                                           </div>
                                           <input 
                                               type="range" min="1" max="2" step="0.1" value={bannerScale}
                                               onChange={(e) => {
                                                   const val = parseFloat(e.target.value);
                                                   setBannerScale(val);
                                                   updateProfile({ bannerScale: val });
                                               }}
                                               className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                           />
                                       </div>
                                       <div>
                                           <div className="flex justify-between text-[10px] text-white/40 mb-1">
                                               <span>Позиция по вертикали</span>
                                               <span>{bannerPosition}%</span>
                                           </div>
                                           <input 
                                               type="range" min="0" max="100" step="1" value={bannerPosition}
                                               onChange={(e) => {
                                                   const val = parseInt(e.target.value);
                                                   setBannerPosition(val);
                                                   updateProfile({ bannerPosition: val });
                                               }}
                                               className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                           />
                                       </div>
                                   </div>
                                 </div>
                               </motion.div>
                             )}

                             {/* Bio Section */}
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                                <div className="text-white/40 text-xs uppercase mb-4 flex justify-between items-center font-bold">
                                    О себе
                                    {isEditing && <span className="text-[10px] text-primary">Редактирование</span>}
                                </div>
                                {isEditing ? (
                                    <textarea
                                        value={currentUser.bio || ''}
                                        onChange={(e) => updateProfile({ bio: e.target.value })}
                                        placeholder="Напишите пару слов о себе..."
                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primary outline-none resize-none h-32 leading-relaxed"
                                        maxLength={150}
                                    />
                                ) : (
                                    <p className="text-white/80 text-base leading-relaxed">
                                        {currentUser.bio || "Информация отсутствует..."}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Role Selection */}
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="text-white/40 text-xs uppercase mb-4 font-bold">Уровень Навыков</div>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(ROLE_REQUIREMENTS).map(([role, req]) => {
                                            const isUnlocked = (currentUser.stats?.level || 1) >= req.level && (currentUser.stats?.completedMissions || 0) >= req.missions;
                                            const isCurrent = (currentUser.title || 'Junior') === role;
                                            
                                            return (
                                                <div key={role} className="relative group/role">
                                                    <button
                                                        onClick={() => isUnlocked && updateProfile({ title: role })}
                                                        disabled={!isUnlocked && !isEditing}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border flex items-center gap-2 ${
                                                            isCurrent
                                                            ? 'bg-primary text-black border-primary' 
                                                            : isUnlocked
                                                                ? 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                                                                : 'bg-black/20 text-white/20 border-white/5'
                                                        } ${!isEditing && !isCurrent ? 'opacity-50' : ''}`}
                                                    >
                                                        {role}
                                                        {!isUnlocked && <Lock size={12} />}
                                                    </button>
                                                    {/* Tooltip */}
                                                    {!isUnlocked && (
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-black/90 border border-white/10 rounded-xl text-xs text-white/80 pointer-events-none opacity-0 group-hover/role:opacity-100 transition-opacity z-50 shadow-xl backdrop-blur-md text-center">
                                                            <div className="font-bold text-white mb-2">{role}</div>
                                                            <div className="space-y-1 text-[10px]">
                                                                <div className={(currentUser.stats?.level || 1) >= req.level ? "text-green-400" : "text-red-400"}>
                                                                    • Уровень {req.level}+ ({currentUser.stats?.level || 1}/{req.level})
                                                                </div>
                                                                <div className={(currentUser.stats?.completedMissions || 0) >= req.missions ? "text-green-400" : "text-red-400"}>
                                                                    • Миссии {req.missions}+ ({currentUser.stats?.completedMissions || 0}/{req.missions})
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Skills */}
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="text-white/40 text-xs uppercase mb-4 font-bold">Навыки</div>
                                    <div className="flex flex-wrap gap-2">
                                         {currentUser.tags && currentUser.tags.length > 0 ? (
                                             currentUser.tags.map((tag, idx) => (
                                                 <div key={idx} className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold flex items-center gap-2">
                                                     {tag}
                                                     {isEditing && (
                                                         <button 
                                                             onClick={() => {
                                                                 const newTags = currentUser.tags?.filter((_, i) => i !== idx);
                                                                 updateProfile({ tags: newTags });
                                                             }}
                                                             className="hover:text-white transition-colors"
                                                         >
                                                             <X size={12} />
                                                         </button>
                                                     )}
                                                 </div>
                                             ))
                                         ) : (
                                             <span className="text-white/30 text-sm">Нет навыков</span>
                                         )}
                                         
                                         {isEditing && (currentUser.tags?.length || 0) < 5 && (
                                             <button
                                                 onClick={() => {
                                                     const tag = prompt("Введите навык (макс 10 символов):");
                                                     if (tag && tag.length <= 10) {
                                                         const newTags = [...(currentUser.tags || []), tag];
                                                         updateProfile({ tags: newTags });
                                                     }
                                                 }}
                                                 className="px-3 py-1.5 bg-white/5 text-white/50 border border-white/10 rounded-lg text-xs hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1 font-bold"
                                             >
                                                 <Plus size={12} /> Добавить
                                             </button>
                                         )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Mobile Logout Button */}
                            <div className="lg:hidden pt-4 border-t border-white/10">
                                <button 
                                    onClick={() => {
                                        if (confirm('Вы уверены, что хотите выйти? Вам придется создать новый профиль или войти заново.')) {
                                            logout();
                                            setShowProfile(false);
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-sm font-bold"
                                >
                                    <LogOut size={16} />
                                    Выйти из аккаунта
                                </button>
                            </div>
                        </div>
                     </div>
                  </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showFriends && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121212]/95 backdrop-blur-xl w-full max-w-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users size={20} className="text-primary" /> Друзья
                </h2>
                <button 
                  onClick={() => setShowFriends(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <form onSubmit={handleAddFriend} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input 
                      value={friendInput}
                      onChange={(e) => setFriendInput(e.target.value)}
                      placeholder="Введите код друга..."
                      className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={!friendInput.trim() || isSearching}
                    className="px-4 bg-primary/20 text-primary border border-primary/50 rounded-xl font-bold hover:bg-primary hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[54px]"
                  >
                    {isSearching ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <UserPlus size={20} />}
                  </button>
                </form>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="bg-white/5 p-4 rounded-xl mb-4 text-center border border-white/10">
                    <div className="text-white/40 text-xs uppercase mb-1">Ваш Код Друга</div>
                    <div className="text-2xl font-mono font-bold text-primary tracking-widest selection:bg-primary selection:text-black">
                      {currentUser?.friendCode}
                    </div>
                  </div>

                  {/* Studio Invites Section */}
                  {studioInvites.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 ml-1">Приглашения в Студию ({studioInvites.length})</h3>
                      <div className="space-y-2">
                        {studioInvites.map((invite, idx) => (
                          <div key={idx} className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-700 to-indigo-900 flex items-center justify-center text-white font-bold border border-white/10">
                                <Building2 size={20} />
                              </div>
                              <div>
                                <div className="text-white font-bold text-sm">{invite.studioName}</div>
                                <div className="text-xs text-purple-300">От: {invite.inviterName}</div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => acceptStudioInvite(invite.studioCode)}
                                className="flex-1 py-1.5 bg-purple-500 text-white text-xs font-bold rounded-lg hover:bg-purple-600 transition-colors"
                              >
                                Вступить
                              </button>
                              <button 
                                onClick={() => rejectStudioInvite(invite.studioCode)}
                                className="flex-1 py-1.5 bg-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/20 transition-colors"
                              >
                                Отклонить
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Friend Requests Section */}
                  {friendRequests.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 ml-1">Заявки ({friendRequests.length})</h3>
                      <div className="space-y-2">
                        {friendRequests.map(request => (
                          <div key={request.id} className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold border border-white/10 overflow-hidden">
                                {request.avatar ? (
                                    <img src={request.avatar} alt={request.name} className="w-full h-full object-cover" />
                                ) : (
                                    request.name[0].toUpperCase()
                                )}
                              </div>
                              <div>
                                <div className="text-white font-bold text-sm">{request.name}</div>
                                <div className="text-xs text-primary">Хочет добавить вас</div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => acceptFriendRequest(request)}
                                className="flex-1 py-1.5 bg-primary text-black text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
                              >
                                Принять
                              </button>
                              <button 
                                onClick={() => rejectFriendRequest(request.id)}
                                className="flex-1 py-1.5 bg-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/20 transition-colors"
                              >
                                Отклонить
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 ml-1">Мои Друзья ({friends.length})</h3>
                  {friends.length === 0 ? (
                    <div className="text-center py-8 text-white/30">
                      <Users size={48} className="mx-auto mb-4 opacity-20" />
                      <p>У вас пока нет друзей</p>
                    </div>
                  ) : (
                    friends.map(friend => (
                      <div 
                        key={friend.id} 
                        className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => setSelectedFriend(friend)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden border border-white/10">
                            {friend.avatar ? (
                                <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                            ) : (
                                friend.name[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="text-white font-bold group-hover:text-primary transition-colors">{friend.name}</div>
                            <div className="text-xs text-white/40 flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${friend.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
                              {friend.status === 'online' ? 'В сети' : 'Не в сети'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           {/* Invite Button - only if we have a team */}
                           {team && friend.status === 'online' && (
                             <button 
                               onClick={(e) => {
                                   e.stopPropagation();
                                   inviteToStudio(friend.id);
                               }}
                               className="p-2 rounded-full text-white/20 hover:text-primary hover:bg-white/10 transition-colors"
                               title="Пригласить в студию"
                             >
                               <UserPlus size={16} />
                             </button>
                           )}
                           <button 
                             onClick={(e) => {
                                 e.stopPropagation();
                                 useGameStore.getState().removeFriend(friend.id);
                             }}
                             className="p-2 rounded-full text-white/20 hover:text-red-400 hover:bg-white/10 transition-colors"
                             title="Удалить"
                           >
                             <X size={16} />
                           </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Friend Profile Modal */}
        {selectedFriend && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedFriend(null)}
          >
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-[#121212]/95 backdrop-blur-xl w-full max-w-md rounded-2xl border border-white/10 shadow-2xl relative flex flex-col overflow-hidden"
               onClick={(e) => e.stopPropagation()}
             >
                {/* Banner */}
                <div className="relative h-32">
                    {(selectedFriend as any).banner ? (
                         <img src={(selectedFriend as any).banner} className="w-full h-full object-cover" alt="Banner" />
                    ) : (
                         <div className="w-full h-full bg-gradient-to-r from-blue-900 via-slate-900 to-black" />
                    )}
                    <button 
                        onClick={() => setSelectedFriend(null)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/30 text-white hover:bg-white/20 backdrop-blur-md transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="px-6 pb-6 relative">
                    <div className="relative -mt-12 mb-4 flex justify-between items-end">
                       <div className="w-24 h-24 rounded-full border-4 border-[#121212] bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg overflow-hidden">
                           {selectedFriend.avatar ? (
                               <img src={selectedFriend.avatar} alt={selectedFriend.name} className="w-full h-full object-cover" />
                           ) : (
                               selectedFriend.name[0].toUpperCase()
                           )}
                       </div>
                       {/* Role Badge */}
                       <div className="mb-2">
                           <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase shadow-sm">
                               {(selectedFriend as any).title || 'Junior'}
                           </span>
                       </div>
                    </div>

                    <div className="mb-6">
                       <h3 className="text-2xl font-bold text-white mb-1">{selectedFriend.name}</h3>
                       <div className="flex items-center gap-3 text-white/50 text-sm">
                           <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${selectedFriend.status === 'online' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-gray-500/10 border-gray-500/20 text-gray-400'}`}>
                               <div className={`w-1.5 h-1.5 rounded-full ${selectedFriend.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
                               {selectedFriend.status === 'online' ? 'В сети' : 'Не в сети'}
                           </div>
                           <span>•</span>
                           <span className="font-mono">ID: {selectedFriend.id}</span>
                       </div>
                    </div>
                    
                    <div className="space-y-3">
                         {team && selectedFriend.status === 'online' && (
                             <button 
                                 onClick={() => {
                                     inviteToStudio(selectedFriend.id);
                                     setSelectedFriend(null);
                                 }}
                                 className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-black rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                             >
                                 <UserPlus size={18} /> Пригласить в Студию
                             </button>
                         )}
                         <button 
                             onClick={() => {
                                 if(confirm('Удалить друга?')) {
                                     useGameStore.getState().removeFriend(selectedFriend.id);
                                     setSelectedFriend(null);
                                 }
                             }}
                             className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 text-red-400 border border-white/10 rounded-xl font-bold hover:bg-red-500/10 hover:border-red-500/50 transition-all"
                         >
                             <LogOut size={18} /> Удалить из друзей
                         </button>
                    </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social Icons */}
      <div className="absolute bottom-8 left-8 flex gap-4">
        <a href="https://discord.gg/iteam" target="_blank" rel="noopener noreferrer" className="p-3 bg-[#5865F2] rounded-full text-white hover:scale-110 transition-transform shadow-lg shadow-[#5865F2]/20 group">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="group-hover:rotate-12 transition-transform">
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.772-.6083 1.1588a18.2915 18.2915 0 00-5.4868 0 2.018 2.018 0 00-.6172-1.1588.0741.0741 0 00-.0785-.0371 19.7913 19.7913 0 00-4.8851 1.5152.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z"/>
          </svg>
        </a>
        <a href="https://vk.com/iteam" target="_blank" rel="noopener noreferrer" className="p-3 bg-[#0077FF] rounded-full text-white hover:scale-110 transition-transform shadow-lg shadow-[#0077FF]/20 group">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="group-hover:rotate-12 transition-transform">
            <path d="M19.915 13.028c1.138 1.138 2.276 2.276 3.35 3.478.514.56.536.87.03 1.258-.42.32-1.07.356-1.57.356h-2.26c-1.374 0-2.352-.674-3.14-1.592-.516-.598-1.032-1.196-1.548-1.794-.258-.3-.516-.6-.838-.6-.216 0-.43.192-.43.6v2.736c0 .408-.13.65-.624.65h-4.14c-2.6 0-4.688-1.716-6.644-4.836C.66 10.66 0 8.48 0 6.22c0-.408.172-.58.58-.58h2.36c.452 0 .624.214.816.686 1.054 2.532 2.73 4.6 4.88 5.826.236.128.43.042.43-.32V6.22c0-.472.13-.644.644-.644h3.956c.386 0 .536.192.536.6v3.718c0 .236.108.386.322.386.194 0 .344-.108.538-.3 1.074-1.074 1.892-2.45 2.45-3.956.128-.344.3-.644.838-.644h2.364c.516 0 .73.236.58.752-.28 1.01-1.01 1.87-1.59 2.73-.624.924-1.248 1.848-1.872 2.772-.344.516-.322.752.194 1.128z"/>
          </svg>
        </a>
      </div>
    </div>
  );
};

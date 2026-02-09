import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, User, Shield, Medal, X, UserPlus, Building2 } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import type { LeaderboardEntry } from '../types';

export const Leaderboard: React.FC = () => {
  const { setView, leaderboard, friends, addFriendByCode, inviteToStudio, team } = useGameStore();
  const [filter, setFilter] = useState<'studios' | 'coders'>('studios');
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);
  
  // Friend status helper
  const isFriend = (id: string) => friends.some(f => f.id === id);

  const filteredData = leaderboard
    .filter(entry => entry.type === (filter === 'studios' ? 'studio' : 'coder'))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setView('menu')}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="text-yellow-400" /> Зал Славы
          </h1>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setFilter('studios')}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${filter === 'studios' ? 'bg-primary text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}
          >
            <Shield size={18} /> Лучшие Студии
          </button>
          <button 
            onClick={() => setFilter('coders')}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${filter === 'coders' ? 'bg-secondary text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}
          >
            <User size={18} /> Лучшие Кодеры
          </button>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-4">
          {filteredData.length === 0 ? (
            <div className="glass rounded-2xl overflow-hidden border border-white/10 min-h-[400px] flex items-center justify-center">
               <div className="text-center">
                 <Trophy size={64} className="mx-auto text-white/10 mb-4" />
                 <h3 className="text-xl font-bold text-white mb-2">Таблица Лидеров Пуста</h3>
                 <p className="text-white/50">Станьте первым, кто покорит вершину!</p>
               </div>
            </div>
          ) : (
            filteredData.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-4 rounded-xl flex items-center gap-6 border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden cursor-pointer group"
                onClick={() => {
                   if (entry.type === 'coder') setSelectedUser(entry);
                }}
              >
                {/* Rank Badge */}
                <div className={`w-12 h-12 flex items-center justify-center rounded-full font-bold text-xl ${
                  index === 0 ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.5)]' :
                  index === 1 ? 'bg-gray-300 text-black' :
                  index === 2 ? 'bg-amber-700 text-white' :
                  'bg-white/5 text-white/50'
                }`}>
                  {index + 1}
                </div>

                {/* Avatar */}
                <div className="w-14 h-14 flex-shrink-0">
                    {entry.avatar && entry.avatar.startsWith('data:image') ? (
                        <img src={entry.avatar} alt={entry.name} className="w-full h-full rounded-full object-cover border-2 border-white/10" />
                    ) : (
                        <div className={`w-full h-full rounded-full ${entry.avatar || 'bg-gradient-to-br from-gray-700 to-gray-900'} flex items-center justify-center text-white font-bold text-xl border-2 border-white/10`}>
                            {entry.name[0].toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {entry.name}
                    {index < 3 && <Medal size={16} className="text-yellow-400" />}
                  </h3>
                  <p className="text-white/40 text-sm capitalize">{entry.type}</p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-primary">
                    {entry.score.toLocaleString()}
                  </div>
                  <div className="text-white/30 text-xs uppercase tracking-wider">
                    {entry.type === 'studio' ? 'Рейтинг' : 'XP'}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Profile Modal */}
      <AnimatePresence>
        {selectedUser && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={() => setSelectedUser(null)}
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
                        {selectedUser.banner ? (
                             <img src={selectedUser.banner} className="w-full h-full object-cover" alt="Banner" />
                        ) : (
                             <div className="w-full h-full bg-gradient-to-r from-blue-900 via-slate-900 to-black" />
                        )}
                        <button 
                            onClick={() => setSelectedUser(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-black/30 text-white hover:bg-white/20 backdrop-blur-md transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="px-6 pb-6 relative">
                        <div className="relative -mt-12 mb-4 flex justify-between items-end">
                            <div className="w-24 h-24 rounded-full border-4 border-[#121212] bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg overflow-hidden">
                                {selectedUser.avatar ? (
                                    <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full object-cover" />
                                ) : (
                                    selectedUser.name[0].toUpperCase()
                                )}
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-white mb-1">{selectedUser.name}</h3>
                            <div className="text-white/50 text-sm font-mono">ID: {selectedUser.id}</div>
                        </div>

                        <div className="space-y-3">
                            {!isFriend(selectedUser.id) && (
                                <button 
                                    onClick={() => {
                                        addFriendByCode(selectedUser.id);
                                        setSelectedUser(null);
                                    }}
                                    className="w-full py-3 bg-primary text-black rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                                >
                                    <UserPlus size={18} /> Добавить в Друзья
                                </button>
                            )}
                            
                            {team && (
                                <button 
                                    onClick={() => {
                                        inviteToStudio(selectedUser.id);
                                        setSelectedUser(null);
                                    }}
                                    className="w-full py-3 bg-white/5 text-white border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                >
                                    <Building2 size={18} /> Пригласить в Студию
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

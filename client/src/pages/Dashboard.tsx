import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, DollarSign, Trophy, ArrowUpRight, Lock, ArrowLeft, Users, UserPlus } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export const Dashboard: React.FC = () => {
  const { team, currentUser, availableMissions, takeContract, setView, friends, addFriendByCode } = useGameStore();
  const [friendCodeInput, setFriendCodeInput] = useState('');

  if (!team || !currentUser) return null;

  const handleTakeContract = (id: string) => {
    takeContract(id);
    setView('lobby');
  };

  const filteredMissions = availableMissions?.filter(mission => 
    !mission.requiredSpecialization || 
    mission.requiredSpecialization.some(spec => team.specializations?.includes(spec))
  ) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto h-screen flex flex-col">
      {/* Header Stats */}
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <button 
             onClick={() => setView('lobby')}
             className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Операционная Панель</h1>
            <p className="text-white/40 font-mono text-sm">С возвращением, {team.name}</p>
          </div>
        </div>
        
        <div className="flex gap-6">
          <div className="glass-card px-6 py-3 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
              <DollarSign size={20} />
            </div>
            <div>
              <div className="text-xs text-white/40 uppercase font-bold">Финансы</div>
              <div className="text-xl font-mono font-bold text-white">${team.money.toLocaleString()}</div>
            </div>
          </div>

          <div className="glass-card px-6 py-3 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
              <Trophy size={20} />
            </div>
            <div>
              <div className="text-xs text-white/40 uppercase font-bold">Репутация</div>
              <div className="text-xl font-mono font-bold text-white">{team.rating}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        
        {/* Missions Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Briefcase size={20} className="text-primary" /> Доступные Контракты
          </h2>
          
          <div className="grid gap-4 overflow-y-auto pr-2 pb-4">
            {filteredMissions.map((mission, idx) => (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass p-6 rounded-2xl border border-white/5 hover:border-primary/50 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Briefcase size={100} />
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      mission.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      mission.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {mission.difficulty === 'Easy' ? 'Легко' : mission.difficulty === 'Medium' ? 'Средне' : 'Сложно'}
                    </span>
                    <span className="text-green-400 font-mono font-bold">+${mission.reward.money}</span>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">{mission.title}</h3>
                  <p className="text-white/60 mb-6 max-w-lg">{mission.description}</p>

                  <button
                    onClick={() => handleTakeContract(mission.id)}
                    className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-primary hover:text-white transition-colors flex items-center gap-2"
                  >
                    Принять Контракт <ArrowUpRight size={18} />
                  </button>
                </div>
              </motion.div>
            ))}

            {/* Locked Placeholders */}
            <div className="p-6 rounded-2xl border border-white/5 bg-black/20 flex items-center justify-center text-white/20 gap-2">
              <Lock size={16} /> Требуется более высокая репутация для новых контрактов
            </div>
          </div>
        </div>

        {/* Side Panel (Team Status) */}
        <div className="glass rounded-2xl p-6 h-full flex flex-col">
           <h3 className="text-lg font-bold text-white mb-4">Статус Команды</h3>
           <div className="space-y-4 mb-8">
             {team.members?.map(member => (
               <div key={member.id} className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-white/80">{member.name}</span>
                 <span className="text-xs text-white/40 ml-auto border border-white/10 px-2 py-1 rounded">{member.role}</span>
               </div>
             ))}
           </div>

           {/* Social / Friends Section */}
           <div className="pt-8 border-t border-white/10 flex-1 flex flex-col min-h-0">
             <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users size={18} className="text-primary" /> Социальная Сеть
             </h3>
             
             {/* My Code */}
             <div className="bg-white/5 p-4 rounded-xl mb-6 border border-white/10">
                <div className="text-xs text-white/40 uppercase font-bold mb-1">Ваш Код Дружбы</div>
                <div className="text-xl font-mono font-bold text-primary tracking-widest selection:bg-primary selection:text-black">
                    {currentUser.friendCode || '---'}
                </div>
                <div className="text-[10px] text-white/30 mt-2">Сообщите этот код другу для добавления.</div>
             </div>

             {/* Add Friend Input */}
             <div className="flex gap-2 mb-6">
                <input 
                    type="text" 
                    placeholder="Введите код друга..." 
                    value={friendCodeInput}
                    onChange={(e) => setFriendCodeInput(e.target.value)}
                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50 font-mono"
                />
                <button 
                    onClick={() => {
                        if (friendCodeInput) {
                            addFriendByCode(friendCodeInput);
                            setFriendCodeInput('');
                        }
                    }}
                    className="bg-primary/20 hover:bg-primary/30 text-primary p-2 rounded-lg transition-colors border border-primary/20"
                >
                    <UserPlus size={20} />
                </button>
             </div>

             {/* Friends List */}
             <h4 className="text-xs font-bold text-white/40 uppercase mb-3">Список Друзей</h4>
             <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1">
                 {friends.length === 0 ? (
                     <div className="text-white/20 text-sm italic text-center py-4">Нет добавленных друзей</div>
                 ) : (
                     friends.map(friend => (
                        <div key={friend.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                            <div className={`w-2 h-2 rounded-full ${friend.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-white truncate">{friend.name}</div>
                                <div className="text-[10px] text-white/40 font-mono">ID: {friend.id}</div>
                            </div>
                        </div>
                     ))
                 )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Trophy, Clock, Star, ArrowRight, Award, Beaker } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export const MissionReport: React.FC = () => {
  const { team, currentUser, availableMissions } = useGameStore();

  if (!team || !currentUser) return null;

  // Since activeMissionId is cleared on finish (or we need to keep it until we leave report),
  // we might need to rely on history or just show a generic "Success" if ID is gone.
  // Ideally, we should keep the mission ID in state until we leave this screen.
  // For now, let's assume we can find the last mission or just show general stats.
  
  // Correction: finishMission in store sets view to report but DOES NOT clear activeMissionId immediately?
  // Let's check store... 
  // Store: finishMission just sets view to 'report'. It does NOT clear team.activeMissionId.
  // Good.
  
  const mission = availableMissions.find(m => m.id === team.activeMissionId);
  
  const handleContinue = () => {
    // Now we clear the mission state AND apply rewards
    useGameStore.setState(state => ({
      team: state.team ? {
        ...state.team,
        money: state.team.money + (mission?.reward || 0),
        rating: state.team.rating + 15,
        researchPoints: (state.team.researchPoints || 0) + (mission?.difficulty === 'Hard' ? 3 : mission?.difficulty === 'Medium' ? 2 : 1),
        activeMissionId: null,
        missionStatus: 'idle',
        missionReadyMembers: [],
        missionStartTime: undefined,
        missionState: { html: '', css: '', js: '', sql: '' }
      } : null,
      view: 'lobby'
    }));
  };

  if (!mission) {
    return (
      <div className="h-full flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Данные отчета недоступны</h1>
          <button onClick={handleContinue} className="bg-primary text-black px-6 py-2 rounded-xl font-bold">
            Вернуться в Лобби
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#050505] text-white p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto w-full">
        
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/20 text-green-400 mb-6 border-4 border-green-500/10 shadow-[0_0_50px_rgba(74,222,128,0.2)]">
            <Trophy size={48} />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
            Миссия Выполнена!
          </h1>
          <p className="text-xl text-white/60">
            Контракт <span className="text-white font-bold">"{mission.title}"</span> успешно закрыт.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* Time Card */}
          <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center hover:bg-[#222] transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Clock size={24} />
            </div>
            <div className="text-3xl font-bold font-mono mb-1">42:15</div>
            <div className="text-xs text-white/40 uppercase tracking-wider font-bold">Время выполнения</div>
          </div>

          {/* Reward Card */}
          <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center hover:bg-[#222] transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Star size={24} />
            </div>
            <div className="text-3xl font-bold font-mono mb-1">+{mission.reward} $</div>
            <div className="text-xs text-white/40 uppercase tracking-wider font-bold">Награда Студии</div>
          </div>

          {/* Rating Card */}
          <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center hover:bg-[#222] transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Award size={24} />
            </div>
            <div className="text-3xl font-bold font-mono mb-1">S</div>
            <div className="text-xs text-white/40 uppercase tracking-wider font-bold">Рейтинг</div>
          </div>

          {/* Research Points Card */}
          <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center hover:bg-[#222] transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Beaker size={24} />
            </div>
            <div className="text-3xl font-bold font-mono mb-1">+{mission.difficulty === 'Hard' ? 3 : mission.difficulty === 'Medium' ? 2 : 1}</div>
            <div className="text-xs text-white/40 uppercase tracking-wider font-bold">Очки Науки</div>
          </div>
        </div>

        {/* Team Performance */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden mb-12">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-lg">Вклад Команды</h3>
            <div className="text-sm text-white/40">XP начислен</div>
          </div>
          <div className="divide-y divide-white/5">
            {team.members.map(member => (
              <div key={member.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center font-bold text-sm">
                  {member.name[0]}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white">{member.name}</div>
                  <div className="text-xs text-white/40">{member.missionRole || member.role}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-green-400 font-bold font-mono">+{(member.id === currentUser.id ? 250 : 180)} XP</div>
                    <div className="text-[10px] text-white/30 uppercase">Level Progress</div>
                  </div>
                  {member.id === currentUser.id && (
                    <div className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold text-white/60">ВЫ</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <button 
            onClick={handleContinue}
            className="group relative px-8 py-4 bg-white text-black font-bold rounded-xl overflow-hidden hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
          >
            <div className="relative z-10 flex items-center gap-3">
              Вернуться в Лобби <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

      </div>
    </div>
  );
};

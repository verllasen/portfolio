import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, Users, ShoppingBag, Beaker, 
  LayoutDashboard, ArrowLeft, Lock, Check, Building2, AlertTriangle, 
  Edit, Play, Clock, CheckCircle, UserX, UserCheck, Crown, Globe, LogOut, MessageSquare, Send, Trash2, Plus, UserPlus, X, Mail
} from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { researchTree } from '../data/research';
import { shopItems } from '../data/shop';
import type { Role, Player } from '../types';

const ROLES: Role[] = ['TeamLead', 'Заместитель', 'Senior', 'Middle', 'Junior'];

const AVATARS = [
  'bg-gradient-to-br from-blue-600 to-indigo-700',
  'bg-gradient-to-br from-purple-600 to-pink-700',
  'bg-gradient-to-br from-green-500 to-emerald-700',
  'bg-gradient-to-br from-orange-500 to-red-700',
  'bg-gradient-to-br from-gray-700 to-black',
];

const BANNERS = [
  'bg-gradient-to-r from-blue-900 via-slate-900 to-black',
  'bg-gradient-to-r from-purple-900 via-slate-900 to-black',
  'bg-gradient-to-r from-green-900 via-slate-900 to-black',
  'bg-gradient-to-r from-red-900 via-slate-900 to-black',
];

export const Lobby: React.FC = () => {
  const { 
    team, currentUser, setView, buyItem, unlockResearch, deleteStudio, leaveTeam,
    startMission, joinContract, updateTeamProfile, kickMember, promoteMember, toggleTeamPrivacy, acceptMember, rejectMember, setMissionRole, sendChatMessage, deleteChatMessage,
    addFriendByCode, friends
  } = useGameStore();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'research' | 'shop' | 'management' | 'chat'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [selectedMember, setSelectedMember] = useState<Player | null>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 2.5 * 1024 * 1024) { // 2.5MB limit
              alert('Файл слишком большой. Максимальный размер 2.5МБ');
              return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
              if (type === 'avatar') updateTeamProfile({ avatar: reader.result as string });
              else updateTeamProfile({ banner: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  React.useEffect(() => {
    // Scroll to top when switching tabs
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Internal scroll for Chat tab
    if (activeTab === 'chat' && chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeTab, team?.chatMessages]);

  const handleSendChat = (e: React.FormEvent) => {
      e.preventDefault();
      if (chatInput.trim()) {
          sendChatMessage(chatInput.trim());
          setChatInput('');
      }
  };

  if (!team || !currentUser) return null;

  if (!team || !currentUser) return null;

  const isLeader = ['Руководитель', 'Заместитель', 'TeamLead'].includes(currentUser.role);
  const isOwner = currentUser.role === 'Руководитель';
  
  // Available Tech Roles for Mission
  const TECH_ROLES = ['HTML', 'CSS', 'JS', 'SQL'];

  const currentBanner = team.banner || BANNERS[0];
  const currentAvatar = team.avatar || AVATARS[0];

  return (
    <div className="flex flex-col min-h-screen bg-background p-6 pb-0">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto w-full flex-1 flex flex-col"
      >
        {/* Header Section */}
        <div className="relative mb-8 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
           {/* Background */}
           {currentBanner.startsWith('data:image') || currentBanner.startsWith('http') ? (
               <img src={currentBanner} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
           ) : (
               <div className={`absolute inset-0 ${currentBanner}`} />
           )}
           <div className="absolute inset-0 bg-black/20" />
           
           {/* Top Actions */}
           <div className="relative z-10 p-6 flex justify-between items-start">
              <button 
                 onClick={() => setView('menu')}
                 className="p-3 rounded-full bg-black/30 hover:bg-black/50 transition-colors text-white backdrop-blur-md border border-white/10"
              >
                <ArrowLeft size={20} />
              </button>
              
              {isLeader && (
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={`p-3 rounded-full transition-colors backdrop-blur-md border border-white/10 ${isEditing ? 'bg-primary text-black' : 'bg-black/30 text-white hover:bg-black/50'}`}
                >
                  <Edit size={20} />
                </button>
              )}
           </div>

           {/* Studio Info */}
           <div className="relative z-10 px-8 pb-8 flex flex-col md:flex-row items-end md:items-center gap-6">
              {currentAvatar.startsWith('data:image') || currentAvatar.startsWith('http') ? (
                  <img src={currentAvatar} alt={team.name} className="w-24 h-24 rounded-2xl object-cover shadow-xl border-2 border-white/20" />
              ) : (
                  <div className={`w-24 h-24 rounded-2xl ${currentAvatar} flex items-center justify-center text-3xl font-bold text-white shadow-xl border-2 border-white/20`}>
                    {team.name[0]}
                  </div>
              )}
              
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2">{team.name}</h1>
                <div className="flex flex-wrap items-center gap-4">
                   <div className="flex gap-2">
                     {team.specializations?.map(spec => (
                       <div key={spec} className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/10 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                         {spec}
                       </div>
                     ))}
                   </div>
                   <div 
                     className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-lg border border-white/10 backdrop-blur-md cursor-pointer hover:bg-black/60 transition-colors group active:scale-95" 
                     title="Копировать код"
                     onClick={() => {
                        navigator.clipboard.writeText(team.code);
                        // Optional: show a small toast or visual feedback?
                        // For now reliance on user seeing the interaction is usually enough or we can add a quick state
                     }}
                   >
                     <span className="text-white/40 text-xs uppercase">Код:</span>
                     <span className="font-mono text-white font-bold tracking-widest">{team.code}</span>
                     <Copy size={14} className="text-white/40 group-hover:text-white transition-colors" />
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-white/10 backdrop-blur-md bg-black/40">
                      {(team.privacyType === 'closed' || (!team.privacyType && team.isPrivate)) && (
                        <>
                          <Lock size={14} className="text-red-400" />
                          <span className="text-xs text-white/80 uppercase font-bold">Закрытая</span>
                        </>
                      )}
                      {team.privacyType === 'invite_only' && (
                        <>
                          <Mail size={14} className="text-yellow-400" />
                          <span className="text-xs text-white/80 uppercase font-bold">По приглашению</span>
                        </>
                      )}
                      {(team.privacyType === 'open' || (!team.privacyType && !team.isPrivate)) && (
                        <>
                          <Globe size={14} className="text-green-400" />
                          <span className="text-xs text-white/80 uppercase font-bold">Открытая</span>
                        </>
                      )}
                   </div>
                </div>
              </div>

              <div className="flex gap-6 text-right">
                <div>
                  <div className="text-white/60 text-xs uppercase mb-1">Баланс</div>
                  <div className="text-3xl font-bold text-green-400 font-mono">${team.money.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-white/60 text-xs uppercase mb-1">Рейтинг</div>
                  <div className="text-3xl font-bold text-primary font-mono">{team.rating}</div>
                </div>
                <div>
                  <div className="text-white/60 text-xs uppercase mb-1">Очки Науки</div>
                  <div className="text-3xl font-bold text-purple-400 font-mono">{team.researchPoints || 0}</div>
                </div>
              </div>
           </div>

           {/* Editing Panel */}
           <AnimatePresence>
             {isEditing && (
               <motion.div 
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="bg-black/80 backdrop-blur-xl border-t border-white/10 overflow-hidden"
               >
                 <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div>
                     <label className="text-xs text-white/40 uppercase mb-3 block">Сменить Аватар</label>
                     <div className="flex gap-3 overflow-x-auto pb-2 items-center">
                       <div 
                           className="w-12 h-12 rounded-xl flex-shrink-0 border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-white transition-colors"
                           onClick={() => avatarInputRef.current?.click()}
                           title="Загрузить фото"
                       >
                           <Plus size={20} className="text-white/50" />
                       </div>
                       <input 
                          type="file" 
                          ref={avatarInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'avatar')}
                       />
                       {AVATARS.map(avatar => (
                         <button
                           key={avatar}
                           onClick={() => updateTeamProfile({ avatar })}
                           className={`w-12 h-12 rounded-xl flex-shrink-0 ${avatar} ${team.avatar === avatar ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-100'}`}
                         />
                       ))}
                     </div>
                   </div>
                   <div>
                     <label className="text-xs text-white/40 uppercase mb-3 block">Сменить Баннер</label>
                     <div className="flex gap-3 overflow-x-auto pb-2 items-center">
                       <div 
                           className="w-20 h-12 rounded-xl flex-shrink-0 border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-white transition-colors"
                           onClick={() => bannerInputRef.current?.click()}
                           title="Загрузить баннер"
                       >
                           <Plus size={20} className="text-white/50" />
                       </div>
                       <input 
                          type="file" 
                          ref={bannerInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'banner')}
                       />
                       {BANNERS.map(banner => (
                         <button
                           key={banner}
                           onClick={() => updateTeamProfile({ banner })}
                           className={`w-20 h-12 rounded-xl flex-shrink-0 ${banner} ${team.banner === banner ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-100'}`}
                         />
                       ))}
                     </div>
                   </div>
                   {isOwner && (
                     <div className="col-span-1 md:col-span-2 flex items-center gap-4 pt-4 border-t border-white/10">
                        <button 
                          onClick={toggleTeamPrivacy}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                        >
                          {(team.privacyType === 'closed' || (!team.privacyType && team.isPrivate)) && <Lock size={16} className="text-red-400" />}
                          {team.privacyType === 'invite_only' && <Mail size={16} className="text-yellow-400" />}
                          {(team.privacyType === 'open' || (!team.privacyType && !team.isPrivate)) && <Globe size={16} className="text-green-400" />}
                          
                          <span className="text-sm font-bold text-white">
                            {(team.privacyType === 'closed' || (!team.privacyType && team.isPrivate)) && 'Сделать по приглашению'}
                            {team.privacyType === 'invite_only' && 'Сделать Открытой'}
                            {(team.privacyType === 'open' || (!team.privacyType && !team.isPrivate)) && 'Сделать Закрытой'}
                          </span>
                        </button>
                     </div>
                   )}
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Обзор' },
            { id: 'chat', icon: MessageSquare, label: 'Чат' },
            { id: 'research', icon: Beaker, label: 'Технологии' },
            { id: 'shop', icon: ShoppingBag, label: 'Магазин' },
            { id: 'management', icon: Building2, label: 'Управление' },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Active Mission Card */}
            {team.missionStatus === 'preparing' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-6 rounded-2xl border border-primary/30 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Clock size={100} className="text-primary" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Подготовка к Проекту</h2>
                <p className="text-white/60 mb-6 relative z-10">Выберите свою роль в проекте и подтвердите готовность.</p>

                <div className="flex flex-wrap gap-4 mb-8 relative z-10">
                   {team.members.map(member => (
                     <div key={member.id} className={`flex flex-col gap-2 p-3 rounded-xl border transition-colors ${team.missionReadyMembers.includes(member.id) ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center gap-2">
                          {team.missionReadyMembers.includes(member.id) ? <CheckCircle size={16} className="text-green-400" /> : <Clock size={16} className="text-white/40" />}
                          <span className={`font-bold text-sm ${team.missionReadyMembers.includes(member.id) ? 'text-green-400' : 'text-white'}`}>{member.name}</span>
                          {team.missionReadyMembers.includes(member.id) && !member.missionRole && (
                              <span className="text-[10px] text-red-400 animate-pulse font-bold ml-2">Выберите роль!</span>
                          )}
                        </div>
                        
                        {/* Role Selector */}
                        {member.id === currentUser.id ? (
                           <div className="flex gap-1">
                             {TECH_ROLES.map(role => (
                               <button
                                 key={role}
                                 onClick={() => setMissionRole(member.id, role)}
                                 className={`px-2 py-1 text-xs font-mono font-bold rounded border transition-colors ${
                                   member.missionRole === role 
                                     ? 'bg-primary text-black border-primary' 
                                     : 'bg-black/40 text-white/40 border-white/10 hover:border-white/30'
                                 }`}
                               >
                                 {role}
                               </button>
                             ))}
                           </div>
                        ) : (
                           <div className="px-2 py-1 bg-black/40 rounded text-xs font-mono text-white/60 border border-white/5 text-center">
                             {member.missionRole || 'Не выбран'}
                           </div>
                        )}
                     </div>
                   ))}
                </div>

                <div className="flex gap-4 relative z-10">
                   {!team.missionReadyMembers.includes(currentUser.id) && (
                     <button 
                       onClick={joinContract}
                       className="px-6 py-3 bg-green-500 hover:bg-green-600 text-black font-bold rounded-xl transition-colors flex items-center gap-2"
                     >
                       <CheckCircle size={20} /> {currentUser.missionRole ? 'Я Готов' : 'Присоединиться'}
                     </button>
                   )}
                   {isLeader && (
                     <button 
                       onClick={startMission}
                       disabled={team.members.some(m => team.missionReadyMembers.includes(m.id) && !m.missionRole)}
                       className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                     >
                       <Play size={20} /> Запустить Проект
                     </button>
                   )}
                </div>
              </motion.div>
            )}

            {/* In Progress Mission Card */}
            {team.missionStatus === 'in_progress' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-6 rounded-2xl border border-green-500/30 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-20 animate-pulse">
                  <Play size={100} className="text-green-500" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Проект в Работе</h2>
                <p className="text-white/60 mb-6 relative z-10">Команда работает над активным контрактом.</p>

                <button 
                  onClick={() => setView('workspace')}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-black font-bold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-green-500/20 relative z-10"
                >
                  <Play size={20} /> Продолжить Работу
                </button>
              </motion.div>
            )}

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 gap-6">
                 {/* Staff List */}
                 <div className="glass p-6 rounded-2xl border border-white/10">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users size={20} className="text-primary" /> Команда
                      </h2>
                      <span className="text-white/40 text-sm">{team.members.length} участников</span>
                    </div>
                    
                    <div className="space-y-3">
                      {team.members.map((member) => (
                        <div 
                          key={member.id} 
                          onClick={() => setSelectedMember(member)}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors group cursor-pointer hover:bg-white/10"
                        >
                          <div className="flex items-center gap-4">
                            {member.avatar?.startsWith('data:image') ? (
                                <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                            ) : (
                                <div className={`w-12 h-12 rounded-full ${member.avatar || 'bg-gradient-to-br from-gray-700 to-gray-900'} flex items-center justify-center border border-white/10 text-white font-bold text-lg`}>
                                  {member.name[0]}
                                </div>
                            )}
                            <div>
                              <div className="text-white font-bold flex items-center gap-2">
                                {member.name}
                                {member.isLeader && <Crown size={14} className="text-yellow-500" />}
                              </div>
                              <div className="text-xs text-white/40 font-mono flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded ${
                                  member.role === 'Руководитель' ? 'bg-red-500/20 text-red-400' :
                                  member.role === 'TeamLead' ? 'bg-purple-500/20 text-purple-400' :
                                  member.role === 'Заместитель' ? 'bg-orange-500/20 text-orange-400' :
                                  'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {member.role}
                                </span>
                                <span>Lvl {member.stats?.level || 1}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          {isLeader && currentUser.id !== member.id && (
                             <div 
                                className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()} 
                             >
                               {isOwner && (
                                 <div className="relative group/promote">
                                   <select 
                                     onChange={(e) => promoteMember(member.id, e.target.value as Role)}
                                     className="appearance-none bg-black/50 text-white text-xs border border-white/20 rounded px-2 py-1 cursor-pointer hover:border-white/40"
                                     value={member.role}
                                   >
                                     {ROLES.map(role => (
                                       <option key={role} value={role}>{role}</option>
                                     ))}
                                   </select>
                                 </div>
                               )}
                               <button 
                                 onClick={() => kickMember(member.id)}
                                 className="p-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors"
                                 title="Исключить"
                               >
                                 <UserX size={16} />
                               </button>
                             </div>
                          )}
                        </div>
                      ))}
                    </div>
                 </div>

                 {/* Pending Requests */}
                 {isLeader && team.pendingMembers.length > 0 && (
                   <div className="glass p-6 rounded-2xl border border-yellow-500/30">
                      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <UserCheck size={20} className="text-yellow-500" /> Заявки на вступление
                      </h2>
                      <div className="space-y-3">
                         {team.pendingMembers.map(pending => (
                           <div key={pending.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white">
                                  {pending.name[0]}
                                </div>
                                <div className="font-bold text-white">{pending.name}</div>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => acceptMember(pending.id)}
                                  className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-black rounded-lg font-bold transition-colors text-sm"
                                >
                                  Принять
                                </button>
                                <button 
                                  onClick={() => rejectMember(pending.id)}
                                  className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg font-bold transition-colors text-sm"
                                >
                                  Отклонить
                                </button>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                 )}
              </div>
            )}

            {/* Research & Shop Tabs (Similar to previous, simplified for brevity but fully functional) */}
            {activeTab === 'research' && (
               <div className="glass p-8 rounded-2xl border border-white/10">
                 <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Beaker size={20} className="text-purple-500" /> Древо Технологий
                 </h2>
                 <div className="grid grid-cols-1 gap-4">
                    {researchTree.map(node => (
                       <div key={node.id} className={`p-4 rounded-xl border flex justify-between items-center ${node.unlocked ? 'bg-purple-500/10 border-purple-500/30' : 'bg-black/20 border-white/5'}`}>
                          <div>
                             <h3 className={`font-bold ${node.unlocked ? 'text-white' : 'text-white/50'}`}>{node.title}</h3>
                             <p className="text-xs text-white/40">{node.description}</p>
                             {!node.unlocked && node.cost > 0 && (
                               <div className="text-xs text-purple-400 mt-1 font-mono">Требует: {node.cost} ОН</div>
                             )}
                          </div>
                          <button 
                            disabled={node.unlocked || team.researchPoints < node.cost}
                            onClick={() => unlockResearch(node.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${
                               node.unlocked 
                                 ? 'bg-green-500/20 text-green-400 cursor-default' 
                                 : 'bg-white/5 text-white hover:bg-purple-500 hover:text-white disabled:opacity-50'
                            }`}
                          >
                            {node.unlocked ? <Check size={16} /> : <Lock size={16} />}
                            {node.unlocked ? 'Изучено' : 'Изучить'}
                          </button>
                       </div>
                    ))}
                 </div>
               </div>
            )}

            {activeTab === 'chat' && (
                <div className="glass flex flex-col h-[75vh] rounded-2xl border border-white/10 overflow-hidden">
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {(!team.chatMessages || team.chatMessages.length === 0) ? (
                            <div className="flex flex-col items-center justify-center h-full text-white/30">
                                <MessageSquare size={48} className="mb-4 opacity-50" />
                                <p>Чат пуст. Начните общение!</p>
                            </div>
                        ) : (
                            team.chatMessages.map((msg) => {
                                // System Message Handling
                                if (msg.system) {
                                    return (
                                        <div key={msg.id} className="flex justify-center my-4">
                                            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white/60 flex flex-col items-center gap-2 max-w-[80%] text-center">
                                                <span className="font-bold text-primary">{msg.senderName}</span>
                                                <span>{msg.text}</span>
                                                
                                                {/* Contract Start Action */}
                                                {(msg as any).type === 'contract_start' && !team.missionReadyMembers.includes(currentUser.id) && (
                                                    <button 
                                                        onClick={() => joinContract()}
                                                        className="mt-2 px-4 py-2 bg-green-500 text-black text-xs font-bold rounded-lg hover:bg-green-400 transition-colors flex items-center gap-2"
                                                    >
                                                        <CheckCircle size={14} /> Присоединиться
                                                    </button>
                                                )}
                                                
                                                <span className="text-[10px] opacity-50 mt-1">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }

                                const isMe = msg.senderId === currentUser.id;
                                const senderMember = team.members.find(m => m.id === msg.senderId);
                                const senderRole = senderMember ? senderMember.role : '';

                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group mb-4`}>
                                        <div className={`flex items-end gap-3 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className="flex-shrink-0">
                                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white overflow-hidden border border-white/10 shadow-lg">
                                                    {senderMember?.avatar ? (
                                                        <img src={senderMember.avatar} alt={msg.senderName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        msg.senderName[0]
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                {!isMe && (
                                                    <div className="flex items-center gap-2 mb-1 ml-1">
                                                        <span className="text-xs font-bold text-white">{msg.senderName}</span>
                                                        {senderRole && (
                                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                                                senderRole === 'Руководитель' ? 'bg-red-500/20 text-red-400' :
                                                                senderRole === 'TeamLead' ? 'bg-purple-500/20 text-purple-400' :
                                                                'bg-blue-500/20 text-blue-400'
                                                            }`}>
                                                                {senderRole}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                <div className={`px-4 py-3 rounded-2xl shadow-md text-sm leading-relaxed relative group/msg ${
                                                    isMe 
                                                        ? 'bg-primary text-black rounded-tr-none' 
                                                        : 'bg-[#2a2a3e] text-white rounded-tl-none border border-white/5'
                                                }`}>
                                                    {msg.text}
                                                    
                                                    {/* Delete Button for Leaders */}
                                                    {isLeader && !isMe && (
                                                        <button 
                                                            onClick={() => deleteChatMessage(msg.id)}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/msg:opacity-100 transition-opacity shadow-sm"
                                                            title="Удалить сообщение"
                                                        >
                                                            <Trash2 size={10} />
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                <span className="text-[10px] text-white/20 mt-1 px-1">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleSendChat} className="p-4 bg-black/20 border-t border-white/10 flex gap-2">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Написать сообщение..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={!chatInput.trim()}
                            className="p-3 bg-primary text-black rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'shop' && (
               <div className="glass p-8 rounded-2xl border border-white/10">
                 <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <ShoppingBag size={20} className="text-orange-500" /> Магазин Оборудования
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shopItems.map(item => (
                       <div key={item.id} className="p-4 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                             <div className="font-bold text-white">{item.name}</div>
                             <div className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/40 uppercase">{item.type}</div>
                          </div>
                          <p className="text-xs text-white/50 mb-4 h-10">{item.description}</p>
                          <div className="flex justify-between items-center">
                             <div className="font-mono text-success font-bold">${item.cost}</div>
                             <button 
                               onClick={() => buyItem(item.id)}
                               disabled={team.money < item.cost}
                               className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded hover:bg-orange-500 hover:text-white transition-colors disabled:opacity-50"
                             >
                               Купить
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
               </div>
            )}

            {activeTab === 'management' && (
               <div className="space-y-6">
                 {/* 
                 <div className="glass p-8 rounded-2xl border border-white/10">
                   <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Plus size={20} className="text-blue-500" /> Расширение Студии
                   </h2>
                   ... Specialization expansion logic (hidden for now as requested to stick to Frontend)
                 </div>
                 */}
                 
                 <div className="glass p-8 rounded-2xl border border-white/10">
                     <h2 className="text-xl font-bold text-white mb-4">Настройки Студии</h2>
                     <p className="text-white/50 text-sm mb-4">Управление доступом и параметрами.</p>
                     
                     {isOwner ? (
                        <button 
                          onClick={toggleTeamPrivacy}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors w-full md:w-auto justify-center"
                        >
                          {(team.privacyType === 'closed' || (!team.privacyType && team.isPrivate)) && <Lock size={16} className="text-red-400" />}
                          {team.privacyType === 'invite_only' && <Mail size={16} className="text-yellow-400" />}
                          {(team.privacyType === 'open' || (!team.privacyType && !team.isPrivate)) && <Globe size={16} className="text-green-400" />}
                          <span className="text-sm font-bold text-white">
                            {(team.privacyType === 'closed' || (!team.privacyType && team.isPrivate)) && 'Сделать по приглашению'}
                            {team.privacyType === 'invite_only' && 'Сделать Открытой'}
                            {(team.privacyType === 'open' || (!team.privacyType && !team.isPrivate)) && 'Сделать Закрытой'}
                          </span>
                        </button>
                     ) : (
                         <div className="text-white/40 italic">Только руководитель может менять настройки.</div>
                     )}
                 </div>

                 {isOwner ? (
                   <div className="glass p-8 rounded-2xl border border-red-500/20">
                     <h2 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-2">
                        <AlertTriangle size={20} /> Опасная Зона
                     </h2>
                     <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                        <div>
                           <div className="font-bold text-white">Расформировать Студию</div>
                           <div className="text-sm text-white/50">Это действие нельзя отменить.</div>
                        </div>
                        <button 
                          onClick={() => {
                              if (confirm('Вы уверены, что хотите расформировать студию?')) {
                                  deleteStudio();
                              }
                          }}
                          className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/50 rounded-xl hover:bg-red-500 hover:text-white transition-all font-bold flex items-center gap-2"
                        >
                          <LogOut size={16} /> Расформировать
                        </button>
                     </div>
                   </div>
                 ) : (
                    <div className="glass p-8 rounded-2xl border border-red-500/20">
                     <h2 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-2">
                        <AlertTriangle size={20} /> Опасная Зона
                     </h2>
                     <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                        <div>
                           <div className="font-bold text-white">Покинуть Студию</div>
                           <div className="text-sm text-white/50">Вы выйдете из состава участников.</div>
                        </div>
                        <button 
                          onClick={() => {
                              if (confirm('Вы уверены, что хотите покинуть студию?')) {
                                  leaveTeam();
                              }
                          }}
                          className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/50 rounded-xl hover:bg-red-500 hover:text-white transition-all font-bold flex items-center gap-2"
                        >
                          <LogOut size={16} /> Выйти из студии
                        </button>
                     </div>
                   </div>
                 )}
               </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
             <div className="glass p-6 rounded-2xl border border-white/10">
               <h3 className="text-sm font-bold text-white/40 uppercase mb-4">Статистика Студии</h3>
               <div className="space-y-4">
                 <div className="flex justify-between items-center">
                   <span className="text-white/60 text-sm">Участников</span>
                   <span className="text-white font-mono">{team.members.length}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-white/60 text-sm">Проектов Завершено</span>
                   <span className="text-white font-mono">{team.completedMissions || 0}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-white/60 text-sm">Общая Выручка</span>
                   <span className="text-white font-mono">$0</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-white/60 text-sm">Эффективность</span>
                   <span className="text-green-400 font-mono">100%</span>
                 </div>
               </div>
             </div>
             
             {/* Quick Dashboard Link */}
             <button 
               onClick={() => setView('dashboard')}
               className="w-full p-4 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 hover:border-primary/50 transition-all flex items-center justify-center gap-2 group"
             >
               <LayoutDashboard size={20} className="text-primary group-hover:scale-110 transition-transform" />
               <span className="font-bold text-white">Доска Задач</span>
             </button>
          </div>
        </div>
        {/* Modal for Member Profile */}
        <AnimatePresence>
          {selectedMember && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={() => setSelectedMember(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#1a1a2e] w-full max-w-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative"
              >
                  {/* Banner */}
                  <div className="h-32 w-full overflow-hidden relative">
                     {selectedMember.banner?.startsWith('data:image') ? (
                         <img src={selectedMember.banner} alt="Banner" className="w-full h-full object-cover" />
                     ) : (
                         <div className={`w-full h-full ${selectedMember.banner || BANNERS[0]}`} />
                     )}
                     <button 
                       onClick={() => setSelectedMember(null)}
                       className="absolute top-4 right-4 p-2 rounded-full bg-black/30 text-white hover:bg-white/20 backdrop-blur-md transition-colors"
                     >
                       <X size={16} />
                     </button>
                  </div>

                  <div className="px-8 pb-8">
                     <div className="relative -mt-12 mb-6 flex justify-between items-end">
                       {selectedMember.avatar?.startsWith('data:image') ? (
                          <img src={selectedMember.avatar} alt={selectedMember.name} className="w-24 h-24 rounded-full object-cover border-4 border-[#1a1a2e] shadow-lg" />
                       ) : (
                          <div className={`w-24 h-24 rounded-full ${selectedMember.avatar || AVATARS[0]} flex items-center justify-center text-white font-bold text-3xl border-4 border-[#1a1a2e] shadow-lg`}>
                             {selectedMember.name[0]}
                          </div>
                       )}
                       {/* Add Friend Button */}
                       {selectedMember.id !== currentUser.id && (
                           <button
                               onClick={() => {
                                   const isFriend = friends.some(f => f.id === selectedMember.id);
                                   if (!isFriend) {
                                       addFriendByCode(selectedMember.friendCode);
                                   }
                               }}
                               disabled={friends.some(f => f.id === selectedMember.id)}
                               className="mb-2 px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:bg-white/10 disabled:text-white/50 flex items-center gap-2"
                           >
                               {friends.some(f => f.id === selectedMember.id) ? (
                                   <>
                                     <CheckCircle size={16} /> Друзья
                                   </>
                               ) : (
                                   <>
                                     <UserPlus size={16} /> Добавить
                                   </>
                               )}
                           </button>
                       )}
                     </div>

                     <div className="mb-6">
                       <h3 className="text-2xl font-bold text-white mb-1">{selectedMember.name}</h3>
                       <div className="flex items-center gap-2 text-white/50 text-sm">
                         <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase">
                           {selectedMember.role}
                         </span>
                         <span>•</span>
                         <span className="font-mono">ID: {selectedMember.id}</span>
                       </div>
                     </div>

                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-3 rounded-xl bg-white/5 text-center">
                             <div className="text-white/40 text-xs uppercase mb-1">Уровень</div>
                             <div className="font-mono font-bold text-white text-xl">{selectedMember.stats?.level || 1}</div>
                           </div>
                           <div className="p-3 rounded-xl bg-white/5 text-center">
                             <div className="text-white/40 text-xs uppercase mb-1">Миссии</div>
                             <div className="font-mono font-bold text-green-400 text-xl">{selectedMember.stats?.completedMissions || 0}</div>
                           </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="text-white/40 text-xs uppercase mb-2">О себе</div>
                            <p className="text-white/80 text-sm leading-relaxed italic">
                                {selectedMember.bio || "Информация отсутствует..."}
                            </p>
                        </div>
                        
                        {selectedMember.tags && selectedMember.tags.length > 0 && (
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="text-white/40 text-xs uppercase mb-2">Навыки</div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedMember.tags.map((tag, idx) => (
                                        <div key={idx} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
                                            {tag}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                     </div>
                  </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

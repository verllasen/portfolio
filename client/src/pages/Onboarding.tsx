import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { ArrowRight, Globe, Image as ImageIcon } from 'lucide-react';
import type { Specialization } from '../types';
import { SPECIALIZATION_ROLES } from '../data/roles';

const SPECS: { id: Specialization; label: string; icon: any; desc: string }[] = [
  { id: 'Frontend', label: 'Frontend Студия', icon: Globe, desc: 'Веб-сайты и интерфейсы (Создание сайтов)' },
  // Other specializations disabled for now as per user request
  // { id: 'Backend', label: 'Backend Решения', icon: Server, desc: 'Серверы и базы данных' },
  // { id: 'Fullstack', label: 'Fullstack Агентство', icon: Code, desc: 'Комплексная разработка' },
  // { id: 'Mobile', label: 'Mobile Apps', icon: Smartphone, desc: 'Приложения для iOS и Android' },
  // { id: 'GameDev', label: 'Game Studio', icon: Gamepad, desc: 'Инди-игры и интерактив' },
];

export const Onboarding: React.FC = () => {
  const { createTeam } = useGameStore();
  const [step, setStep] = useState(1);
  const [studioName, setStudioName] = useState('');
  const [specialization, setSpecialization] = useState<Specialization | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string>('');
  const [banner, setBanner] = useState<string>('');

  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 1024 * 1024) { 
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

  const handleFinish = () => {
    if (studioName && specialization && role) {
      createTeam(studioName, specialization);
      // We need to update the team with avatar/banner immediately after creation
      // Since createTeam is synchronous in store (mostly), we can try to update immediately
      // But createTeam sets the team in state.
      // A small timeout to ensure state is settled or just call updateTeamProfile if we have access to the created team code?
      // Actually createTeam updates the store 'team' object. 
      // We can pass avatar/banner to createTeam if we modify it, or just use updateTeamProfile.
      // But updateTeamProfile works on 'team' in store.
      // Let's modify createTeam signature or just call updateTeamProfile after a short delay or rely on store update.
      setTimeout(() => {
          useGameStore.getState().updateTeamProfile({ avatar, banner });
      }, 100);
    }
  };

  const currentRoles = specialization ? SPECIALIZATION_ROLES[specialization] : [];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-[0.03]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl z-10"
      >
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold font-mono text-white mb-2">Создание Студии</h1>
          <div className="flex items-center justify-center gap-2">
             {[1, 2, 3].map(i => (
               <div key={i} className={`h-1 w-12 rounded-full transition-colors ${step >= i ? 'bg-primary' : 'bg-white/10'}`} />
             ))}
          </div>
        </div>

        <div className="glass p-8 rounded-2xl border border-white/10">
          {step === 1 && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h2 className="text-2xl font-bold text-white mb-6">Название и Бренд</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Название Студии</label>
                  <input 
                    type="text" 
                    value={studioName}
                    onChange={(e) => setStudioName(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none transition-colors font-mono text-lg"
                    placeholder="Matrix Software"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-white/60 mb-2 block">Логотип</label>
                        <div 
                            onClick={() => avatarInputRef.current?.click()}
                            className="h-32 rounded-xl bg-black/20 border-2 border-dashed border-white/10 hover:border-white/30 cursor-pointer flex flex-col items-center justify-center transition-colors overflow-hidden"
                        >
                            {avatar ? (
                                <img src={avatar} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <ImageIcon className="text-white/20 mb-2" />
                                    <span className="text-xs text-white/40">Загрузить</span>
                                </>
                            )}
                        </div>
                        <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                    </div>
                    <div>
                        <label className="text-sm text-white/60 mb-2 block">Баннер</label>
                        <div 
                            onClick={() => bannerInputRef.current?.click()}
                            className="h-32 rounded-xl bg-black/20 border-2 border-dashed border-white/10 hover:border-white/30 cursor-pointer flex flex-col items-center justify-center transition-colors overflow-hidden"
                        >
                             {banner ? (
                                <img src={banner} alt="Banner" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <ImageIcon className="text-white/20 mb-2" />
                                    <span className="text-xs text-white/40">Загрузить</span>
                                </>
                            )}
                        </div>
                        <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
                    </div>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => useGameStore.getState().setView('menu')}
                  className="px-6 py-4 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
                >
                  Назад
                </button>
                <button 
                  onClick={() => setStep(2)}
                  disabled={!studioName.trim()}
                  className="flex-1 bg-primary text-black font-bold py-4 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Далее <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h2 className="text-2xl font-bold text-white mb-6">Специализация Студии</h2>
              <div className="grid grid-cols-1 gap-3">
                {SPECS.map((spec) => (
                  <button
                    key={spec.id}
                    onClick={() => setSpecialization(spec.id)}
                    className={`p-4 rounded-xl border text-left flex items-center gap-4 transition-all
                      ${specialization === spec.id 
                        ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(0,229,255,0.2)]' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                      }
                    `}
                  >
                    <div className={`p-3 rounded-lg ${specialization === spec.id ? 'bg-primary text-black' : 'bg-white/10 text-white'}`}>
                      <spec.icon size={24} />
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg">{spec.label}</div>
                      <div className="text-sm text-white/50">{spec.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setStep(1)}
                  className="px-6 py-4 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                >
                  Назад
                </button>
                <button 
                  onClick={() => setStep(3)}
                  disabled={!specialization}
                  className="flex-1 bg-primary text-black font-bold py-4 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Далее <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h2 className="text-2xl font-bold text-white mb-6">Выберите Вашу Роль</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentRoles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group
                      ${role === r.id 
                        ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(0,229,255,0.2)]' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={`p-2 rounded-lg ${role === r.id ? 'bg-primary text-black' : 'bg-white/10 text-white'}`}>
                        <r.icon size={20} />
                      </div>
                      <div className={`text-xs font-mono px-2 py-1 rounded border ${role === r.id ? 'border-primary/50 text-primary' : 'border-white/10 text-white/40'}`}>
                        {r.id}
                      </div>
                    </div>
                    <div className={`font-bold text-lg mb-1 ${r.color}`}>{r.label}</div>
                    <div className="text-xs text-white/50">{r.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setStep(2)}
                  className="px-6 py-4 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                >
                  Назад
                </button>
                <button 
                  onClick={handleFinish}
                  disabled={!role}
                  className="flex-1 bg-success text-black font-bold py-4 rounded-xl hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Создать Студию <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

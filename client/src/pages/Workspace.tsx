import React, { useState, useEffect } from 'react';
import { Book, CheckCircle, Play, AlertCircle, ChevronRight, Clock, Eye, User, ArrowLeft, XCircle, Code, Monitor } from 'lucide-react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useGameStore } from '../store/useGameStore';

import { validateCode } from '../utils/validator';

// Configure Monaco loader to use the bundled monaco-editor
loader.config({ monaco });

export const Workspace: React.FC = () => {
  const { team, currentUser, availableMissions, completeStage, leaveMission, cancelMission, setMissionRole, updateMissionCode } = useGameStore();
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState('00:00:00');
  const [spectatingUser, setSpectatingUser] = useState<string | null>(null);

  if (!team || !currentUser || !team.activeMissionId) return null;

  const mission = availableMissions.find(m => m.id === team.activeMissionId);
  if (!mission) return null;

  const myTask = mission.tasks.find(t => t.role === currentUser.missionRole);
  const currentStage = myTask ? myTask.stages[myTask.currentStageIndex] : null;
  
  const TECH_ROLES = ['HTML', 'CSS', 'JS', 'SQL'];
  const isLeader = ['Руководитель', 'Заместитель', 'TeamLead'].includes(currentUser.role);

  // Timer Logic
  useEffect(() => {
    if (team.missionStartTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        const diff = now - (team.missionStartTime || now);
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeElapsed(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [team.missionStartTime]);

  // Initialize code
  useEffect(() => {
    const roleKey = currentUser.missionRole?.toLowerCase();
    // Prioritize shared state if it exists
    if (roleKey && team.missionState && (team.missionState as any)[roleKey]) {
        setCode((team.missionState as any)[roleKey]);
    } else if (currentStage?.codeSnippet && !code) {
      setCode(currentStage.codeSnippet);
    }
  }, [currentStage, currentUser.missionRole]);

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    if (currentUser.missionRole) {
        updateMissionCode(currentUser.missionRole, newCode);
    }
  };

  const getPreviewContent = () => {
    if (!team.missionState) return '';
    const { html, css, js } = team.missionState;
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: sans-serif; }
            ${css}
          </style>
        </head>
        <body>
          ${html}
          <script>
            try {
                ${js}
            } catch(e) {
                console.error(e);
            }
          </script>
        </body>
      </html>
    `;
  };
  const runValidation = (inputCode: string) => {
    if (!currentStage) return { valid: false, errors: ['Нет активной задачи'] };
    
    // New Validator Engine
    if (currentStage.validationRules) {
      return validateCode(inputCode, currentStage.validationRules);
    }

    // Fallback to legacy check
    if (currentStage.validationCriteria) {
       return { 
         valid: inputCode.length > 50, 
         errors: inputCode.length > 50 ? [] : ['Код слишком короткий'] 
       };
    }
    
    return { valid: inputCode.length > 20, errors: [] };
  };

  const handleRun = () => {
    setIsRunning(true);
    setOutput(null);
    
    setTimeout(() => {
      setIsRunning(false);
      const result = runValidation(code);
      
      if (result.valid) {
         setOutput("✅ Сборка Успешна!\n\n> Запуск тестов...\n> Тест 1: OK\n> Тест 2: OK\n> Тест 3: OK\n\nРезультат: Выполнено корректно.");
      } else {
         const errorList = result.errors.map(e => `> ${e}`).join('\n');
         setOutput(`❌ Ошибка Валидации\n\n${errorList}\n\nПодсказка: Проверьте код на соответствие требованиям.`);
      }
    }, 1500);
  };

  const handleSubmit = () => {
    if (myTask && output?.includes("Успешна")) {
      completeStage(myTask.id, currentUser.id);
      setOutput(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#050505] overflow-hidden text-white font-sans">
      {/* Top Bar */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a] shadow-md z-20">
        <div className="flex items-center gap-4">
          <div className="font-bold text-xl tracking-tight text-white">{mission.title}</div>
          <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold border border-primary/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            В ПРОЦЕССЕ
          </div>
          
          {/* Debug/Single Player Role Switcher */}
          {isLeader && (
            <div className="ml-4 flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
               <span className="text-xs text-white/40 font-mono uppercase">Role:</span>
               <select 
                 value={currentUser.missionRole} 
                 onChange={(e) => setMissionRole(currentUser.id, e.target.value)}
                 className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
               >
                 {TECH_ROLES.map(role => (
                   <option key={role} value={role} className="bg-[#0a0a0a] text-white">{role}</option>
                 ))}
               </select>
            </div>
          )}
        </div>
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2 text-white/60 text-sm font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
             <Clock size={14} />
             {timeElapsed}
           </div>
           <button 
             onClick={leaveMission}
             className="flex items-center gap-2 bg-white/10 text-white/60 hover:text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/20 transition-colors border border-white/10"
           >
             <ArrowLeft size={16} /> Меню
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Team & Global Docs */}
        <aside className="w-64 border-r border-white/10 flex flex-col bg-[#0a0a0a]">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-xs font-bold text-white/40 uppercase mb-4 tracking-wider flex items-center gap-2">
              <User size={14} /> Активность Команды
            </h3>
            <div className="space-y-3">
              {team.members.map(member => (
                <button 
                  key={member.id} 
                  onClick={() => setSpectatingUser(member.id === currentUser.id ? null : member.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    spectatingUser === member.id ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5'
                  } ${member.id === currentUser.id ? 'opacity-100' : 'opacity-80'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    member.id === currentUser.id ? 'bg-primary text-black' : 'bg-white/10 text-white'
                  }`}>
                    {member.name[0]}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-sm text-white font-bold truncate flex items-center gap-2">
                      {member.name}
                      {member.id !== currentUser.id && spectatingUser !== member.id && (
                        <Eye size={12} className="text-white/20 group-hover:text-white/60" />
                      )}
                    </div>
                    <div className="text-[10px] text-white/40 font-mono truncate">{member.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-bold text-white/40 uppercase mb-4 tracking-wider flex items-center gap-2">
              <Book size={14} /> Бриф Проекта
            </h3>
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="text-white/70 text-xs whitespace-pre-wrap font-sans leading-relaxed">
                {mission.globalDocs}
              </div>
            </div>
          </div>
          
          {isLeader && (
            <div className="p-4 border-t border-white/10">
               <button 
                 onClick={cancelMission}
                 className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 px-4 py-3 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors border border-red-500/20 uppercase tracking-wide"
               >
                 <XCircle size={14} /> Отменить Проект
               </button>
            </div>
          )}
        </aside>

        {/* Main Content: Editor */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#050505] relative border-r border-white/10">
          
          {spectatingUser ? (
            <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex items-center justify-center flex-col">
               <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-white/10 text-center max-w-md">
                 <Eye size={48} className="mx-auto text-primary mb-4" />
                 <h2 className="text-2xl font-bold text-white mb-2">Режим Наблюдения</h2>
                 <p className="text-white/50 mb-6">
                   Вы наблюдаете за работой коллеги. Вы не можете вмешиваться в его код, но можете анализировать процесс.
                 </p>
                 <div className="p-4 bg-black/50 rounded-xl border border-white/5 font-mono text-sm text-left text-green-400 mb-6">
                   &gt; Watching stream: {team.members.find(m => m.id === spectatingUser)?.name}...<br/>
                   &gt; Connection established.<br/>
                   &gt; Receiving data packets...
                 </div>
                 <button 
                   onClick={() => setSpectatingUser(null)}
                   className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
                 >
                   Вернуться к работе
                 </button>
               </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Tabs */}
              <div className="flex items-center border-b border-white/10 bg-[#0a0a0a]">
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-6 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'code' ? 'border-primary text-white' : 'border-transparent text-white/40 hover:text-white'
                  }`}
                >
                  <Code size={14} /> Редактор Кода
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-6 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'preview' ? 'border-primary text-white' : 'border-transparent text-white/40 hover:text-white'
                  }`}
                >
                  <Monitor size={14} /> Результат (Preview)
                </button>
              </div>

              <div className="flex-1 relative bg-[#1e1e1e] overflow-hidden">
                {activeTab === 'code' ? (
                    <Editor
                      height="100%"
                      defaultLanguage={currentUser.missionRole?.toLowerCase() === 'html' ? 'html' : currentUser.missionRole?.toLowerCase() === 'css' ? 'css' : currentUser.missionRole?.toLowerCase() === 'sql' ? 'sql' : 'javascript'}
                      language={currentUser.missionRole?.toLowerCase() === 'html' ? 'html' : currentUser.missionRole?.toLowerCase() === 'css' ? 'css' : currentUser.missionRole?.toLowerCase() === 'sql' ? 'sql' : 'javascript'}
                      theme="vs-dark"
                      value={code}
                      onChange={handleEditorChange}
                      options={{
                        minimap: { enabled: true },
                        fontSize: 14,
                        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 20, bottom: 20 },
                        lineNumbers: 'on',
                        renderWhitespace: 'selection',
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                        smoothScrolling: true,
                        contextmenu: true,
                      }}
                    />
                ) : (
                    <iframe 
                        srcDoc={getPreviewContent()} 
                        className="w-full h-full bg-white" 
                        title="Preview"
                        sandbox="allow-scripts"
                    />
                )}
              </div>
              
              {/* Output Console */}
              <div className="h-48 bg-[#080808] border-t border-white/10 flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#0a0a0a]">
                  <div className="text-white/40 text-xs font-bold uppercase tracking-wider">Терминал Вывода</div>
                  <div className="flex gap-2">
                     <div className="w-2 h-2 rounded-full bg-red-500/50" />
                     <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                     <div className="w-2 h-2 rounded-full bg-green-500/50" />
                  </div>
                </div>
                <div className="flex-1 p-4 font-mono text-sm overflow-y-auto custom-scrollbar">
                  {isRunning ? (
                    <div className="text-yellow-400 animate-pulse flex items-center gap-2">
                      <span className="animate-spin">⟳</span> Компиляция и запуск модулей...
                    </div>
                  ) : output ? (
                    <div className="whitespace-pre-wrap">
                      {output.split('\n').map((line, i) => (
                        <div key={i} className={
                          line.includes('Ошибка') || line.includes('❌') ? 'text-red-400' : 
                          line.includes('Успешна') || line.includes('✅') ? 'text-green-400' : 
                          line.startsWith('>') ? 'text-white/60' : 'text-white/80'
                        }>
                          {line}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/20 italic">
                      // Ожидание запуска кода...
                      <br/>
                      // Нажмите "Run" для проверки решения.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar: Tasks & Hints (Always Visible) */}
        <aside className="w-96 border-l border-white/10 flex flex-col bg-[#0a0a0a]">
           <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
             {myTask && currentStage ? (
               <div className="space-y-8 pb-20">
                 <div className="space-y-4">
                   <div className="flex items-center gap-3">
                     <div className="px-3 py-1 rounded bg-white/10 text-white/60 text-xs font-mono font-bold border border-white/10">
                       ЭТАП {myTask.currentStageIndex + 1} ИЗ {myTask.stages.length}
                     </div>
                     <div className="h-px flex-1 bg-white/10" />
                   </div>
                   <h2 className="text-2xl font-bold text-white leading-tight">{currentStage.title}</h2>
                   <div className="text-white/80 text-sm leading-relaxed space-y-4">
                     <p>{currentStage.description}</p>
                   </div>
                 </div>

                 <div className="p-4 bg-[#1a1a1a] border border-l-4 border-l-primary border-white/5 rounded-r-xl shadow-lg">
                   <h3 className="text-primary font-bold mb-3 flex items-center gap-2 uppercase tracking-wider text-xs">
                     <AlertCircle size={14} /> Подсказка
                   </h3>
                   <div className="text-white/70 whitespace-pre-wrap font-mono text-xs leading-relaxed bg-black/30 p-3 rounded-lg border border-white/5">
                     {currentStage.hint}
                   </div>
                 </div>

                 {myTask.completed && (
                   <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl flex flex-col items-center justify-center text-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                       <CheckCircle size={24} />
                     </div>
                     <div>
                       <h3 className="text-xl font-bold text-white">Все задачи выполнены!</h3>
                       <p className="text-green-400/80 text-sm">Ожидайте завершения работы остальной команды.</p>
                     </div>
                   </div>
                 )}
               </div>
             ) : (
               <div className="text-white/40 flex flex-col items-center justify-center h-full">
                 <CheckCircle size={48} className="mb-4 opacity-20" />
                 <p>Нет активных задач для вашей роли.</p>
               </div>
             )}
           </div>

           {/* Action Bar */}
           <div className="p-6 border-t border-white/10 bg-[#0a0a0a] flex items-center gap-4">
              <button 
                onClick={handleRun}
                disabled={isRunning || !myTask}
                className="flex-1 h-12 rounded-xl bg-white/5 text-white hover:bg-primary hover:text-black transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed gap-2 font-bold text-sm"
              >
                {isRunning ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Play size={18} />}
                Запустить
              </button>
              
              <button 
                onClick={handleSubmit}
                disabled={!output?.includes('Успешна') || myTask?.completed}
                className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
                  myTask?.completed 
                    ? 'bg-green-500 text-black' 
                    : output?.includes('Успешна') 
                      ? 'bg-white text-black animate-pulse' 
                      : 'bg-white/5 text-white/20'
                }`}
              >
                {myTask?.completed ? <CheckCircle size={20} /> : <ChevronRight size={20} />}
              </button>
           </div>
        </aside>
      </div>
    </div>
  );
};

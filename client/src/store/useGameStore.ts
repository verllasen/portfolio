import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { io } from 'socket.io-client';
import type { GameState, Role, Player, Team, LeaderboardEntry, Friend, MissionReward } from '../types';
import { missions as initialMissions } from '../data/missions';
import { researchTree } from '../data/research';
import { shopItems } from '../data/shop';
import menuTheme from '../assets/music/menu_theme.mp3';

// Connect to Socket.IO server
// Default to Render (Online) for production/deployment.
// Local development will override this via VITE_SERVER_URL env var.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://iteam-server.onrender.com';
const socket = io(SERVER_URL);

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial State
      view: 'menu',
      isLoading: false,
      currentUser: null,
      team: null,
      availableMissions: initialMissions,
      settings: {
        fullscreen: false,
        animations: true,
        soundVolume: 50,
        musicVolume: 50,
        isMusicPlaying: false
      },
      friends: [],
      friendRequests: [],
      notifications: [],
      leaderboard: [], // Clean slate, only real players/teams will be added
      socket: socket,
      isConnected: false,
      studioInvites: [],
      registrationError: null as string | null,

      // Music Player State
      playlist: [
        { id: 'theme', title: 'Menu Theme', src: menuTheme, artist: 'ITeam OST' }
      ],
      currentTrackIndex: 0,
      isPlayerOpen: false,

      togglePlayer: () => set((state) => ({ isPlayerOpen: !state.isPlayerOpen })),
      playTrack: (index) => set((state) => ({ 
          currentTrackIndex: index, 
          settings: { ...state.settings, isMusicPlaying: true } 
      })),
      nextTrack: () => {
          const { playlist, currentTrackIndex } = get();
          const nextIndex = (currentTrackIndex + 1) % playlist.length;
          set({ currentTrackIndex: nextIndex });
      },
      prevTrack: () => {
          const { playlist, currentTrackIndex } = get();
          const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
          set({ currentTrackIndex: prevIndex });
      },
      addToPlaylist: (track) => set((state) => ({ playlist: [...state.playlist, track] })),
      setPlaylist: (tracks) => set({ playlist: tracks, currentTrackIndex: 0 }),

      initSocket: () => {
        const { addNotification } = get();
        
        // Connection listeners
        socket.on('connect', () => {
            console.log('Connected to server');
            set({ isConnected: true });
            
            // Re-identify if we have a user
            const { currentUser } = get();
            if (currentUser) {
                // Send FULL profile on reconnect to ensure role/avatar persistence
                socket.emit('register_user', currentUser);
                socket.emit('update_status', { status: 'online' });
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from server');
            set({ isConnected: false });
        });
        
        // Remove existing listeners to avoid duplicates
        socket.off('friend_added');
        socket.off('friend_error');
        socket.off('friend_removed');
        socket.off('friend_request_received');
        socket.off('friend_request_sent');
        socket.off('studio_invite_received');
        socket.off('registration_error');
        socket.off('registration_success');
        socket.off('studio_error');
        socket.off('notification');
        socket.off('member_joined');
        socket.off('studio_joined');
        socket.off('chat_message_received');

        socket.on('leaderboard_update', (data: LeaderboardEntry[]) => {
            set({ leaderboard: data });
        });

        socket.on('contract_taken', (data: { missionId: string, status: 'preparing' }) => {
             const { team, addNotification } = get();
             if (team) {
                 set({ 
                     team: { 
                         ...team, 
                         activeMissionId: data.missionId, 
                         missionStatus: data.status,
                         missionReadyMembers: [] // Reset ready members
                     } 
                 });
                 addNotification('Новый Контракт', 'Лидер выбрал проект. Зайдите в лобби и подтвердите участие!', 'info');
             }
        });

        socket.on('mission_started', () => {
             const { team, addNotification } = get();
             if (team) {
                 set({ 
                     team: { ...team, missionStatus: 'in_progress', missionStartTime: Date.now() },
                     view: 'workspace'
                 });
                 addNotification('Проект начался', 'Все системы запущены!', 'success');
             }
        });

        socket.on('mission_cancelled', () => {
            const { team, addNotification } = get();
            if (team) {
                set({ 
                    team: { 
                        ...team, 
                        activeMissionId: null,
                        missionStatus: 'idle',
                        missionReadyMembers: [],
                        missionStartTime: undefined 
                    },
                    view: 'lobby'
                });
                addNotification('Отмена', 'Проект был отменен руководством.', 'warning');
            }
       });

       socket.on('mission_finished_success', (data: { rewards: MissionReward, studio: Partial<Team> }) => {
            const { team, addNotification } = get();
            if (team) {
                set({ 
                    team: { 
                        ...team, 
                        ...data.studio,
                        activeMissionId: null,
                        missionStatus: 'idle',
                        missionReadyMembers: [],
                        missionStartTime: undefined,
                        missionState: { html: '', css: '', js: '', sql: '' } // Reset code
                    },
                    view: 'lobby'
                });
                addNotification('Успех!', `Контракт выполнен! +$${data.rewards.money}, Рейтинг +${data.rewards.rating}`, 'success');
            }
       });
        
        socket.on('member_role_updated', (data: { playerId: string, role: Role }) => {
            const { team, currentUser, addNotification } = get();
            if (team) {
                const updatedMembers = team.members.map(m => m.id === data.playerId ? { ...m, role: data.role } : m);
                set({ team: { ...team, members: updatedMembers } });
                
                if (currentUser && currentUser.id === data.playerId) {
                    set({ currentUser: { ...currentUser, role: data.role } });
                    addNotification('Повышение', `Вам назначена новая роль: ${data.role}`, 'success');
                }
            }
        });

        socket.on('mission_role_updated', (data: { playerId: string, role: string }) => {
            const { team, currentUser } = get();
            if (team) {
                const updatedMembers = team.members.map(m => m.id === data.playerId ? { ...m, missionRole: data.role } : m);
                set({ team: { ...team, members: updatedMembers } });
                
                if (currentUser && currentUser.id === data.playerId) {
                    set({ currentUser: { ...currentUser, missionRole: data.role } });
                }
            }
        });

        socket.on('mission_ready_update', (data: { missionReadyMembers: string[] }) => {
            const { team, addNotification, currentUser } = get();
            if (team) {
                // Check if I just became ready (simple diff check or just rely on state)
                const wasReady = team.missionReadyMembers.includes(currentUser?.id || '');
                const isReady = data.missionReadyMembers.includes(currentUser?.id || '');
                
                if (!wasReady && isReady) {
                    addNotification('Готовность', 'Вы присоединились к команде проекта', 'success');
                }

                set({ team: { ...team, missionReadyMembers: data.missionReadyMembers } });
            }
        });

        socket.on('chat_message_received', (message: any) => {
            const { team } = get();
            if (team) {
                // Keep only last 50 messages to avoid memory bloat
                const updatedMessages = [...(team.chatMessages || []), message].slice(-50);
                set({ team: { ...team, chatMessages: updatedMessages } });
            }
        });

        socket.on('user_status_change', ({ userId, status }) => {
            const { friends } = get();
            const updatedFriends = friends.map(f => f.id === userId ? { ...f, status } : f);
            set({ friends: updatedFriends });
        });

        socket.on('friend_added', (friend: Friend) => {
           const { friends, addNotification } = get();
           if (!friends.find(f => f.id === friend.id)) {
               set({ friends: [...friends, friend] });
               addNotification('Друзья', `${friend.name} теперь ваш друг`, 'success');
           }
        });

        socket.on('friend_request_received', (requester: any) => {
            const { friendRequests, addNotification } = get();
            if (!friendRequests.find(r => r.id === requester.id)) {
                const request: Friend = { ...requester, status: 'online' };
                set({ friendRequests: [...friendRequests, request] });
                addNotification('Заявка в друзья', `Получена заявка от ${requester.name}`, 'info');
            }
        });

        socket.on('friend_request_sent', (msg: string) => {
            addNotification('Успешно', msg, 'success');
        });

        socket.on('studio_invite_received', (data: any) => {
            const { studioInvites, addNotification } = get();
            if (!studioInvites.find(i => i.studioCode === data.studioCode)) {
                set({ studioInvites: [...studioInvites, data] });
                addNotification('Приглашение', `${data.inviterName} зовет вас в студию ${data.studioName}`, 'info');
            }
        });

        socket.on('studio_profile_updated', (updates: Partial<Team>) => {
            const { team } = get();
            if (team) {
                set({ team: { ...team, ...updates } });
            }
        });

        socket.on('registration_success', (userData: Player) => {
             console.log('Socket: registration_success received', userData);
             const { leaderboard } = get();
             
             // Add to leaderboard locally
             const newLeaderboardEntry: LeaderboardEntry = {
                id: userData.id,
                name: userData.name,
                type: 'coder',
                score: 0,
                avatar: userData.avatar,
                banner: userData.banner
             };

             set({ 
                 currentUser: userData, 
                 isLoading: false, 
                 view: 'menu',
                 leaderboard: [...leaderboard, newLeaderboardEntry]
             });
        });

        socket.on('registration_error', (msg: string) => {
             // We handle this via callback/state mostly, but notification helps
             addNotification('Ошибка регистрации', msg, 'error');
             set({ isLoading: false }); // Stop loading
        });
        
        socket.on('friend_removed', (friendId: string) => {
            const { friends } = get();
            set({ friends: friends.filter(f => f.id !== friendId) });
        });

        socket.on('friend_error', (msg: string) => {
            addNotification('Ошибка', msg, 'error');
        });

        socket.on('studio_error', (msg: string) => {
            addNotification('Ошибка студии', msg, 'error');
        });

        socket.on('notification', (data: any) => {
            addNotification(data.title, data.message, data.type);
        });

        socket.on('member_joined', (member: Player) => {
            const { team } = get();
            if (team) {
                // Check if member already exists
                if (!team.members.find(m => m.id === member.id)) {
                    set({ team: { ...team, members: [...team.members, member] } });
                    addNotification('Новый сотрудник', `${member.name} присоединился к команде`, 'success');
                }
            }
        });

        socket.on('member_left', (memberId: string) => {
            const { team } = get();
            if (team) {
                set({ team: { ...team, members: team.members.filter(m => m.id !== memberId) } });
            }
        });

        socket.on('studio_left', () => {
             get().deleteStudio(); // Clear local team state
             get().addNotification('Студия', 'Вы покинули студию', 'info');
        });

        socket.on('studio_joined', (studio: Team) => {
             // When we successfully join a studio
             set({ 
                 team: studio, 
                 view: 'lobby',
                 // Update user role if needed, but studio object should have correct members
             });
             addNotification('Успешно', `Вы вступили в ${studio.name}`, 'success');
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setView: (view) => set({ view }),

      sendChatMessage: (text) => {
          const { team, currentUser } = get();
          if (!team || !currentUser) return;
          
          socket.emit('send_chat_message', {
              studioCode: team.code,
              senderId: currentUser.id,
              senderName: currentUser.name,
              text
          });
      },

      addNotification: (title, message, type) => {
        const id = Math.random().toString(36).substr(2, 9);
        set((state) => ({
          notifications: [
            { id, title, message, type, timestamp: Date.now() },
            ...state.notifications
          ]
        }));
        // Auto remove after 5 seconds
        setTimeout(() => {
          get().removeNotification(id);
        }, 5000);
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },

      setMissionRole: (playerId, role) => {
        const { team, currentUser } = get();
        if (!team) return;

        // Update team members
        const updatedMembers = team.members.map(m => m.id === playerId ? { ...m, missionRole: role } : m);
        
        // Prepare state update
        const stateUpdate: any = {
          team: {
            ...team,
            members: updatedMembers
          }
        };

        // If the updated user is the current user, update currentUser as well
        if (currentUser && currentUser.id === playerId) {
          stateUpdate.currentUser = { ...currentUser, missionRole: role };
        }

        set(stateUpdate);
        socket.emit('update_mission_role', { studioCode: team.code, playerId, role });
      },

      createProfile: (name, avatar, banner) => {
        const { isConnected, addNotification } = get();
        
        set({ registrationError: null }); // Reset error

        if (!isConnected) {
            addNotification('Ошибка', 'Нет соединения с сервером. Пожалуйста, подождите...', 'error');
            return;
        }

        const player: Player = {
          id: Math.random().toString(36).substr(2, 9),
          name: name,
          role: 'Freelancer',
          title: 'Junior',
          friendCode: Math.floor(100000 + Math.random() * 900000).toString(),
          isLeader: false,
          avatar: avatar, // Custom avatar base64 or class string
          banner: banner, // Custom banner base64 or class string
          stats: {
            level: 1,
            xp: 0,
            completedMissions: 0,
            productivity: 100
          }
        };
        
        set({ isLoading: true }); // Start loading
        
        console.log('Socket: Emitting register_user', player);
        // Register with server
        socket.emit('register_user', { 
            id: player.id, 
            name: player.name, 
            friendCode: player.friendCode, 
            avatar: player.avatar,
          banner: player.banner,
          bannerPosition: player.bannerPosition,
          bannerScale: player.bannerScale,
          title: player.title
        });

        // Timeout safety
        setTimeout(() => {
            const { isLoading } = get();
            if (isLoading) {
                set({ isLoading: false });
                addNotification('Внимание', 'Сервер долго отвечает (возможно, просыпается). Попробуйте еще раз через минуту.', 'warning');
            }
        }, 15000); // 15 seconds timeout

        // We DO NOT set currentUser here anymore. We wait for 'registration_success'
        // But we temporarily store the pending player to set it on success
        // actually, simpler: just send data, if success, server sends back data, we use that.
      },

      createTeam: (teamName, specialization) => {
        const { currentUser, addNotification } = get();
        if (!currentUser) return;

        const updatedUser = { ...currentUser, role: 'Руководитель' as Role, isLeader: true };
        
        const newTeam: Team = {
          code: Math.random().toString(36).substr(2, 6).toUpperCase(),
          name: teamName,
          specializations: [specialization],
          members: [updatedUser],
          money: 500,
          rating: 0,
          activeMissionId: null,
          missionStatus: 'idle',
          missionReadyMembers: [],
          missionStartTime: undefined,
          missionState: { html: '', css: '', js: '', sql: '' },
          tasks: [],
          researchTree: [],
          inventory: [],
          pendingMembers: [],
          isPrivate: true,
          privacyType: 'closed',
          chatMessages: [],
          researchPoints: 0,
          completedMissions: 0
        };

        // Notify server
        socket.emit('create_studio', newTeam);

        // Add to leaderboard
        const newLeaderboardEntry: LeaderboardEntry = {
          id: newTeam.code,
          name: newTeam.name,
          type: 'studio',
          score: 0,
          avatar: undefined, // Will be updated later via updateTeamProfile
          banner: undefined
        };

        set((state) => ({ 
          currentUser: updatedUser, 
          team: newTeam, 
          view: 'lobby',
          leaderboard: [...state.leaderboard, newLeaderboardEntry]
        }));
        
        addNotification('Студия Создана', `Добро пожаловать в ${teamName}!`, 'success');
      },

      joinTeam: (name, teamCode) => {
        let { currentUser } = get();
        
        if (!currentUser) {
           // Auto-create profile if joining directly
           const player: Player = {
             id: Math.random().toString(36).substr(2, 9),
             name: name,
             role: 'Junior', // Default seniority for joiners
             title: 'Junior',
             friendCode: Math.floor(100000 + Math.random() * 900000).toString(),
             isLeader: false,
             stats: {
               level: 1,
               xp: 0,
               completedMissions: 0,
               productivity: 100
             }
           };
           set({ currentUser: player });
           currentUser = player;
           // Register with server
           socket.emit('register_user', { 
             id: player.id, 
             name: player.name, 
             friendCode: player.friendCode,
             title: player.title 
           });
        }
        
        // Emit join request to server (no role needed)
        socket.emit('join_studio', { userId: currentUser.id, studioCode: teamCode, userName: currentUser.name });
      },

      takeContract: (missionId) => {
        const { team, currentUser, addNotification } = get();
        if (!team || !currentUser) return;
        
        // Check permissions
        const allowedRoles = ['Руководитель', 'TeamLead', 'Заместитель'];
        if (!allowedRoles.includes(currentUser.role)) {
          addNotification('Ошибка', 'Только руководство может брать контракты', 'error');
          return;
        }

        // Optimistic update
        set({ 
          team: { 
            ...team, 
            activeMissionId: missionId,
            missionStatus: 'preparing',
            missionReadyMembers: [currentUser.id] // Leader is automatically ready
          }
        });
        
        // Notify server
        socket.emit('take_contract', { studioCode: team.code, missionId, playerId: currentUser.id });
        
        addNotification('Новый Контракт', 'Студия начала подготовку к проекту. Присоединяйтесь!', 'info');
      },

      joinContract: () => {
        const { team, currentUser } = get();
        if (!team || !currentUser || team.missionStatus !== 'preparing') return;

        if (!team.missionReadyMembers.includes(currentUser.id)) {
          socket.emit('join_contract_team', { studioCode: team.code, playerId: currentUser.id });
        }
      },

      startMission: () => {
        const { team, currentUser, addNotification, availableMissions } = get();
        if (!team || !currentUser) return;
        
        const allowedRoles = ['Руководитель', 'TeamLead', 'Заместитель'];
        if (!allowedRoles.includes(currentUser.role)) {
          addNotification('Ошибка', 'Только руководство может начать выполнение', 'error');
          return;
        }

        // Validate that user has a mission role
        if (!currentUser.missionRole) {
           addNotification('Ошибка', 'Выберите роль (HTML/CSS/JS/SQL) перед началом!', 'warning');
           return;
        }

        const mission = availableMissions.find(m => m.id === team.activeMissionId);
        if (!mission) {
            addNotification('Ошибка', 'Контракт не найден', 'error');
            return;
        }

        // Emit event to server
        socket.emit('start_mission', { studioCode: team.code });
        
        // Sync tasks to server
        socket.emit('update_studio_profile', { studioCode: team.code, updates: { tasks: mission.tasks } });

        set({ 
          team: { 
            ...team, 
            missionStatus: 'in_progress',
            missionStartTime: Date.now(),
            tasks: mission.tasks
          },
          view: 'workspace'
        });
        addNotification('Работа началась', 'Все системы в норме. Приступаем к выполнению!', 'success');
      },

      leaveMission: () => {
         set({ view: 'lobby' });
      },

      cancelMission: () => {
        const { team, currentUser, addNotification } = get();
        if (!team || !currentUser) return;

        // Permission Check
        const allowedRoles = ['Руководитель', 'TeamLead', 'Заместитель'];
        if (!allowedRoles.includes(currentUser.role)) {
            addNotification('Ошибка', 'Отменить проект могут только Руководитель, Заместитель или TeamLead', 'error');
            return;
        }

        // Emit event to server
        socket.emit('cancel_mission', { studioCode: team.code });

        set({
          team: {
            ...team,
            activeMissionId: null,
            missionStatus: 'idle',
            missionReadyMembers: [],
            missionStartTime: undefined,
            missionState: { html: '', css: '', js: '', sql: '' }
          },
          view: 'lobby'
        });
        addNotification('Проект Отменен', 'Контракт был расторгнут руководством.', 'warning');
      },

      finishMission: () => {
         const { team, currentUser, availableMissions, addNotification } = get();
         if (!team || !currentUser) return;

         // Permission Check
         const allowedRoles = ['Руководитель', 'TeamLead', 'Заместитель'];
         if (!allowedRoles.includes(currentUser.role)) {
             addNotification('Ошибка', 'Сдать проект могут только Руководитель, Заместитель или TeamLead', 'error');
             return;
         }

         const mission = availableMissions.find(m => m.id === team.activeMissionId);
         if (!mission) return;

         // Verify all tasks are completed using TEAM state (synced)
         const tasks = team.tasks || [];
         const allTasksCompleted = tasks.length > 0 && tasks.every(t => t.completed);
         
         if (!allTasksCompleted) {
             addNotification('Ошибка', 'Не все задачи выполнены! Проверьте статус этапов.', 'error');
             return;
         }

         // Verify Code Quality (Simple simulation for now)
         // In a real app, we would run tests here. 
         // For now, we assume if tasks are marked completed (via completeStage), code is good enough.
         
         socket.emit('finish_mission', { 
             studioCode: team.code, 
             missionId: mission.id,
             rewards: mission.reward // Passing rewards from client for MVP simplicity
         });

         // Optimistic update handled by socket listener 'mission_finished_success'
         addNotification('Отправка', 'Проверка контракта заказчиком...', 'info');
      },

      completeStage: (taskId, playerId) => {
        const { team, currentUser, addNotification } = get();
        if (!team || !team.activeMissionId || !currentUser) return;

        const currentTasks = team.tasks || [];
        let xpReward = 50; 
        let bonusXp = 0;
        let tasksUpdated = false;

        const updatedTasks = currentTasks.map(task => {
            if (task.id === taskId) {
                // If already completed, ignore
                if (task.completed) return task;

                const nextStageIndex = task.currentStageIndex + 1;
                const isFinished = nextStageIndex >= task.stages.length;
                  
                // Base XP for stage
                xpReward = 50; 
                  
                // Check if it's the player who clicked
                if (playerId === currentUser.id) {
                     bonusXp = 10;
                }

                tasksUpdated = true;
                return { 
                    ...task, 
                    currentStageIndex: isFinished ? task.currentStageIndex : nextStageIndex,
                    completed: isFinished
                };
            }
            return task;
        });

        if (!tasksUpdated) return;

        // Check if ALL tasks are completed
        const allCompleted = updatedTasks.every(t => t.completed);
        if (allCompleted) {
           setTimeout(() => {
             get().finishMission();
           }, 1500);
        }

        // Update Team Members XP
        const updatedMembers = team.members.map(member => {
           let newXp = member.stats.xp + 20; // Shared XP for everyone
           
           if (member.id === playerId) {
              newXp += xpReward + bonusXp;
           }

           // Level up logic (simple: every 1000 XP)
           let newLevel = member.stats.level;
           if (newXp >= newLevel * 1000) {
              newLevel++;
              if (member.id === currentUser.id) {
                 addNotification('Уровень Повышен!', `Вы достигли ${newLevel} уровня!`, 'success');
              }
           }

           return {
             ...member,
             stats: {
               ...member.stats,
               xp: newXp,
               level: newLevel
             }
           };
        });
        
        // Sync to server
        socket.emit('update_studio_profile', { 
            studioCode: team.code, 
            updates: { 
                tasks: updatedTasks,
                members: updatedMembers 
            } 
        });

        set({ 
           team: { ...team, members: updatedMembers, tasks: updatedTasks }
        });
        
        if (playerId === currentUser.id) {
           addNotification('Этап Завершен', `+${20 + xpReward + bonusXp} XP (Личный вклад + Бонус)`, 'success');
        }
      },

      addMemberMock: (name, role) => {
         const { team } = get();
         if(!team) return;
         const newMember: Player = {
             id: Math.random().toString(),
             name, 
             role: role as Role,
             title: 'Junior',
             friendCode: Math.floor(100000 + Math.random() * 900000).toString(),
             isLeader: false,
             stats: {
               level: 1,
               xp: 0,
               completedMissions: 0,
               productivity: 100
             }
         };
         set({ team: { ...team, members: [...team.members, newMember] }});
      },

      logout: () => {
        set({
          currentUser: null,
          team: null,
          view: 'profile-setup', // Reset to profile creation/login screen
          friendRequests: [],
          friends: [],
          notifications: []
        });
        // Disconnect and reconnect socket to ensure clean state
        get().socket.disconnect();
        get().socket.connect(); 
      },

      resetGame: () => {
        localStorage.removeItem('iteam-storage');
        window.location.reload();
      },

      buyItem: (itemId) => {
        const { team, currentUser, addNotification } = get();
        if (!team || !currentUser) return;
        
        // Permission Check
        const allowedRoles = ['Руководитель', 'TeamLead', 'Заместитель'];
        if (!allowedRoles.includes(currentUser.role)) {
            addNotification('Ошибка', 'Покупать предметы могут только Руководитель, Заместитель или TeamLead', 'error');
            return;
        }
        
        const item = shopItems.find(i => i.id === itemId);
        if (!item) return;

        if (team.money >= item.cost) {
           // Apply item effects
           let updatedTeam = { ...team };
           let updatedMembers = [...team.members];

           if (item.effect) {
               if (item.effect.startsWith('productivity_')) {
                   const amount = parseInt(item.effect.split('_')[1]);
                   updatedMembers = updatedMembers.map(m => ({
                       ...m,
                       stats: { ...m.stats, productivity: Math.min(150, m.stats.productivity + amount) }
                   }));
                   addNotification('Буст', `Продуктивность команды повышена на ${amount}%!`, 'success');
               } 
               else if (item.effect.startsWith('rating_')) {
                   const amount = parseInt(item.effect.split('_')[1]);
                   updatedTeam.rating += amount;
                   addNotification('Рейтинг', `Рейтинг студии вырос на ${amount}!`, 'success');
               }
               else if (item.effect === 'level_up_team') {
                   updatedMembers = updatedMembers.map(m => ({
                       ...m,
                       stats: { ...m.stats, level: m.stats.level + 1 }
                   }));
                   addNotification('Уровень', `Все сотрудники повысили свой уровень!`, 'success');
               }
           }

           // Prepare updates
           const updates = {
               money: team.money - item.cost,
               inventory: [...team.inventory, { ...item, purchased: true }],
               members: updatedMembers,
               rating: updatedTeam.rating
           };

           // Optimistic update
           set({ 
               team: { 
                   ...updatedTeam, 
                   ...updates
               } 
           });

           // Sync with server (broadcast to everyone)
            socket.emit('update_studio_profile', { studioCode: team.code, updates });
 
            // Send system message
            socket.emit('send_chat_message', {
                studioCode: team.code,
                senderId: 'system',
                senderName: 'System',
                text: `Приобретено оборудование: ${item.name}`,
                system: true
            });

            addNotification('Покупка', `${item.name} успешно приобретен!`, 'success');
        } else {
           addNotification('Ошибка', 'Недостаточно средств', 'error');
        }
      },

      unlockResearch: (researchId) => {
         const { team, currentUser, addNotification } = get();
         if (!team || !currentUser) return;
         
         // Permission Check
         const allowedRoles = ['Руководитель', 'TeamLead', 'Заместитель'];
         if (!allowedRoles.includes(currentUser.role)) {
             addNotification('Ошибка', 'Изучать технологии могут только Руководитель, Заместитель или TeamLead', 'error');
             return;
         }
         
         const researchNode = researchTree.find(n => n.id === researchId);
         if (!researchNode) return;
         
         if (team.researchPoints >= researchNode.cost) {
             // Apply research effects
             let updatedTeam = { ...team };
             let updatedMembers = [...team.members];

             if (researchNode.effect) {
                 if (researchNode.effect === 'rating_boost_10') {
                     updatedTeam.rating += 100; // Boost rating
                     addNotification('Эффект', 'Рейтинг студии повышен!', 'success');
                     socket.emit('update_studio_rating', { studioCode: team.code, rating: updatedTeam.rating });
                 }
                 else if (researchNode.effect === 'speed_boost_15') {
                     // Speed logic is handled in task completion, assume it works passively or we add a modifier
                     addNotification('Эффект', 'Скорость разработки увеличена!', 'success');
                 }
                 else if (researchNode.effect === 'productivity_20') {
                     updatedMembers = updatedMembers.map(m => ({
                         ...m,
                         stats: { ...m.stats, productivity: Math.min(150, m.stats.productivity + 20) }
                     }));
                     addNotification('Эффект', 'Продуктивность команды выросла!', 'success');
                 }
                 else if (researchNode.effect === 'xp_boost_25') {
                     // Passive XP boost logic handled elsewhere
                     addNotification('Эффект', 'Получаемый опыт увеличен!', 'success');
                 }
                 else if (researchNode.effect === 'money_boost_50') {
                     // Passive Money boost logic handled elsewhere
                     addNotification('Эффект', 'Доход с контрактов увеличен!', 'success');
                 }
             }

             set({
                 team: {
                     ...updatedTeam,
                     members: updatedMembers,
                     researchPoints: team.researchPoints - researchNode.cost,
                     researchTree: [...team.researchTree, researchNode]
                 }
             });
             addNotification('Исследование', `Технология "${researchNode.title}" изучена!`, 'success');
         } else {
             addNotification('Ошибка', `Недостаточно очков исследований (Нужно: ${researchNode.cost})`, 'error');
         }
      },

      deleteChatMessage: (messageId) => {
          const { team, currentUser } = get();
          if (!team || !currentUser) return;
          
          set({
              team: {
                  ...team,
                  chatMessages: team.chatMessages.filter(msg => msg.id !== messageId)
              }
          });
          // In real app, emit socket event
      },

      deleteStudio: () => {
        const { currentUser, team } = get();
        if (!currentUser) return;
        
        const resetUser = { ...currentUser, role: 'Freelancer' as Role, isLeader: false };
        set((state) => ({
          team: null,
          currentUser: resetUser,
          view: 'menu',
          leaderboard: state.leaderboard.filter(entry => entry.id !== team?.code)
        }));
      },

      updateSettings: (newSettings) => {
        set((state) => ({ settings: { ...state.settings, ...newSettings } }));
      },

      addFriend: (_name) => {
        // Legacy
      },

      removeFriend: (friendId) => {
         const { currentUser } = get();
         if (!currentUser) return;
         socket.emit('remove_friend', { myId: currentUser.id, friendId });
         // Optimistic update
         set((state) => ({ friends: state.friends.filter(f => f.id !== friendId) }));
      },

      inviteToStudio: (friendId: string) => {
          const { currentUser, team } = get();
          if (!currentUser || !team) return;
          socket.emit('invite_to_studio', { myId: currentUser.id, friendId, studioCode: team.code });
          get().addNotification('Приглашение', 'Приглашение отправлено', 'success');
      },

      acceptFriendRequest: (friend) => {
          const { currentUser, friendRequests } = get();
          if (!currentUser) return;
          
          socket.emit('accept_friend_request', { myId: currentUser.id, friendId: friend.id });
          set({ 
              friendRequests: friendRequests.filter(r => r.id !== friend.id)
              // friends list update will come from socket event
          });
      },

      rejectFriendRequest: (friendId) => {
          const { currentUser, friendRequests } = get();
          if (!currentUser) return;
          
          socket.emit('reject_friend_request', { myId: currentUser.id, friendId });
          set({ friendRequests: friendRequests.filter(r => r.id !== friendId) });
      },

      addFriendByCode: async (code: string) => {
        const { friends, addNotification, currentUser } = get();
        
        // Artificial delay to simulate network request
        await new Promise(resolve => setTimeout(resolve, 500));

        if (friends.find(f => f.id === code)) {
            addNotification('Ошибка', 'Этот пользователь уже в списке друзей', 'warning');
            return;
        }
        
        if (!currentUser) return;
        
        socket.emit('send_friend_request', { myId: currentUser.id, friendCode: code });
      },

      updateMissionCode: (role: string, code: string) => {
         const { team } = get();
         if (!team) return;
         
         const key = role.toLowerCase();
         if (!['html', 'css', 'js', 'sql'].includes(key)) return;

         set({
             team: {
                 ...team,
                 missionState: {
                     ...team.missionState,
                     [key]: code
                 }
             }
         });
      },

      addSpecialization: (spec) => {
        const { team, addNotification } = get();
        if (!team) return;
        const cost = 5000;
        if (team.money >= cost && !team.specializations.includes(spec)) {
          set({ 
            team: { 
              ...team, 
              money: team.money - cost,
              specializations: [...team.specializations, spec]
            } 
          });
          addNotification('Успешно', `Специализация ${spec} открыта!`, 'success');
        } else {
          addNotification('Ошибка', 'Недостаточно средств', 'error');
        }
      },

      updateProfile: (updates) => {
        const { currentUser, team, leaderboard } = get();
        if (!currentUser) return;
        
        const updatedUser = { ...currentUser, ...updates };
        
        // Update Team Members if in a team
        let updatedTeam = team;
        if (team) {
            updatedTeam = {
                ...team,
                members: team.members.map(m => m.id === currentUser.id ? { ...m, ...updates } : m)
            };
        }

        // Update Leaderboard if in leaderboard
        const updatedLeaderboard = leaderboard.map(entry => {
            if (entry.id === currentUser.id) {
                return { 
                    ...entry, 
                    name: updates.name || entry.name,
                    avatar: updates.avatar !== undefined ? updates.avatar : entry.avatar,
                    banner: updates.banner !== undefined ? updates.banner : entry.banner
                    // Note: Leaderboard doesn't typically display banner position, so we don't sync it here to save bandwidth
                };
            }
            return entry;
        });

        set({ 
            currentUser: updatedUser,
            team: updatedTeam,
            leaderboard: updatedLeaderboard
        });
        
        // Send score update to server if XP changed
        if (updates.stats && updates.stats.xp !== undefined) {
            socket.emit('update_score', { userId: currentUser.id, xp: updates.stats.xp });
        }
      },

      updateTeamProfile: (updates) => {
        const { team, currentUser, addNotification } = get();
        if (!team || !currentUser) return;
        
        const allowedRoles = ['Руководитель', 'TeamLead', 'Заместитель'];
        if (!allowedRoles.includes(currentUser.role)) {
           addNotification('Ошибка', 'Нет прав на изменение профиля студии', 'error');
           return;
        }

        const updatedTeam = { ...team, ...updates };
        
        // Update Leaderboard if name/avatar changed
        const { leaderboard } = get();
        const updatedLeaderboard = leaderboard.map(entry => {
            if (entry.id === team.code) {
                return { ...entry, ...updates };
            }
            return entry;
        });

        set({ team: updatedTeam, leaderboard: updatedLeaderboard });
        socket.emit('update_studio_profile', { studioCode: team.code, updates });
        addNotification('Успешно', 'Профиль студии обновлен', 'success');
      },

      kickMember: (playerId: string) => {
        const { team, currentUser, addNotification } = get();
        if (!team || !currentUser) return;

        // Permission Check
        const allowedRoles = ['Руководитель', 'TeamLead', 'Заместитель'];
        if (!allowedRoles.includes(currentUser.role)) return;

        // Cannot kick Leader
        const target = team.members.find(m => m.id === playerId);
        if (target?.role === 'Руководитель') return;

        // Add to banned list
        const bannedIds = [...(team.bannedIds || []), playerId];

        const updatedMembers = team.members.filter(m => m.id !== playerId);
        set({
          team: {
            ...team,
            members: updatedMembers,
            bannedIds
          }
        });

        socket.emit('kick_member', { studioCode: team.code, playerId });

        addNotification('Исключение', `Сотрудник ${target?.name} был уволен`, 'info');
      },

      promoteMember: (playerId, newRole) => {
        const { team, currentUser, addNotification } = get();
        if (!team || !currentUser) return;

        const allowedRoles = ['Руководитель'];
        if (!allowedRoles.includes(currentUser.role)) {
           addNotification('Ошибка', 'Только Руководитель может менять роли', 'error');
           return;
        }

        // Optimistic update
        set({
          team: {
            ...team,
            members: team.members.map(m => m.id === playerId ? { ...m, role: newRole } : m)
          }
        });
        
        const memberName = team.members.find(m => m.id === playerId)?.name || 'Unknown';
        
        socket.emit('promote_member', { 
            studioCode: team.code, 
            playerId, 
            role: newRole,
            promoterName: currentUser.name,
            playerName: memberName
        });
        
        addNotification('Повышение', `Роль сотрудника изменена на ${newRole}`, 'success');
      },

      leaveTeam: () => {
          const { team, currentUser } = get();
          if (!team || !currentUser) return;
          
          socket.emit('leave_studio', { 
              userId: currentUser.id, 
              studioCode: team.code,
              userName: currentUser.name
          });

          // Optimistic update
          set({ team: null, view: 'menu' });
      },

      toggleTeamPrivacy: () => {
        const { team, updateTeamProfile } = get();
        if (!team) return;
        
        const currentType = team.privacyType || (team.isPrivate ? 'closed' : 'open');
        let newType: 'open' | 'closed' | 'invite_only' = 'closed';
        let newIsPrivate = true;

        if (currentType === 'closed') {
            newType = 'invite_only';
            newIsPrivate = true;
        } else if (currentType === 'invite_only') {
            newType = 'open';
            newIsPrivate = false;
        } else {
            newType = 'closed';
            newIsPrivate = true;
        }

        updateTeamProfile({ isPrivate: newIsPrivate, privacyType: newType });
      },

      acceptMember: (playerId) => {
        const { team, currentUser, addNotification } = get();
        if (!team || !currentUser) return;
        
        const memberToJoin = team.pendingMembers.find(m => m.id === playerId);
        if (!memberToJoin) return;

        const newMember = { ...memberToJoin, role: 'Junior' as Role };

        set({
          team: {
            ...team,
            pendingMembers: team.pendingMembers.filter(m => m.id !== playerId),
            members: [...team.members, newMember]
          }
        });
        addNotification('Новый сотрудник', `${newMember.name} присоединился к команде`, 'success');
      },

      rejectMember: (playerId) => {
        const { team, currentUser } = get();
        if (!team || !currentUser) return;
        
        set({
          team: {
            ...team,
            pendingMembers: team.pendingMembers.filter(m => m.id !== playerId)
          }
        });
      },

      acceptStudioInvite: (code) => {
          const { currentUser, studioInvites } = get();
          if (!currentUser) return;
          
          socket.emit('join_studio', { userId: currentUser.id, studioCode: code, userName: currentUser.name });
          set({ studioInvites: studioInvites.filter(i => i.studioCode !== code) });
      },

      rejectStudioInvite: (code) => {
          const { studioInvites } = get();
          set({ studioInvites: studioInvites.filter(i => i.studioCode !== code) });
      }
    }),
    {
      name: 'iteam-storage',
      storage: createJSONStorage(() => localStorage),
      version: 4,
      migrate: (persistedState: any, version) => {
        let state = persistedState;
        
        // Fix for missing stats in currentUser
        if (state.currentUser && !state.currentUser.stats) {
             console.warn('Migration: Resetting user due to missing stats');
             state = {
                 ...state,
                 currentUser: null,
                 view: 'profile-setup'
             };
        }

        if (version === 0) {
            const oldLeaderboard = state.leaderboard || [];
            // Filter out mock data (IDs are usually short integers)
            let newLeaderboard = oldLeaderboard.filter((entry: any) => entry.id.length > 5);
            
            // Ensure current user is in leaderboard if missing
            if (state.currentUser && state.currentUser.stats) {
                const userExists = newLeaderboard.find((e: any) => e.id === state.currentUser.id);
                if (!userExists) {
                    newLeaderboard.push({
                        id: state.currentUser.id,
                        name: state.currentUser.name,
                        type: 'coder',
                        score: state.currentUser.stats.xp || 0
                    });
                }
            }
            
            // Ensure current team is in leaderboard if missing
            if (state.team) {
                const teamExists = newLeaderboard.find((e: any) => e.id === state.team.code);
                if (!teamExists) {
                    newLeaderboard.push({
                        id: state.team.code,
                        name: state.team.name,
                        type: 'studio',
                        score: state.team.rating || 1000
                    });
                }
            }

            return { ...state, leaderboard: newLeaderboard };
        }
        return state;
      },
      partialize: (state) => ({ 
        currentUser: state.currentUser, 
        team: state.team,
        availableMissions: state.availableMissions,
        settings: { ...state.settings, isMusicPlaying: false },
        friends: state.friends,
        leaderboard: state.leaderboard,
        notifications: state.notifications
      }),
    }
  )
);

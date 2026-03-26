import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { socket } from '../socket';
import { MessageSquare, Users, Phone, Settings, LogOut, Send, Mic, MicOff, Headphones, Video, Monitor, Hash, Plus, UserPlus, PhoneIncoming, PhoneOutgoing, PhoneMissed, Play, Image as ImageIcon, X, Trash2, Camera, Link, UserCheck, UserX } from 'lucide-react';
import avatarImg from '../assets/avatar.jpg';

export default function Dashboard() {
  const { 
    user, logout, activeTab, setActiveTab, activeGroupId, setActiveGroup, 
    onlineUsers, setOnlineUsers, messages, addMessage, deleteMessage,
    activeRoom, setActiveRoom, groups, channels, friends, callHistory, 
    addGroup, addChannel, addFriend, removeFriend, acceptFriend, leaveGroup, joinGroup,
    friendsTab, setFriendsTab, voiceParticipants, setVoiceParticipants
  } = useStore();
  const [msgInput, setMsgInput] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [friendIdInput, setFriendIdInput] = useState('');
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [joinGroupInput, setJoinGroupInput] = useState('');
  const [showGroupSettingsModal, setShowGroupSettingsModal] = useState(false);
  const [contextMenuTarget, setContextMenuTarget] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [channelNameInput, setChannelNameInput] = useState('');
  const [channelTypeInput, setChannelTypeInput] = useState<'text' | 'voice'>('text');
  
  const [attachment, setAttachment] = useState<string | null>(null);
  const [isInVoice, setIsInVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connection & Data sync
  useEffect(() => {
    if (user) {
      socket.emit('login', { id: user.id, name: user.name, status: user.status });
    }

    const handleUsers = (usersList: any[]) => setOnlineUsers(usersList);
    const handleMessage = (msg: any) => {
      addMessage(msg);
      // If message is not from current user and we're not in that room
      if (msg.senderId !== user?.id && msg.roomId !== activeRoom) {
        playNotificationSound();
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`New message from ${msg.senderName}`, {
            body: msg.text || 'Sent an attachment',
            icon: avatarImg
          });
        }
      }
    };
    const handleVoiceParticipants = (data: { roomId: string, participants: string[] }) => {
      setVoiceParticipants(data.roomId, data.participants);
    };
    
    const handleCallMade = (data: any) => {
      playCallSound();
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Incoming Call from ${data.name}`, {
          body: "Click to answer",
          icon: avatarImg
        });
      }
    };

    socket.on('users', handleUsers);
    socket.on('message', handleMessage);
    socket.on('voice-participants', handleVoiceParticipants);
    socket.on('call-made', handleCallMade);

    return () => {
      socket.off('users', handleUsers);
      socket.off('message', handleMessage);
      socket.off('voice-participants', handleVoiceParticipants);
      socket.off('call-made', handleCallMade);
    };
  }, [user]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeRoom]);

  // Request notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio context not supported or blocked');
    }
  };

  const playCallSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      
      // Pulsing effect
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      for(let i=0; i<3; i++) {
        gainNode.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + i*0.4 + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i*0.4 + 0.3);
      }
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.log('Audio context not supported');
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!msgInput.trim() && !attachment) || !user) return;
    
    const newMsg = {
      id: Date.now().toString(),
      text: msgInput,
      senderId: user.id,
      senderName: user.name,
      timestamp: Date.now(),
      roomId: activeRoom,
      attachmentUrl: attachment || undefined
    };
    
    socket.emit('message', newMsg);
    setMsgInput('');
    setAttachment(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (friendIdInput.trim()) {
      addFriend({ id: friendIdInput.trim(), name: `User_${friendIdInput.trim()}`, status: 'pending_outgoing' });
      setFriendIdInput('');
      setIsAddingFriend(false);
    }
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupNameInput.trim() && user) {
      const newGroupId = groupNameInput.toLowerCase().replace(/\s+/g, '-');
      addGroup({ id: newGroupId, name: groupNameInput.trim(), ownerId: user.id, members: [user.id] });
      addChannel({ id: `${newGroupId}-general`, groupId: newGroupId, name: 'Общий', type: 'text' });
      setGroupNameInput('');
      setShowCreateGroupModal(false);
      setActiveGroup(newGroupId);
      setActiveRoom(`${newGroupId}-general`);
    }
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinGroupInput.trim() && user) {
      const success = joinGroup(joinGroupInput.trim(), user.id);
      if (success) {
        setJoinGroupInput('');
        setShowJoinGroupModal(false);
      } else {
        alert("Неверный код приглашения или вы уже состоите в группе.");
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, groupId: string) => {
    e.preventDefault();
    setContextMenuTarget(groupId);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setContextMenuTarget(null);
  };

  useEffect(() => {
    const handleClickOutside = () => closeContextMenu();
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const copyInviteCode = () => {
    const group = groups.find(g => g.id === activeGroupId);
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      alert("Код приглашения скопирован!");
    }
  };

  const handleLeaveGroup = () => {
    if (activeGroupId && user) {
      if (confirm("Вы уверены, что хотите покинуть эту группу?")) {
        leaveGroup(activeGroupId, user.id);
        setActiveGroup(null);
        setActiveTab('friends');
      }
    }
  };

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (channelNameInput.trim() && activeGroupId) {
      const newChannelId = `${activeGroupId}-${channelNameInput.toLowerCase().replace(/\s+/g, '-')}`;
      addChannel({ id: newChannelId, groupId: activeGroupId, name: channelNameInput.trim(), type: channelTypeInput });
      setChannelNameInput('');
      setIsCreatingChannel(false);
      setActiveRoom(newChannelId);
    }
  };

  const activeChannelData = channels.find(c => c.id === activeRoom);
  const activeFriendData = friends.find(f => f.id === activeRoom);
  const activeGroupData = groups.find(g => g.id === activeGroupId);
  const isGroupOwner = activeGroupData?.ownerId === user?.id;
  const roomName = activeChannelData ? activeChannelData.name : (activeFriendData ? activeFriendData.name : '');
  const isVoiceChannel = activeChannelData?.type === 'voice';

  const [showMembers, setShowMembers] = useState(false);

  const [currentVoiceRoom, setCurrentVoiceRoom] = useState<string | null>(null);

  // Handle local media stream
  useEffect(() => {
    if (isInVoice) {
      if (isScreenSharing) {
        navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
          .then(stream => {
            setLocalStream(stream);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          })
          .catch(err => {
            console.error("Error accessing display media.", err);
            setIsScreenSharing(false);
          });
      } else {
        navigator.mediaDevices.getUserMedia({ audio: true, video: isVideoOn })
          .then(stream => {
            setLocalStream(stream);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
            // Sync mute state
            stream.getAudioTracks().forEach(track => {
              track.enabled = !isMuted;
            });
          })
          .catch(err => console.error("Error accessing media devices.", err));
      }
    } else {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
    }
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isInVoice, isVideoOn, isScreenSharing]);

  // Voice activity detection
  useEffect(() => {
    if (localStream && !isMuted) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      
      try {
        const source = audioCtx.createMediaStreamSource(localStream);
        source.connect(analyser);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let animationId: number;
        
        const checkAudioLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for(let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const average = sum / dataArray.length;
          setIsSpeaking(average > 10);
          animationId = requestAnimationFrame(checkAudioLevel);
        };
        
        checkAudioLevel();
        
        return () => {
          cancelAnimationFrame(animationId);
          if (audioCtx.state !== 'closed') audioCtx.close();
        };
      } catch (e) {
        console.error("Audio context error:", e);
      }
    } else {
      setIsSpeaking(false);
    }
  }, [localStream, isMuted]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOn, isScreenSharing]);

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted && !isDeafened;
      });
    }
  }, [isMuted, isDeafened, localStream]);

  // If user is deafened, we mute remote audio (mocked here by state, in a real app you'd mute incoming streams)
  // For now we just visually show deafened state

  const joinVoice = (roomId: string) => {
    setIsInVoice(true);
    setCurrentVoiceRoom(roomId);
    socket.emit('join-voice', roomId);
  };

  const leaveVoice = () => {
    setIsInVoice(false);
    if (currentVoiceRoom) {
      socket.emit('leave-voice', currentVoiceRoom);
      setCurrentVoiceRoom(null);
    }
  };

  const filteredMessages = messages.filter(m => m.roomId === activeRoom);

  return (
    <div className="h-screen w-full p-6 flex gap-6 overflow-hidden relative z-10 pt-14 bg-black">
      
      {/* Groups Sidebar Navigation (Discord Style) */}
      <nav className="w-20 panel flex flex-col items-center py-4 gap-4 shrink-0 overflow-y-auto">
        <div 
          onClick={() => { setActiveTab('friends'); setActiveGroup(null); setActiveRoom(''); }}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${activeTab === 'friends' ? 'bg-white text-black rounded-[16px]' : 'bg-[#222] text-[#888] hover:bg-[#333] hover:text-white hover:rounded-[16px]'}`}
        >
          <img src={avatarImg} alt="App Logo" className="w-8 h-8 rounded-full object-cover" />
        </div>
        
        <div className="w-8 h-[2px] bg-[#222] rounded-full shrink-0"></div>
        
        {groups.map(g => (
          <div 
            key={g.id}
            onContextMenu={(e) => handleContextMenu(e, g.id)}
            onClick={() => { setActiveTab('groups'); setActiveGroup(g.id); setActiveRoom(channels.find(c => c.groupId === g.id)?.id || ''); }}
            className={`w-12 h-12 flex items-center justify-center cursor-pointer transition-all relative group ${activeGroupId === g.id && activeTab === 'groups' ? 'bg-white text-black rounded-[16px]' : 'bg-[#222] text-white rounded-[24px] hover:bg-white hover:text-black hover:rounded-[16px]'}`}
          >
            <span className="font-bold text-lg">{g.name[0].toUpperCase()}</span>
            {activeGroupId === g.id && activeTab === 'groups' && (
              <div className="absolute -left-5 w-2 h-10 bg-white rounded-r-full"></div>
            )}
          </div>
        ))}
        
        <div className="flex flex-col gap-2">
          <div 
            onClick={() => setShowCreateGroupModal(true)}
            className="w-12 h-12 rounded-[24px] flex items-center justify-center cursor-pointer transition-all bg-[#222] text-green-500 hover:bg-green-500 hover:text-white hover:rounded-[16px]"
            title="Создать группу"
          >
            <Plus size={24} />
          </div>
          <div 
            onClick={() => setShowJoinGroupModal(true)}
            className="w-12 h-12 rounded-[24px] flex items-center justify-center cursor-pointer transition-all bg-[#222] text-blue-500 hover:bg-blue-500 hover:text-white hover:rounded-[16px]"
            title="Присоединиться"
          >
            <Link size={20} />
          </div>
        </div>

        <div className="flex-1"></div>
        
        <NavButton icon={<Settings size={22} />} isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        <NavButton icon={<LogOut size={22} />} onClick={logout} className="text-red-500 hover:bg-red-500/10" />
      </nav>

      {/* Dynamic List Panel */}
      {activeTab !== 'settings' && activeTab !== 'calls' && (
        <aside className="w-[340px] panel flex flex-col shrink-0 overflow-hidden relative">
          <div className="p-6 pb-4 border-b border-[#1f1f1f] flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight truncate mr-2">
              {activeTab === 'groups' ? activeGroupData?.name || 'Каналы' : 'Друзья'}
            </h2>
            <div className="flex gap-1 shrink-0">
              {activeTab === 'groups' && isGroupOwner && (
                <button 
                  onClick={() => setIsCreatingChannel(!isCreatingChannel)}
                  className="w-8 h-8 rounded-lg bg-[#111] hover:bg-[#222] flex items-center justify-center text-[#888] hover:text-white transition-colors border border-[#222]"
                  title="Создать канал"
                >
                  <Plus size={16} />
                </button>
              )}
              {activeTab === 'groups' && (
                <button 
                  onClick={handleLeaveGroup}
                  className="w-8 h-8 rounded-lg bg-[#111] hover:bg-red-500/20 flex items-center justify-center text-[#888] hover:text-red-500 transition-colors border border-[#222]"
                  title="Покинуть группу"
                >
                  <LogOut size={16} />
                </button>
              )}
              {activeTab === 'friends' && (
                <button 
                  onClick={() => setIsAddingFriend(!isAddingFriend)}
                  className="w-8 h-8 rounded-lg bg-[#111] hover:bg-[#222] flex items-center justify-center text-[#888] hover:text-white transition-colors border border-[#222]"
                  title="Добавить друга"
                >
                  <UserPlus size={16} />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {activeTab === 'groups' && activeGroupId && (
              <>
                {isCreatingChannel && (
                  <form onSubmit={handleCreateChannel} className="p-3 mb-2 bg-[#111] rounded-xl border border-[#222]">
                    <input 
                      type="text" 
                      placeholder="Название канала" 
                      value={channelNameInput}
                      onChange={e => setChannelNameInput(e.target.value)}
                      className="w-full bg-[#222] border border-[#333] rounded-lg py-1.5 px-3 text-sm text-white mb-2 focus:outline-none focus:border-[#555]"
                      autoFocus
                    />
                    <div className="flex gap-2 mb-2">
                      <button type="button" onClick={() => setChannelTypeInput('text')} className={`flex-1 py-1 text-xs rounded-md border ${channelTypeInput === 'text' ? 'bg-white text-black border-white' : 'bg-[#222] text-[#888] border-[#333]'}`}>Текст</button>
                      <button type="button" onClick={() => setChannelTypeInput('voice')} className={`flex-1 py-1 text-xs rounded-md border ${channelTypeInput === 'voice' ? 'bg-white text-black border-white' : 'bg-[#222] text-[#888] border-[#333]'}`}>Голос</button>
                    </div>
                    <button type="submit" className="w-full py-1.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-200">Создать</button>
                  </form>
                )}

                <div className="px-3 pt-2 pb-2 text-xs font-semibold text-[#555] uppercase tracking-wider">
                  Текстовые каналы
                </div>
                {channels.filter(c => c.groupId === activeGroupId && c.type === 'text').map(c => (
                  <div 
                    key={c.id}
                    onClick={() => setActiveRoom(c.id)}
                    className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors ${activeRoom === c.id ? 'bg-[#1a1a1a]' : 'hover:bg-[#111]'}`}
                  >
                    <Hash className="text-[#666] w-5 h-5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm truncate">{c.name}</div>
                    </div>
                  </div>
                ))}

                <div className="px-3 pt-6 pb-2 text-xs font-semibold text-[#555] uppercase tracking-wider">
                  Голосовые каналы
                </div>
                {channels.filter(c => c.groupId === activeGroupId && c.type === 'voice').map(c => {
                  const channelParticipants = voiceParticipants[c.id] || [];
                  const isConnected = currentVoiceRoom === c.id;
                  return (
                  <div key={c.id}>
                    <div 
                      onClick={() => {
                        setActiveRoom(c.id);
                        if (!isConnected) joinVoice(c.id);
                      }}
                      className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors ${activeRoom === c.id ? 'bg-[#1a1a1a]' : 'hover:bg-[#111]'}`}
                    >
                      <Phone className="text-[#666] w-5 h-5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm truncate ${isConnected ? 'text-green-500' : 'text-white'}`}>{c.name}</div>
                      </div>
                    </div>
                    {channelParticipants.length > 0 && (
                      <div className="ml-8 mt-1 space-y-1">
                        {channelParticipants.map((pName, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-[#888]">
                            <div className="w-5 h-5 rounded-full bg-[#222] flex items-center justify-center shrink-0">
                              <UserAvatar name={pName} />
                            </div>
                            <span className="truncate">{pName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  );
                })}
              </>
            )}

            {activeTab === 'friends' && (
              <div className="flex flex-col h-full">
                {isAddingFriend && (
                  <form onSubmit={handleAddFriend} className="p-3 mb-2 bg-[#111] rounded-xl border border-[#222]">
                    <input 
                      type="text" 
                      placeholder="ID пользователя (напр. 1234)" 
                      value={friendIdInput}
                      onChange={e => setFriendIdInput(e.target.value)}
                      className="w-full bg-[#222] border border-[#333] rounded-lg py-1.5 px-3 text-sm text-white mb-2 focus:outline-none focus:border-[#555]"
                      autoFocus
                    />
                    <button type="submit" className="w-full py-1.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-200">Отправить запрос</button>
                  </form>
                )}

                <div className="flex gap-1 p-2 bg-[#111] rounded-xl mb-3 border border-[#222]">
                  <button onClick={() => setFriendsTab('all')} className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${friendsTab === 'all' ? 'bg-[#222] text-white' : 'text-[#666] hover:text-[#aaa]'}`}>Все друзья</button>
                  <button onClick={() => setFriendsTab('pending')} className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${friendsTab === 'pending' ? 'bg-[#222] text-white' : 'text-[#666] hover:text-[#aaa]'}`}>Ожидающие</button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {friendsTab === 'all' && (
                    <>
                      {friends.filter(f => f.status === 'accepted').length === 0 ? (
                        <div className="text-center text-[#555] text-sm mt-4">Пока нет друзей</div>
                      ) : (
                        friends.filter(f => f.status === 'accepted').map(f => {
                          const isOnline = onlineUsers.some(u => u.id === f.id);
                          return (
                            <div 
                              key={f.id} 
                              onClick={() => setActiveRoom(f.id)}
                              className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors mb-1 ${activeRoom === f.id ? 'bg-[#1a1a1a]' : 'hover:bg-[#111]'}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center relative shrink-0">
                                  <UserAvatar name={f.name} />
                                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-[#0a0a0a] rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-white text-sm truncate">{f.name}</div>
                                  <p className="text-xs text-[#666] truncate mt-0.5">{isOnline ? 'В сети' : 'Не в сети'}</p>
                                </div>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); removeFriend(f.id); }} className="p-1.5 text-[#666] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <UserX size={16} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </>
                  )}

                  {friendsTab === 'pending' && (
                    <>
                      {friends.filter(f => f.status !== 'accepted').length === 0 ? (
                        <div className="text-center text-[#555] text-sm mt-4">Нет ожидающих запросов</div>
                      ) : (
                        friends.filter(f => f.status !== 'accepted').map(f => (
                          <div key={f.id} className="p-3 rounded-xl flex items-center justify-between mb-1 bg-[#111]">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center shrink-0">
                                <UserAvatar name={f.name} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-white text-sm truncate">{f.name}</div>
                                <p className="text-xs text-[#666] truncate mt-0.5">{f.status === 'pending_incoming' ? 'Входящий запрос' : 'Исходящий запрос'}</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {f.status === 'pending_incoming' && (
                                <button onClick={() => acceptFriend(f.id)} className="p-1.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-md transition-colors">
                                  <UserCheck size={16} />
                                </button>
                              )}
                              <button onClick={() => removeFriend(f.id)} className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors">
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Control Panel */}
          <div className="mt-auto bg-[#111] border-t border-[#1f1f1f] p-3 shrink-0 flex flex-col gap-2">
            {currentVoiceRoom && (
              <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-2 mb-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="text-green-500"><Phone size={14} /></div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-green-500 uppercase tracking-wider truncate">Голосовая связь</div>
                      <div className="text-xs text-[#aaa] truncate hover:underline cursor-pointer" onClick={() => setActiveRoom(currentVoiceRoom)}>
                        {channels.find(c => c.id === currentVoiceRoom)?.name || 'Канал'}
                      </div>
                    </div>
                  </div>
                  <button onClick={leaveVoice} className="p-1.5 text-[#888] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors" title="Отключиться">
                    <PhoneMissed size={14} />
                  </button>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setIsVideoOn(!isVideoOn)} className={`flex-1 p-1.5 flex items-center justify-center rounded-lg transition-colors ${isVideoOn ? 'bg-blue-500/20 text-blue-500' : 'hover:bg-[#222] text-[#888] hover:text-white'}`} title="Камера">
                    <Video size={14} />
                  </button>
                  <button onClick={() => setIsScreenSharing(!isScreenSharing)} className={`flex-1 p-1.5 flex items-center justify-center rounded-lg transition-colors ${isScreenSharing ? 'bg-purple-500/20 text-purple-500' : 'hover:bg-[#222] text-[#888] hover:text-white'}`} title="Демонстрация экрана">
                    <Monitor size={14} />
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1 hover:bg-[#222] p-1.5 rounded-xl cursor-pointer transition-colors" onClick={() => setActiveTab('settings')}>
                <div className="w-8 h-8 rounded-full bg-[#222] shrink-0 overflow-hidden relative">
                   <img src={user?.avatarUrl || avatarImg} alt="avatar" className="w-full h-full object-cover" />
                   <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-[#111] rounded-full ${user?.status === 'online' ? 'bg-green-500' : user?.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate leading-tight">{user?.name}</div>
                  <div className="text-[11px] text-[#666] truncate leading-tight">#{user?.id}</div>
                </div>
              </div>
              <div className="flex items-center shrink-0">
                <button onClick={() => setIsMuted(!isMuted)} className={`p-2 rounded-lg transition-colors ${isMuted ? 'text-red-500 hover:bg-red-500/10' : 'text-[#888] hover:bg-[#222] hover:text-white'}`} title={isMuted ? "Включить микрофон" : "Выключить микрофон"}>
                  {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <button onClick={() => setIsDeafened(!isDeafened)} className={`p-2 rounded-lg transition-colors ${isDeafened ? 'text-red-500 hover:bg-red-500/10' : 'text-[#888] hover:bg-[#222] hover:text-white'}`} title={isDeafened ? "Включить звук" : "Выключить звук"}>
                  {isDeafened ? <Headphones size={18} className="opacity-50" /> : <Headphones size={18} />}
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 panel flex flex-col overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'groups' || activeTab === 'friends' ? (
            !activeRoom ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-[#555]"
              >
                <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                <h2 className="text-xl font-medium text-white mb-2">Выберите беседу</h2>
                <p>Выберите канал или друга, чтобы начать общение.</p>
              </motion.div>
            ) : (
            <motion.div 
              key="chats"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col h-full"
            >
              <header className="h-[72px] border-b border-[#1f1f1f] flex items-center justify-between px-6 bg-[#0a0a0a] shrink-0">
                <div className="flex items-center gap-4">
                  <div className="font-semibold text-white text-lg flex items-center gap-2">
                    {activeTab === 'groups' ? <Hash className="w-5 h-5 text-[#666]" /> : <Users className="w-5 h-5 text-[#666]" />}
                    {roomName}
                  </div>
                  {activeTab === 'groups' && activeGroupId && (
                    <span className="text-xs text-[#666] bg-[#222] px-2 py-1 rounded-md">ID: {activeGroupId}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <HeaderButton icon={<Phone className="w-5 h-5" />} onClick={() => setActiveTab('calls')} />
                  <HeaderButton icon={<Video className="w-5 h-5" />} onClick={() => setActiveTab('calls')} />
                  {activeTab === 'groups' && (
                    <>
                      <div className="w-px h-6 bg-[#222] mx-2"></div>
                      <HeaderButton icon={<Users className="w-5 h-5" />} onClick={() => setShowMembers(!showMembers)} />
                    </>
                  )}
                </div>
              </header>

              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col relative">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isVoiceChannel ? (
                  <div className="h-full flex flex-col items-center justify-center text-[#555] relative">
                    {isInVoice ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] rounded-2xl border border-[#222]">
                        <div className="flex-1 flex items-center justify-center gap-6 p-10 w-full flex-wrap overflow-y-auto">
                          <div className="flex flex-col items-center gap-4">
                            <div className={`w-64 h-48 rounded-2xl flex items-center justify-center overflow-hidden border-4 transition-colors relative ${isSpeaking ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : (isMuted ? 'border-red-500/50' : 'border-[#333]')} bg-[#222]`}>
                              {(isVideoOn || isScreenSharing) && localStream ? (
                                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <img src={user?.avatarUrl || avatarImg} alt="Вы" className="w-24 h-24 rounded-full object-cover" />
                                </div>
                              )}
                              {isMuted && (
                                <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                                  <Mic size={12} className="text-white opacity-50" />
                                </div>
                              )}
                              {isDeafened && (
                                <div className="absolute top-2 right-8 bg-red-500 rounded-full p-1">
                                  <Headphones size={12} className="text-white opacity-50" />
                                </div>
                              )}
                            </div>
                            <span className="text-white font-medium">Вы</span>
                          </div>
                          
                          {/* Other participants */}
                          {voiceParticipants[activeRoom]?.filter(name => name !== user?.name).map((pName, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-4">
                              <div className={`w-64 h-48 rounded-2xl flex items-center justify-center overflow-hidden border-4 border-[#333] bg-[#222] transition-colors relative`}>
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-24 h-24 rounded-full bg-[#333] flex items-center justify-center text-3xl font-bold text-white">
                                    {pName[0].toUpperCase()}
                                  </div>
                                </div>
                              </div>
                              <span className="text-white font-medium">{pName}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="h-24 w-full bg-[#111] border-t border-[#222] rounded-b-2xl flex items-center justify-center gap-6">
                          <button 
                            onClick={() => setIsMuted(!isMuted)} 
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#222] text-white hover:bg-[#333]'}`}
                            title={isMuted ? "Включить микрофон" : "Выключить микрофон"}
                          >
                            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                          </button>
                          <button 
                            onClick={() => setIsDeafened(!isDeafened)} 
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isDeafened ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#222] text-white hover:bg-[#333]'}`}
                            title={isDeafened ? "Включить звук" : "Выключить звук"}
                          >
                            {isDeafened ? <Headphones size={24} className="opacity-50" /> : <Headphones size={24} />}
                          </button>
                          <button 
                            onClick={() => setIsVideoOn(!isVideoOn)} 
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isVideoOn ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-[#222] text-white hover:bg-[#333]'}`}
                            title="Камера"
                          >
                            <Video size={24} />
                          </button>
                          <button 
                            onClick={() => setIsScreenSharing(!isScreenSharing)} 
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isScreenSharing ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-[#222] text-white hover:bg-[#333]'}`}
                            title="Демонстрация экрана"
                          >
                            <Monitor size={24} />
                          </button>
                          <button 
                            onClick={leaveVoice} 
                            className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                            title="Отключиться"
                          >
                            <PhoneMissed size={24} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-24 h-24 rounded-full border border-[#333] bg-[#111] flex items-center justify-center mb-6">
                          <Mic className="w-8 h-8 text-[#888]" />
                        </div>
                        <h2 className="text-xl font-medium text-white mb-2">Голосовой канал: {roomName}</h2>
                        <p className="text-sm mb-6">Подключите микрофон, чтобы начать говорить.</p>
                        <button 
                          onClick={() => joinVoice(activeRoom)}
                          className="px-6 py-2.5 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" /> Подключиться
                        </button>
                      </>
                    )}
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-[#555]">
                    <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                    <h2 className="text-xl font-medium text-white mb-2">Добро пожаловать в {roomName}</h2>
                    <p>Пока нет сообщений. Начните общение!</p>
                  </div>
                ) : (
                  filteredMessages.map((m: any) => {
                    const isMe = m.senderId === user?.id;
                    return (
                      <div key={m.id} className={`flex gap-4 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                        <div className="w-10 h-10 rounded-full bg-[#222] shrink-0 overflow-hidden flex items-center justify-center border border-[#333]">
                          <UserAvatar name={m.senderName} isMe={isMe} />
                        </div>
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <span className="font-medium text-[#ccc] text-sm">{isMe ? 'Вы' : m.senderName}</span>
                            <span className="text-[11px] text-[#555]">
                              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className={`p-3.5 text-[14px] leading-relaxed relative group/msg ${isMe ? 'bg-white text-black rounded-2xl rounded-tr-sm' : 'bg-[#1a1a1a] text-[#eee] rounded-2xl rounded-tl-sm border border-[#222]'}`}>
                            {m.text}
                            {m.attachmentUrl && (
                              <div className="mt-2 rounded-xl overflow-hidden border border-[#333]">
                                <img src={m.attachmentUrl} alt="attachment" className="max-w-[300px] max-h-[300px] object-contain" />
                              </div>
                            )}
                            {(isMe || isGroupOwner) && (
                              <button 
                                onClick={() => deleteMessage(m.id)}
                                className={`absolute -top-3 ${isMe ? '-right-3' : '-left-3'} p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover/msg:opacity-100 transition-opacity shadow-lg hover:bg-red-600`}
                                title="Удалить сообщение"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-6 pt-0">
                {attachment && (
                  <div className="mb-2 p-2 bg-[#111] rounded-xl border border-[#222] inline-flex items-center gap-2 relative">
                    <img src={attachment} alt="preview" className="h-16 w-16 object-cover rounded-lg" />
                    <button onClick={() => setAttachment(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                      <X size={12} />
                    </button>
                  </div>
                )}
                <form onSubmit={sendMessage} className={`bg-[#111] border border-[#222] rounded-2xl p-2 flex items-end gap-2 focus-within:border-[#444] transition-colors ${isVoiceChannel ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 text-[#666] hover:text-white transition-colors rounded-xl hover:bg-[#222]">
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <textarea 
                    value={msgInput}
                    onChange={e => setMsgInput(e.target.value)}
                    onKeyDown={e => {
                      if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e as any); }
                    }}
                    placeholder={isVoiceChannel ? "Чат отключен в голосовом канале" : `Написать в ${roomName}...`} 
                    className="flex-1 bg-transparent border-none outline-none text-white resize-none max-h-32 min-h-[44px] py-3 text-[14px] placeholder:text-[#555]"
                    rows={1}
                    disabled={isVoiceChannel}
                  />
                  <button type="submit" disabled={(!msgInput.trim() && !attachment) || isVoiceChannel} className="p-3 bg-white text-black hover:bg-gray-200 transition-colors rounded-xl disabled:opacity-50 disabled:hover:bg-white">
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
              </div>
              
              {/* Members Sidebar */}
              <AnimatePresence>
                {activeTab === 'groups' && showMembers && activeGroupData && (
                  <motion.div 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-l border-[#1f1f1f] bg-[#0a0a0a] flex flex-col shrink-0 overflow-hidden"
                  >
                    <div className="p-4 border-b border-[#1f1f1f] flex items-center justify-between shrink-0 h-[72px]">
                      <h3 className="font-semibold text-white">Участники</h3>
                      <span className="text-xs bg-[#222] text-[#888] px-2 py-1 rounded-full">{activeGroupData.members.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {activeGroupData.members.map(memberId => {
                        const isOnline = onlineUsers.some(u => u.id === memberId);
                        const isOwner = activeGroupData.ownerId === memberId;
                        const isMe = memberId === user?.id;
                        // In a real app we'd fetch member details, for now just use ID as name if friend data not found
                        const friendData = friends.find(f => f.id === memberId);
                        const memberName = memberId === user?.id ? user?.name : (friendData?.name || `Пользователь ${memberId.slice(0,4)}`);
                        
                        return (
                          <div key={memberId} className="flex items-center justify-between p-2 rounded-xl hover:bg-[#111] group transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center relative shrink-0">
                                <UserAvatar name={memberName} isMe={isMe} />
                                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-[#0a0a0a] rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-white text-sm flex items-center gap-1">
                                  <span className="truncate">{memberName}</span>
                                  {isOwner && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 rounded-sm">Владелец</span>}
                                </div>
                              </div>
                            </div>
                            {isGroupOwner && !isMe && activeGroupId && (
                              <button 
                                onClick={() => leaveGroup(activeGroupId, memberId)}
                                className="p-1.5 text-[#666] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 bg-red-500/10 rounded-md"
                                title="Исключить участника"
                              >
                                <UserX size={14} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>

            </motion.div>
            )
          ) : activeTab === 'calls' ? (
            <motion.div 
              key="calls"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col absolute inset-0 bg-[#0a0a0a]"
            >
              <div className="p-10 border-b border-[#1f1f1f]">
                <h2 className="text-2xl font-bold text-white">История звонков</h2>
                <p className="text-[#888] text-sm mt-1">Просмотр вашей истории голосовых и видео звонков</p>
              </div>
              <div className="flex-1 overflow-y-auto p-10">
                {callHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-[#555]">
                    <div className="w-24 h-24 rounded-full border border-[#222] flex items-center justify-center mb-6 bg-[#111]">
                      <Phone className="w-8 h-8 text-[#666]" />
                    </div>
                    <h2 className="text-xl font-medium text-white mb-2">Нет недавних звонков</h2>
                    <p className="text-sm">Ваша история звонков пуста.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-w-3xl mx-auto">
                    {callHistory.map(call => (
                      <div key={call.id} className="bg-[#111] border border-[#222] p-4 rounded-2xl flex items-center justify-between hover:border-[#333] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center">
                            {call.type === 'incoming' && <PhoneIncoming className="w-5 h-5 text-blue-500" />}
                            {call.type === 'outgoing' && <PhoneOutgoing className="w-5 h-5 text-green-500" />}
                            {call.type === 'missed' && <PhoneMissed className="w-5 h-5 text-red-500" />}
                          </div>
                          <div>
                            <div className="text-white font-medium">{call.userName}</div>
                            <div className="text-xs text-[#666] flex items-center gap-2 mt-0.5">
                              <span className={call.type === 'missed' ? 'text-red-500' : ''}>
                                {call.type === 'incoming' ? 'Входящий' : call.type === 'outgoing' ? 'Исходящий' : 'Пропущенный'} звонок
                              </span>
                              <span>•</span>
                              <span>{new Date(call.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <button className="w-10 h-10 rounded-full bg-[#222] hover:bg-white hover:text-black text-white flex items-center justify-center transition-colors">
                          <Phone className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'settings' ? (
            <SettingsPanel key="settings" user={user} />
          ) : null}
        </AnimatePresence>
      </main>

      {/* Modals & Context Menus */}
      <AnimatePresence>
        {showCreateGroupModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-[#222] flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Создать свою группу</h2>
                <button onClick={() => setShowCreateGroupModal(false)} className="text-[#888] hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateGroup} className="p-6 space-y-6">
                <div className="flex justify-center">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#444] flex flex-col items-center justify-center text-[#666] hover:text-white hover:border-[#888] transition-colors cursor-pointer bg-[#1a1a1a]">
                    <Camera size={24} className="mb-2" />
                    <span className="text-xs font-medium uppercase tracking-wider">Загрузить</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#888] uppercase mb-2 block">Название группы</label>
                  <input 
                    type="text" 
                    placeholder="Новая группа" 
                    value={groupNameInput}
                    onChange={e => setGroupNameInput(e.target.value)}
                    className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#555] transition-colors"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreateGroupModal(false)} className="flex-1 py-2.5 bg-transparent border border-[#333] text-white rounded-lg text-sm font-medium hover:bg-[#222] transition-colors">Отмена</button>
                  <button type="submit" disabled={!groupNameInput.trim()} className="flex-1 py-2.5 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50">Создать</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showJoinGroupModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-[#222] flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Присоединиться к группе</h2>
                <button onClick={() => setShowJoinGroupModal(false)} className="text-[#888] hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleJoinGroup} className="p-6 space-y-6">
                <div>
                  <label className="text-xs font-semibold text-[#888] uppercase mb-2 block">Код приглашения</label>
                  <input 
                    type="text" 
                    placeholder="Например: ABCD-1234" 
                    value={joinGroupInput}
                    onChange={e => setJoinGroupInput(e.target.value)}
                    className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#555] transition-colors"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowJoinGroupModal(false)} className="flex-1 py-2.5 bg-transparent border border-[#333] text-white rounded-lg text-sm font-medium hover:bg-[#222] transition-colors">Отмена</button>
                  <button type="submit" disabled={!joinGroupInput.trim()} className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50">Присоединиться</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      {contextMenuTarget && (
        <div 
          className="fixed z-50 bg-[#111] border border-[#222] rounded-xl shadow-2xl py-1 w-48 overflow-hidden"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
        >
          <button 
            className="w-full text-left px-4 py-2 text-sm text-[#ccc] hover:bg-[#222] hover:text-white transition-colors"
            onClick={() => {
              setActiveGroup(contextMenuTarget);
              setShowGroupSettingsModal(true);
              closeContextMenu();
            }}
          >
            Настройки группы
          </button>
          <div className="my-1 border-t border-[#222]"></div>
          <button 
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
            onClick={() => {
              if (confirm("Вы уверены, что хотите покинуть эту группу?")) {
                leaveGroup(contextMenuTarget, user?.id || '');
                setActiveGroup(null);
                setActiveTab('friends');
              }
              closeContextMenu();
            }}
          >
            Покинуть группу
          </button>
        </div>
      )}

      {/* Group Settings Modal */}
      <AnimatePresence>
        {showGroupSettingsModal && activeGroupId && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-[#222] flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Настройки группы</h2>
                <button onClick={() => setShowGroupSettingsModal(false)} className="text-[#888] hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="text-xs font-semibold text-[#888] uppercase mb-2 block">Код приглашения</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={groups.find(g => g.id === activeGroupId)?.inviteCode || ''}
                      readOnly
                      className="flex-1 bg-[#222] border border-[#333] rounded-lg px-4 py-2.5 text-[#888] text-sm focus:outline-none"
                    />
                    <button 
                      onClick={copyInviteCode}
                      className="py-2.5 px-4 bg-[#222] border border-[#333] text-white rounded-lg text-sm font-medium hover:bg-[#333] transition-colors"
                    >
                      Копировать
                    </button>
                  </div>
                </div>
                {user?.id === groups.find(g => g.id === activeGroupId)?.ownerId && (
                  <>
                    <div className="pt-4 border-t border-[#222]">
                      <label className="text-xs font-semibold text-[#888] uppercase mb-2 block">Изменить название</label>
                      <input 
                        type="text" 
                        defaultValue={groups.find(g => g.id === activeGroupId)?.name || ''}
                        onBlur={(e) => {
                          if (e.target.value.trim()) {
                            useStore.getState().updateGroup(activeGroupId, { name: e.target.value.trim() });
                          }
                        }}
                        className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#555] transition-colors"
                      />
                    </div>
                  </>
                )}
                <div className="pt-2">
                  <button onClick={() => setShowGroupSettingsModal(false)} className="w-full py-2.5 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Готово</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- Subcomponents ---

function SettingsPanel({ user }: { user: any }) {
  const { updateUser, settingsTab, setSettingsTab } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editStatus, setEditStatus] = useState(user?.status || 'online');
  const [editAvatar, setEditAvatar] = useState(user?.avatarUrl || avatarImg);
  const [editBanner, setEditBanner] = useState(user?.bannerUrl || '');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Audio settings
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('default');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('default');
  const [micVolume, setMicVolume] = useState<number>(0);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const micTestRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (settingsTab === 'audio') {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        setAudioInputs(devices.filter(d => d.kind === 'audioinput'));
        setAudioOutputs(devices.filter(d => d.kind === 'audiooutput'));
      });
    } else {
      stopMicTest();
    }
    return () => stopMicTest();
  }, [settingsTab]);

  const stopMicTest = () => {
    setIsTestingMic(false);
    if (micTestRef.current) cancelAnimationFrame(micTestRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setMicVolume(0);
  };

  const startMicTest = async () => {
    if (isTestingMic) {
      stopMicTest();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedMic !== 'default' ? { exact: selectedMic } : undefined }
      });
      micStreamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        setMicVolume(Math.min(100, Math.round((sum / bufferLength) * 2))); // amplify a bit
        micTestRef.current = requestAnimationFrame(updateVolume);
      };
      setIsTestingMic(true);
      updateVolume();
    } catch (err) {
      console.error("Mic test error:", err);
      alert("Could not access microphone.");
    }
  };

  const handleSave = () => {
    if (editName.trim()) {
      updateUser({ 
        name: editName.trim(),
        bio: editBio.trim(),
        status: editStatus,
        avatarUrl: editAvatar,
        bannerUrl: editBanner
      });
      setIsEditing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex overflow-hidden absolute inset-0 bg-[#0a0a0a]"
    >
      {/* Settings Sidebar */}
      <div className="w-64 bg-[#111] border-r border-[#222] p-6 flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-2 px-3">Настройки</h3>
        <button onClick={() => setSettingsTab('profile')} className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${settingsTab === 'profile' ? 'bg-[#222] text-white' : 'text-[#888] hover:bg-[#1a1a1a] hover:text-[#ccc]'}`}>Мой профиль</button>
        <button onClick={() => setSettingsTab('notifications')} className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${settingsTab === 'notifications' ? 'bg-[#222] text-white' : 'text-[#888] hover:bg-[#1a1a1a] hover:text-[#ccc]'}`}>Уведомления</button>
        <button onClick={() => setSettingsTab('appearance')} className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${settingsTab === 'appearance' ? 'bg-[#222] text-white' : 'text-[#888] hover:bg-[#1a1a1a] hover:text-[#ccc]'}`}>Внешний вид</button>
        <button onClick={() => setSettingsTab('audio')} className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${settingsTab === 'audio' ? 'bg-[#222] text-white' : 'text-[#888] hover:bg-[#1a1a1a] hover:text-[#ccc]'}`}>Голос и видео</button>
        <div className="my-2 border-t border-[#222]"></div>
        <button onClick={() => setSettingsTab('about')} className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${settingsTab === 'about' ? 'bg-[#222] text-white' : 'text-[#888] hover:bg-[#1a1a1a] hover:text-[#ccc]'}`}>О приложении</button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-10">
        {settingsTab === 'profile' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-8">Мой профиль</h2>
            
            <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden relative mb-8">
              {/* Banner */}
              <div className="h-32 bg-gradient-to-r from-blue-900 to-purple-900 relative group">
                {(editBanner || user?.bannerUrl) && <img src={editBanner || user?.bannerUrl} alt="banner" className="w-full h-full object-cover" />}
                {isEditing && (
                  <div onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                    <Camera className="text-white" />
                    <input type="file" accept="image/*" ref={bannerInputRef} onChange={(e) => handleImageUpload(e, setEditBanner)} className="hidden" />
                  </div>
                )}
              </div>
              
              <div className="px-6 pb-6 relative">
                {/* Avatar */}
                <div className="absolute -top-12 left-6 w-24 h-24 rounded-full border-4 border-[#111] bg-[#222] overflow-hidden group">
                  <img src={editAvatar || user?.avatarUrl || avatarImg} alt="avatar" className="w-full h-full object-cover" />
                  {isEditing && (
                    <div onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                      <Camera className="text-white" />
                      <input type="file" accept="image/*" ref={avatarInputRef} onChange={(e) => handleImageUpload(e, setEditAvatar)} className="hidden" />
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 mb-4">
                  {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="px-4 py-1.5 bg-[#222] hover:bg-[#333] text-white text-sm font-medium rounded-lg transition-colors border border-[#333]">
                      Редактировать
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4 mt-8">
                    <div>
                      <label className="text-xs text-[#888] mb-1 block">Отображаемое имя</label>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-[#222] border border-[#444] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs text-[#888] mb-1 block">Обо мне</label>
                      <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Пара слов о себе..." className="w-full bg-[#222] border border-[#444] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white transition-colors resize-none h-20" />
                    </div>
                    <div>
                      <label className="text-xs text-[#888] mb-1 block">Статус</label>
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full bg-[#222] border border-[#444] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white transition-colors">
                        <option value="online">В сети</option>
                        <option value="busy">Не беспокоить</option>
                        <option value="offline">Невидимка</option>
                      </select>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-[#222]">
                      <button onClick={handleSave} className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Сохранить</button>
                      <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-transparent text-white border border-[#444] rounded-lg text-sm font-medium hover:bg-[#222] transition-colors">Отмена</button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 bg-[#1a1a1a] rounded-xl p-4 border border-[#222]">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-white">{user?.name}</h3>
                      <span className="text-sm text-[#888]">#{user?.id}</span>
                    </div>
                    <div className="text-sm text-[#666] mb-4 flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${user?.status === 'online' ? 'bg-green-500' : user?.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                      <span className="capitalize">{user?.status === 'online' ? 'В сети' : user?.status === 'busy' ? 'Не беспокоить' : 'Невидимка'}</span>
                    </div>
                    <div className="text-xs font-semibold text-[#666] uppercase mb-2">Обо мне</div>
                    <p className="text-sm text-[#ccc] whitespace-pre-wrap">{user?.bio || "Информация о себе не добавлена."}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {settingsTab === 'notifications' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-8">Уведомления</h2>
            <div className="bg-[#111] border border-[#222] rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium mb-1">Звуки сообщений</h3>
                  <p className="text-sm text-[#888]">Воспроизводить звук при получении новых сообщений</p>
                </div>
                <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-[#222]">
                <div>
                  <h3 className="text-white font-medium mb-1">Звук звонка</h3>
                  <p className="text-sm text-[#888]">Воспроизводить звук при входящем вызове</p>
                </div>
                <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-[#222]">
                <div>
                  <h3 className="text-white font-medium mb-1">Всплывающие уведомления (Windows)</h3>
                  <p className="text-sm text-[#888]">Показывать системные уведомления</p>
                </div>
                <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {settingsTab === 'appearance' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-8">Внешний вид</h2>
            <div className="bg-[#111] border border-[#222] rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-white font-medium mb-4">Тема оформления</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border-2 border-white rounded-xl p-4 bg-[#0a0a0a] cursor-pointer">
                    <div className="w-full h-24 bg-[#111] rounded-lg mb-3 border border-[#222] flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-[#222]"></div>
                    </div>
                    <p className="text-center text-white font-medium">Темная (выбрана)</p>
                  </div>
                  <div className="border-2 border-[#222] rounded-xl p-4 bg-white cursor-not-allowed opacity-50">
                    <div className="w-full h-24 bg-gray-100 rounded-lg mb-3 border border-gray-200 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                    </div>
                    <p className="text-center text-black font-medium">Светлая (скоро)</p>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-[#222]">
                <h3 className="text-white font-medium mb-4">Масштаб шрифта чата</h3>
                <input type="range" min="12" max="24" defaultValue="14" className="w-full accent-white" />
                <div className="flex justify-between text-xs text-[#888] mt-2">
                  <span>12px</span>
                  <span>14px</span>
                  <span>24px</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {settingsTab === 'audio' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-8">Voice & Video</h2>
            <div className="bg-[#111] border border-[#222] rounded-2xl p-6 space-y-6">
              <div>
                <label className="text-xs font-semibold text-[#888] uppercase mb-2 block">Input Device (Microphone)</label>
                <select 
                  value={selectedMic} 
                  onChange={e => setSelectedMic(e.target.value)}
                  className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#555]"
                >
                  <option value="default">Default</option>
                  {audioInputs.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${device.deviceId.slice(0,5)}`}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#888] uppercase mb-2 block">Output Device (Headphones)</label>
                <select 
                  value={selectedSpeaker} 
                  onChange={e => setSelectedSpeaker(e.target.value)}
                  className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#555]"
                >
                  <option value="default">Default</option>
                  {audioOutputs.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>{device.label || `Speaker ${device.deviceId.slice(0,5)}`}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-[#222]">
                <label className="text-xs font-semibold text-[#888] uppercase mb-4 block">Mic Test</label>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={startMicTest}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${isTestingMic ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white text-black hover:bg-gray-200'}`}
                  >
                    {isTestingMic ? 'Stop Test' : 'Let\'s Check'}
                  </button>
                  <div className="flex-1 h-3 bg-[#222] rounded-full overflow-hidden border border-[#333]">
                    <div 
                      className="h-full bg-green-500 transition-all duration-75"
                      style={{ width: `${micVolume}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-xs text-[#666] mt-2">Click the button and start speaking to test your microphone.</p>
              </div>
            </div>
          </div>
        )}

        {settingsTab === 'about' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-8">About Friendly</h2>
            <div className="bg-[#111] border border-[#222] rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <img src={avatarImg} alt="Logo" className="w-24 h-24 rounded-3xl mb-4 border border-[#333]" />
              <h3 className="text-xl font-bold text-white">Friendly Workspace</h3>
              <p className="text-[#888] mt-2">Version 2.0.0 (Stable)</p>
              <p className="text-[#666] text-sm mt-4 max-w-md">A modern, fast, and secure communication platform built for professionals and friends alike.</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}



function NavButton({ icon, isActive, onClick, className = '' }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 relative group ${isActive ? 'bg-white text-black' : 'text-[#666] hover:bg-[#1a1a1a] hover:text-white'} ${className}`}
    >
      {icon}
    </button>
  );
}

function HeaderButton({ icon, onClick }: any) {
  return (
    <button onClick={onClick} className="w-10 h-10 rounded-xl flex items-center justify-center text-[#666] hover:bg-[#1a1a1a] hover:text-white transition-colors">
      {icon}
    </button>
  );
}

function UserAvatar({ name, isMe = false }: { name: string, isMe?: boolean }) {
  if (isMe) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-[#222]">
        <img src={avatarImg} alt="avatar" className="w-full h-full object-cover z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <span className="absolute text-white font-medium text-sm z-0">{name?.[0]?.toUpperCase() || '?'}</span>
      </div>
    );
  }
  return <span className="text-white font-medium text-sm">{name?.[0]?.toUpperCase() || '?'}</span>;
}
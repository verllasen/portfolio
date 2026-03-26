import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy' | 'dnd';
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}

export interface Group {
  id: string;
  name: string;
  icon?: string;
  ownerId: string;
  members: string[]; // array of user IDs
  inviteCode?: string;
}

export interface Channel {
  id: string;
  groupId: string;
  name: string;
  type: 'text' | 'voice';
}

export interface Friend {
  id: string;
  name: string;
  status: 'accepted' | 'pending_incoming' | 'pending_outgoing';
}

export interface CallHistory {
  id: string;
  userId: string;
  userName: string;
  type: 'incoming' | 'outgoing' | 'missed';
  timestamp: number;
  duration?: number;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  roomId: string; // can be channelId or dmRoomId
  attachmentUrl?: string;
}

interface AppState {
  isAppLoaded: boolean;
  isAuthenticated: boolean;
  user: User | null;
  activeTab: 'groups' | 'friends' | 'calls' | 'settings';
  activeGroupId: string | null;
  activeRoom: string; // current channel or DM
  friendsTab: 'all' | 'pending' | 'add';
  settingsTab: 'profile' | 'notifications' | 'appearance' | 'audio' | 'about';
  onlineUsers: User[];
  messages: Message[];
  groups: Group[];
  channels: Channel[];
  friends: Friend[];
  callHistory: CallHistory[];
  voiceParticipants: Record<string, string[]>; // channelId -> array of user names
  
  setAppLoaded: (loaded: boolean) => void;
  login: (user: User) => void;
  logout: () => void;
  setActiveTab: (tab: 'groups' | 'friends' | 'calls' | 'settings') => void;
  setActiveGroup: (groupId: string | null) => void;
  setActiveRoom: (roomId: string) => void;
  setFriendsTab: (tab: 'all' | 'pending' | 'add') => void;
  setSettingsTab: (tab: 'profile' | 'notifications' | 'appearance' | 'audio' | 'about') => void;
  setOnlineUsers: (users: User[]) => void;
  
  addMessage: (msg: Message) => void;
  deleteMessage: (msgId: string) => void;
  updateUser: (updates: Partial<User>) => void;
  
  addGroup: (group: Group) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  leaveGroup: (groupId: string, userId: string) => void;
  joinGroup: (inviteCode: string, userId: string) => boolean;
  generateInviteCode: (groupId: string) => string;
  
  addChannel: (channel: Channel) => void;
  
  addFriend: (friend: Friend) => void;
  removeFriend: (friendId: string) => void;
  acceptFriend: (friendId: string) => void;
  
  addCallHistory: (call: CallHistory) => void;
  setVoiceParticipants: (channelId: string, participants: string[]) => void;
}

export const useStore = create<AppState>((set, get) => ({
  isAppLoaded: false,
  isAuthenticated: false,
  user: null,
  activeTab: 'friends',
  activeGroupId: null,
  activeRoom: '',
  friendsTab: 'all',
  settingsTab: 'profile',
  onlineUsers: [],
  messages: [],
  groups: [],
  channels: [],
  friends: [],
  callHistory: [],
  voiceParticipants: {},

  setAppLoaded: (loaded) => set({ isAppLoaded: loaded }),
  login: (user) => set({ isAuthenticated: true, user }),
  logout: () => set({ isAuthenticated: false, user: null, activeTab: 'friends', activeRoom: '', activeGroupId: null }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveGroup: (groupId) => set({ activeGroupId: groupId }),
  setActiveRoom: (roomId) => set({ activeRoom: roomId }),
  setFriendsTab: (tab) => set({ friendsTab: tab }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  deleteMessage: (msgId) => set((state) => ({ messages: state.messages.filter(m => m.id !== msgId) })),
  updateUser: (updates) => set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
  
  addGroup: (group) => set((state) => ({ groups: [...state.groups, { ...group, inviteCode: Math.random().toString(36).substring(2, 10).toUpperCase() }] })),
  updateGroup: (groupId, updates) => set((state) => ({
    groups: state.groups.map(g => g.id === groupId ? { ...g, ...updates } : g)
  })),
  leaveGroup: (groupId, userId) => set((state) => ({
    groups: state.groups.map(g => g.id === groupId ? { ...g, members: g.members.filter(m => m !== userId) } : g)
  })),
  joinGroup: (inviteCode, userId) => {
    const state = get();
    const group = state.groups.find(g => g.inviteCode === inviteCode);
    if (group && !group.members.includes(userId)) {
      set({ groups: state.groups.map(g => g.id === group.id ? { ...g, members: [...g.members, userId] } : g) });
      return true;
    }
    return false;
  },
  generateInviteCode: (groupId) => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    set((state) => ({ groups: state.groups.map(g => g.id === groupId ? { ...g, inviteCode: code } : g) }));
    return code;
  },
  
  addChannel: (channel) => set((state) => ({ channels: [...state.channels, channel] })),
  
  addFriend: (friend) => set((state) => ({ friends: [...state.friends, friend] })),
  removeFriend: (friendId) => set((state) => ({ friends: state.friends.filter(f => f.id !== friendId) })),
  acceptFriend: (friendId) => set((state) => ({ friends: state.friends.map(f => f.id === friendId ? { ...f, status: 'accepted' } : f) })),
  
  addCallHistory: (call) => set((state) => ({ callHistory: [call, ...state.callHistory] })),
  setVoiceParticipants: (channelId, participants) => set((state) => ({ voiceParticipants: { ...state.voiceParticipants, [channelId]: participants } })),
}));
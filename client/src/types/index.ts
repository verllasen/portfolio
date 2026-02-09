export type Role = 'Руководитель' | 'TeamLead' | 'Заместитель' | 'Senior' | 'Middle' | 'Junior' | 'Freelancer';

export type Specialization = 'Frontend' | 'Backend' | 'Fullstack' | 'Mobile' | 'GameDev';

export interface GameSettings {
  fullscreen: boolean;
  animations: boolean;
  soundVolume: number;
  musicVolume: number;
  isMusicPlaying?: boolean;
}

export interface Friend {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'in-game';
  avatar?: string;
}

export interface PlayerStats {
  level: number;
  xp: number;
  completedMissions: number;
  productivity: number; // 0-100%
}

export interface Player {
  id: string;
  name: string;
  role: Role; // Studio Role (permissions)
  title: string; // Skill Level (Junior, Middle, Senior, etc.)
  missionRole?: string; // e.g. 'HTML', 'CSS', 'JS', 'SQL'
  friendCode: string; // Unique code for adding friends
  isLeader: boolean; // Deprecated in favor of Role check, but kept for compatibility
  stats: PlayerStats;
  avatar?: string;
  banner?: string;
  bannerPosition?: number;
  bannerScale?: number;
  bio?: string;
  tags?: string[]; // e.g. ["SQL", "React", "Management"]
}

export interface MissionState {
  html: string;
  css: string;
  js: string;
  sql: string;
}

export interface ResearchNode {
  id: string;
  title: string;
  description: string;
  cost: number;
  unlocked: boolean;
  requiredLevel: number;
  prerequisites: string[]; // IDs of required nodes
  effect: string; // e.g., "unlocks_mission_type_hard" or "productivity_boost"
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'furniture' | 'equipment' | 'buff';
  purchased: boolean;
  effect?: string;
}

export interface ValidationRule {
  id: string;
  type: 'regex' | 'includes' | 'notIncludes' | 'minLength';
  value: string; // The regex pattern or string to check
  errorMsg: string; // Message to show if validation fails
}

export interface Stage {
  id: string;
  title: string;
  description: string;
  hint: string;
  codeSnippet?: string; // Starter code for this stage
  validationRules?: ValidationRule[]; // New robust validation system
  validationCriteria?: string; // Legacy simple string check
}

export interface Task {
  id: string;
  role: string; // Specialization
  title: string; // Overall task title
  stages: Stage[];
  currentStageIndex: number;
  completed: boolean;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  reward: number;
  tasks: Task[];
  status: 'available' | 'in_progress' | 'completed';
  globalDocs: string; // Shared documentation
  requiredSpecialization?: Specialization[]; // If undefined, available to all
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  system?: boolean;
}

export interface Team {
  code: string;
  name: string;
  specializations: Specialization[];
  members: Player[];
  money: number;
  rating: number;
  activeMissionId: string | null;
  missionStatus: 'idle' | 'preparing' | 'in_progress';
  missionReadyMembers: string[]; // IDs of members ready for mission
  missionStartTime?: number;
  missionState: MissionState; // Shared code repository
  researchTree: ResearchNode[];
  inventory: ShopItem[];
  avatar?: string;
  banner?: string;
  bannerPosition?: number;
  bannerScale?: number;
  pendingMembers: Player[]; // For invite-only logic
  isPrivate: boolean;
  privacyType?: 'open' | 'closed' | 'invite_only';
  chatMessages: ChatMessage[];
  researchPoints: number;
  completedMissions: number;
  bannedIds?: string[]; // IDs of banned players
}

export type ViewState = 'menu' | 'profile-setup' | 'create-studio' | 'lobby' | 'dashboard' | 'workspace' | 'leaderboard' | 'settings' | 'profile' | 'report';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  type: 'studio' | 'coder';
  score: number; // Rating for studio, XP for coder
  avatar?: string;
  banner?: string;
}

export interface Track {
  id: string;
  title: string;
  src: string;
  artist?: string;
  duration?: number;
}

export interface GameState {
  view: ViewState;
  isLoading: boolean;
  currentUser: Player | null;
  team: Team | null;
  availableMissions: Mission[];
  settings: GameSettings;
  friends: Friend[];
  notifications: Notification[];
  leaderboard: LeaderboardEntry[];

  // Music Player State
  playlist: Track[];
  currentTrackIndex: number;
  isPlayerOpen: boolean;
  togglePlayer: () => void;
  playTrack: (index: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  addToPlaylist: (track: Track) => void;
  setPlaylist: (tracks: Track[]) => void;

  setLoading: (loading: boolean) => void;
  setView: (view: ViewState) => void;
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  removeNotification: (id: string) => void;
  createProfile: (name: string, avatar?: string, banner?: string) => void;
  createTeam: (teamName: string, specialization: Specialization) => void;
  joinTeam: (name: string, teamCode: string) => void;
  takeContract: (missionId: string) => void;
  joinContract: () => void;
  startMission: () => void;
  leaveMission: () => void;
  cancelMission: () => void;
  finishMission: () => void;
  completeStage: (taskId: string, playerId: string) => void;
  setMissionRole: (playerId: string, role: string) => void;
  buyItem: (itemId: string) => void;
  unlockResearch: (researchId: string) => void;
  deleteStudio: () => void;
  updateSettings: (newSettings: Partial<GameSettings>) => void;
  addFriend: (name: string) => void;
  addFriendByCode: (code: string) => Promise<void>;
  updateMissionCode: (role: string, code: string) => void;
  addSpecialization: (spec: Specialization) => void;
  updateProfile: (updates: Partial<Player>) => void;
  updateTeamProfile: (updates: Partial<Team>) => void;
  kickMember: (playerId: string) => void;
  promoteMember: (playerId: string, newRole: Role) => void;
  toggleTeamPrivacy: () => void;
  acceptMember: (playerId: string) => void;
  rejectMember: (playerId: string) => void;
  sendChatMessage: (text: string) => void;
  addMemberMock: (name: string, role: Role) => void;
  logout: () => void;
  leaveTeam: () => void;

  
  // Socket & Social
  socket: any;
  initSocket: () => void;
  deleteChatMessage: (messageId: string) => void;
  friendRequests: Friend[];
  acceptFriendRequest: (friend: Friend) => void;
  rejectFriendRequest: (friendId: string) => void;
  inviteToStudio: (friendId: string) => void;
  removeFriend: (friendId: string) => void;
  isConnected: boolean;
  
  // Invites
  studioInvites: { studioName: string, studioCode: string, inviterName: string }[];
  acceptStudioInvite: (code: string) => void;
  rejectStudioInvite: (code: string) => void;
  registrationError: string | null;
}

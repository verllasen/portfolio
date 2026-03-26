import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../../dist')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const DB_FILE = path.join(__dirname, 'db.json');

// Helper to read DB
const readDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], groups: [], messages: [], friends: [] }));
  }
  const data = fs.readFileSync(DB_FILE, 'utf8');
  const parsed = JSON.parse(data);
  if (!parsed.friends) parsed.friends = [];
  return parsed;
};

// Helper to write DB
const writeDB = (data: any) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// Auth routes
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  const db = readDB();
  
  if (db.users.find((u: any) => u.email === email)) {
    return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password, // In a real app, hash the password!
    status: 'online'
  };

  db.users.push(newUser);
  writeDB(db);

  res.json({ id: newUser.id, name: newUser.name, status: newUser.status, email: newUser.email });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  
  const user = db.users.find((u: any) => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Неверный email или пароль' });
  }

  res.json({ id: user.id, name: user.name, status: user.status, email: user.email });
});

// Groups routes
app.post('/api/groups', (req, res) => {
  const { name, ownerId } = req.body;
  const db = readDB();
  const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  const newGroup = {
    id: Date.now().toString(),
    name,
    ownerId,
    members: [ownerId],
    inviteCode,
    channels: [{ id: Date.now().toString() + 'c', name: 'general', type: 'text' }]
  };
  
  db.groups.push(newGroup);
  writeDB(db);
  res.json(newGroup);
});

app.post('/api/groups/join', (req, res) => {
  const { inviteCode, userId } = req.body;
  const db = readDB();
  
  const group = db.groups.find((g: any) => g.inviteCode === inviteCode);
  if (!group) {
    return res.status(404).json({ error: 'Сервер не найден' });
  }
  
  if (!group.members.includes(userId)) {
    group.members.push(userId);
    writeDB(db);
  }
  
  res.json(group);
});

app.post('/api/groups/leave', (req, res) => {
  const { groupId, userId } = req.body;
  const db = readDB();
  
  const group = db.groups.find((g: any) => g.id === groupId);
  if (!group) {
    return res.status(404).json({ error: 'Сервер не найден' });
  }
  
  group.members = group.members.filter((id: string) => id !== userId);
  writeDB(db);
  
  res.json({ success: true });
});

app.post('/api/groups/:groupId/channels', (req, res) => {
  const { name, type } = req.body;
  const db = readDB();
  
  const group = db.groups.find((g: any) => g.id === req.params.groupId);
  if (!group) {
    return res.status(404).json({ error: 'Сервер не найден' });
  }
  
  const newChannel = {
    id: Date.now().toString() + 'c',
    groupId: group.id,
    name,
    type
  };
  
  if (!group.channels) group.channels = [];
  group.channels.push(newChannel);
  writeDB(db);
  
  res.json(newChannel);
});

app.get('/api/groups/:userId', (req, res) => {
  const db = readDB();
  const userGroups = db.groups.filter((g: any) => g.members.includes(req.params.userId));
  res.json(userGroups);
});

// Friends routes
app.post('/api/friends/request', (req, res) => {
  const { fromUserId, toUserId } = req.body;
  const db = readDB();
  
  if (fromUserId === toUserId) {
    return res.status(400).json({ error: 'Нельзя добавить самого себя' });
  }

  const toUser = db.users.find((u: any) => u.id === toUserId || u.name === toUserId);
  if (!toUser) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  // Check if request already exists
  const existing = db.friends.find((f: any) => 
    (f.from === fromUserId && f.to === toUser.id) || 
    (f.from === toUser.id && f.to === fromUserId)
  );

  if (existing) {
    return res.status(400).json({ error: 'Запрос уже отправлен или вы уже друзья' });
  }

  const newRequest = { id: Date.now().toString(), from: fromUserId, to: toUser.id, status: 'pending' };
  db.friends.push(newRequest);
  writeDB(db);

  // Send real-time notification if user is online
  const targetSocketId = Array.from(onlineUsers.entries()).find(([_, u]) => u.id === toUser.id)?.[0];
  if (targetSocketId) {
    const fromUser = db.users.find((u: any) => u.id === fromUserId);
    io.to(targetSocketId).emit('friend-request', { id: fromUser.id, name: fromUser.name });
  }

  res.json({ id: toUser.id, name: toUser.name, status: 'pending_outgoing' });
});

app.post('/api/friends/accept', (req, res) => {
  const { fromUserId, toUserId } = req.body;
  const db = readDB();
  
  const request = db.friends.find((f: any) => f.from === fromUserId && f.to === toUserId);
  if (request) {
    request.status = 'accepted';
    writeDB(db);
    
    // Notify the other user
    const targetSocketId = Array.from(onlineUsers.entries()).find(([_, u]) => u.id === fromUserId)?.[0];
    if (targetSocketId) {
      const toUser = db.users.find((u: any) => u.id === toUserId);
      io.to(targetSocketId).emit('friend-accepted', { id: toUser.id, name: toUser.name });
    }
  }
  
  res.json({ success: true });
});

app.get('/api/friends/:userId', (req, res) => {
  const db = readDB();
  const userId = req.params.userId;
  
  const userFriends = db.friends.filter((f: any) => f.from === userId || f.to === userId).map((f: any) => {
    const isOutgoing = f.from === userId;
    const otherUserId = isOutgoing ? f.to : f.from;
    const otherUser = db.users.find((u: any) => u.id === otherUserId);
    
    let status = 'accepted';
    if (f.status === 'pending') {
      status = isOutgoing ? 'pending_outgoing' : 'pending_incoming';
    }
    
    return {
      id: otherUserId,
      name: otherUser?.name || 'Unknown',
      status
    };
  });
  
  res.json(userFriends);
});

// Messages routes
app.get('/api/messages/:roomId', (req, res) => {
  const db = readDB();
  const roomMessages = db.messages.filter((m: any) => m.roomId === req.params.roomId);
  res.json(roomMessages);
});

// Store connected users for WebSockets
const onlineUsers = new Map<string, any>();
const voiceRooms = new Map<string, Set<string>>(); // roomId -> Set of socket.ids

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('login', (user: { id: string, name: string, status: string }) => {
    onlineUsers.set(socket.id, { ...user, socketId: socket.id });
    io.emit('users', Array.from(onlineUsers.values()));
  });

  socket.on('message', (msg: any) => {
    const db = readDB();
    db.messages.push(msg);
    writeDB(db);
    io.emit('message', msg); // In a real app, emit to specific room
  });

  // Voice Rooms Logic
  socket.on('join-voice', (roomId: string) => {
    socket.join(roomId);
    if (!voiceRooms.has(roomId)) {
      voiceRooms.set(roomId, new Set());
    }
    voiceRooms.get(roomId)!.add(socket.id);
    
    const participants = Array.from(voiceRooms.get(roomId)!).map(id => onlineUsers.get(id)?.name).filter(Boolean);
    io.emit('voice-participants', { roomId, participants });
  });

  socket.on('leave-voice', (roomId: string) => {
    socket.leave(roomId);
    if (voiceRooms.has(roomId)) {
      voiceRooms.get(roomId)!.delete(socket.id);
      const participants = Array.from(voiceRooms.get(roomId)!).map(id => onlineUsers.get(id)?.name).filter(Boolean);
      io.emit('voice-participants', { roomId, participants });
    }
  });

  // Call Signaling Logic
  socket.on('call-user', (data: { userToCall: string, signalData: any, from: string, name: string }) => {
    io.to(data.userToCall).emit('call-made', { signal: data.signalData, from: data.from, name: data.name });
  });

  socket.on('answer-call', (data: { to: string, signal: any }) => {
    io.to(data.to).emit('call-answered', data.signal);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    voiceRooms.forEach((participants, roomId) => {
      if (participants.has(socket.id)) {
        participants.delete(socket.id);
        const updatedNames = Array.from(participants).map(id => onlineUsers.get(id)?.name).filter(Boolean);
        io.emit('voice-participants', { roomId, participants: updatedNames });
      }
    });

    onlineUsers.delete(socket.id);
    io.emit('users', Array.from(onlineUsers.values()));
  });
});

// Anything that doesn't match the above, send back index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
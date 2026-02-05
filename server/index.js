const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for dev
    methods: ["GET", "POST"]
  }
});

// In-memory storage
const users = {}; // userId -> { socketId, userData }
const studios = {}; // studioCode -> { members: [], ...studioData }
const socketToUser = {}; // socketId -> userId

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User registration (when entering the game)
  socket.on('register_user', (userData) => {
    if (!userData || !userData.id) return;
    
    users[userData.id] = {
      socketId: socket.id,
      data: userData
    };
    socketToUser[socket.id] = userData.id;
    console.log(`User registered: ${userData.name} (${userData.id})`);
    
    // Check if user is in a studio and rejoin room
    // (This part would require persistence to be robust, but for now we trust the client to join)
  });

  // Friend System
  socket.on('add_friend', ({ myId, friendCode }) => {
    console.log(`Friend request from ${myId} to code ${friendCode}`);
    
    // Find user with this friendCode
    const friendId = Object.keys(users).find(uid => users[uid].data.friendCode === friendCode);
    
    if (!friendId) {
      socket.emit('friend_error', 'Пользователь с таким кодом не найден');
      return;
    }

    if (friendId === myId) {
        socket.emit('friend_error', 'Нельзя добавить самого себя');
        return;
    }

    const friendSocketId = users[friendId].socketId;
    const myData = users[myId]?.data;

    // Check if real status
    const isOnline = !!friendSocketId && !!socketToUser[friendSocketId];

    // Notify the adder (success)
    const friendData = users[friendId].data;
    socket.emit('friend_added', {
        id: friendData.id,
        name: friendData.name,
        status: isOnline ? 'online' : 'offline',
        avatar: friendData.avatar
    });

    // Notify the friend (they got added)
    if (friendSocketId) {
        io.to(friendSocketId).emit('friend_added', {
            id: myData.id,
            name: myData.name,
            status: 'online',
            avatar: myData.avatar
        });
        io.to(friendSocketId).emit('notification', {
            title: 'Новый друг',
            message: `${myData.name} добавил вас в друзья`,
            type: 'success'
        });
    }
  });

  socket.on('remove_friend', ({ myId, friendId }) => {
     // Notify both parties to remove each other
     socket.emit('friend_removed', friendId);
     
     const friendSocketId = users[friendId]?.socketId;
     if (friendSocketId) {
         io.to(friendSocketId).emit('friend_removed', myId);
     }
  });

  // Studio System
  socket.on('create_studio', (studioData) => {
    studios[studioData.code] = studioData;
    socket.join(studioData.code);
    console.log(`Studio created: ${studioData.name} (${studioData.code})`);
  });

  socket.on('join_studio', ({ userId, studioCode, userName }) => {
    const studio = studios[studioCode];
    if (!studio) {
      socket.emit('studio_error', 'Студия не найдена');
      return;
    }

    if (studio.isPrivate) {
        // Handle private logic (request to join) - simplified for now
        // For now, let's just allow join if we are mimicking the "join by code" feature
    }

    // Add member to studio (in memory)
    if (!studio.members.find(m => m.id === userId)) {
        studio.members.push(users[userId]?.data || { id: userId, name: userName, role: 'Junior' });
    }

    socket.join(studioCode);
    
    // Notify user they joined
    socket.emit('studio_joined', studio);
    
    // Notify studio members
    socket.to(studioCode).emit('member_joined', users[userId]?.data || { id: userId, name: userName });
    
    console.log(`${userName} joined studio ${studioCode}`);
  });

  socket.on('disconnect', () => {
    const userId = socketToUser[socket.id];
    if (userId) {
      // Handle user disconnect (maybe update status to offline)
      delete socketToUser[socket.id];
      // Don't delete from users immediately to keep data if they reconnect
      // But update status
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
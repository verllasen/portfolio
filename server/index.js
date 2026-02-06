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
    
    // Check if name is taken
    const existingUser = Object.values(users).find(u => u.data.name.toLowerCase() === userData.name.toLowerCase() && u.data.id !== userData.id);
    if (existingUser) {
        socket.emit('registration_error', 'Это имя уже занято. Пожалуйста, выберите другое.');
        return;
    }

    users[userData.id] = {
      socketId: socket.id,
      data: userData,
      friendRequests: [] // Incoming requests
    };
    socketToUser[socket.id] = userData.id;
    console.log(`User registered: ${userData.name} (${userData.id})`);
    
    socket.emit('registration_success', userData);
  });

  // Friend System
  socket.on('send_friend_request', ({ myId, friendCode }) => {
    console.log(`Friend request from ${myId} to code ${friendCode}`);
    
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

    // Check if already friends (client side should prevent this too, but double check)
    // For MVP we don't have persistent friend list on server, so we trust client somewhat or just send request anyway.
    // Ideally, we should check if request already pending.
    
    if (users[friendId].friendRequests.includes(myId)) {
        socket.emit('friend_error', 'Заявка уже отправлена');
        return;
    }

    users[friendId].friendRequests.push(myId);

    if (friendSocketId) {
        io.to(friendSocketId).emit('friend_request_received', {
            id: myData.id,
            name: myData.name,
            avatar: myData.avatar
        });
    }
    
    socket.emit('friend_request_sent', 'Заявка отправлена');
  });

  socket.on('accept_friend_request', ({ myId, friendId }) => {
      // Remove from pending
      if (users[myId]) {
          users[myId].friendRequests = users[myId].friendRequests.filter(id => id !== friendId);
      }

      const friendSocketId = users[friendId]?.socketId;
      const myData = users[myId]?.data;
      const friendData = users[friendId]?.data;

      if (!friendData) return;

      // Notify Me
      const isFriendOnline = !!friendSocketId && !!socketToUser[friendSocketId];
      socket.emit('friend_added', {
        id: friendData.id,
        name: friendData.name,
        status: isFriendOnline ? 'online' : 'offline',
        avatar: friendData.avatar
      });

      // Notify Friend
      if (friendSocketId) {
          const isMeOnline = true;
          io.to(friendSocketId).emit('friend_added', {
            id: myData.id,
            name: myData.name,
            status: isMeOnline ? 'online' : 'offline',
            avatar: myData.avatar
          });
          io.to(friendSocketId).emit('notification', {
            title: 'Новый друг',
            message: `${myData.name} принял вашу заявку`,
            type: 'success'
          });
      }
  });

  socket.on('reject_friend_request', ({ myId, friendId }) => {
      if (users[myId]) {
          users[myId].friendRequests = users[myId].friendRequests.filter(id => id !== friendId);
      }
      // Optionally notify the sender they were rejected, but usually we just ignore
  });

  socket.on('invite_to_studio', ({ myId, friendId, studioCode }) => {
      const friendSocketId = users[friendId]?.socketId;
      const myData = users[myId]?.data;
      const studio = studios[studioCode];

      if (friendSocketId && studio) {
          io.to(friendSocketId).emit('studio_invite_received', {
              studioName: studio.name,
              studioCode: studio.code,
              inviterName: myData.name
          });
      }
  });

  // Old direct add listener - keeping for backward compat if needed, but 'send_friend_request' replaces it.
  // socket.on('add_friend', ...) - REMOVED/REPLACED by send_friend_request logic above

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
        // Ensure we have full user data including avatar/banner
        const fullUserData = users[userId]?.data;
        if (fullUserData) {
             studio.members.push({ ...fullUserData, role: 'Junior' });
        } else {
             studio.members.push({ id: userId, name: userName, role: 'Junior' });
        }
    }

    socket.join(studioCode);
    
    // Notify user they joined
    socket.emit('studio_joined', studio);
    
    // Notify studio members with FULL user data
    const memberData = users[userId]?.data || { id: userId, name: userName };
    socket.to(studioCode).emit('member_joined', memberData);
    
    console.log(`${userName} joined studio ${studioCode}`);
  });

  // Chat System
  socket.on('send_chat_message', ({ studioCode, senderId, senderName, text }) => {
      const message = {
          id: Math.random().toString(36).substr(2, 9),
          senderId,
          senderName,
          text,
          timestamp: Date.now()
      };
      
      // Broadcast to everyone in the studio (including sender)
      io.to(studioCode).emit('chat_message_received', message);
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} - Data Reset`);
});
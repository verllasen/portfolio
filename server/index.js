const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e8, // 100 MB
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
    
    // Broadcast online status
    io.emit('user_status_change', { userId: userData.id, status: 'online' });
    
    // Update and broadcast leaderboard
    updateLeaderboard();
  });

  // Leaderboard Helper
  const updateLeaderboard = () => {
      const userEntries = Object.values(users).map(u => ({
          id: u.data.id,
          name: u.data.name,
          type: 'coder',
          score: u.data.stats?.xp || 0,
          avatar: u.data.avatar,
          banner: u.data.banner
      }));

      const studioEntries = Object.values(studios).map(s => ({
          id: s.code,
          name: s.name,
          type: 'studio',
          score: s.rating || 0,
          avatar: s.avatar, // Ensure studio has avatar field if set
          banner: s.banner
      }));

      const lbData = [...userEntries, ...studioEntries]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10); // Top 10
      
      io.emit('leaderboard_update', lbData);
  };

  // Score Update (from client)
  socket.on('update_score', ({ userId, xp }) => {
      if (users[userId]) {
          // Update local memory
          if (!users[userId].data.stats) users[userId].data.stats = {};
          users[userId].data.stats.xp = xp;
          updateLeaderboard();
      }
  });

  // Friend System
  socket.on('send_friend_request', ({ myId, friendCode }) => {
    console.log(`Friend request from ${myId} to code ${friendCode}`);
    
    const friendId = Object.keys(users).find(uid => 
        String(users[uid].data.friendCode).trim() === String(friendCode).trim()
    );
    
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
        avatar: friendData.avatar,
        banner: friendData.banner,
        title: friendData.title,
        role: friendData.role
      });

      // Notify Friend
      if (friendSocketId) {
          const isMeOnline = true;
          io.to(friendSocketId).emit('friend_added', {
            id: myData.id,
            name: myData.name,
            status: isMeOnline ? 'online' : 'offline',
            avatar: myData.avatar,
            banner: myData.banner,
            title: myData.title,
            role: myData.role
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
    updateLeaderboard();
  });

  socket.on('update_studio_rating', ({ studioCode, rating }) => {
    if (studios[studioCode]) {
        studios[studioCode].rating = rating;
        updateLeaderboard();
    }
  });

  socket.on('update_studio_profile', ({ studioCode, updates }) => {
    if (studios[studioCode]) {
        studios[studioCode] = { ...studios[studioCode], ...updates };
        // Broadcast update to all members in the studio
        io.to(studioCode).emit('studio_profile_updated', updates);
        updateLeaderboard();
    }
  });

  socket.on('promote_member', ({ studioCode, playerId, role, promoterName, playerName }) => {
      const studio = studios[studioCode];
      if (studio) {
          const member = studio.members.find(m => m.id === playerId);
          if (member) {
              member.role = role;
              io.to(studioCode).emit('member_role_updated', { playerId, role });
              
              // System message
              const message = {
                  id: Math.random().toString(36).substr(2, 9),
                  senderId: 'system',
                  senderName: 'System',
                  text: `${promoterName} назначил ${playerName} на роль ${role}`,
                  timestamp: Date.now(),
                  system: true
              };
              io.to(studioCode).emit('chat_message_received', message);
          }
      }
  });

  socket.on('join_studio', ({ userId, studioCode, userName }) => {
    const studio = studios[studioCode];
    if (!studio) {
      socket.emit('studio_error', 'Студия не найдена');
      return;
    }

    if (studio.isPrivate) {
        // Handle private logic
        if (studio.privacyType === 'closed') {
             socket.emit('studio_error', 'Студия закрыта для вступления');
             return;
        }
        if (studio.privacyType === 'invite_only') {
             // For now, blocking direct code join.
        }
    }
    
    // Check if banned
    if (studio.bannedIds && studio.bannedIds.includes(userId)) {
        socket.emit('studio_error', 'Вы были исключены из этой студии');
        return;
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
    
    // System message
    const message = {
        id: Math.random().toString(36).substr(2, 9),
        senderId: 'system',
        senderName: 'System',
        text: `${userName} присоединился к студии`,
        timestamp: Date.now(),
        system: true
    };
    io.to(studioCode).emit('chat_message_received', message);

    console.log(`${userName} joined studio ${studioCode}`);
  });

  socket.on('leave_studio', ({ userId, studioCode, userName }) => {
      const studio = studios[studioCode];
      if (!studio) return;

      // Remove from memory
      studio.members = studio.members.filter(m => m.id !== userId);
      
      socket.leave(studioCode);
      
      socket.emit('studio_left');
      socket.to(studioCode).emit('member_left', userId);
      
      // System message
      const message = {
          id: Math.random().toString(36).substr(2, 9),
          senderId: 'system',
          senderName: 'System',
          text: `${userName} покинул студию`,
          timestamp: Date.now(),
          system: true
      };
      io.to(studioCode).emit('chat_message_received', message);
      
      console.log(`${userName} left studio ${studioCode}`);
  });

  socket.on('take_contract', ({ studioCode, missionId, playerId }) => {
      const studio = studios[studioCode];
      if (studio) {
          studio.activeMissionId = missionId;
          studio.missionStatus = 'preparing';
          studio.missionReadyMembers = playerId ? [playerId] : []; 
          
          io.to(studioCode).emit('contract_taken', { missionId, status: 'preparing' });
          if (playerId) {
              io.to(studioCode).emit('mission_ready_update', { missionReadyMembers: studio.missionReadyMembers });
          }
          
          // System message with specialized type for "Join" button
          const message = {
              id: Math.random().toString(36).substr(2, 9),
              senderId: 'system',
              senderName: 'System',
              text: `Студия начала новый контракт!`,
              type: 'contract_start', // Special type
              missionId: missionId,
              timestamp: Date.now(),
              system: true
          };
          io.to(studioCode).emit('chat_message_received', message);
      }
  });

  socket.on('update_mission_role', ({ studioCode, playerId, role }) => {
      const studio = studios[studioCode];
      if (studio) {
          const member = studio.members.find(m => m.id === playerId);
          if (member) {
              member.missionRole = role;
              io.to(studioCode).emit('mission_role_updated', { playerId, role });
          }
      }
  });

  // buy_item handlers removed in favor of update_studio_profile broadcast

  socket.on('join_contract_team', ({ studioCode, playerId }) => {
      const studio = studios[studioCode];
      if (studio) {
           if (!studio.missionReadyMembers) studio.missionReadyMembers = [];
           if (!studio.missionReadyMembers.includes(playerId)) {
               studio.missionReadyMembers.push(playerId);
               io.to(studioCode).emit('mission_ready_update', { missionReadyMembers: studio.missionReadyMembers });
           }
      }
  });

  // Chat System
  socket.on('send_chat_message', ({ studioCode, senderId, senderName, text, system }) => {
      const message = {
          id: Math.random().toString(36).substr(2, 9),
          senderId,
          senderName,
          text,
          timestamp: Date.now(),
          system: system || false
      };
      
      // Broadcast to everyone in the studio (including sender)
      io.to(studioCode).emit('chat_message_received', message);
  });

  socket.on('update_status', ({ status }) => {
      const userId = socketToUser[socket.id];
      if (userId && users[userId]) {
          // Broadcast status change
          io.emit('user_status_change', { userId, status });
      }
  });

  socket.on('kick_member', ({ studioCode, playerId }) => {
      const studio = studios[studioCode];
      if (studio) {
          if (!studio.bannedIds) studio.bannedIds = [];
          if (!studio.bannedIds.includes(playerId)) {
              studio.bannedIds.push(playerId);
          }
          
          studio.members = studio.members.filter(m => m.id !== playerId);
          
          io.to(studioCode).emit('member_left', playerId);
          
          // Force leave socket room if connected
          const kickedUser = users[playerId];
          if (kickedUser) {
              const kickedSocket = io.sockets.sockets.get(kickedUser.socketId);
              if (kickedSocket) {
                  kickedSocket.leave(studioCode);
                  kickedSocket.emit('studio_error', 'Вы были исключены из студии');
                  // Trigger client to clear team state
                  kickedSocket.emit('studio_left');
              }
          }
      }
  });

  socket.on('start_mission', ({ studioCode }) => {
      const studio = studios[studioCode];
      if (studio) {
          studio.missionStatus = 'in_progress';
          studio.missionStartTime = Date.now();
          io.to(studioCode).emit('mission_started');
      }
  });

  socket.on('cancel_mission', ({ studioCode }) => {
      const studio = studios[studioCode];
      if (studio) {
          studio.missionStatus = 'idle';
          studio.activeMissionId = null;
          studio.missionReadyMembers = [];
          io.to(studioCode).emit('mission_cancelled');
      }
  });

  socket.on('disconnect', () => {
    const userId = socketToUser[socket.id];
    if (userId) {
      // Handle user disconnect (maybe update status to offline)
      // delete socketToUser[socket.id]; // Keep mapping for reconnects or better offline handling if needed
      
      const userData = users[userId]?.data;
      if (userData) {
          // Notify friends
          if (users[userId].friendRequests) {
              // Iterate friends (this is inefficient without a proper friend list in memory, but workable)
              // Better: Iterate all users and check if they have this user as friend
              Object.values(users).forEach(u => {
                  // If we had a friend list, we would use it. 
                  // For now, let's just broadcast to everyone for simplicity in this prototype or check sockets
              });
          }
          
          // Broadcast offline status globally (or to relevant people)
          io.emit('user_status_change', { userId, status: 'offline' });
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} - Data Reset`);
});
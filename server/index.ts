import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';

const app = express();
app.use(cors());

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../../dist')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store users with their data
const users = new Map<string, any>();
const voiceRooms = new Map<string, Set<string>>(); // roomId -> Set of socket.ids

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User logs in and provides their info
  socket.on('login', (user: { id: string, name: string, status: string }) => {
    users.set(socket.id, { ...user, socketId: socket.id });
    io.emit('users', Array.from(users.values()));
  });

  // Handle incoming messages
  socket.on('message', (msg: any) => {
    // Basic chat message broadcast
    io.emit('message', msg);
  });

  // Voice Rooms Logic
  socket.on('join-voice', (roomId: string) => {
    socket.join(roomId);
    if (!voiceRooms.has(roomId)) {
      voiceRooms.set(roomId, new Set());
    }
    voiceRooms.get(roomId)!.add(socket.id);
    
    // Broadcast updated participants for this room
    const participants = Array.from(voiceRooms.get(roomId)!).map(id => users.get(id)?.name).filter(Boolean);
    io.emit('voice-participants', { roomId, participants });
  });

  socket.on('leave-voice', (roomId: string) => {
    socket.leave(roomId);
    if (voiceRooms.has(roomId)) {
      voiceRooms.get(roomId)!.delete(socket.id);
      const participants = Array.from(voiceRooms.get(roomId)!).map(id => users.get(id)?.name).filter(Boolean);
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
    
    // Remove from voice rooms
    voiceRooms.forEach((participants, roomId) => {
      if (participants.has(socket.id)) {
        participants.delete(socket.id);
        const updatedNames = Array.from(participants).map(id => users.get(id)?.name).filter(Boolean);
        io.emit('voice-participants', { roomId, participants: updatedNames });
      }
    });

    users.delete(socket.id);
    io.emit('users', Array.from(users.values()));
  });
});

// Anything that doesn't match the above, send back index.html
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
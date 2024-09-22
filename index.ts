import express from 'express';
import http from 'http';
import { Server } from "socket.io";
import cors from 'cors';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms: { [key: string]: Set<string> } = {};
const roomAdmins: { [key: string]: string } = {}; // In-memory storage for room admins
const votes: { [key: string]: { [key: string]: string } } = {}; // In-memory storage for votes

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('createRoom', (roomId: string) => {
    if (rooms[roomId] !== undefined) {
      socket.emit('error', 'Room already exists');
    } else {
      rooms[roomId] = new Set([socket.id]); // Initialize room with 1 user (the host)
      roomAdmins[roomId] = socket.id; // Set the admin of the room
      votes[roomId] = {}; // Initialize votes for the room
      socket.join(roomId);
      console.log(`Room created: ${roomId}`);
      socket.emit('roomCreated', roomId);
      io.to(roomId).emit('userCount', rooms[roomId].size);
      io.to(roomId).emit('adminAssigned', socket.id); // Notify clients about the admin
      io.to(roomId).emit('userList', Array.from(rooms[roomId])); // Send the list of users
    }
  });

  socket.on('joinRoom', (roomId, callback) => {
    if (rooms[roomId] !== undefined) {
      if (rooms[roomId].has(socket.id)) {
        callback({ success: false, error: 'You are already connected to this room' });
      } else {
        rooms[roomId].add(socket.id);
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
        socket.to(roomId).emit('userJoined', `User ${socket.id} has joined the room.`);
        io.to(roomId).emit('userCount', rooms[roomId].size);
        io.to(roomId).emit('userList', Array.from(rooms[roomId])); // Send the updated list of users
        callback({ success: true });
      }
    } else {
      callback({ success: false, error: 'Room does not exist' });
    }
  });

  socket.on('getActiveRooms', () => {
    const activeRooms = Object.keys(rooms);
    socket.emit('activeRooms', activeRooms);
  });


  socket.on('vote', (roomId: string, vote: string) => {
    if (rooms[roomId] && rooms[roomId].has(socket.id)) {
      votes[roomId][socket.id] = vote;
      io.to(roomId).emit('newVote', `User ${socket.id} has voted.`);
    } else {
      socket.emit('error', 'You are not in this room');
    }
  });

  socket.on('revealVotes', (roomId: string) => {
    if (roomAdmins[roomId] === socket.id) {
      io.to(roomId).emit('votesRevealed', votes[roomId]);
    } else {
      socket.emit('error', 'Only the admin can reveal votes');
    }
  });

  socket.on('kickUser', (roomId: string, userId: string) => {
    if (roomAdmins[roomId] === socket.id) {
      if (userId === socket.id) {
        socket.emit('error', 'Admin cannot kick itself');
      } else if (rooms[roomId].has(userId)) {
        io.to(userId).emit('kicked', 'You have been kicked from the room');
        rooms[roomId].delete(userId);
        io.to(roomId).emit('userKicked', `User ${userId} has been kicked from the room`);
        io.to(roomId).emit('userCount', rooms[roomId].size);
        io.to(roomId).emit('userList', Array.from(rooms[roomId])); // Send the updated list of users
      } else {
        socket.emit('error', 'User not found in the room');
      }
    } else {
      socket.emit('error', 'Only the admin can kick users');
    }
  });

  socket.on('clearVotes', (roomId: string) => {
    if (roomAdmins[roomId] === socket.id) {
      votes[roomId] = {};
      io.to(roomId).emit('votesCleared');
    } else {
      socket.emit('error', 'Only the admin can clear votes');
    }
  });

  socket.on('disconnecting', () => {
    const roomsJoined = Array.from(socket.rooms).filter(room => room !== socket.id);
    roomsJoined.forEach(roomId => {
      if (rooms[roomId] !== undefined) {
        rooms[roomId].delete(socket.id);
        if (rooms[roomId].size === 0) {
          delete rooms[roomId];
          delete roomAdmins[roomId]; // Remove admin info when room is empty
          delete votes[roomId]; // Remove votes when room is empty
        } else {
          if (roomAdmins[roomId] === socket.id) {
            const newAdmin = Array.from(rooms[roomId])[0]; // Assign new admin
            roomAdmins[roomId] = newAdmin;
            io.to(roomId).emit('adminAssigned', newAdmin); // Notify clients about the new admin
          }
          io.to(roomId).emit('userCount', rooms[roomId].size);
          io.to(roomId).emit('userList', Array.from(rooms[roomId])); // Send the updated list of users
        }
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
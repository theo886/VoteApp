const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let totalEffort = 0;
let totalImpact = 0;
let voteCount = 0;

// Keep track of who has voted (by userId)
const votedUsers = new Set();

// Store individual votes so we can plot them all
let votes = [];

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New client connected');

  // Send the current averages, vote count, and all votes
  socket.emit('update', {
    averageEffort: voteCount ? totalEffort / voteCount : 0,
    averageImpact: voteCount ? totalImpact / voteCount : 0,
    voteCount,
    allVotes: votes
  });

  // Handle new votes
  socket.on('newVote', (data) => {
    const { userId, effort, impact } = data;

    // If userId is already in votedUsers, ignore the vote
    if (votedUsers.has(userId)) {
      console.log(`User ${userId} already voted.`);
      // Optionally send a message back that they've already voted
      socket.emit('alreadyVoted');
      return;
    }

    // Otherwise, record the vote
    votedUsers.add(userId);
    totalEffort += effort;
    totalImpact += impact;
    voteCount++;

    votes.push({ effort, impact });

    io.emit('update', {
      averageEffort: totalEffort / voteCount,
      averageImpact: totalImpact / voteCount,
      voteCount,
      allVotes: votes
    });
  });

  // Handle reset
  socket.on('reset', () => {
    totalEffort = 0;
    totalImpact = 0;
    voteCount = 0;
    votes = [];
    votedUsers.clear();

    io.emit('update', {
      averageEffort: 0,
      averageImpact: 0,
      voteCount: 0,
      allVotes: []
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});

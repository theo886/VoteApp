const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let totalEffort = 0;
let totalImpact = 0;
let voteCount = 0;

// Store all votes in an array, each with { userId, effort, impact }
let votes = [];

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New client connected');

  // Send current averages, vote count, and all votes
  socket.emit('update', {
    averageEffort: voteCount ? totalEffort / voteCount : 0,
    averageImpact: voteCount ? totalImpact / voteCount : 0,
    voteCount,
    allVotes: votes
  });

  // Handle new or updated votes
  socket.on('newVote', (data) => {
    const { userId, effort, impact } = data;

    // Check if this user already voted
    const existingVote = votes.find(v => v.userId === userId);
    if (existingVote) {
      // Remove old values from totals
      totalEffort -= existingVote.effort;
      totalImpact -= existingVote.impact;

      // Update the existing vote
      existingVote.effort = effort;
      existingVote.impact = impact;

      // Add new values to totals
      totalEffort += effort;
      totalImpact += impact;
    } else {
      // This is a brand new voter
      votes.push({ userId, effort, impact });
      totalEffort += effort;
      totalImpact += impact;
      voteCount++;
    }

    // Broadcast updated info to all
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

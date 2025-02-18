const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Track total sums and count
let totalEffort = 0;
let totalImpact = 0;
let voteCount = 0;

// Store all votes: each item is { userId, effort, impact }
let votes = [];

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New client connected');

  // 1) Client announces who they are (userId)
  socket.on('register', ({ userId }) => {
    // Check if this user has voted before
    const existingVote = votes.find(v => v.userId === userId);
    if (existingVote) {
      // They've already voted, so add them to the "voters" room
      socket.join('voters');
      // Send them the current data
      socket.emit('update', getCurrentData());
    } 
    // If they haven't voted, do nothing yet (they won't see data until they vote)
  });

  // 2) New or updated vote
  socket.on('newVote', ({ userId, effort, impact }) => {
    const existingVote = votes.find(v => v.userId === userId);

    if (existingVote) {
      // Remove old values from totals
      totalEffort -= existingVote.effort;
      totalImpact -= existingVote.impact;
      // Update the existing vote
      existingVote.effort = effort;
      existingVote.impact = impact;
    } else {
      // Brand new voter
      votes.push({ userId, effort, impact });
      voteCount++;
    }
    // Add new values to totals
    totalEffort += effort;
    totalImpact += impact;

    // If this was their first vote, add them to the "voters" room
    socket.join('voters');

    // Broadcast to everyone in "voters"
    io.to('voters').emit('update', getCurrentData());
  });

  // 3) Reset everything
  socket.on('reset', () => {
    totalEffort = 0;
    totalImpact = 0;
    voteCount = 0;
    votes = [];

    // Kick everyone out of "voters" by closing the room 
    // (simplest approach: forcibly disconnect or just broadcast the reset
    // and let them re-register. For a quick fix, we won't literally remove
    // them from the room, but they won't see data anyway because it's all zero.)
    io.to('voters').emit('update', {
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

// Helper to package up current data
function getCurrentData() {
  return {
    averageEffort: voteCount ? totalEffort / voteCount : 0,
    averageImpact: voteCount ? totalImpact / voteCount : 0,
    voteCount,
    allVotes: votes
  };
}

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});

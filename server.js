const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Totals and vote storage
let totalEffort = 0;
let totalImpact = 0;
let voteCount = 0;
// Each element: { userId, effort, impact }
let votes = [];
let connectedUsers = 0;

app.use(express.static('public'));

io.on('connection', (socket) => {
  connectedUsers++;
  console.log('New client connected. Total connected:', connectedUsers);

  // The client tells us its userId as soon as it connects.
  socket.on('register', ({ userId }) => {
    const existingVote = votes.find(v => v.userId === userId);
    if (existingVote) {
      // If they voted before, add them to "voters" so they see the chart
      socket.join('voters');
      socket.emit('update', getCurrentData());
    }
    // Send the current vote count (as fraction) to everyone
    socket.emit('voteCount', { voteCount, userCount: connectedUsers });
    io.emit('voteCount', { voteCount, userCount: connectedUsers });
  });

  // When a user votes or updates their vote
  socket.on('newVote', ({ userId, effort, impact }) => {
    const existingVote = votes.find(v => v.userId === userId);

    if (existingVote) {
      // Remove old values
      totalEffort -= existingVote.effort;
      totalImpact -= existingVote.impact;
      // Update the existing vote
      existingVote.effort = effort;
      existingVote.impact = impact;
    } else {
      // New voter
      votes.push({ userId, effort, impact });
      voteCount++;
    }

    // Add the new values
    totalEffort += effort;
    totalImpact += impact;

    // Put this socket in the "voters" room so they see data
    socket.join('voters');

    // Broadcast updated chart data to "voters" only
    io.to('voters').emit('update', getCurrentData());

    // Broadcast the updated vote count (as fraction) to everyone
    io.emit('voteCount', { voteCount, userCount: connectedUsers });
  });

  // Reset everything
  socket.on('reset', () => {
    totalEffort = 0;
    totalImpact = 0;
    voteCount = 0;
    votes = [];

    // Remove everyone from "voters"
    io.in('voters').socketsLeave('voters');

    // 1) Send empty data to ALL clients so their charts clear immediately
    io.emit('update', {
      averageEffort: 0,
      averageImpact: 0,
      voteCount: 0,
      allVotes: []
    });

    // 2) Also send new (zero) vote count to everyone
    io.emit('voteCount', { voteCount: 0, userCount: connectedUsers });
  });

  socket.on('disconnect', () => {
    connectedUsers--;
    console.log('Client disconnected. Total connected:', connectedUsers);
    // Update vote count fraction for remaining users
    io.emit('voteCount', { voteCount, userCount: connectedUsers });
  });
});

// Helper: current data payload
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

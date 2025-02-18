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

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New client connected');

  // 1) The client tells us its userId (on every connection).
  socket.on('register', ({ userId }) => {
    // If they've voted before (this session), add them to the "voters" room immediately.
    // Otherwise, they stay out until they cast a vote.
    const existingVote = votes.find(v => v.userId === userId);
    if (existingVote) {
      socket.join('voters');
      // Send them the current data so they see the chart
      socket.emit('update', getCurrentData());
    }
    // Regardless, also tell them the current vote count
    socket.emit('voteCount', { voteCount });
  });

  // 2) When a user votes or updates their vote
  socket.on('newVote', ({ userId, effort, impact }) => {
    const existingVote = votes.find(v => v.userId === userId);
    if (existingVote) {
      // Remove old values
      totalEffort -= existingVote.effort;
      totalImpact -= existingVote.impact;
      // Update their vote
      existingVote.effort = effort;
      existingVote.impact = impact;
    } else {
      // New voter
      votes.push({ userId, effort, impact });
      voteCount++;
    }
    // Add new values
    totalEffort += effort;
    totalImpact += impact;

    // Put this socket in the "voters" room so they can see data
    socket.join('voters');

    // 2a) Broadcast the updated chart data to all "voters"
    io.to('voters').emit('update', getCurrentData());

    // 2b) Broadcast the updated vote count to everyone
    io.emit('voteCount', { voteCount });
  });

  // 3) Reset everything
  socket.on('reset', () => {
    totalEffort = 0;
    totalImpact = 0;
    voteCount = 0;
    votes = [];

    // Remove everyone from the "voters" room
    io.in('voters').socketsLeave('voters');

    // Broadcast zero data to "voters" (now empty) is optional,
    // but we do want to broadcast the new (zero) vote count to everyone
    io.emit('voteCount', { voteCount: 0 });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Helper function to package current data
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

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let totalEffort = 0;
let totalImpact = 0;
let voteCount = 0;
// Store individual votes here
let votes = [];

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New client connected');

  // Send the current averages, vote count, and all individual votes
  socket.emit('update', {
    averageEffort: voteCount ? totalEffort / voteCount : 0,
    averageImpact: voteCount ? totalImpact / voteCount : 0,
    voteCount,
    allVotes: votes
  });

  socket.on('newVote', (data) => {
    const { effort, impact } = data;
    totalEffort += effort;
    totalImpact += impact;
    voteCount++;

    // Store this new vote
    votes.push({ effort, impact });

    // Broadcast updated averages and all votes
    io.emit('update', {
      averageEffort: totalEffort / voteCount,
      averageImpact: totalImpact / voteCount,
      voteCount,
      allVotes: votes
    });
  });

  socket.on('reset', () => {
    // Reset everything
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
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

// Add global variable for allow vote changes
let globalAllowVoteChanges = true;

// Add global variable for the scale
let globalScale = {
  min: 1,
  max: 5
};

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
    
    // Send current settings to newly connected client
    socket.emit('settingUpdate', {
      allowVoteChanges: globalAllowVoteChanges,
      scale: globalScale
    });
  });

  // When a user votes or updates their vote
  socket.on('newVote', ({ userId, effort, impact }) => {
    // Ensure values are within the current scale
    effort = Math.min(Math.max(effort, globalScale.min), globalScale.max);
    impact = Math.min(Math.max(impact, globalScale.min), globalScale.max);
    
    const existingVote = votes.find(v => v.userId === userId);

    if (existingVote) {
      // Use global flag instead of client-passed allowVoteChanges.
      if (!globalAllowVoteChanges) {
        return;
      }
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

  // Listen for setting updates and broadcast global change
  socket.on('updateSetting', (payload) => {
    if(payload.hasOwnProperty('allowVoteChanges')) {
      globalAllowVoteChanges = payload.allowVoteChanges;
    }
    
    // Handle scale changes
    if(payload.hasOwnProperty('scale')) {
      const oldScale = { ...globalScale };
      globalScale = payload.scale;
      
      // Optional: Convert existing votes if the scale changes
      if (votes.length > 0) {
        const oldMin = oldScale.min;
        const oldMax = oldScale.max;
        const newMin = globalScale.min;
        const newMax = globalScale.max;
        
        // Only convert if scale actually changed
        if (oldMin !== newMin || oldMax !== newMax) {
          console.log(`Converting votes from scale ${oldMin}-${oldMax} to ${newMin}-${newMax}`);
          
          totalEffort = 0;
          totalImpact = 0;
          
          votes.forEach(vote => {
            // Convert effort and impact to new scale
            vote.effort = convertValue(vote.effort, oldMin, oldMax, newMin, newMax);
            vote.impact = convertValue(vote.impact, oldMin, oldMax, newMin, newMax);
            
            // Add to new totals
            totalEffort += vote.effort;
            totalImpact += vote.impact;
          });
          
          // Update all clients with new data
          io.to('voters').emit('update', getCurrentData());
        }
      }
    }
    
    // Send the updated settings to all clients
    io.emit('settingUpdate', { 
      allowVoteChanges: globalAllowVoteChanges,
      scale: globalScale
    });
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

// Helper function to convert values between scales
function convertValue(value, oldMin, oldMax, newMin, newMax) {
  // Calculate percentage of position in old range
  const percentage = (value - oldMin) / (oldMax - oldMin);
  // Map to new range and round to nearest integer
  return Math.round(percentage * (newMax - newMin) + newMin);
}

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <!-- Helps with mobile scaling -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Idea Rating App</title>
  <script src="/socket.io/socket.io.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* A square chart container with padding */
    .chart-container {
      width: 100%;
      max-width: 600px;
      aspect-ratio: 1 / 1;
      max-height: 60vh;
      position: relative;
      padding: 1rem;
      box-sizing: border-box;
    }

    #resultsChart {
      width: 100%;
      height: 100%;
      cursor: crosshair;
    }

    /* Center the Reset button & vote count */
    .bottom-bar {
      width: 100%;
      max-width: 600px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 2rem;
      padding: 1rem;
    }

    button {
      padding: 0.5rem 1rem;
      font-size: 1rem;
    }
  </style>
</head>
<body>
  <!-- Square chart container -->
  <div class="chart-container">
    <canvas id="resultsChart"></canvas>
  </div>

  <!-- Bottom bar with Reset and vote count -->
  <div class="bottom-bar">
    <button id="resetVotes">Reset</button>
    <span>Vote Count: <span id="voteCountDisplay">0/0</span></span>
  </div>

  <script>
    const socket = io();
    const resetButton = document.getElementById('resetVotes');
    const voteCountDisplay = document.getElementById('voteCountDisplay');

    // Generate or retrieve userId
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', userId);
    }

    // Register with the server
    socket.emit('register', { userId });

    // Create the chart with 3 datasets:
    // 0: Other Votes
    // 1: Your Vote
    // 2: Average
    const ctx = document.getElementById('resultsChart').getContext('2d');
    const resultsChart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Other Votes',
            data: [],
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            pointRadius: 4
          },
          {
            label: 'Your Vote',
            data: [],
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            pointRadius: 6
          },
          {
            label: 'Average',
            data: [{ x: 0, y: 0 }],
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            pointRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          x: {
            type: 'linear',
            min: 1,
            max: 5,
            grid: {
              color: (context) => {
                // Bold grid line at 3 (center)
                return context.tick.value === 3 ? '#000' : '#ccc';
              }
            },
            ticks: { stepSize: 1 },
            title: {
              display: true,
              text: 'Effort',
              font: { size: 24 } // Axis label 2x bigger
            }
          },
          y: {
            type: 'linear',
            min: 1,
            max: 5,
            grid: {
              color: (context) => {
                // Bold grid line at 3 (center)
                return context.tick.value === 3 ? '#000' : '#ccc';
              }
            },
            ticks: { stepSize: 1 },
            title: {
              display: true,
              text: 'Impact',
              font: { size: 24 } // Axis label 2x bigger
            }
          }
        }
      }
    });

    // Click to vote (ratings clamped between 1 and 5)
    resultsChart.canvas.addEventListener('click', (evt) => {
      const xScale = resultsChart.scales.x;
      const yScale = resultsChart.scales.y;

      const xValue = xScale.getValueForPixel(evt.offsetX);
      const yValue = yScale.getValueForPixel(evt.offsetY);

      const effort = Math.round(Math.min(Math.max(xValue, 1), 5));
      const impact = Math.round(Math.min(Math.max(yValue, 1), 5));

      socket.emit('newVote', { userId, effort, impact });
    });

    // Reset
    resetButton.addEventListener('click', () => {
      socket.emit('reset');
    });

    // Update vote count as a fraction (votes/users)
    socket.on('voteCount', (data) => {
      voteCountDisplay.textContent = `${data.voteCount}/${data.userCount}`;
    });

    // Only get 'update' if we're in the "voters" room
    socket.on('update', (data) => {
      const userVote = data.allVotes.find(v => v.userId === userId);
      const otherVotes = data.allVotes.filter(v => v.userId !== userId);

      // Other Votes
      resultsChart.data.datasets[0].data = otherVotes.map(v => ({
        x: v.effort,
        y: v.impact
      }));

      // Your Vote
      if (userVote) {
        resultsChart.data.datasets[1].data = [{
          x: userVote.effort,
          y: userVote.impact
        }];
      } else {
        resultsChart.data.datasets[1].data = [];
      }

      // Average
      resultsChart.data.datasets[2].data = [{
        x: data.averageEffort,
        y: data.averageImpact
      }];

      resultsChart.update();
    });
  </script>
</body>
</html>

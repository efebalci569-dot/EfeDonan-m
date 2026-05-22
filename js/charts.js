let fpsChartInstance = null;
let altResChartInstance = null;
let popularChartInstance = null;

function createFpsChart(qualities, fpsData) {
  const ctx = document.getElementById('fpsChart').getContext('2d');
  if (fpsChartInstance) fpsChartInstance.destroy();

  fpsChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: qualities.map(q => CONFIG.QUALITY_LABELS[q]),
      datasets: [{
        label: 'Ortalama FPS',
        data: qualities.map(q => fpsData[q].fps),
        backgroundColor: [
          'rgba(0,255,136,0.5)',
          'rgba(0,212,255,0.5)',
          'rgba(124,58,234,0.5)',
          'rgba(255,61,138,0.5)',
        ],
        borderColor: [
          'rgba(0,255,136,1)',
          'rgba(0,212,255,1)',
          'rgba(124,58,234,1)',
          'rgba(255,61,138,1)',
        ],
        borderWidth: 2,
        borderRadius: 8,
        barPercentage: 0.6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a3a',
          titleColor: '#fff',
          bodyColor: '#b0b0c8',
          borderColor: 'rgba(0,212,255,0.3)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            afterLabel: function(context) {
              const q = qualities[context.dataIndex];
              const d = fpsData[q];
              return `GPU: ${d.gpuFps} FPS | CPU: ${d.cpuFps} FPS`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#8888aa', font: { size: 11 }, callback: v => v + ' FPS' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#b0b0c8', font: { size: 12, weight: '600' } }
        }
      }
    }
  });
}

function createAltResChart(resolutionData) {
  const ctx = document.getElementById('altResChart').getContext('2d');
  if (altResChartInstance) altResChartInstance.destroy();

  const labels = resolutionData.map(d => d.resolution.id);
  const fpsValues = resolutionData.map(d => d.fps);
  const colors = fpsValues.map(v =>
    v >= 144 ? 'rgba(0,255,136,0.6)' :
    v >= 60 ? 'rgba(0,212,255,0.6)' :
    v >= 30 ? 'rgba(255,183,0,0.6)' :
    'rgba(255,61,138,0.6)'
  );
  const borderColors = colors.map(c => c.replace('0.6', '1'));

  altResChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'FPS',
        data: fpsValues,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.7,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a3a',
          titleColor: '#fff',
          bodyColor: '#b0b0c8',
          borderColor: 'rgba(0,212,255,0.3)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: ctx => `${ctx.parsed.y} FPS`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#8888aa', font: { size: 10 }, callback: v => v + ' FPS' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#b0b0c8', font: { size: 10 } }
        }
      }
    }
  });
}

function createPopularGamesChart(stats) {
  const ctx = document.getElementById('popularGamesChart').getContext('2d');
  if (popularChartInstance) popularChartInstance.destroy();

  popularChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['30+ FPS', '60+ FPS', '120+ FPS', '144+ FPS'],
      datasets: [
        {
          label: 'Tüm Oyunlar (%)',
          data: [stats.all.gt30, stats.all.gt60, stats.all.gt120, stats.all.gt144],
          backgroundColor: 'rgba(0,212,255,0.5)',
          borderColor: 'rgba(0,212,255,1)',
          borderWidth: 2,
          borderRadius: 6,
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a3a',
          titleColor: '#fff',
          bodyColor: '#b0b0c8',
          borderColor: 'rgba(0,212,255,0.3)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: ctx => `${ctx.parsed.x}%`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#8888aa', font: { size: 11 }, callback: v => v + '%' }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#b0b0c8', font: { size: 12, weight: '600' } }
        }
      }
    }
  });
}
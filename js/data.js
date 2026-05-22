let gpus = [], cpus = [], motherboards = [], games = [], resolutions = [];
let dataLoaded = false;

async function loadData() {
  try {
    const [g, c, m, gm, r] = await Promise.all([
      fetch('data/gpus.json').then(r => r.json()),
      fetch('data/cpus.json').then(r => r.json()),
      fetch('data/motherboards.json').then(r => r.json()),
      fetch('data/games.json').then(r => r.json()),
      fetch('data/resolutions.json').then(r => r.json()),
    ]);
    gpus = g; cpus = c; motherboards = m; games = gm; resolutions = r;
    gpus.sort((a, b) => b.performanceScore - a.performanceScore);
    cpus.sort((a, b) => b.performanceScore - a.performanceScore);
    games.sort((a, b) => b.popularity - a.popularity);
    dataLoaded = true;
  } catch (err) {
    console.error('Veri yüklenemedi:', err);
    document.getElementById('calculateBtn').innerHTML = '<i class="bi bi-exclamation-triangle me-2"></i>Veri Yüklenemedi!';
  }
}

function getGpuById(id) { return gpus.find(g => g.id === id); }
function getCpuById(id) { return cpus.find(c => c.id === id); }
function getMotherboardById(id) { return motherboards.find(m => m.id === id); }
function getGameById(id) { return games.find(g => g.id === id); }
function getResolutionById(id) { return resolutions.find(r => r.id === id); }

function getCpusBySocket(socket) {
  return cpus.filter(c => c.socket === socket).sort((a, b) => b.performanceScore - a.performanceScore);
}

function getMotherboardSockets() {
  return [...new Set(motherboards.map(m => m.socket))];
}

function getGamesByPopularity(limit) {
  return games.slice(0, limit || games.length);
}
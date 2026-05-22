let selectedGpu = null, selectedCpu = null, selectedGame = null, selectedResolution = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  if (!dataLoaded) return;

  populateGpus();
  populateMotherboards();
  populateResolutions();
  populateGames();
  setupEventListeners();

  const params = getUrlParams();
  if (params.gpu && params.mb && params.cpu && params.game && params.res) {
    applyUrlParams(params);
  }
});

function populateGpus() {
  const sel = document.getElementById('gpuSelect');
  sel.innerHTML = '<option value="">GPU Seçin...</option>';
  for (const g of gpus) {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = `${g.shortName} | ${g.vram}GB | ${g.performanceScore}p`;
    sel.appendChild(opt);
  }
}

function populateMotherboards() {
  const sel = document.getElementById('motherboardSelect');
  sel.innerHTML = '<option value="">Anakart Seçin...</option>';
  for (const m of motherboards) {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.brand} ${m.name} (${m.socket})`;
    sel.appendChild(opt);
  }
}

function populateCpusBySocket(socket) {
  const sel = document.getElementById('cpuSelect');
  sel.innerHTML = '<option value="">İşlemci Seçin...</option>';
  sel.disabled = !socket;
  if (!socket) return;

  const compatible = getCpusBySocket(socket);
  for (const c of compatible) {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.shortName} | ${c.cores}C/${c.threads}T | ${c.performanceScore}p`;
    sel.appendChild(opt);
  }
  sel.disabled = compatible.length === 0;
  if (compatible.length === 0) {
    sel.innerHTML = '<option value="">Bu soket için işlemci bulunamadı</option>';
  }
}

function populateResolutions() {
  const sel = document.getElementById('resolutionSelect');
  sel.innerHTML = '<option value="">Çözünürlük Seçin...</option>';
  for (const r of resolutions) {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = r.label;
    sel.appendChild(opt);
  }
}

function populateGames() {
  const sel = document.getElementById('gameSelect');
  sel.innerHTML = '<option value="">Oyun Seçin...</option>';
  for (const g of games) {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = `${g.name} (${g.year})`;
    sel.appendChild(opt);
  }
}

function setupEventListeners() {
  document.getElementById('motherboardSelect').addEventListener('change', function() {
    const mb = getMotherboardById(this.value);
    populateCpusBySocket(mb ? mb.socket : null);
    selectedCpu = null;
    checkCalculateReady();
  });

  document.getElementById('gpuSelect').addEventListener('change', function() {
    selectedGpu = getGpuById(this.value);
    checkCalculateReady();
  });

  document.getElementById('cpuSelect').addEventListener('change', function() {
    selectedCpu = getCpuById(this.value);
    checkCalculateReady();
  });

  document.getElementById('resolutionSelect').addEventListener('change', function() {
    selectedResolution = this.value;
    checkCalculateReady();
  });

  document.getElementById('gameSelect').addEventListener('change', function() {
    selectedGame = getGameById(this.value);
    checkCalculateReady();
  });

  document.getElementById('calculateBtn').addEventListener('click', calculateAndShow);
}

function checkCalculateReady() {
  const btn = document.getElementById('calculateBtn');
  const ready = selectedGpu && selectedCpu && selectedResolution && selectedGame;
  btn.disabled = !ready;
  if (ready) {
    btn.innerHTML = '<i class="bi bi-search me-2"></i>HESAPLA';
  }
}

function applyUrlParams(params) {
  const setSelect = (id, val) => {
    const el = document.getElementById(id);
    if (el && val) { el.value = val; el.dispatchEvent(new Event('change')); }
  };
  setSelect('gpuSelect', params.gpu);
  setSelect('motherboardSelect', params.mb);
  setSelect('cpuSelect', params.cpu);
  setSelect('resolutionSelect', params.res);
  setSelect('gameSelect', params.game);

  setTimeout(calculateAndShow, 500);
}

function calculateAndShow() {
  if (!selectedGpu || !selectedCpu || !selectedResolution || !selectedGame) return;

  setUrlParams({
    gpu: selectedGpu.id,
    mb: document.getElementById('motherboardSelect').value,
    cpu: selectedCpu.id,
    res: selectedResolution,
    game: selectedGame.id
  });

  document.getElementById('loadingOverlay').classList.remove('d-none');

  setTimeout(() => {
    updateBottleneck();
    updateFpsCards();
    updateFpsChart();
    updateSystemReqs();
    updateAltResChart();
    updateOverclocking();
    updatePopularGamesChart();
    updateFpsTips();
    updateCpuUpgrade();

    document.getElementById('results').classList.remove('d-none');
    document.getElementById('loadingOverlay').classList.add('d-none');

    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 600);
}

function updateBottleneck() {
  const bn = calculateBottleneck(selectedGpu, selectedCpu);
  const cpuUsage = 100 - bn.percent * (bn.isCpuBottleneck ? 1 : 0);
  const gpuUsage = 100 - bn.percent * (bn.isCpuBottleneck ? 0 : 1);

  const cpuBar = document.getElementById('cpuBar');
  const gpuBar = document.getElementById('gpuBar');
  cpuBar.style.width = (bn.isCpuBottleneck ? 100 - bn.percent : 100) + '%';
  gpuBar.style.width = (bn.isCpuBottleneck ? 100 : 100 - bn.percent) + '%';

  cpuBar.style.background = bn.isCpuBottleneck
    ? 'linear-gradient(90deg, #ff6b35, #ff3d8a)'
    : 'linear-gradient(90deg, #00d4ff, #7c3aed)';

  document.getElementById('cpuPercent').textContent = (bn.isCpuBottleneck ? 100 - bn.percent : 100) + '%';
  document.getElementById('gpuPercent').textContent = (bn.isCpuBottleneck ? 100 : 100 - bn.percent) + '%';

  const badge = getBottleneckLabel(bn.percent, bn.isCpuBottleneck);
  const badgeEl = document.getElementById('bottleneckBadge');
  badgeEl.className = 'bottleneck-badge ' + badge.cls;
  document.getElementById('bottleneckText').textContent = badge.text;

  const detail = document.getElementById('bottleneckDetail');
  if (bn.percent <= CONFIG.BOTTLENECK_THRESHOLD) {
    detail.textContent = `${selectedGpu.shortName} ve ${selectedCpu.shortName} mükemmel uyum sağlıyor.`;
  } else if (bn.isCpuBottleneck) {
    detail.textContent = `${selectedCpu.shortName}, ${selectedGpu.shortName} için yetersiz kalıyor. İşlemci yükseltmesi önerilir.`;
  } else {
    detail.textContent = `${selectedGpu.shortName}, ${selectedCpu.shortName} için dengeli. Daha iyi GPU ile FPS artabilir.`;
  }
}

function updateFpsCards() {
  const allQualities = calculateAllQualities(selectedGpu, selectedCpu, selectedGame, selectedResolution);

  document.getElementById('selectedGameName').textContent = selectedGame.name;

  for (const q of CONFIG.QUALITY_KEYS) {
    const fps = allQualities[q].fps;
    const play = getPlayabilityLabel(fps);

    const fpsEl = document.getElementById('fps' + q.charAt(0).toUpperCase() + q.slice(1));
    const badgeEl = document.getElementById('badge' + q.charAt(0).toUpperCase() + q.slice(1));

    if (fpsEl) fpsEl.textContent = fps;
    if (badgeEl) {
      badgeEl.textContent = play.text;
      badgeEl.className = 'fps-badge ' + play.class;
    }
  }
}

function updateFpsChart() {
  const allQualities = calculateAllQualities(selectedGpu, selectedCpu, selectedGame, selectedResolution);
  createFpsChart(CONFIG.QUALITY_KEYS, allQualities);
}

function updateSystemReqs() {
  const reqs = selectedGame.requirements;
  const minGpu = getGpuById(reqs.min.gpu);
  const recGpu = getGpuById(reqs.recommended.gpu);
  const minCpu = getCpuById(reqs.min.cpu);
  const recCpu = getCpuById(reqs.recommended.cpu);

  document.getElementById('minGpu').textContent = minGpu ? minGpu.shortName : reqs.min.gpu;
  document.getElementById('recGpu').textContent = recGpu ? recGpu.shortName : reqs.recommended.gpu;
  document.getElementById('minCpu').textContent = minCpu ? minCpu.shortName : reqs.min.cpu;
  document.getElementById('recCpu').textContent = recCpu ? recCpu.shortName : reqs.recommended.cpu;
  document.getElementById('minRam').textContent = reqs.min.ram + ' GB';
  document.getElementById('recRam').textContent = reqs.recommended.ram + ' GB';
  document.getElementById('reqStorage').textContent = reqs.recommended.storage + ' GB';

  const gpuScore = selectedGpu.performanceScore;
  const recGpuScore = recGpu ? recGpu.performanceScore : 50;
  const recCpuScore = recCpu ? recCpu.performanceScore : 50;

  const gpuFit = getFitLevel(gpuScore, recGpuScore);
  const cpuFit = getFitLevel(selectedCpu.performanceScore, recCpuScore);

  document.getElementById('gpuFitText').textContent = gpuFit.text;
  document.getElementById('cpuFitText').textContent = cpuFit.text;
  document.getElementById('gpuFitBar').style.width = gpuFit.pct + '%';
  document.getElementById('cpuFitBar').style.width = cpuFit.pct + '%';
}

function updateAltResChart() {
  const data = calculateAllResolutions(selectedGpu, selectedCpu, selectedGame, 'medium');
  createAltResChart(data);
}

function updateOverclocking() {
  const oc = calculateOverclocked(selectedGpu, selectedCpu, selectedGame, selectedResolution, 'medium');
  document.getElementById('ocNormalFps').textContent = oc.normal + ' FPS';
  document.getElementById('ocOverclockedFps').textContent = oc.ocCpu + ' FPS';

  const gain = oc.normal > 0 ? Math.round((oc.ocCpu - oc.normal) / oc.normal * 100) : 0;
  document.getElementById('ocGain').textContent = '+' + gain + '%';
}

function updatePopularGamesChart() {
  const stats = getPopularGamesStats(selectedGpu, selectedCpu, selectedResolution);
  createPopularGamesChart(stats);
}

function updateFpsTips() {
  const currentFps = calculateSingleFps(selectedGpu, selectedCpu, selectedGame, selectedResolution, 'medium').fps;
  const tips = getFpsTips(selectedGpu, selectedCpu, currentFps, selectedGame, selectedResolution);
  const container = document.getElementById('fpsTips');
  container.innerHTML = tips.map(t => `
    <div class="tip-item">
      <div class="tip-icon">${t.icon}</div>
      <div class="tip-text">
        <div class="tip-title">${t.title}</div>
        <div class="tip-desc">${t.desc}</div>
      </div>
    </div>
  `).join('');
}

function updateCpuUpgrade() {
  const suggestions = getCpuUpgradeSuggestions(selectedCpu, selectedGpu);
  const container = document.getElementById('cpuUpgradeContent');

  if (suggestions.length === 0) {
    container.innerHTML = '<p class="text-gray">Mevcut işlemciniz bu soketteki en iyi seçenek.</p>';
    return;
  }

  const rankIcons = ['🥇', '🥈', '🥉'];
  container.innerHTML = `
    <div class="mb-2 small text-gray">
      <i class="bi bi-cpu me-1"></i> Mevcut: ${selectedCpu.shortName} (${selectedCpu.performanceScore}p)
      <span class="ms-2 badge bg-dark text-neon">${selectedCpu.socket}</span>
    </div>
    ${suggestions.map((s, i) => `
      <div class="upgrade-item">
        <div class="upgrade-rank rank-${i+1}">${rankIcons[i]}</div>
        <div class="upgrade-info">
          <div class="upgrade-name">${s.cpu.shortName} ${s.requiresNewMb ? '🔄' : ''}</div>
          <div class="upgrade-stats">${s.cpu.cores}C/${s.cpu.threads}T | ${s.cpu.performanceScore}p | ~$${s.cpu.price}</div>
        </div>
        <div class="upgrade-gain">+%${s.fpsGain}</div>
      </div>
    `).join('')}
  `;
}
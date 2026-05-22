function getQualityFactor(quality) {
  return CONFIG.QUALITY_FACTORS[quality] || 1.0;
}

function getResolutionFactor(resolutionId) {
  const res = getResolutionById(resolutionId);
  return res ? res.factor : 1.0;
}

function calculateSingleFps(gpu, cpu, game, resolutionId, quality) {
  const qualFactor = getQualityFactor(quality);
  const resFactor = getResolutionFactor(resolutionId);

  const baseFps = game.baseFps1080pMedium * qualFactor * resFactor;
  const gpuFactor = gpu.performanceScore / CONFIG.REFERENCE_GPU_SCORE;
  const cpuFactor = cpu.performanceScore / CONFIG.REFERENCE_CPU_SCORE;

  const gpuFps = baseFps * gpuFactor;
  const cpuFps = baseFps * cpuFactor;

  const totalDemand = game.gpuDemand + game.cpuDemand;
  const gameGpuWeight = totalDemand > 0 ? game.gpuDemand / totalDemand : 0.5;
  const resGpuBias = Math.max(0, (1 - resFactor) * 0.3);
  const adjustedGpuWeight = Math.min(1, gameGpuWeight + resGpuBias);
  const adjustedCpuWeight = 1 - adjustedGpuWeight;

  const fps = gpuFps * adjustedGpuWeight + cpuFps * adjustedCpuWeight;

  return {
    fps: Math.round(Math.max(0, fps)),
    gpuFps: Math.round(gpuFps),
    cpuFps: Math.round(cpuFps),
    gpuFactor, cpuFactor
  };
}

function calculateBottleneck(gpu, cpu) {
  const maxScore = Math.max(gpu.performanceScore, cpu.performanceScore);
  if (maxScore === 0) return { percent: 0, isCpuBottleneck: false };
  const diff = Math.abs(gpu.performanceScore - cpu.performanceScore);
  const percent = Math.round((diff / maxScore) * 100);
  return {
    percent,
    isCpuBottleneck: cpu.performanceScore < gpu.performanceScore
  };
}

function calculateAllQualities(gpu, cpu, game, resolutionId) {
  const result = {};
  for (const q of CONFIG.QUALITY_KEYS) {
    result[q] = calculateSingleFps(gpu, cpu, game, resolutionId, q);
  }
  return result;
}

function calculateAllResolutions(gpu, cpu, game, quality) {
  const result = [];
  for (const res of resolutions) {
    const calc = calculateSingleFps(gpu, cpu, game, res.id, quality);
    result.push({ resolution: res, fps: calc.fps });
  }
  return result;
}

function calculateOverclocked(gpu, cpu, game, resolutionId, quality) {
  const ocCpu = { ...cpu, performanceScore: Math.round(cpu.performanceScore * CONFIG.OC_CPU_BOOST) };
  const ocGpu = { ...gpu, performanceScore: Math.round(gpu.performanceScore * CONFIG.OC_GPU_BOOST) };
  return {
    normal: calculateSingleFps(gpu, cpu, game, resolutionId, quality).fps,
    ocCpu: calculateSingleFps(gpu, ocCpu, game, resolutionId, quality).fps,
    ocGpu: calculateSingleFps(ocGpu, cpu, game, resolutionId, quality).fps,
  };
}

function calculateAllGamesFps(gpu, cpu, resolutionId) {
  const quality = 'medium';
  const results = [];
  for (const game of games) {
    const calc = calculateSingleFps(gpu, cpu, game, resolutionId, quality);
    results.push({ game, fps: calc.fps });
  }
  return results;
}

function getPopularGamesStats(gpu, cpu, resolutionId) {
  const allGames = calculateAllGamesFps(gpu, cpu, resolutionId);
  const total = allGames.length;
  const gt30 = allGames.filter(g => g.fps >= 30).length;
  const gt60 = allGames.filter(g => g.fps >= 60).length;
  const gt120 = allGames.filter(g => g.fps >= 120).length;
  const gt144 = allGames.filter(g => g.fps >= 144).length;

  const topGames = allGames.filter(g => g.game.popularity >= 70).slice(0, 20);
  const topGt30 = topGames.filter(g => g.fps >= 30).length;
  const topGt60 = topGames.filter(g => g.fps >= 60).length;
  const topGt120 = topGames.filter(g => g.fps >= 120).length;

  return {
    all: {
      total,
      gt30: Math.round(gt30 / total * 100),
      gt60: Math.round(gt60 / total * 100),
      gt120: Math.round(gt120 / total * 100),
      gt144: Math.round(gt144 / total * 100),
    },
    top: {
      total: topGames.length,
      gt30: Math.round(topGt30 / topGames.length * 100),
      gt60: Math.round(topGt60 / topGames.length * 100),
      gt120: Math.round(topGt120 / topGames.length * 100),
    },
    perGame: topGames.map(g => ({ game: g.game.name, fps: g.fps }))
  };
}

function getCpuUpgradeSuggestions(currentCpu, currentGpu) {
  if (!currentCpu) return [];
  const socket = currentCpu.socket;
  const compatible = cpus.filter(c => c.socket === socket && c.id !== currentCpu.id);
  const suggestions = compatible.map(c => {
    const fpsGain = c.performanceScore > currentCpu.performanceScore
      ? Math.round((c.performanceScore - currentCpu.performanceScore) / currentCpu.performanceScore * 100)
      : Math.round((currentCpu.performanceScore - c.performanceScore) / currentCpu.performanceScore * -100);
    return { cpu: c, fpsGain };
  }).filter(s => s.fpsGain > 0).sort((a, b) => b.fpsGain - a.fpsGain).slice(0, 3);

  while (suggestions.length < 3) {
    const alt = cpus.filter(c => c.socket !== currentCpu.socket && c.performanceScore > currentCpu.performanceScore);
    if (alt.length === 0) break;
    const bestAlt = alt.sort((a, b) => b.performanceScore - a.performanceScore)[0];
    const exists = suggestions.find(s => s.cpu.id === bestAlt.id);
    if (!exists) suggestions.push({ cpu: bestAlt, fpsGain: Math.round((bestAlt.performanceScore - currentCpu.performanceScore) / currentCpu.performanceScore * 100), requiresNewMb: true });
    break;
  }

  return suggestions;
}

function getFpsTips(gpu, cpu, currentFps, game, resolutionId) {
  const tips = [];

  const betterGpu = gpus.find(g => g.performanceScore > gpu.performanceScore * 1.3);
  if (betterGpu) {
    const gain = Math.round((betterGpu.performanceScore / gpu.performanceScore - 1) * 100);
    tips.push({
      icon: '🎮',
      title: `GPU Yükseltmesi: ${betterGpu.shortName}`,
      desc: `Tahmini %${gain}+ FPS artışı. En etkili yükseltme.`
    });
  }

  const res = getResolutionById(resolutionId);
  if (res && res.factor < 1.0) {
    const lowerRes = resolutions.find(r => r.factor > res.factor);
    if (lowerRes) {
      tips.push({
        icon: '📺',
        title: 'Çözünürlük Düşürme',
        desc: `${resolutionId} → ${lowerRes.id}: Tahmini %${Math.round((lowerRes.factor / res.factor - 1) * 100)}+ FPS artışı.`
      });
    }
  }

  if (gpu.performanceScore < 60) {
    tips.push({
      icon: '⚙️',
      title: 'Grafik Ayarlarını Düşürün',
      desc: 'Ultra/High → Medium/Low: Çoğu oyunda %40-60 FPS artışı sağlar.'
    });
  }

  tips.push({
    icon: '💡',
    title: 'DLSS / FSR / XeSS Kullanın',
    desc: 'Yapay zeka destekli yükseltme teknolojileri, görüntü kalitesini korurken FPS\'i %50-80 artırabilir.'
  });

  return tips;
}
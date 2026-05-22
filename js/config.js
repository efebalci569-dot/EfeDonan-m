const CONFIG = {
  REFERENCE_GPU_SCORE: 100,
  REFERENCE_CPU_SCORE: 90,
  QUALITY_FACTORS: { low: 1.30, medium: 1.00, high: 0.76, ultra: 0.56 },
  QUALITY_KEYS: ['low', 'medium', 'high', 'ultra'],
  QUALITY_LABELS: { low: 'Düşük', medium: 'Orta', high: 'Yüksek', ultra: 'Ultra' },
  OC_CPU_BOOST: 1.18,
  OC_GPU_BOOST: 1.12,
  BOTTLENECK_THRESHOLD: 5,
};

function getUrlParams() {
  const params = {};
  const query = window.location.search.substring(1);
  if (!query) return params;
  query.split('&').forEach(p => {
    const [k, v] = p.split('=');
    if (k && v) params[decodeURIComponent(k)] = decodeURIComponent(v);
  });
  return params;
}

function setUrlParams(params) {
  const qs = Object.entries(params)
    .filter(([, v]) => v)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const url = window.location.pathname + (qs ? '?' + qs : '');
  window.history.replaceState({}, '', url);
}

function getPlayabilityLabel(fps) {
  if (fps >= 144) return { text: 'E-Spor', class: 'fps-badge-success' };
  if (fps >= 120) return { text: 'Çok Akıcı', class: 'fps-badge-info' };
  if (fps >= 60) return { text: 'Akıcı', class: 'fps-badge-success' };
  if (fps >= 45) return { text: 'Orta', class: 'fps-badge-warning' };
  if (fps >= 30) return { text: 'Düşük', class: 'fps-badge-warning' };
  return { text: 'Oynanamaz', class: 'fps-badge-danger' };
}

function getBottleneckLabel(percent, isCpu) {
  if (percent <= CONFIG.BOTTLENECK_THRESHOLD) return { text: '✓ Dengeli Sistem', cls: 'bottleneck-none' };
  if (isCpu) return { text: `⚠ CPU Darboğazı (%${percent})`, cls: 'bottleneck-cpu' };
  return { text: `⚠ GPU Darboğazı (%${percent})`, cls: 'bottleneck-gpu' };
}

function getFitLevel(userScore, reqScore) {
  const ratio = userScore / reqScore;
  if (ratio >= 2) return { text: 'Fazlasıyla Yeterli', pct: 100 };
  if (ratio >= 1.5) return { text: 'Çok İyi', pct: 85 };
  if (ratio >= 1.0) return { text: 'Yeterli', pct: 65 };
  if (ratio >= 0.7) return { text: 'Sınırda', pct: 40 };
  return { text: 'Yetersiz', pct: 15 };
}
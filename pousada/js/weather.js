/**
 * RECANTO DA PEDRA — POUSADA & GASTRONOMIA (IRIRI, ANCHIETA - ES)
 * Componente Minimalista de Clima & Condições do Mar
 * 
 * - Linha recolhida: fina e discreta (~44px max no desktop)
 * - Painel expandido: tabela profissional estilo Apple Weather / Windy
 * - Seletor segmentado de abas: "Sua estadia" e "7 dias"
 * - APIs Open-Meteo (tempo real, gratuitas) com cache de 15 minutos em sessionStorage
 */

// ============================================================================
// CONFIGURAÇÃO CENTRALIZADA
// ============================================================================
const WEATHER_CONFIG = {
  lat: -20.79,                     // Latitude aproximada de Iriri
  lon: -40.62,                     // Longitude aproximada de Iriri
  timezone: "America/Sao_Paulo",
  forecastDays: 16,
  cacheKey: "recanto_weather_pro_v2",
  cacheDurationMs: 15 * 60 * 1000  // 15 minutos
};

// Dias da semana em português
const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Mapeamento WMO com rótulo em português e ícone SVG vetorial limpo (Lucide / Meteocons style)
const WMO_MAP = {
  0: { label: "Céu limpo", type: "sun" },
  1: { label: "Ensolarado", type: "sun" },
  2: { label: "Parcialmente nublado", type: "cloud-sun" },
  3: { label: "Nublado", type: "cloud" },
  45: { label: "Nevoeiro", type: "fog" },
  48: { label: "Nevoeiro com rime", type: "fog" },
  51: { label: "Garoa leve", type: "drizzle" },
  53: { label: "Garoa", type: "drizzle" },
  55: { label: "Garoa densa", type: "rain" },
  61: { label: "Chuva fraca", type: "drizzle" },
  63: { label: "Chuva moderada", type: "rain" },
  65: { label: "Chuva forte", type: "heavy-rain" },
  80: { label: "Pancadas de chuva", type: "drizzle" },
  81: { label: "Pancadas moderadas", type: "rain" },
  82: { label: "Chuva torrencial", type: "heavy-rain" },
  95: { label: "Trovoadas", type: "thunder" },
  96: { label: "Chuva com raios", type: "thunder" },
  99: { label: "Tempestade severa", type: "thunder" }
};

// Gerador de ícones vetoriais SVG (24x24px, traço consistente de 2px, sem emojis)
function getSvgIcon(type, label) {
  const common = `class="weather-svg-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${label}"`;
  switch (type) {
    case 'sun':
      return `<svg ${common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;
    case 'moon':
      return `<svg ${common}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
    case 'cloud-sun':
      return `<svg ${common}><path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2"/><path d="M16 12a4 4 0 0 0-4-4c-1.3 0-2.45.62-3.17 1.58A4 4 0 0 0 3 13.5C3 15.99 5.01 18 7.5 18H17a4 4 0 0 0 0-8c-.34 0-.67.04-1 .11"/></svg>`;
    case 'cloud-moon':
      return `<svg ${common}><path d="M10 2a6 6 0 0 0 6 6 6 6 0 0 0 .5-.02A4.5 4.5 0 0 1 18 19H7a5 5 0 0 1-1-9.9 6 6 0 0 0 4-7.1Z"/></svg>`;
    case 'cloud':
      return `<svg ${common}><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`;
    case 'fog':
      return `<svg ${common}><path d="M4 14h16M4 18h16M4 10h16M4 6h16"/></svg>`;
    case 'drizzle':
      return `<svg ${common}><path d="M17.5 17H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M8 19v2M12 19v2M16 19v2"/></svg>`;
    case 'rain':
      return `<svg ${common}><path d="M17.5 17H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="m8 18-1 3M12 18l-1 3M16 18l-1 3"/></svg>`;
    case 'heavy-rain':
      return `<svg ${common}><path d="M17.5 16H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="m7 17-2 4M11 17l-2 4M15 17l-2 4M19 17l-2 4"/></svg>`;
    case 'thunder':
      return `<svg ${common}><path d="M17.5 17H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="m13 13-3 5h4l-2 5"/></svg>`;
    default:
      return `<svg ${common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>`;
  }
}

// ============================================================================
// GERENCIADOR PROFISSIONAL
// ============================================================================
class RecantoProfessionalWeather {
  constructor() {
    this.container = document.getElementById('weatherMarineConsole');
    this.data = null;
    this.currentStay = { checkin: null, checkout: null };
    this.isExpanded = false;
    this.activeTab = 'stay'; // 'stay' ou '7days'
  }

  init() {
    if (!this.container) return;
    this.renderSkeleton();
    this.loadData().then(() => {
      this.syncWithBookingBar();
    });

    setInterval(() => this.loadData(true), WEATHER_CONFIG.cacheDurationMs);
  }

  syncWithBookingBar() {
    const inInput = document.getElementById('barCheckin');
    const outInput = document.getElementById('barCheckout');
    if (inInput && outInput && inInput.value && outInput.value) {
      this.highlightStay(inInput.value, outInput.value);
    }
  }

  getCachedData() {
    try {
      const raw = sessionStorage.getItem(WEATHER_CONFIG.cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp > WEATHER_CONFIG.cacheDurationMs) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  setCachedData(data) {
    try {
      sessionStorage.setItem(WEATHER_CONFIG.cacheKey, JSON.stringify(data));
    } catch (e) {}
  }

  async loadData(forceRefresh = false) {
    try {
      if (!forceRefresh) {
        const cached = this.getCachedData();
        if (cached) {
          this.data = cached;
          this.renderFull();
          return;
        }
      }

      // API Meteorológica com novos campos solicitados
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_CONFIG.lat}&longitude=${WEATHER_CONFIG.lon}&timezone=${encodeURIComponent(WEATHER_CONFIG.timezone)}&forecast_days=${WEATHER_CONFIG.forecastDays}&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant,uv_index_max,sunrise,sunset`;

      // API Marítima com wave_period_max
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${WEATHER_CONFIG.lat}&longitude=${WEATHER_CONFIG.lon}&timezone=${encodeURIComponent(WEATHER_CONFIG.timezone)}&forecast_days=${WEATHER_CONFIG.forecastDays}&current=wave_height,sea_surface_temperature&daily=wave_height_max,wave_period_max`;

      const [weatherRes, marineRes] = await Promise.allSettled([
        fetch(weatherUrl).then(r => (r.ok ? r.json() : null)),
        fetch(marineUrl).then(r => (r.ok ? r.json() : null))
      ]);

      if (weatherRes.status !== 'fulfilled' || !weatherRes.value) return;

      this.data = {
        weather: weatherRes.value,
        marine: marineRes.status === 'fulfilled' ? marineRes.value : null,
        timestamp: Date.now()
      };

      this.setCachedData(this.data);
      this.renderFull();
    } catch (err) {
      console.warn('[Clima Pro]', err);
    }
  }

  renderSkeleton() {
    this.container.innerHTML = `
      <div class="weather-minimal-bar" id="weatherMinimalBar">
        <button type="button" class="weather-toggle-btn" disabled aria-label="Carregando previsão do tempo">
          <div class="weather-summary-line">
            <span class="weather-summary-item">
              <span class="weather-dot-live"></span>
              <span style="opacity: 0.6;">Carregando clima em Iriri...</span>
            </span>
          </div>
          <span class="weather-chevron"><i class="fa-solid fa-chevron-down"></i></span>
        </button>
      </div>
    `;
  }

  // Renderiza toda a estrutura (linha recolhida + painel expandido redesenhado)
  renderFull() {
    if (!this.data || !this.data.weather) return;

    const currentW = this.data.weather.current || {};
    const code = currentW.weather_code ?? 0;
    const meta = WMO_MAP[code] || { label: "Parcialmente nublado", type: "cloud-sun" };
    const isDay = currentW.is_day ?? 1;
    let currentIconType = meta.type;
    if (isDay === 0) {
      if (currentIconType === 'sun') currentIconType = 'moon';
      else if (currentIconType === 'cloud-sun') currentIconType = 'cloud-moon';
    }
    const temp = Math.round(currentW.temperature_2m ?? 28);

    // Dados Marítimos Atuais (tolerante a falhas)
    const currentM = (this.data.marine && this.data.marine.current) ? this.data.marine.current : null;
    const hasMarine = currentM && currentM.sea_surface_temperature != null && currentM.wave_height != null;
    const seaTemp = hasMarine ? Math.round(currentM.sea_surface_temperature) : null;
    const waveHeight = hasMarine ? Number(currentM.wave_height).toFixed(1).replace('.', ',') : null;

    // Snapshot do momento (linha discreta acima da tabela)
    const appTemp = Math.round(currentW.apparent_temperature ?? temp);
    const humidity = currentW.relative_humidity_2m != null ? Math.round(currentW.relative_humidity_2m) : null;
    const dailyW = this.data.weather.daily || { time: [] };
    const uvMax = dailyW.uv_index_max && dailyW.uv_index_max[0] != null ? Math.round(dailyW.uv_index_max[0]) : null;

    const formatTime = (iso) => (iso ? iso.split('T')[1]?.substring(0, 5) : null);
    const sunrise = dailyW.sunrise ? formatTime(dailyW.sunrise[0]) : null;
    const sunset = dailyW.sunset ? formatTime(dailyW.sunset[0]) : null;

    // Timestamp da atualização
    const updatedTime = new Date(this.data.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Determinar se há estadia válida para definir aba padrão
    const stayIndices = this.getStayIndices();
    const hasValidStay = stayIndices.length > 0;
    if (!hasValidStay && this.activeTab === 'stay') {
      this.activeTab = '7days';
    }

    this.container.innerHTML = `
      <div class="weather-minimal-bar ${this.isExpanded ? 'is-expanded' : ''}" id="weatherMinimalBar">
        <!-- 1. LINHA RECOLHIDA PADRÃO (Max ~44px no desktop) -->
        <button type="button" class="weather-toggle-btn" id="weatherToggleBtn" aria-expanded="${this.isExpanded ? 'true' : 'false'}" aria-controls="weatherExpandedDrawer" aria-label="Abrir painel detalhado de previsão do tempo">
          <div class="weather-summary-line">
            <!-- Clima Atual -->
            <span class="weather-summary-item weather-current-item">
              <span class="weather-dot-live" aria-hidden="true"></span>
              <span class="weather-mini-icon-wrap" aria-hidden="true">${getSvgIcon(currentIconType, meta.label)}</span>
              <span id="miniWeatherText">${temp}°C ${meta.label}</span>
            </span>

            ${hasMarine ? `
              <span class="weather-summary-sep" aria-hidden="true">·</span>
              <!-- Mar de Iriri -->
              <span class="weather-summary-item weather-sea-item">
                <span class="weather-sea-emoji" aria-hidden="true">🌊</span>
                <span>${seaTemp}°C, ondas ${waveHeight} m</span>
              </span>
            ` : ''}

            <!-- Trecho da Estadia (Opcional, só se dentro de 16 dias) -->
            <span class="weather-summary-sep weather-stay-sep" id="miniStaySep" aria-hidden="true" style="display: ${hasValidStay ? 'inline' : 'none'};">·</span>
            <span class="weather-summary-item weather-stay-item" id="miniStayItem" style="display: ${hasValidStay ? 'inline-flex' : 'none'};">
              <span id="miniStayText"></span>
            </span>
          </div>

          <span class="weather-chevron" aria-hidden="true">
            <i class="fa-solid fa-chevron-down" id="miniChevronIcon"></i>
          </span>
        </button>

        <!-- 2. PAINEL EXPANDIDO (TABELA PROFISSIONAL ESTILO APPLE WEATHER / WINDY) -->
        <div class="weather-drawer" id="weatherExpandedDrawer" role="region" aria-label="Previsão detalhada do tempo e mar">
          <div class="weather-drawer-inner">
            
            <!-- Barra de Topo: Abas Segmentadas -->
            <div class="weather-drawer-topbar">
              <div class="weather-tab-group" role="tablist" aria-label="Visualização da previsão">
                <button type="button" class="weather-tab-btn ${this.activeTab === 'stay' ? 'is-active' : ''}" id="tabStayBtn" role="tab" aria-selected="${this.activeTab === 'stay' ? 'true' : 'false'}" ${!hasValidStay ? 'disabled title="Selecione Entrada e Saída na barra de reservas"' : ''}>
                  Sua estadia
                </button>
                <button type="button" class="weather-tab-btn ${this.activeTab === '7days' ? 'is-active' : ''}" id="tab7DaysBtn" role="tab" aria-selected="${this.activeTab === '7days' ? 'true' : 'false'}">
                  7 dias
                </button>
              </div>
            </div>

            <!-- Bloco de Resumo Discreto das Condições Atuais -->
            <div class="weather-summary-snapshot" aria-label="Condições meteorológicas do momento">
              <span class="snap-item"><span class="snap-lbl">Sensação</span> <strong class="snap-val">${appTemp}°</strong></span>
              ${humidity != null ? `<span class="snap-sep">·</span><span class="snap-item"><span class="snap-lbl">Umidade</span> <strong class="snap-val">${humidity}%</strong></span>` : ''}
              ${uvMax != null ? `<span class="snap-sep">·</span><span class="snap-item"><span class="snap-lbl">UV</span> <strong class="snap-val">${uvMax}</strong></span>` : ''}
              ${sunrise ? `<span class="snap-sep">·</span><span class="snap-item"><span class="snap-lbl">Nascer</span> <strong class="snap-val">${sunrise}</strong></span>` : ''}
              ${sunset ? `<span class="snap-sep">·</span><span class="snap-item"><span class="snap-lbl">Pôr do sol</span> <strong class="snap-val">${sunset}</strong></span>` : ''}
              ${hasMarine ? `<span class="snap-sep">·</span><span class="snap-item"><span class="snap-lbl">Água</span> <strong class="snap-val snap-marine">${seaTemp}°</strong></span>` : ''}
            </div>

            <!-- Tabela Semântica de Previsão -->
            <div class="weather-table-container">
              <table class="weather-pro-table ${!hasMarine ? 'no-marine-data' : ''}">
                <thead>
                  <tr>
                    <th scope="col" class="th-day">Dia</th>
                    <th scope="col" class="th-icon"><span class="sr-only">Condição</span></th>
                    <th scope="col" class="th-cond">Condição</th>
                    <th scope="col" class="th-rain" title="Probabilidade de chuva e volume acumulado">Chuva</th>
                    <th scope="col" class="th-temp">Temperatura</th>
                    <th scope="col" class="th-wind">Vento</th>
                    ${hasMarine ? `<th scope="col" class="th-waves">Ondas</th>` : ''}
                  </tr>
                </thead>
                <tbody id="weatherTableBody">
                  <!-- Injetado dinamicamente -->
                </tbody>
              </table>
            </div>

            <!-- Rodapé Discreto -->
            <div class="weather-drawer-footer">
              <span>Iriri, Anchieta · atualizado às ${updatedTime} · Dados: Open-Meteo</span>
            </div>

          </div>
        </div>
      </div>
    `;

    // Conectar eventos
    this.attachEvents();
    // Renderizar linhas da tabela conforme a aba ativa
    this.renderTableRows();
    // Atualizar texto resumido da estadia na linha recolhida
    this.updateStaySummaryLine();
  }

  attachEvents() {
    const toggleBtn = document.getElementById('weatherToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleExpand());
    }

    const tabStayBtn = document.getElementById('tabStayBtn');
    const tab7DaysBtn = document.getElementById('tab7DaysBtn');

    if (tabStayBtn) {
      tabStayBtn.addEventListener('click', () => {
        if (tabStayBtn.disabled) return;
        this.activeTab = 'stay';
        this.updateTabSelection();
        this.renderTableRows();
      });
    }

    if (tab7DaysBtn) {
      tab7DaysBtn.addEventListener('click', () => {
        this.activeTab = '7days';
        this.updateTabSelection();
        this.renderTableRows();
      });
    }
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    const bar = document.getElementById('weatherMinimalBar');
    const btn = document.getElementById('weatherToggleBtn');
    if (bar && btn) {
      bar.classList.toggle('is-expanded', this.isExpanded);
      btn.setAttribute('aria-expanded', this.isExpanded ? 'true' : 'false');
    }
  }

  updateTabSelection() {
    const tabStayBtn = document.getElementById('tabStayBtn');
    const tab7DaysBtn = document.getElementById('tab7DaysBtn');
    if (tabStayBtn && tab7DaysBtn) {
      tabStayBtn.classList.toggle('is-active', this.activeTab === 'stay');
      tabStayBtn.setAttribute('aria-selected', this.activeTab === 'stay' ? 'true' : 'false');
      tab7DaysBtn.classList.toggle('is-active', this.activeTab === '7days');
      tab7DaysBtn.setAttribute('aria-selected', this.activeTab === '7days' ? 'true' : 'false');
    }
  }

  getStayIndices() {
    if (!this.data || !this.data.weather) return [];
    const inIso = this.currentStay.checkin;
    const outIso = this.currentStay.checkout;
    if (!inIso || !outIso) return [];

    const dailyW = this.data.weather.daily || { time: [] };
    const indices = [];
    for (let i = 0; i < dailyW.time.length; i++) {
      const d = dailyW.time[i];
      if (d >= inIso && d <= outIso) {
        indices.push(i);
      }
    }
    return indices;
  }

  // Atualiza o texto da estadia na linha recolhida
  updateStaySummaryLine() {
    const stayIndices = this.getStayIndices();
    const staySep = document.getElementById('miniStaySep');
    const stayItem = document.getElementById('miniStayItem');
    const stayText = document.getElementById('miniStayText');

    if (!stayText) return;

    if (stayIndices.length > 0) {
      const dailyW = this.data.weather.daily;
      const minTemps = stayIndices.map(i => dailyW.temperature_2m_min[i]).filter(v => v != null);
      const maxTemps = stayIndices.map(i => dailyW.temperature_2m_max[i]).filter(v => v != null);
      const rainProbs = stayIndices.map(i => dailyW.precipitation_probability_max[i]).filter(v => v != null);

      const lowestMin = minTemps.length ? Math.round(Math.min(...minTemps)) : 22;
      const peakMax = maxTemps.length ? Math.round(Math.max(...maxTemps)) : 31;
      const peakRain = rainProbs.length ? Math.round(Math.max(...rainProbs)) : 0;

      stayText.textContent = `Sua estadia: ${lowestMin}–${peakMax}°, chuva ${peakRain}%`;
      if (staySep) staySep.style.display = 'inline';
      if (stayItem) stayItem.style.display = 'inline-flex';
    } else {
      if (staySep) staySep.style.display = 'none';
      if (stayItem) stayItem.style.display = 'none';
    }
  }

  // Renderiza as linhas da tabela de previsão
  renderTableRows() {
    const tbody = document.getElementById('weatherTableBody');
    if (!tbody || !this.data || !this.data.weather) return;

    const dailyW = this.data.weather.daily || { time: [] };
    const dailyM = (this.data.marine && this.data.marine.daily) ? this.data.marine.daily : null;
    const hasMarine = dailyM && dailyM.wave_height_max;

    const stayIndices = this.getStayIndices();

    // Determinar quais índices exibir conforme a aba ativa
    let displayIndices = [];
    if (this.activeTab === 'stay' && stayIndices.length > 0) {
      displayIndices = stayIndices;
    } else {
      // Aba 7 dias: primeiros 7 dias a partir de hoje
      const total = Math.min(7, dailyW.time.length);
      for (let i = 0; i < total; i++) displayIndices.push(i);
    }

    if (displayIndices.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="weather-table-empty">Nenhuma data disponível para o período selecionado.</td></tr>`;
      return;
    }

    // Calcular mínimo e máximo globais de todos os dias exibidos para a barra de temperatura
    let globalMin = Infinity;
    let globalMax = -Infinity;
    displayIndices.forEach(i => {
      const min = dailyW.temperature_2m_min[i];
      const max = dailyW.temperature_2m_max[i];
      if (min != null && min < globalMin) globalMin = min;
      if (max != null && max > globalMax) globalMax = max;
    });

    if (globalMin === Infinity) globalMin = 20;
    if (globalMax === -Infinity) globalMax = 32;
    const tempSpan = Math.max(1, globalMax - globalMin);

    let rowsHtml = '';
    displayIndices.forEach(i => {
      const dateStr = dailyW.time[i];
      const [y, m, d] = dateStr.split('-');
      const dateObj = new Date(Number(y), Number(m) - 1, Number(d));

      const isToday = (i === 0);
      const weekday = isToday ? "Hoje" : WEEKDAYS_SHORT[dateObj.getDay()];
      const dateFormatted = `${d}/${m}`;

      // Condição e Ícone Vetorial
      const code = dailyW.weather_code ? dailyW.weather_code[i] : 0;
      const meta = WMO_MAP[code] || { label: "Parcialmente nublado", type: "cloud-sun" };
      const svgIcon = getSvgIcon(meta.type, meta.label);

      // Chuva: probabilidade (%) e volume acumulado em mm
      const rainProb = Math.round(dailyW.precipitation_probability_max ? (dailyW.precipitation_probability_max[i] ?? 0) : 0);
      const rainMm = dailyW.precipitation_sum ? Number(dailyW.precipitation_sum[i] ?? 0).toFixed(0) : null;
      const rainText = rainMm && Number(rainMm) > 0 ? `${rainProb}% · ${rainMm} mm` : `${rainProb}%`;

      // Temperatura
      const minVal = Math.round(dailyW.temperature_2m_min[i] ?? 22);
      const maxVal = Math.round(dailyW.temperature_2m_max[i] ?? 30);

      // Posição e largura da barra de temperatura (estilo Apple Weather)
      const leftPct = Math.max(0, Math.min(100, ((minVal - globalMin) / tempSpan) * 100));
      const rightPct = Math.max(0, Math.min(100, ((maxVal - globalMin) / tempSpan) * 100));
      const widthPct = Math.max(8, rightPct - leftPct);

      // Vento com seta direcional
      const windSpeed = Math.round(dailyW.wind_speed_10m_max ? (dailyW.wind_speed_10m_max[i] ?? 15) : 15);
      const windDeg = Math.round(dailyW.wind_direction_10m_dominant ? (dailyW.wind_direction_10m_dominant[i] ?? 45) : 45);

      // Ondas com altura e período (se disponível)
      const waveMax = (hasMarine && dailyM.wave_height_max[i] != null) 
        ? Number(dailyM.wave_height_max[i]).toFixed(1).replace('.', ',') 
        : null;
      const wavePeriod = (hasMarine && dailyM.wave_period_max && dailyM.wave_period_max[i] != null)
        ? Math.round(dailyM.wave_period_max[i])
        : null;

      // Destaque da estadia na aba "7 dias"
      const inStay = stayIndices.includes(i);
      const isStayHighlight = (this.activeTab === '7days' && inStay);

      rowsHtml += `
        <tr class="weather-table-row ${isStayHighlight ? 'is-stay-row' : ''}">
          <!-- Coluna 1: Dia -->
          <td class="cell-day">
            <div class="day-wrap">
              <span class="day-name ${isToday ? 'is-today-text' : ''}">${weekday}</span>
              <span class="day-date">${dateFormatted}</span>
              ${isStayHighlight ? `<span class="stay-subtle-badge">Estadia</span>` : ''}
            </div>
          </td>

          <!-- Coluna 2: Ícone Vetorial SVG -->
          <td class="cell-icon">
            ${svgIcon}
          </td>

          <!-- Coluna 3: Descrição da Condição -->
          <td class="cell-cond">
            <span class="cond-text">${meta.label}</span>
          </td>

          <!-- Coluna 4: Chuva -->
          <td class="cell-rain">
            <span class="rain-data" title="Probabilidade e volume de chuva">
              <i class="fa-solid fa-droplet rain-glyph" aria-hidden="true"></i>
              ${rainText}
            </span>
          </td>

          <!-- Coluna 5: Temperatura (mín–barra–máx) -->
          <td class="cell-temp">
            <div class="temp-bar-container" title="Mínima: ${minVal}°C • Máxima: ${maxVal}°C">
              <span class="temp-num temp-min-val">${minVal}°</span>
              <div class="temp-bar-bg" aria-hidden="true">
                <div class="temp-bar-fill" style="left: ${leftPct.toFixed(1)}%; width: ${widthPct.toFixed(1)}%;"></div>
              </div>
              <span class="temp-num temp-max-val">${maxVal}°</span>
            </div>
          </td>

          <!-- Coluna 6: Vento com Seta Direcional -->
          <td class="cell-wind">
            <div class="wind-data" title="Vento máximo: ${windSpeed} km/h (direção ${windDeg}°)">
              <svg class="wind-arrow-svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(${windDeg}deg);" aria-hidden="true">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
              <span>${windSpeed} km/h</span>
            </div>
          </td>

          <!-- Coluna 7: Ondas (Ocultada graciosamente se sem API de mar) -->
          ${hasMarine ? `
            <td class="cell-waves">
              <span class="waves-data" title="Altura máxima das ondas">
                ${waveMax ? `${waveMax} m${wavePeriod ? `<span class="wave-period-sec"> · ${wavePeriod}s</span>` : ''}` : '--'}
              </span>
            </td>
          ` : ''}
        </tr>
      `;
    });

    tbody.innerHTML = rowsHtml;
  }

  // ==========================================================================
  // FUNÇÃO PÚBLICA DE DESTAQUE DA ESTADIA
  // ==========================================================================
  highlightStay(checkin, checkout) {
    if (!checkin || !checkout) return;

    const normalize = (val) => {
      if (!val) return "";
      if (typeof val === 'string') return val.trim().substring(0, 10);
      if (val instanceof Date) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      return "";
    };

    this.currentStay = { checkin: normalize(checkin), checkout: normalize(checkout) };

    if (!this.data) return;

    const stayIndices = this.getStayIndices();
    const hasValidStay = stayIndices.length > 0;

    // Atualizar estado das abas
    const tabStayBtn = document.getElementById('tabStayBtn');
    if (tabStayBtn) {
      tabStayBtn.disabled = !hasValidStay;
      if (hasValidStay) {
        tabStayBtn.removeAttribute('title');
        this.activeTab = 'stay';
      } else {
        tabStayBtn.setAttribute('title', 'Previsão disponível para até 16 dias');
        this.activeTab = '7days';
      }
      this.updateTabSelection();
    }

    this.updateStaySummaryLine();
    this.renderTableRows();
  }
}

// ============================================================================
// INICIALIZAÇÃO & FUNÇÃO GLOBAL
// ============================================================================
let recantoWeatherProInstance = null;

window.climaDestacarEstadia = function(checkin, checkout) {
  if (recantoWeatherProInstance) {
    recantoWeatherProInstance.highlightStay(checkin, checkout);
  } else {
    window._pendingStayHighlight = { checkin, checkout };
  }
};

document.addEventListener('DOMContentLoaded', () => {
  recantoWeatherProInstance = new RecantoProfessionalWeather();
  recantoWeatherProInstance.init();

  if (window._pendingStayHighlight) {
    recantoWeatherProInstance.highlightStay(
      window._pendingStayHighlight.checkin,
      window._pendingStayHighlight.checkout
    );
    window._pendingStayHighlight = null;
  }
});

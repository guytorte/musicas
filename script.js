/**
 * CONFIGURAÇÕES GERAIS
 * ----------------------------------------------------
 * - Controles globais do player
 * - Elementos DOM essenciais
 * - Constantes reutilizáveis
 */
const audio = new Audio();
let currentTrack = null;
let isPlaying = false;
const UI = {
  playPause: document.getElementById('playPause'),
  progress: document.getElementById('progress'),
  volume: document.getElementById('volume'),
  destaques: document.getElementById('destaques'),
  todasMusicas: document.getElementById('todas-musicas'),
  loading: {
    overlay: document.getElementById('loading-overlay'),
    text: document.querySelector('.loading-text')
  },
  errorContainer: document.querySelector('.error-container')
};

const PATH = {
  audio: 'audio/',
  thumb: 'thumb/',
  capa: 'capa/'
};

const ERROR = {
  NETWORK: '⚠️ Erro de conexão',
  LOAD: '❌ Falha ao carregar músicas',
  PLAY: '❌ Erro na reprodução'
};

/**
 * CARREGAMENTO INICIAL
 * ----------------------------------------------------
 * - Fetch das músicas
 * - Tratamento de erros
 * - Inicialização do Service Worker
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    showLoading(true, 'Carregando catálogo...');
    await setupServiceWorker();
    await loadMusicData();
  } catch (error) {
    showError(ERROR.LOAD, error.message);
  } finally {
    showLoading(false);
  }
});

/**
 * FUNÇÕES PRINCIPAIS
 * ----------------------------------------------------
 */

// Carrega dados do JSON
async function loadMusicData() {
  try {
    const response = await fetch('musicas.json');
    if (!response.ok) throw new Error(ERROR.NETWORK);
    
    const { musicas } = await response.json();
    if (!musicas?.length) throw new Error('Nenhuma música encontrada');

    renderMusicList(musicas);
    initPlayerControls();

  } catch (error) {
    throw new Error(`${ERROR.LOAD}: ${error.message}`);
  }
}

// Renderiza a lista de músicas
function renderMusicList(musicas) {
  UI.destaques.innerHTML = musicas
    .filter(m => m.destaque)
    .map(createFeaturedCard)
    .join('');

  UI.todasMusicas.innerHTML = musicas
    .map(createMusicCard)
    .join('');
}

// Controles do player
async function playTrack(trackData) {
  try {
    showLoading(true, 'Preparando música...');
    
    if (currentTrack?.id === trackData.id) {
      togglePlayState();
      return;
    }

    audio.src = `${PATH.audio}${trackData.arquivo}`;
    await audio.play();
    
    currentTrack = trackData;
    isPlaying = true;
    updatePlayerUI();
    highlightCurrentTrack(trackData.id);

  } catch (error) {
    showError(ERROR.PLAY, error.message);
  } finally {
    showLoading(false);
  }
}

/**
 * FUNÇÕES AUXILIARES
 * ----------------------------------------------------
 */

// Cria card de destaque
function createFeaturedCard(musica) {
  return `
    <div class="featured-item" 
         data-id="${musica.id}" 
         onclick="playTrack(${JSON.stringify(musica)})">
      <img src="${PATH.capa}${musica.capa}" 
           alt="${musica.titulo}"
           loading="lazy"
           onerror="this.src='fallback-capa.jpg'">
      <div class="overlay">
        <i class="fas fa-play"></i>
        <span class="genre-tag">${musica.genero}</span>
      </div>
      <h3>${musica.titulo}</h3>
    </div>
  `;
}

// Cria card padrão
function createMusicCard(musica) {
  return `
    <div class="music-item" 
         data-id="${musica.id}" 
         onclick="playTrack(${JSON.stringify(musica)})">
      <img src="${PATH.thumb}${musica.thumbnail}" 
           class="thumbnail" 
           alt="${musica.titulo}"
           loading="lazy"
           onerror="this.src='fallback-thumb.jpg'">
      <div class="info">
        <span class="title">${musica.titulo}</span>
        <span class="genre">${musica.genero}</span>
      </div>
      <div class="actions">
        <button class="download-btn" 
                onclick="downloadTrack('${musica.arquivo}')"
                aria-label="Baixar ${musica.titulo}">
          <i class="fas fa-download"></i>
        </button>
      </div>
    </div>
  `;
}

// Atualiza a UI do player
function updatePlayerUI() {
  UI.playPause.innerHTML = isPlaying 
    ? '<i class="fas fa-pause"></i>' 
    : '<i class="fas fa-play"></i>';
}

/**
 * GERENCIAMENTO DE EVENTOS
 * ----------------------------------------------------
 */

function initPlayerControls() {
  // Play/Pause
  UI.playPause.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if (isPlaying) audio.play();
    else audio.pause();
    updatePlayerUI();
  });

  // Barra de progresso
  audio.addEventListener('timeupdate', () => {
    UI.progress.value = (audio.currentTime / audio.duration) * 100 || 0;
  });

  UI.progress.addEventListener('input', (e) => {
    audio.currentTime = (e.target.value / 100) * audio.duration;
  });

  // Compartilhamento
  document.getElementById('share').addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({
        title: currentTrack.titulo,
        text: `Ouça "${currentTrack.titulo}" por ${document.querySelector('h1').textContent}`,
        url: window.location.href
      });
    } else {
      alert('Recurso de compartilhamento não suportado');
    }
  });
}

/**
 * UTILITÁRIOS
 * ----------------------------------------------------
 */

// Download de músicas
function downloadTrack(filename) {
  const link = document.createElement('a');
  link.href = `${PATH.audio}${filename}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Service Worker
async function setupServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('sw.js');
      registration.update();
      console.log('Service Worker registrado');
    } catch (error) {
      console.error('Falha no SW:', error);
    }
  }
}

// Feedback visual
function showLoading(show, text = 'Carregando...') {
  UI.loading.overlay.style.display = show ? 'flex' : 'none';
  UI.loading.text.textContent = text;
}

function showError(title, message = '') {
  UI.errorContainer.innerHTML = `
    <div class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>${title}</h3>
      ${message && `<p>${message}</p>`}
      <button onclick="window.location.reload()">Tentar novamente</button>
    </div>
  `;
  UI.errorContainer.style.display = 'block';
}

// Highlight da música atual
function highlightCurrentTrack(trackId) {
  document.querySelectorAll('[data-id]').forEach(el => {
    el.classList.toggle('playing', el.dataset.id === trackId);
  });
}

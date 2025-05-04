/**
 * CONFIGURAÇÕES GERAIS
 * ----------------------------------------------------
 */
const audio = new Audio();
let currentTrack = null;
let isPlaying = false;
const UI = {
  playPause: document.getElementById('playPause'),
  progress: document.getElementById('progress'),
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
 * SERVICE WORKER
 * ----------------------------------------------------
 */
async function setupServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('sw.js', {
        scope: '/musicas/'
      });
      
      console.log('Service Worker registrado:', registration);
      
      // Atualização periódica a cada 1 hora
      setInterval(() => registration.update(), 3600000);
      
    } catch (error) {
      console.error('Falha no registro do Service Worker:', error);
      showError('Erro de conexão', 'Não foi possível configurar o modo offline');
    }
  }
}

/**
 * FUNÇÕES PRINCIPAIS
 * ----------------------------------------------------
 */
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

function renderMusicList(musicas) {
  UI.destaques.innerHTML = musicas
    .filter(m => m.destaque)
    .map(createFeaturedCard)
    .join('');

  UI.todasMusicas.innerHTML = musicas
    .map(createMusicCard)
    .join('');
}

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
function initUIElements() {
  UI.loading.overlay = document.getElementById('loading-overlay');
  UI.loading.text = document.querySelector('.loading-text');
  UI.errorContainer = document.querySelector('.error-container');
}

function createFeaturedCard(musica) {
  return `
    <div class="featured-item" data-id="${musica.id}" onclick="playTrack(${JSON.stringify(musica)})">
      <img src="${PATH.capa}${musica.capa}" alt="${musica.titulo}" loading="lazy" onerror="this.src='fallback-capa.jpg'">
      <div class="overlay">
        <i class="fas fa-play"></i>
        <span class="genre-tag">${musica.genero}</span>
      </div>
      <h3>${musica.titulo}</h3>
    </div>
  `;
}

function createMusicCard(musica) {
  return `
    <div class="music-item" data-id="${musica.id}" onclick="playTrack(${JSON.stringify(musica)})">
      <img src="${PATH.thumb}${musica.thumbnail}" class="thumbnail" alt="${musica.titulo}" loading="lazy" onerror="this.src='fallback-thumb.jpg'">
      <div class="info">
        <span class="title">${musica.titulo}</span>
        <span class="genre">${musica.genero}</span>
      </div>
      <div class="actions">
        <button class="download-btn" onclick="downloadTrack('${musica.arquivo}')" aria-label="Baixar ${musica.titulo}">
          <i class="fas fa-download"></i>
        </button>
      </div>
    </div>
  `;
}

function updatePlayerUI() {
  UI.playPause.innerHTML = isPlaying 
    ? '<i class="fas fa-pause"></i>' 
    : '<i class="fas fa-play"></i>';
}

/**
 * CONTROLES DO PLAYER
 * ----------------------------------------------------
 */
function initPlayerControls() {
  UI.playPause.addEventListener('click', togglePlayState);
  
  audio.addEventListener('timeupdate', () => {
    UI.progress.value = (audio.currentTime / audio.duration) * 100 || 0;
  });

  UI.progress.addEventListener('input', (e) => {
    audio.currentTime = (e.target.value / 100) * audio.duration;
  });

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

function togglePlayState() {
  isPlaying = !isPlaying;
  isPlaying ? audio.play() : audio.pause();
  updatePlayerUI();
}

/**
 * UTILITÁRIOS
 * ----------------------------------------------------
 */
function showLoading(show, text = 'Carregando...') {
  if (!UI.loading.overlay) {
    console.error('Elemento loading-overlay não encontrado');
    return;
  }
  
  UI.loading.overlay.style.display = show ? 'flex' : 'none';
  if (UI.loading.text) UI.loading.text.textContent = text;
}

function showError(title, message = '') {
  const errorHTML = `
    <div class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>${title}</h3>
      ${message && `<p>${message}</p>`}
      <button onclick="window.location.reload()">Tentar novamente</button>
    </div>
  `;
  
  if (UI.errorContainer) {
    UI.errorContainer.innerHTML = errorHTML;
    UI.errorContainer.style.display = 'block';
  } else {
    const fallbackError = document.createElement('div');
    fallbackError.innerHTML = errorHTML;
    document.body.appendChild(fallbackError);
  }
}

function highlightCurrentTrack(trackId) {
  document.querySelectorAll('[data-id]').forEach(el => {
    el.classList.toggle('playing', el.dataset.id === trackId);
  });
}

function downloadTrack(filename) {
  const link = document.createElement('a');
  link.href = `${PATH.audio}${filename}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * INICIALIZAÇÃO
 * ----------------------------------------------------
 */
document.addEventListener('DOMContentLoaded', () => {
  initUIElements();
  
  try {
    showLoading(true, 'Carregando catálogo...');
    setupServiceWorker();
    loadMusicData();
  } catch (error) {
    showError('Erro inicial', error.message);
  } finally {
    showLoading(false);
  }
});

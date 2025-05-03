// Configurações globais
const audio = new Audio();
let currentTrack = null;
let isPlaying = false;
const playPauseBtn = document.getElementById('playPause');
const progress = document.getElementById('progress');
const volumeControl = document.getElementById('volume');

// Elementos DOM
const destaquesContainer = document.getElementById('destaques');
const musicasContainer = document.getElementById('todas-musicas');

// Constantes
const ERROR_MESSAGE = {
  NETWORK: 'Erro de conexão. Verifique sua internet.',
  FORMAT: 'Formato de arquivo inválido.',
  NOT_FOUND: 'Músicas não encontradas.'
};

// Função para carregar músicas
const carregarMusicas = async () => {
  try {
    showLoading(true);
    
    const response = await fetch('musicas.json');
    if (!response.ok) throw new Error(ERROR_MESSAGE.NETWORK);
    
    const data = await response.json();
    if (!data.todas?.length) throw new Error(ERROR_MESSAGE.NOT_FOUND);

    renderizarMusicas(data);
    showLoading(false);

  } catch (error) {
    console.error('Erro:', error);
    showError(error.message);
    showLoading(false);
  }
};

// Renderização otimizada
const renderizarMusicas = (data) => {
  destaquesContainer.innerHTML = data.destaques?.map(criarCardDestaque).join('') || '';
  musicasContainer.innerHTML = data.todas.map(criarCardMusica).join('');

  requestAnimationFrame(() => {
    adicionarEventos();
    initIntersectionObserver();
  });
};

// Templates de cards com caminhos corrigidos
const criarCardDestaque = (musica) => `
  <div class="featured-item" data-src="/audio/${musica.arquivo}" data-id="${musica.id}">
    <img src="/capas/${musica.capa}" alt="${musica.titulo}" 
         loading="lazy" onerror="this.src='fallback-image.jpg'">
    <div class="overlay">
      <i class="fas fa-play"></i>
      <span class="genre-tag">${musica.genero}</span>
    </div>
    <div class="featured-info">
      <h3>${musica.titulo}</h3>
      ${musica.duracao ? `<span class="duration">${musica.duracao}</span>` : ''}
    </div>
  </div>
`;

const criarCardMusica = (musica) => `
  <div class="music-item" data-src="/audio/${musica.arquivo}" data-id="${musica.id}">
    <img src="/thumb/${musica.thumbnail}" class="thumbnail" 
         alt="${musica.titulo}" loading="lazy"
         onerror="this.src='fallback-thumb.jpg'">
    <div class="info">
      <span class="title">${musica.titulo}</span>
      <span class="genre">${musica.genero}</span>
    </div>
    <div class="actions">
      <button class="download-btn" aria-label="Baixar">
        <i class="fas fa-download"></i>
      </button>
      <i class="fas fa-play play-icon"></i>
    </div>
  </div>
`;

// Controles de áudio melhorados
const playTrack = async (src, trackId) => {
  try {
    if (currentTrack === trackId && !audio.paused) {
      audio.pause();
      return;
    }

    showLoading(true, 'Carregando música...');
    
    audio.src = src;
    await audio.play();
    
    currentTrack = trackId;
    isPlaying = true;
    updatePlayButton();
    highlightCurrentTrack(trackId);

  } catch (error) {
    console.error('Erro na reprodução:', error);
    showError('Não foi possível reproduzir a música');
  } finally {
    showLoading(false);
  }
};

// Função de eventos adicionada
const adicionarEventos = () => {
  document.querySelectorAll('.featured-item, .music-item').forEach(item => {
    item.addEventListener('click', () => {
      const src = item.dataset.src;
      const id = item.dataset.id;
      playTrack(src, id);
    });
  });

  playPauseBtn.addEventListener('click', togglePlay);
};

const togglePlay = () => {
  if (!currentTrack) return;

  if (audio.paused) {
    audio.play().catch(error => {
      console.error('Erro ao retomar:', error);
      showError('Erro ao retomar reprodução');
    });
  } else {
    audio.pause();
  }
  
  isPlaying = !audio.paused;
  updatePlayButton();
};

// Atualizações de UI
const updatePlayButton = () => {
  playPauseBtn.innerHTML = isPlaying 
    ? '<i class="fas fa-pause"></i>' 
    : '<i class="fas fa-play"></i>';
};

const highlightCurrentTrack = (trackId) => {
  document.querySelectorAll('.playing').forEach(el => el.classList.remove('playing'));
  const currentElement = document.querySelector(`[data-id="${trackId}"]`);
  if (currentElement) {
    currentElement.classList.add('playing');
    currentElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

// Otimizações de performance
const initIntersectionObserver = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '100px' });

  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    img.dataset.src = img.src;
    img.src = '';
    observer.observe(img);
  });
};

// Sistema de erro melhorado
const showError = (message) => {
  musicasContainer.innerHTML = `
    <div class="error-container">
      <div class="error-content">
        <i class="fas fa-exclamation-circle"></i>
        <h3>${message}</h3>
        <button onclick="window.location.reload()">Tentar novamente</button>
      </div>
    </div>
  `;
};

const showLoading = (show, text = 'Carregando...') => {
  const loader = document.getElementById('loading-overlay') || createLoader();
  loader.querySelector('.loading-text').textContent = text;
  loader.style.display = show ? 'flex' : 'none';
};

const createLoader = () => {
  const loader = document.createElement('div');
  loader.id = 'loading-overlay';
  loader.innerHTML = `
    <div class="loading-spinner"></div>
    <p class="loading-text"></p>
  `;
  document.body.appendChild(loader);
  return loader;
};

// Inicialização otimizada
document.addEventListener('DOMContentLoaded', () => {
  carregarMusicas();
  setupServiceWorker();
});

const setupServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('sw.js')
        .then(registration => {
          registration.update();
          console.log('SW registrado:', registration);
        })
        .catch(err => console.error('SW falhou:', err));
    });
  }
};

// Restante das funções (progresso, volume, etc.)
// ... (mantenha as funções restantes se existirem)

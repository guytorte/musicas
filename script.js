// Configurações globais
const audio = new Audio();
let currentTrack = null;
const playPauseBtn = document.getElementById('playPause');
const progress = document.getElementById('progress');
const volumeControl = document.getElementById('volume');

// DOM Elements
const destaquesContainer = document.getElementById('destaques');
const musicasContainer = document.getElementById('todas-musicas');

// Carregar músicas do JSON
const carregarMusicas = async () => {
  try {
    const response = await fetch('musicas.json');
    if (!response.ok) throw new Error('Falha ao carregar dados');
    
    const { destaques, todas } = await response.json();
    
    // Renderizar destaques
    destaquesContainer.innerHTML = destaques.map(musica => `
      <div class="featured-item" data-src="${musica.arquivo}" data-id="${musica.id}">
        <img src="${musica.capa}" alt="${musica.titulo}" loading="lazy">
        <div class="overlay">
          <i class="fas fa-play"></i>
          <span class="genre-tag">${musica.genero}</span>
        </div>
        <div class="featured-info">
          <h3>${musica.titulo}</h3>
        </div>
      </div>
    `).join('');

    // Renderizar lista completa
    musicasContainer.innerHTML = todas.map(musica => `
      <div class="music-item" data-src="${musica.arquivo}" data-id="${musica.id}">
        <img src="${musica.thumbnail}" class="thumbnail" alt="${musica.titulo}" loading="lazy">
        <div class="info">
          <span class="title">${musica.titulo}</span>
          <span class="genre">${musica.genero}</span>
          ${musica.duracao ? `<span class="duration">${musica.duracao}</span>` : ''}
        </div>
        <div class="actions">
          <button class="download-btn" aria-label="Baixar">
            <i class="fas fa-download"></i>
          </button>
          <i class="fas fa-play play-icon" aria-hidden="true"></i>
        </div>
      </div>
    `).join('');

    iniciarEventos();
    
  } catch (error) {
    console.error('Erro:', error);
    musicasContainer.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Não foi possível carregar as músicas</p>
      </div>
    `;
  }
};

// Gerenciador de eventos
const iniciarEventos = () => {
  // Controles do player
  playPauseBtn.addEventListener('click', togglePlay);
  progress.addEventListener('input', seekAudio);
  volumeControl && volumeControl.addEventListener('input', setVolume);

  // Eventos de música
  document.querySelectorAll('.featured-item, .music-item').forEach(item => {
    item.addEventListener('click', () => playTrack(item.dataset.src, item.dataset.id));
  });

  // Ícone de play individual
  document.querySelectorAll('.play-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = e.target.closest('[data-src]');
      playTrack(item.dataset.src, item.dataset.id);
    });
  });

  // Download
  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const src = e.target.closest('[data-src]').dataset.src;
      downloadTrack(src);
    });
  });

  // Atualização progressiva
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('ended', nextTrack);
};

// Controles de áudio
const playTrack = (src, trackId) => {
  if (currentTrack === trackId && !audio.paused) {
    audio.pause();
    return;
  }

  audio.src = src;
  audio.play()
    .then(() => {
      currentTrack = trackId;
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      highlightCurrentTrack(trackId);
    })
    .catch(error => console.error('Playback failed:', error));
};

const togglePlay = () => {
  audio.paused ? audio.play() : audio.pause();
  playPauseBtn.innerHTML = audio.paused 
    ? '<i class="fas fa-play"></i>' 
    : '<i class="fas fa-pause"></i>';
};

const updateProgress = () => {
  if (!isNaN(audio.duration)) {
    progress.value = (audio.currentTime / audio.duration) * 100;
  }
};

const seekAudio = () => {
  audio.currentTime = (progress.value / 100) * audio.duration;
};

const setVolume = (e) => {
  audio.volume = e.target.value;
};

// Funções auxiliares
const highlightCurrentTrack = (trackId) => {
  document.querySelectorAll('.playing').forEach(el => el.classList.remove('playing'));
  document.querySelector(`[data-id="${trackId}"]`).classList.add('playing');
};

const downloadTrack = (src) => {
  const link = document.createElement('a');
  link.href = src;
  link.download = src.split('/').pop();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  carregarMusicas();
  
  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('SW registrado:', reg))
      .catch(err => console.error('SW falhou:', err));
  }
});
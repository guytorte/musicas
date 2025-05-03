// script.js atualizado
const audio = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPause');
const progress = document.getElementById('progress');
const shareBtn = document.getElementById('share');

let isPlaying = false;
let currentTime = 0;

// Função principal de inicialização
function initPlayer() {
  // Event Listeners
  playPauseBtn.addEventListener('click', togglePlay);
  progress.addEventListener('input', seekAudio);
  shareBtn.addEventListener('click', shareTrack);

  // Atualização do tempo
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('ended', handleTrackEnd);
  
  // Verifica se há reprodução prévia
  const savedTime = localStorage.getItem('lastPlayTime');
  if(savedTime) {
    audio.currentTime = parseFloat(savedTime);
  }
}

// Controle de Play/Pause
function togglePlay() {
  if(isPlaying) {
    audio.pause();
    localStorage.setItem('lastPlayTime', audio.currentTime);
  } else {
    audio.play().catch(error => {
      console.error('Erro na reprodução:', error);
      showError('Não foi possível reproduzir a música');
    });
  }
  
  isPlaying = !isPlaying;
  updatePlayButton();
}

// Atualiza o botão visualmente
function updatePlayButton() {
  playPauseBtn.innerHTML = isPlaying 
    ? '<i class="fas fa-pause"></i>' 
    : '<i class="fas fa-play"></i>';
  
  playPauseBtn.style.transform = isPlaying 
    ? 'scale(1.1)' 
    : 'scale(1)';
}

// Barra de progresso
function updateProgress() {
  const percentage = (audio.currentTime / audio.duration) * 100 || 0;
  progress.value = percentage;
  
  // Atualização visual suave
  progress.style.setProperty('--progress', `${percentage}%`);
}

// Seek manual
function seekAudio(e) {
  const seekTime = (e.target.value / 100) * audio.duration;
  audio.currentTime = seekTime;
}

// Compartilhamento
async function shareTrack() {
  try {
    await navigator.share({
      title: document.title,
      text: 'Ouça essa música incrível!',
      url: window.location.href
    });
  } catch (err) {
    console.log('Compartilhamento cancelado:', err);
  }
}

// Finalização da faixa
function handleTrackEnd() {
  isPlaying = false;
  updatePlayButton();
  progress.value = 0;
  localStorage.removeItem('lastPlayTime');
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  initPlayer();
  
  // Tenta recuperar última reprodução
  const lastTrack = localStorage.getItem('lastTrack');
  if(lastTrack) {
    audio.src = lastTrack;
  }
});

// Atualizações no CSS para a barra de progresso
Adicione isto ao seu CSS:

```css
/* Adicionar ao :root */
--progress: 0%;

/* Atualizar o estilo da barra de progresso */
#progress {
  background: linear-gradient(
    to right,
    var(--primary-color) var(--progress),
    rgba(255,255,255,0.1) var(--progress)
  );
}

const audio = new Audio();
let currentTrack = null;

async function loadMusicData() {
  try {
    const response = await fetch('musicas.json');
    const { musicas } = await response.json();
    
    document.getElementById('todas-musicas').innerHTML = musicas
      .map(musica => `
        <div class="music-item" data-src="${musica.arquivo}">
          <div class="music-info">
            <div>
              <h3>${musica.titulo}</h3>
              <span class="genre">${musica.genero}</span>
            </div>
            <button class="download-btn" onclick="downloadTrack('${musica.arquivo}')">
              <i class="fas fa-download"></i>
            </button>
          </div>
        </div>
      `).join('');
    
    initPlayerControls();

  } catch (error) {
    console.error('Erro ao carregar músicas:', error);
  }
}

function initPlayerControls() {
  document.querySelectorAll('.music-item').forEach(item => {
    item.addEventListener('click', () => {
      const src = item.dataset.src;
      if(currentTrack === src) {
        audio.paused ? audio.play() : audio.pause();
      } else {
        audio.src = src;
        audio.play();
        currentTrack = src;
      }
      updatePlayButton();
    });
  });

  document.getElementById('playPause').addEventListener('click', () => {
    audio.paused ? audio.play() : audio.pause();
    updatePlayButton();
  });

  audio.addEventListener('timeupdate', () => {
    document.getElementById('progress').value = 
      (audio.currentTime / audio.duration) * 100 || 0;
  });
}

function updatePlayButton() {
  document.getElementById('playPause').innerHTML = 
    audio.paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
}

function downloadTrack(filename) {
  const link = document.createElement('a');
  link.href = `audio/${filename}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Iniciar
document.addEventListener('DOMContentLoaded', loadMusicData);

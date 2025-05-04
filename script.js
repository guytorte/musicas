const audio = new Audio();
let currentTrack = null;

// Dados das músicas
const musicData = [
    { titulo: "A Prima", arquivo: "a-prima.mp3", genero: "Sertanejo" },
    { titulo: "Aprendi Com Você", arquivo: "aprendi-com-voce.mp3", genero: "Sertanejo" },
    { titulo: "Mercadinho", arquivo: "mercadinho.mp3", genero: "Sertanejo" },
    { titulo: "Namorando Três", arquivo: "namorando-tres.mp3", genero: "Sertanejo" },
    { titulo: "Não Compra Não", arquivo: "nao-compra-nao.mp3", genero: "Sertanejo" },
    { titulo: "O Morto Tá de Lancha", arquivo: "o-morto-ta-de-lancha.mp3", genero: "Sertanejo" },
    { titulo: "Oh Azar", arquivo: "oh-azar.mp3", genero: "Sertanejo" },
    { titulo: "Só Tô Aceitando Pix", arquivo: "so-to-aceitando-pix.mp3", genero: "Sertanejo" },
    { titulo: "Te Faltou Mae", arquivo: "te-faltou-mae.mp3", genero: "Sertanejo" }
];

// Carrega as músicas
function loadMusicData() {
    const musicGrid = document.getElementById('todas-musicas');
    
    musicData.forEach(musica => {
        const musicItem = document.createElement('div');
        musicItem.className = 'music-item';
        musicItem.setAttribute('data-src', musica.arquivo);
        
        musicItem.innerHTML = `
            <div class="music-info">
                <div>
                    <h3>${musica.titulo}</h3>
                    <span class="genre">${musica.genero}</span>
                </div>
                <button class="download-btn" onclick="downloadTrack('${musica.arquivo}')">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        `;
        
        musicGrid.appendChild(musicItem);
    });
    
    initPlayerControls();
}

// Controles do player
function initPlayerControls() {
    const playPauseBtn = document.getElementById('playPause');
    const progressBar = document.getElementById('progress');
    const currentSongDisplay = document.getElementById('currentSong');
    
    // Evento para as músicas
    document.querySelectorAll('.music-item').forEach(item => {
        item.addEventListener('click', function() {
            const src = this.getAttribute('data-src');
            const songName = this.querySelector('h3').textContent;
            
            if(currentTrack === src) {
                togglePlayPause();
            } else {
                currentTrack = src;
                audio.src = `audio/${src}`;
                audio.play();
                currentSongDisplay.textContent = songName;
                updatePlayButton(true);
            }
        });
    });
    
    // Botão play/pause
    playPauseBtn.addEventListener('click', togglePlayPause);
    
    // Barra de progresso
    audio.addEventListener('timeupdate', () => {
        progressBar.value = (audio.currentTime / audio.duration) * 100 || 0;
    });
    
    progressBar.addEventListener('input', () => {
        audio.currentTime = (progressBar.value / 100) * audio.duration;
    });
    
    // Quando a música termina
    audio.addEventListener('ended', () => {
        updatePlayButton(false);
    });
}

function togglePlayPause() {
    if(audio.paused) {
        audio.play();
        updatePlayButton(true);
    } else {
        audio.pause();
        updatePlayButton(false);
    }
}

function updatePlayButton(isPlaying) {
    const icon = document.getElementById('playPause').querySelector('i');
    icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
}

function downloadTrack(filename) {
    const link = document.createElement('a');
    link.href = `audio/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Inicia tudo quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    loadMusicData();
});

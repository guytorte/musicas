// --- Global Variables ---
const audio = new Audio();
let currentTrackIndex = -1; // Index in the original full musicData array
let musicData = []; // Will hold all songs from the JSON
let playlists = {}; // Will hold the predefined playlists from the JSON
let currentlyDisplayedSongs = []; // Holds the subset of songs currently visible on the page

// --- DOM Element References ---
const playPauseBtn = document.getElementById('playPause');
const prevTrackBtn = document.getElementById('prevTrack');
const nextTrackBtn = document.getElementById('nextTrack');
const progressBar = document.getElementById('progress');
const currentSongDisplay = document.getElementById('currentSong');
const currentTimeDisplay = document.getElementById('currentTime');
const totalTimeDisplay = document.getElementById('totalTime');
const volumeSlider = document.getElementById('volume');
const volumeIconBtn = document.getElementById('volumeIcon');
const musicGrid = document.getElementById('todas-musicas');
const mainShareBtn = document.getElementById('share');

// --- Utility Functions ---

/**
 * Formats time in seconds to a "MM:SS" string.
 * @param {number} seconds - The time in seconds.
 * @returns {string} The formatted time string.
 */
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;
    return `${minutes}:${formattedSeconds}`;
}

// --- Core Logic: Data Fetching and Filtering ---

/**
 * Fetches music data from the JSON file and initializes the application.
 */
async function fetchMusicData() {
    try {
        const response = await fetch('musicas.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        musicData = data.musicas;
        playlists = data.playlists || {};

        applyFilterFromURL(); // This sets `currentlyDisplayedSongs` and renders the initial list
        initPlayerControls(); // Setup event listeners for the player
        playMusicFromUrl();   // Check if a specific song should be played from the URL

        console.log("Dados das músicas carregados com sucesso.");
    } catch (error) {
        console.error("Erro ao carregar dados das músicas:", error);
        musicGrid.innerHTML = '<p>Erro ao carregar as músicas. Tente novamente mais tarde.</p>';
    }
}

/**
 * Reads URL parameters, filters the song list, and then renders it.
 */
function applyFilterFromURL() {
    const params = new URLSearchParams(window.location.search);
    const genre = params.get('genre');
    const tag = params.get('tag');
    const playlist = params.get('playlist');

    let filteredList = musicData; // Default to all songs

    if (genre) {
        filteredList = musicData.filter(song => (song.genero || "").toLowerCase().includes(genre.toLowerCase()));
        console.log(`Filtrando por gênero: ${genre}`);
    } else if (tag) {
        filteredList = musicData.filter(song => song.tags && song.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
        console.log(`Filtrando por tag: ${tag}`);
    } else if (playlist && playlists[playlist]) {
        const playlistTitles = playlists[playlist];
        filteredList = musicData.filter(song => playlistTitles.includes(song.titulo));
        console.log(`Carregando playlist: ${playlist}`);
    }
    
    // Store the filtered list globally for the player controls to use
    currentlyDisplayedSongs = filteredList;
    loadMusicListUI(currentlyDisplayedSongs);
}

/**
 * Renders the provided list of songs into the HTML grid.
 * @param {Array} songsToDisplay - The array of song objects to show.
 */
function loadMusicListUI(songsToDisplay) {
    musicGrid.innerHTML = '';

    if (!songsToDisplay || songsToDisplay.length === 0) {
        musicGrid.innerHTML = '<p>Nenhuma música encontrada para esta seleção.</p>';
        return;
    }

    songsToDisplay.forEach((musica) => {
        const originalIndex = musicData.findIndex(item => item.arquivo === musica.arquivo);
        if (originalIndex === -1) return;

        const musicItem = document.createElement('div');
        musicItem.className = 'music-item';
        musicItem.setAttribute('data-index', originalIndex);

        musicItem.innerHTML = `
            <div class="music-info">
                <div>
                    <h3>${musica.titulo}</h3>
                    <span class="genre">${musica.genero}</span>
                </div>
                <div class="music-actions">
                    <button class="share-music-btn" title="Copiar link da música" onclick="shareSingleTrackLink(event, '${musica.titulo}')">
                        <i class="fas fa-link"></i>
                    </button>
                    <button class="download-btn" title="Baixar música" onclick="downloadTrack(event, '${musica.arquivo}')">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </div>`;
        musicGrid.appendChild(musicItem);
    });
}

/**
 * Checks URL for a 'play' parameter and starts playing the song if found.
 */
function playMusicFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const songToPlayTitle = params.get('play');
    if (songToPlayTitle) {
        const songIndex = musicData.findIndex(song => song.titulo === songToPlayTitle);
        if (songIndex !== -1) {
            // A brief delay helps ensure the browser is ready to play audio automatically.
            setTimeout(() => playTrack(songIndex), 200);
        }
    }
}

// --- Player Control Functions ---

function playTrack(index) {
    if (index < 0 || index >= musicData.length) return;

    currentTrackIndex = index;
    const musica = musicData[currentTrackIndex];
    
    audio.src = musica.arquivo;
    audio.play().catch(e => console.error("Erro ao iniciar a reprodução:", e));

    currentSongDisplay.textContent = musica.titulo;
    updatePlayButton(true);
}

function togglePlayPause() {
    if (audio.paused) {
        if (currentTrackIndex === -1 && currentlyDisplayedSongs.length > 0) {
            // If nothing played, play the first visible song
            const firstSongOriginalIndex = musicData.findIndex(m => m.arquivo === currentlyDisplayedSongs[0].arquivo);
            playTrack(firstSongOriginalIndex);
        } else {
            audio.play();
        }
    } else {
        audio.pause();
    }
}

function updatePlayButton(isPlaying) {
    const icon = playPauseBtn.querySelector('i');
    icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
    updatePlayingIndicator(isPlaying ? currentTrackIndex : -1);
}

function nextTrack() {
    if (currentlyDisplayedSongs.length === 0) return;

    // Find the current song's position *within the visible list*
    const currentVisibleIndex = currentlyDisplayedSongs.findIndex(song => musicData.indexOf(song) === currentTrackIndex);
    
    const nextVisibleIndex = (currentVisibleIndex + 1) % currentlyDisplayedSongs.length;
    const nextSong = currentlyDisplayedSongs[nextVisibleIndex];

    // Find the original index of the next song to play it
    const nextOriginalIndex = musicData.indexOf(nextSong);
    playTrack(nextOriginalIndex);
}

function prevTrack() {
    if (currentlyDisplayedSongs.length === 0) return;

    const currentVisibleIndex = currentlyDisplayedSongs.findIndex(song => musicData.indexOf(song) === currentTrackIndex);
    
    const prevVisibleIndex = (currentVisibleIndex - 1 + currentlyDisplayedSongs.length) % currentlyDisplayedSongs.length;
    const prevSong = currentlyDisplayedSongs[prevVisibleIndex];
    
    const prevOriginalIndex = musicData.indexOf(prevSong);
    playTrack(prevOriginalIndex);
}

function updatePlayingIndicator(playingIndex) {
    document.querySelectorAll('.music-item').forEach(item => {
        item.classList.toggle('active', parseInt(item.dataset.index) === playingIndex);
    });
}

function updateVolumeIcon() {
    const icon = volumeIconBtn.querySelector('i');
    if (audio.muted || audio.volume === 0) {
        icon.className = 'fas fa-volume-mute';
    } else if (audio.volume < 0.5) {
        icon.className = 'fas fa-volume-down';
    } else {
        icon.className = 'fas fa-volume-up';
    }
}

// --- Initialization and Event Listeners ---

function initPlayerControls() {
    musicGrid.addEventListener('click', (event) => {
        const musicItem = event.target.closest('.music-item');
        if (!musicItem || event.target.closest('.music-actions')) return;
        const index = parseInt(musicItem.dataset.index);
        if (index === currentTrackIndex) togglePlayPause();
        else playTrack(index);
    });

    playPauseBtn.addEventListener('click', togglePlayPause);
    prevTrackBtn.addEventListener('click', prevTrack);
    nextTrackBtn.addEventListener('click', nextTrack);

    audio.addEventListener('play', () => updatePlayButton(true));
    audio.addEventListener('pause', () => updatePlayButton(false));
    audio.addEventListener('ended', nextTrack);
    audio.addEventListener('timeupdate', () => {
        if (!isNaN(audio.duration)) {
            progressBar.value = (audio.currentTime / audio.duration) * 100 || 0;
            currentTimeDisplay.textContent = formatTime(audio.currentTime);
        }
    });
    audio.addEventListener('loadedmetadata', () => {
        totalTimeDisplay.textContent = formatTime(audio.duration);
    });
    audio.addEventListener('error', (e) => {
        console.error("Erro de áudio:", e);
        currentSongDisplay.textContent = "Erro ao carregar música";
    });

    progressBar.addEventListener('input', () => {
        if (!isNaN(audio.duration)) audio.currentTime = (progressBar.value / 100) * audio.duration;
    });

    volumeSlider.addEventListener('input', () => {
        audio.muted = false;
        audio.volume = volumeSlider.value / 100;
    });
    volumeIconBtn.addEventListener('click', () => (audio.muted = !audio.muted));
    audio.addEventListener('volumechange', () => {
        if (!audio.muted) volumeSlider.value = audio.volume * 100;
        updateVolumeIcon();
    });

    if (navigator.share) {
        mainShareBtn.addEventListener('click', async () => {
            if (currentTrackIndex === -1) return alert("Selecione uma música para compartilhar.");
            const musica = musicData[currentTrackIndex];
            const shareUrl = `${window.location.origin}${window.location.pathname}?play=${encodeURIComponent(musica.titulo)}`;
            await navigator.share({ title: `Ouça: ${musica.titulo}`, url: shareUrl }).catch(e => console.error(e));
        });
    } else {
        mainShareBtn.style.display = 'none';
    }

    audio.volume = volumeSlider.value / 100;
    updateVolumeIcon();
}

// --- Action Functions (called from HTML onclick) ---

function shareSingleTrackLink(event, songTitle) {
    event.stopPropagation();
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('play', songTitle); // Set only the play parameter

    navigator.clipboard.writeText(url.href).then(() => {
        const button = event.currentTarget;
        const icon = button.querySelector('i');
        const originalIconClass = icon.className;
        
        icon.className = 'fas fa-check';
        setTimeout(() => { icon.className = originalIconClass; }, 2000);
    }).catch(err => console.error('Falha ao copiar o link:', err));
}

function downloadTrack(event, filepath) {
    event.stopPropagation();
    const link = document.createElement('a');
    link.href = filepath;
    link.download = filepath.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', fetchMusicData); 

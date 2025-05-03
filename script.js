const PLACEHOLDER = 'placeholder.png'; // path to your placeholder image

window.addEventListener('DOMContentLoaded', () => {
fetch('musicas.json')
.then(res => res.json())
.then(data => renderizarMusicas(data))
.catch(err => console.error('Erro ao carregar JSON:', err));
});

function renderizarMusicas({ destaques, todas }) {
const destaqueEl = document.getElementById('destaques');
const todasEl     = document.getElementById('todas-musicas');

// Render destaques
destaques.forEach(m => {
const card = criarCard(m);
destaqueEl.appendChild(card);
});

// Render todas
todas.forEach(m => {
const card = criarCard(m);
todasEl.appendChild(card);
});
}

function criarCard(musica) {
const card = document.createElement('div');
card.className = 'track-card';

// Placeholder image
const img = document.createElement('img');
img.src = PLACEHOLDER;
img.alt = 'Placeholder';

// Title
const title = document.createElement('span');
title.textContent = musica.titulo;

card.appendChild(img);
card.appendChild(title);

card.addEventListener('click', () => playTrack(musica.arquivo));
return card;
}

function playTrack(src) {
const player = document.getElementById('audioPlayer');
player.src = audio/${src};
player.play();
}

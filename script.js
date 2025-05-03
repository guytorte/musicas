const PLACEHOLDER = 'placeholder.png';

window.addEventListener('DOMContentLoaded', () => {
  fetch('./musicas.json')
    .then(res => res.json())
    .then(data => renderizarMusicas(data))
    .catch(err => {
      console.error('Erro ao carregar JSON:', err);
      document.getElementById('todas-musicas')
        .textContent = 'Não foi possível carregar as músicas.';
    });
});

function renderizarMusicas({ destaques, todas }) {
  const destaqueEl = document.getElementById('destaques');
  const todasEl    = document.getElementById('todas-musicas');

  destaqueEl.innerHTML = '';
  todasEl.innerHTML    = '';

  if (destaques?.length) {
    destaques.forEach(m => destaqueEl.appendChild(criarCard(m)));
  }

  if (todas?.length) {
    todas.forEach(m => todasEl.appendChild(criarCard(m)));
  }
}

function criarCard(musica) {
  const card = document.createElement('div');
  card.className = 'track-card';

  const img = document.createElement('img');
  img.src = PLACEHOLDER;
  img.alt = 'Placeholder';

  const title = document.createElement('span');
  title.textContent = musica.titulo;

  card.append(img, title);
  card.addEventListener('click', () => playTrack(musica.arquivo));
  return card;
}

function playTrack(src) {
  const player = document.getElementById('audioPlayer');
  player.src = `./audio/${src}`;
  player.play()
    .catch(err => console.error('Erro ao reproduzir:', err));
}

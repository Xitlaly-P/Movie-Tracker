const { ipcRenderer } = require('electron');

function goHome() {
  window.location.href = "index.html";
}

function closeApp() {
  ipcRenderer.send('close-app');
}

async function loadWatchedMovies() {
  const data = await ipcRenderer.invoke('get-watchlist');
  const list = document.getElementById('watched-list');
  list.innerHTML = '';

  data.watched.forEach((movie) => {
    const li = document.createElement('li');
    li.textContent = `${movie.title} - ${movie.genre} (⭐ ${movie.rating})`;
    list.appendChild(li);
  });
}

async function addMovie() {
  const title = document.getElementById('title').value;
  const genre = document.getElementById('genre').value;
  const rating = document.getElementById('rating').value;

  if (!title || !genre || !rating) return;

  const data = await ipcRenderer.invoke('get-watchlist');
  data.watched.push({ title, genre, rating });

  await ipcRenderer.invoke('update-watchlist', { table: 'watched', data: data.watched });
  loadWatchedMovies();
}

loadWatchedMovies();

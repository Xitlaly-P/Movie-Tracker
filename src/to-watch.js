const { ipcRenderer } = require('electron');

function closeApp() {
  ipcRenderer.send('close-app');
}

function goHome() {
  window.location.href = "index.html";
}

async function loadToWatchMovies() {
  const data = await ipcRenderer.invoke('get-watchlist');
  const list = document.getElementById('to-watch-list');
  list.innerHTML = '';

  data.to_watch.forEach((movie, index) => {
    const li = document.createElement('li');
    li.textContent = `${movie.title} - ${movie.genre}`;
    
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'X';
    removeBtn.onclick = async () => {
      // Remove movie from to_watch table
      data.to_watch.splice(index, 1);
      await ipcRenderer.invoke('update-watchlist', { table: 'to_watch', data: [] }); // You'll need to add a function to delete
      loadToWatchMovies();
    };

    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

async function addMovie() {
  const title = document.getElementById('title').value;
  const genre = document.getElementById('genre').value;

  if (!title || !genre) return;

  const data = await ipcRenderer.invoke('get-watchlist');
  data.to_watch.push({ title, genre });

  await ipcRenderer.invoke('update-watchlist', { table: 'to_watch', data: data.to_watch });
  loadToWatchMovies();
}

loadToWatchMovies();

const { app, BrowserWindow, ipcMain } = require('electron');

const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const dbPath = path.join(__dirname, 'watchlist.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database opening error: ", err);
  } else {
    // Initialize database if it doesn't exist
    db.run("CREATE TABLE IF NOT EXISTS to_watch (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, genre TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS watched (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, genre TEXT, rating INTEGER)");
  }
});

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 500,
    height: 600,
    frame: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true, 
      contextIsolation: false,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Function to retrieve the watchlist (to_watch and watched)
function getWatchlist(callback) {
  db.all("SELECT * FROM to_watch", (err, toWatch) => {
    if (err) {
      console.error("Error getting to_watch: ", err);
      callback(err);
    }
    db.all("SELECT * FROM watched", (err, watched) => {
      if (err) {
        console.error("Error getting watched: ", err);
        callback(err);
      }
      callback(null, { to_watch: toWatch, watched: watched });
    });
  });
}

// Function to update the watchlist (to_watch or watched)
function updateWatchlist(table, data, callback) {
  const stmt = db.prepare(`INSERT INTO ${table} (title, genre, rating) VALUES (?, ?, ?)`);
  data.forEach((movie) => {
    stmt.run(movie.title, movie.genre, movie.rating || null);
  });
  stmt.finalize(callback);
}

// Handle IPC calls
ipcMain.handle('get-watchlist', () => {
  return new Promise((resolve, reject) => {
    getWatchlist((err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
});

ipcMain.handle('update-watchlist', (event, { table, data }) => {
  if (table === 'to_watch') {
    // Delete all entries from the 'to_watch' table
    db.run('DELETE FROM to_watch');
    // Insert the new data into the 'to_watch' table
    const stmt = db.prepare('INSERT INTO to_watch (title, genre) VALUES (?, ?)');
    data.forEach((movie) => {
      stmt.run(movie.title, movie.genre);
    });
    stmt.finalize();
  } else if (table === 'watched') {
    // Handle watched data updates here if necessary
  }
});

ipcMain.on('close-app', () => {
  app.quit();
});

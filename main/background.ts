// SonicVault — Electron Main Process
// Desktop app shell via nextron/Electron.
// Primary target: web/Docker. Electron provides native file dialogs + tray.

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';

const isProd = process.env.NODE_ENV === 'production';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'SonicVault',
    backgroundColor: '#0A0A0C',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isProd) {
    mainWindow.loadURL('app://./');
  } else {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── IPC Handlers ──

// Native folder picker dialog
ipcMain.handle('dialog:selectFolder', async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Folder',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// ── App Lifecycle ──

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

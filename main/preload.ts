// SonicVault — Electron Preload Script
// Exposes safe APIs to the renderer process via contextBridge.

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // File system dialogs
  selectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('dialog:selectFolder'),

  // Platform info
  platform: process.platform,
  isElectron: true,
});

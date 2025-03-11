// Preload script runs in renderer process with Node.js environment
// It can expose specific APIs from Electron to the renderer process

// Import necessary Electron modules
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// specific Electron APIs without exposing the entire API
contextBridge.exposeInMainWorld('electronAPI', {
  // Get screen dimensions from main process
  getScreenSize: () => ipcRenderer.invoke('get-screen-size')
}); 
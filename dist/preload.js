"use strict";
// Preload script runs in renderer process with Node.js environment
// It can expose specific APIs from Electron to the renderer process
Object.defineProperty(exports, "__esModule", { value: true });
// Import necessary Electron modules
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// specific Electron APIs without exposing the entire API
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Get screen dimensions from main process
    getScreenSize: () => electron_1.ipcRenderer.invoke('get-screen-size')
});
//# sourceMappingURL=preload.js.map
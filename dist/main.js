"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
// Keep a global reference of the window object to prevent garbage collection
let mainWindow = null;
function createWindow() {
    // Get the primary display's work area (screen size minus taskbar/dock)
    const primaryDisplay = electron_1.screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    // Create the browser window with transparency and no frame
    mainWindow = new electron_1.BrowserWindow({
        width: 256, // Larger size for development
        height: 256, // Larger size for development
        transparent: true, // Make window transparent
        frame: false, // Remove window frame
        alwaysOnTop: true, // Keep window above others
        skipTaskbar: true, // Don't show in taskbar
        resizable: false, // Prevent resizing
        movable: true, // Allow moving during development
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    // IMPORTANT: First make the window capture mouse events
    mainWindow.setIgnoreMouseEvents(false);
    // Enable dev tools for debugging in development
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    // After initialization, enable click-through but keep capturing mouse events
    setTimeout(() => {
        if (mainWindow) {
            // The forward: true parameter is critical - it allows the window to
            // capture mouse events while still being click-through
            mainWindow.setIgnoreMouseEvents(true, { forward: true });
            console.log('Window now set to click-through but still tracking mouse');
        }
    }, 5000); // Increased delay to ensure page is fully loaded
    // Position window in the center of the primary display initially
    mainWindow.setPosition(Math.floor(width / 2 - 128), Math.floor(height / 2 - 128));
    // Load the index.html file from the dist folder
    const distRendererPath = path.join(__dirname, 'renderer/index.html');
    mainWindow.loadFile(distRendererPath).catch(err => {
        console.error('Error loading application:', err);
        // Try src folder as a fallback
        const srcRendererPath = path.join(__dirname, '../src/renderer/index.html');
        if (mainWindow) {
            console.log('Trying fallback path:', srcRendererPath);
            mainWindow.loadFile(srcRendererPath).catch(err => {
                console.error('Failed to load application. Please rebuild the project.');
            });
        }
    });
    // Set up IPC handlers for communication between main and renderer processes
    electron_1.ipcMain.handle('get-screen-size', () => {
        return { width, height };
    });
    // Handle window being closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
// Create window when Electron has finished initialization
electron_1.app.whenReady().then(() => {
    createWindow();
    // On macOS, re-create window when dock icon is clicked
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
// Quit when all windows are closed, except on macOS
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
//# sourceMappingURL=main.js.map
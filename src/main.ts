import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';

// Keep a global reference of the window object to prevent garbage collection
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // Get the primary display's work area (screen size minus taskbar/dock)
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Create the browser window with transparency and no frame
  mainWindow = new BrowserWindow({
    width: 256,      // Larger size for development
    height: 256,     // Larger size for development
    transparent: true, // Make window transparent
    frame: false,      // Remove window frame
    alwaysOnTop: true, // Keep window above others
    skipTaskbar: true, // Don't show in taskbar
    resizable: false,  // Prevent resizing
    movable: true,     // Allow moving during development
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
  mainWindow.setPosition(
    Math.floor(width / 2 - 128),
    Math.floor(height / 2 - 128)
  );

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
  ipcMain.handle('get-screen-size', () => {
    return { width, height };
  });

  // Handle window being closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // On macOS, re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 
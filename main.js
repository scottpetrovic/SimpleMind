// app - controls the application's event lifecycle
// BrowserWindow - creates and manages the browser window
const { app, BrowserWindow, globalShortcut } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    frame: false, // disable the default title bar
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#e7e7e7',
      symbolColor: 'black',
      height: 10
    },
    webPreferences: {
      nodeIntegration: true,
      // Note: For security reasons, you should keep contextIsolation enabled and use contextBridge for IPC
      contextIsolation: false, 
    }
  })

  win.loadFile('index.html')
}

// hook when the application is ready to start doing work
app.whenReady().then(() => {
  createWindow()



  // Register a global shortcut to open DevTools
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      
      if (win.webContents.isDevToolsOpened()) {     
        win.webContents.closeDevTools();
      } else {     
        win.webContents.openDevTools();
      }


    }
  });


// Unregister all shortcuts when the application is quitting.
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});





  // lifecycle hook specific to MacOS for opening window
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

})

// windows and linux usually close without needing this
// but MacOS doesn't close the app when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

// app - controls the application's event lifecycle
// BrowserWindow - creates and manages the browser window
const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  })

  win.loadFile('index.html')
}

// hook when the application is ready to start doing work
app.whenReady().then(() => {
  createWindow()

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
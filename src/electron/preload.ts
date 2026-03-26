import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  windowMinimize: () => ipcRenderer.send('window-min'),
  windowMaximize: () => ipcRenderer.send('window-max'),
  windowClose: () => ipcRenderer.send('window-close'),
})
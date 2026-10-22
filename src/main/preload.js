'use strict';
// The page gets window controls only. No file system, no network, no Node.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('myuuelWindow', {
  state: () => ipcRenderer.invoke('window:state'),
  place: mode => ipcRenderer.invoke('window:place', mode),
  pin: on => ipcRenderer.invoke('window:pin', !!on),
  action: name => ipcRenderer.invoke('window:action', name),
  openSite: () => ipcRenderer.invoke('open:site'),
  onChange: fn => { ipcRenderer.on('window:changed', (_e, s) => fn(s)); }
});

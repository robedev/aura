const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('auraAPI', {
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    on: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
    },
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

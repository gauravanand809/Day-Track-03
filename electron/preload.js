const { contextBridge, ipcRenderer } = require('electron');

// Expose a controlled API to the renderer process (app.js)
contextBridge.exposeInMainWorld('electronAPI', {
  // This function will be callable from app.js as window.electronAPI.generateTodo()
  generateTodo: (args) => ipcRenderer.invoke('generate-todo', args), // Pass through args
  // New function for AI study plan
  generateAiStudyPlan: (planDetails) => ipcRenderer.invoke('generate-ai-study-plan', planDetails),
  // New function for generic text completion for Parallel You
  generateTextCompletion: (args) => ipcRenderer.invoke('generate-text-completion', args)
});

console.log('Preload script loaded (electron/preload.js).');

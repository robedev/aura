const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const RuleEngine = require('./rules-engine.js');
const ProfileManager = require('./profile-manager.js');
const osController = require('./os-controller.js');

const profileManager = new ProfileManager(path.join(__dirname, '../profiles/default.json'));
const profile = profileManager.load();
const ruleEngine = new RuleEngine();

// Initialize FaceTracker with profile thresholds
let faceTracker = null;

// Load saved rules into engine
profile.rules.forEach(r => {
  const condition = { [r.gesture]: true };
  let action;
  switch(r.action) {
    case 'click':
      action = 'click';
      break;
    case 'right-click':
      action = 'right-click';
      break;
    case 'middle-click':
      action = 'middle-click';
      break;
    case 'scroll-up':
      action = 'scroll-up';
      break;
    case 'scroll-down':
      action = 'scroll-down';
      break;
    case 'type':
      action = `type-${r.param}`;
      break;
    case 'copy':
      action = 'copy';
      break;
    case 'paste':
      action = 'paste';
      break;
    case 'cut':
      action = 'cut';
      break;
    case 'select-all':
      action = 'select-all';
      break;
    case 'undo':
      action = 'undo';
      break;
    case 'save-file':
      action = 'save-file';
      break;
    case 'volume-up':
      action = 'volume-up';
      break;
    case 'volume-down':
      action = 'volume-down';
      break;
    case 'minimize-window':
      action = 'minimize-window';
      break;
    case 'maximize-window':
      action = 'maximize-window';
      break;
    case 'close-window':
      action = 'close-window';
      break;
    case 'read-text':
      action = `read-text-${r.param}`;
      break;
    default:
      action = r.action;
  }
  ruleEngine.addRule(condition, action);
});

// Cooldown for rule execution (to prevent double clicks/types)
let lastExecutionTime = 0;

// Macros system (Simplified)
const macros = {
  recording: false,
  currentMacro: [],
  savedMacros: {},
  startRecording: (name) => { this.recording = true; this.currentMacro = []; },
  stopRecording: (name) => { this.recording = false; this.savedMacros[name] = [...this.currentMacro]; },
  playMacro: (name) => {
    const macro = this.savedMacros[name];
    if (macro) macro.forEach((a, i) => setTimeout(() => osController[a.type](...Object.values(a).slice(1)), i * 200));
  }
};

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile('app/renderer/index.html');

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Main window loaded, sending profile data');
    mainWindow.webContents.send('profile-loaded', profile);
  });

  // Cleanup when window is closed
  mainWindow.on('close', () => {
    console.log('🧹 Main window closing, cleaning up...');

    // Stop any running timers/intervals
    mainWindow.webContents.executeJavaScript('window.cleanupAura && window.cleanupAura()');

    // Give time for cleanup
    setTimeout(() => {
      console.log('✅ Cleanup completed');
    }, 500);
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// IPC handlers
ipcMain.on('move-mouse', (event, x, y) => osController.moveMouse(x, y));

ipcMain.on('click-mouse', (event, button) => {
  osController.clickMouse(button);
  if (mainWindow) {
    mainWindow.webContents.send('action-executed', `Click ${button} ejecutado`);
  }
});

ipcMain.on('gesture-update', (event, gestures) => {
  const now = Date.now();
  const executionCooldown = profile.thresholds?.executionCooldown || 800;
  if (now - lastExecutionTime < executionCooldown) return;

  const action = ruleEngine.evaluate(gestures);
  if (action) {
    console.log(`[RULE ENGINE] Triggered: ${action}`);
    lastExecutionTime = now;

    // Execute different actions based on type
    if (action === 'click') {
      osController.clickMouse('left');
    } else if (action === 'right-click') {
      osController.clickMouse('right');
    } else if (action === 'middle-click') {
      osController.clickMouse('middle');
    } else if (action === 'scroll-up') {
      osController.scrollMouse('up');
    } else if (action === 'scroll-down') {
      osController.scrollMouse('down');
    } else if (action.startsWith('type-')) {
      osController.typeText(action.split('-').slice(1).join('-'));
    } else if (action === 'copy') {
      osController.copy();
    } else if (action === 'paste') {
      osController.paste();
    } else if (action === 'cut') {
      osController.cut();
    } else if (action === 'select-all') {
      osController.selectAll();
    } else if (action === 'undo') {
      osController.undo();
    } else if (action === 'save-file') {
      osController.save();
    } else if (action === 'volume-up') {
      osController.volumeUp();
    } else if (action === 'volume-down') {
      osController.volumeDown();
    } else if (action === 'minimize-window') {
      osController.minimizeWindow();
    } else if (action === 'maximize-window') {
      osController.maximizeWindow();
    } else if (action === 'close-window') {
      osController.closeWindow();
    } else if (action.startsWith('read-text-')) {
      const text = action.split('-').slice(2).join('-');
      osController.readText(text);
    }

    // Send visual feedback to UI
    if (mainWindow) {
      mainWindow.webContents.send('action-executed', `Gesto detectado: ${action}`);
    }
  }
});

ipcMain.on('add-rule', (event, rule) => {
  // Check for duplicate rules
  const existingRule = profileManager.currentProfile.rules.find(r =>
    r.gesture === rule.gesture && r.action === rule.action &&
    (rule.action !== 'type' || r.param === rule.param)
  );

  if (existingRule) {
    event.sender.send('rule-error', 'Ya existe una regla con este gesto y acción');
    return;
  }

  const condition = { [rule.gesture]: true };
  let action;
  switch(rule.action) {
    case 'click':
      action = 'click';
      break;
    case 'type':
      action = `type-${rule.param}`;
      break;
    case 'volume-up':
      action = 'volume-up';
      break;
    case 'volume-down':
      action = 'volume-down';
      break;
    case 'undo':
      action = 'undo';
      break;
    case 'read-text':
      action = `read-text-${rule.param}`;
      break;
    default:
      action = rule.action;
  }
  ruleEngine.addRule(condition, action);
  profileManager.addRule(rule);
  console.log('Rule added and persisted:', rule);

  // Send updated rules list to renderer
  if (mainWindow) {
    mainWindow.webContents.send('rules-updated', profileManager.currentProfile.rules);
  }
});

ipcMain.on('remove-rule', (event, index) => {
  // Remove from rule engine (rebuild it)
  ruleEngine.rules = [];
  profileManager.removeRule(index);

  // Reload all rules into engine
  profileManager.currentProfile.rules.forEach(r => {
    const condition = { [r.gesture]: true };
    let action;
    switch(r.action) {
      case 'click':
        action = 'click';
        break;
      case 'type':
        action = `type-${r.param}`;
        break;
      case 'volume-up':
        action = 'volume-up';
        break;
      case 'volume-down':
        action = 'volume-down';
        break;
      case 'undo':
        action = 'undo';
        break;
      case 'read-text':
        action = `read-text-${r.param}`;
        break;
      default:
        action = r.action;
    }
    ruleEngine.addRule(condition, action);
  });

  console.log('Rule removed and engine updated');

  // Send updated rules list to renderer
  if (mainWindow) {
    mainWindow.webContents.send('rules-updated', profileManager.currentProfile.rules);
  }
});

ipcMain.on('calibrate-save', (event, pose) => {
  profileManager.updateCalibration(pose);
  console.log('Calibration persisted');
});

// Settings management
ipcMain.on('get-profile-settings', (event) => {
  event.sender.send('profile-settings-loaded', profileManager.currentProfile);
});

ipcMain.on('save-profile-settings', (event, newSettings) => {
  // Update profile with new settings
  if (newSettings.thresholds) {
    profileManager.currentProfile.thresholds = {
      ...profileManager.currentProfile.thresholds,
      ...newSettings.thresholds
    };
  }
  if (newSettings.adaptive) {
    profileManager.currentProfile.adaptive = {
      ...profileManager.currentProfile.adaptive,
      ...newSettings.adaptive
    };
  }

  profileManager.save();

  // Reinitialize face tracker with new thresholds
  if (faceTracker) {
    faceTracker.thresholds = profileManager.currentProfile.thresholds;
  }

  event.sender.send('settings-saved');
  console.log('Profile settings updated and saved');
});

ipcMain.on('reset-profile-settings', (event) => {
  // Reset to default settings
  profileManager.currentProfile = profileManager.getDefaultProfile();
  profileManager.save();

  // Reinitialize face tracker with default thresholds
  if (faceTracker) {
    faceTracker.thresholds = profileManager.currentProfile.thresholds;
    faceTracker.resetSession();
  }

  event.sender.send('settings-saved');
  console.log('Profile settings reset to defaults');
});

// Adaptive learning updates
ipcMain.on('adaptation-update', (event, adaptationData) => {
  if (profileManager.currentProfile.calibration) {
    // Store adaptation history for learning
    profileManager.currentProfile.calibration.adaptationHistory.push({
      timestamp: Date.now(),
      usageStats: adaptationData.usageStats,
      adaptiveThresholds: adaptationData.adaptiveThresholds
    });

    // Keep only last 50 adaptation records
    if (profileManager.currentProfile.calibration.adaptationHistory.length > 50) {
      profileManager.currentProfile.calibration.adaptationHistory.shift();
    }

    profileManager.save();
    console.log('Adaptation data saved');
  }
});

// Platform information
ipcMain.on('get-platform-info', (event) => {
  const platformInfo = osController.getPlatformInfo();
  event.sender.send('platform-info', platformInfo);
});

// Camera error handling
ipcMain.on('camera-error', (event, errorData) => {
  console.error('Camera error reported:', errorData);

  // Show dialog to user
  const { dialog } = require('electron');
  const errorMessages = {
    'NotReadableError': 'No se puede acceder a la cámara. Verifica que esté conectada y no esté siendo usada por otra aplicación.',
    'NotAllowedError': 'La aplicación no tiene permisos para acceder a la cámara. Ve a Configuración del sistema > Privacidad > Cámara.',
    'NotFoundError': 'No se encontró ninguna cámara conectada al sistema.',
    'default': 'Error desconocido con la cámara: ' + errorData.message
  };

  const message = errorMessages[errorData.error] || errorMessages.default;

  dialog.showErrorBox(
    'Error de Cámara - Aura',
    `Problema detectado con la cámara:\n\n${message}\n\nLa aplicación continuará funcionando, pero algunas funciones estarán limitadas.`
  );
});

ipcMain.on('calibrate', () => {
  if (mainWindow) {
    mainWindow.webContents.send('start-calibration');
  }
});

ipcMain.on('type-text', (event, text) => osController.typeText(text));
ipcMain.on('undo', () => osController.undo());
ipcMain.on('open-app', (event, app) => osController.openApp(app));
ipcMain.on('volume-up', () => osController.volumeUp());
ipcMain.on('volume-down', () => osController.volumeDown());
ipcMain.on('read-text', (event, text) => osController.readText(text));

// Advanced mouse controls
ipcMain.on('scroll-up', () => osController.scrollMouse('up'));
ipcMain.on('scroll-down', () => osController.scrollMouse('down'));
ipcMain.on('right-click', () => osController.clickMouse('right'));
ipcMain.on('middle-click', () => osController.clickMouse('middle'));

// Window management
ipcMain.on('minimize-window', () => osController.minimizeWindow());
ipcMain.on('maximize-window', () => osController.maximizeWindow());
ipcMain.on('close-window', () => osController.closeWindow());

// Advanced keyboard shortcuts
ipcMain.on('copy', () => osController.copy());
ipcMain.on('paste', () => osController.paste());
ipcMain.on('cut', () => osController.cut());
ipcMain.on('select-all', () => osController.selectAll());
ipcMain.on('save-file', () => osController.save());
ipcMain.on('new-tab', () => osController.newTab());
ipcMain.on('close-tab', () => osController.closeTab());

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, cleaning up...');
  osController.cleanup();
  setTimeout(() => process.exit(0), 500);
});

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, cleaning up...');
  osController.cleanup();
  setTimeout(() => process.exit(0), 500);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  console.log('🧹 Application closing, performing final cleanup...');

  // Cleanup OS Controller processes
  osController.cleanup();

  // Give time for cleanup to complete
  setTimeout(() => {
    if (process.platform !== 'darwin') {
      console.log('✅ Application cleanup completed, quitting...');
      app.quit();
    }
  }, 1000);
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
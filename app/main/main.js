const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const RuleEngine = require('./rules-engine.js');
const ProfileManager = require('./profile-manager.js');
const osController = require('./os-controller.js');
const AIService = require('./ai-service.js');

const aiService = new AIService();

const profileManager = new ProfileManager(path.join(__dirname, '../profiles/default.json'));
const profile = profileManager.load();
const ruleEngine = new RuleEngine();

// Initialize FaceTracker with profile thresholds
let faceTracker = null;

// Traduce una regla del perfil (JSON) a la acción interna del engine.
// Solo 'type' y 'read-text' llevan parámetro embebido; el resto es identidad.
function translateRuleAction(r) {
  switch (r.action) {
    case 'type':
      return `type-${r.param}`;
    case 'read-text':
      return `read-text-${r.param}`;
    default:
      return r.action;
  }
}

// Carga una regla del perfil en el engine, propagando priority y anyOf (OR)
function loadRuleIntoEngine(r) {
  const condition = { [r.gesture]: true };
  ruleEngine.addRule(condition, translateRuleAction(r), {
    priority: r.priority,
    anyOf: r.anyOf
  });
}

// Load saved rules into engine
profile.rules.forEach(loadRuleIntoEngine);

// Cooldown for rule execution (to prevent double clicks/types)
let lastExecutionTime = 0;

// TTS proactivo (N5): anuncios de voz de eventos importantes.
// Lista blanca de mensajes — el renderer solo envía la clave del evento,
// nunca texto libre hacia espeak/festival.
const TTS_MESSAGES = {
  'calibration-complete': 'Calibración lista',
  'fatigue': 'Descansemos un momento',
  'paused': 'Sistema pausado',
  'resumed': 'Sistema activo',
  'camera-error': 'Cámara no disponible',
  'action': 'Acción ejecutada'
};

function announceTTS(key) {
  const tts = profileManager.currentProfile?.ttsAnnouncements;
  if (!tts || !tts.enabled) return;
  if (key === 'fatigue' && !tts.fatigue) return;
  if (key === 'action' && !tts.actions) return;

  const message = TTS_MESSAGES[key];
  if (message) {
    osController.readText(message);
    console.log(`🔊 TTS: "${message}"`);
  }
}

ipcMain.on('tts-announce', (event, key) => announceTTS(key));

// Anti-spam del anuncio de fatiga: como máximo una vez cada 5 minutos
let lastFatigueAnnounce = 0;
const FATIGUE_ANNOUNCE_COOLDOWN = 5 * 60 * 1000;

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
    height: 800,
    alwaysOnTop: true,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile('app/renderer/index.html');

  // Enable DevTools for debugging
  // mainWindow.webContents.openDevTools({
  //   mode: 'detach', // Open in separate window
  //   activate: false // Don't bring to front automatically
  // });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Main window loaded, sending profile data');
    console.log('🛠️  DevTools enabled - Console available for debugging');

    mainWindow.webContents.send('profile-loaded', profile);
  });

  // Add keyboard shortcut to toggle DevTools (F12 or Ctrl+Shift+I)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      event.preventDefault();
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
        console.log('🛠️  DevTools closed');
      } else {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
        console.log('🛠️  DevTools opened');
      }
    }
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
ipcMain.on('log', (event, message) => console.log(`[RENDERER] ${message}`));
ipcMain.on('move-mouse', (event, x, y) => osController.moveMouse(x, y));
ipcMain.on('move-mouse-relative', (event, dx, dy) => osController.moveMouseRelative(dx, dy));

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

    // Anuncio de acción ejecutada (N5, desactivado por defecto)
    announceTTS('action');
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

  loadRuleIntoEngine(rule);
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
  profileManager.currentProfile.rules.forEach(loadRuleIntoEngine);

  console.log('Rule removed and engine updated');

  // Send updated rules list to renderer
  if (mainWindow) {
    mainWindow.webContents.send('rules-updated', profileManager.currentProfile.rules);
  }
});

ipcMain.on('calibrate-save', (event, pose) => {
  profileManager.updateCalibration(pose);
  console.log('Calibration persisted');
  announceTTS('calibration-complete');
});

ipcMain.on('save-calibrated-thresholds', (event, thresholds) => {
  profileManager.updateCalibratedThresholds(thresholds);
  console.log('Calibrated thresholds persisted');
  announceTTS('calibration-complete');
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

  event.sender.send('settings-reset');
  console.log('Profile settings reset to defaults');
});

// Sugerencias IA (N1): el renderer envía el texto parcial del teclado;
// se devuelve junto al texto original para descartar respuestas obsoletas
ipcMain.on('ai-suggest', async (event, text) => {
  const suggestions = await aiService.suggest(text);
  if (suggestions.length > 0 && !event.sender.isDestroyed()) {
    event.sender.send('ai-suggestions', { text, suggestions });
  }
});

// Onboarding (N3): marcar el tutorial como completado para no volver a mostrarlo
ipcMain.on('onboarding-completed', () => {
  if (profileManager.currentProfile) {
    profileManager.currentProfile.onboardingCompleted = true;
    profileManager.save();
    console.log('✅ Onboarding marcado como completado');
  }
});

ipcMain.on('save-learnings', (event, learnings) => {
  if (learnings && profileManager.currentProfile) {
    profileManager.currentProfile.learnings = learnings;
    profileManager.save();
  }
});

// Adaptive learning updates
ipcMain.on('adaptation-update', (event, adaptationData) => {
  // Anuncio de fatiga (N5): nivel alto sostenido, con cooldown anti-spam
  const fatigueLevel = adaptationData.usageStats?.fatigueLevel || 0;
  if (fatigueLevel > 0.7 && Date.now() - lastFatigueAnnounce > FATIGUE_ANNOUNCE_COOLDOWN) {
    lastFatigueAnnounce = Date.now();
    announceTTS('fatigue');
  }

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
  announceTTS('camera-error');

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

ipcMain.on('pause', () => {
  console.log('Emergency pause activated');
  // Stop face tracking immediately
  if (mainWindow) {
    mainWindow.webContents.send('emergency-pause');
  }
  announceTTS('paused');
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
ipcMain.on('resize-window', (event, width, height) => {
  if (mainWindow) {
    mainWindow.setSize(width, height);
  }
});

// Minimal mode - small camera-only window positioned top-right
let isMinimalMode = false;
let previousBounds = null;

ipcMain.on('toggle-minimal-mode', (event) => {
  if (!mainWindow) return;
  
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;
  
  if (!isMinimalMode) {
    // Save current bounds before switching to minimal mode
    previousBounds = mainWindow.getBounds();
    
    // Minimal mode: small window top-right
    const minimalWidth = 280;
    const minimalHeight = 200;
    const margin = 20;
    
    mainWindow.setSize(minimalWidth, minimalHeight);
    mainWindow.setPosition(screenWidth - minimalWidth - margin, margin);
    mainWindow.setResizable(false);
    mainWindow.setAlwaysOnTop(true, 'floating'); // Ensure always on top
    
    isMinimalMode = true;
    event.sender.send('minimal-mode-changed', true);
    console.log('🔲 Switched to minimal mode');
  } else {
    // Restore previous bounds
    if (previousBounds) {
      mainWindow.setBounds(previousBounds);
    } else {
      mainWindow.setSize(900, 800);
      mainWindow.center();
    }
    mainWindow.setResizable(true);
    mainWindow.setAlwaysOnTop(true); // Keep always on top but normal level
    
    isMinimalMode = false;
    event.sender.send('minimal-mode-changed', false);
    console.log('🔳 Switched to full mode');
  }
});

ipcMain.on('get-minimal-mode', (event) => {
  event.sender.send('minimal-mode-changed', isMinimalMode);
});

// Advanced keyboard shortcuts
ipcMain.on('copy', () => osController.copy());
ipcMain.on('paste', () => osController.paste());
ipcMain.on('cut', () => osController.cut());
ipcMain.on('select-all', () => osController.selectAll());
ipcMain.on('save-file', () => osController.save());
ipcMain.on('new-tab', () => osController.newTab());
ipcMain.on('close-tab', () => osController.closeTab());

// Enhanced graceful shutdown handling
let isShuttingDown = false;

async function performGracefulShutdown(signal = 'unknown') {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`🛑 ${signal} received, starting cleanup...`);

  try {
    // Phase 1: Close Windows
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.destroy();
    }

    // Phase 1.5: Force key release (CRITICAL)
    await osController.releaseAllKeys();

    // Phase 2: OS Controller cleanup (Aggressive)
    await osController.cleanup();

  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  } finally {
    console.log('🏁 Shutdown complete');
    process.exit(0);
  }
}

process.on('SIGINT', () => performGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => performGracefulShutdown('SIGTERM'));

// Handle unexpected exits
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  performGracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection:', reason);
  performGracefulShutdown('unhandledRejection');
});

app.whenReady().then(() => {
  console.log('✅ app.whenReady() resolved');
  createWindow();
  
  // Increase cursor size for accessibility
  osController.setLargeCursor(true);
});

app.on('window-all-closed', () => {
  performGracefulShutdown('window-all-closed');
});

async function performFinalCleanupCheck() {
  console.log('🔍 Performing final cleanup verification...');

  try {
    // Check for any remaining processes on Linux
    if (process.platform === 'linux') {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      try {
        const { stdout } = await execAsync('pgrep -f "aura|xdotool|espeak|festival" || true');
        const pids = stdout.trim().split('\n').filter(Boolean);

        if (pids.length > 0) {
          console.warn(`🚨 Found ${pids.length} potentially orphaned processes:`, pids);
          // Force kill them
          for (const pid of pids) {
            try {
              process.kill(parseInt(pid), 'SIGKILL');
            } catch (error) {
              // Process might have already terminated
            }
          }
        } else {
          console.log('✅ No orphaned processes found');
        }
      } catch (error) {
        console.log('ℹ️ Process check completed (no processes found)');
      }
    }

    // Additional platform-specific checks could be added here

  } catch (error) {
    console.warn('Final cleanup check encountered error:', error.message);
  }
}

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
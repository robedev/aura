// Renderer process for Aura
console.log('🚀 Aura renderer loaded');

// Global cleanup function
window.cleanupAura = function() {
  console.log('🧹 Performing comprehensive Aura cleanup...');

  try {
    // Phase 1: Clear all timers and intervals
    console.log('📋 Phase 1: Clearing all timers and intervals');

    // Clear known intervals
    const intervalsToClear = [
      'debugInterval',
      'mediaPipeCheckInterval',
      'scanInterval',
      'auraScanInterval',
      'auraTimeout'
    ];

    intervalsToClear.forEach(intervalName => {
      if (window[intervalName]) {
        if (typeof window[intervalName] === 'number') {
          clearInterval(window[intervalName]);
        } else {
          clearInterval(window[intervalName]);
        }
        window[intervalName] = null;
      }
    });

    // Clear any remaining intervals by ID
    const highestIntervalId = setInterval(() => {}, 1000);
    for (let i = 0; i < highestIntervalId; i++) {
      clearInterval(i);
    }

    // Clear any remaining timeouts by ID
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
    }

    // Phase 2: Stop face tracker and camera
    console.log('📋 Phase 2: Stopping face tracker and camera');
  if (faceTracker) {
    try {
      faceTracker.stop();
      console.log('✅ FaceTracker stopped');
    } catch (error) {
      console.error('Error stopping FaceTracker:', error);
    }
  }

  // Clear any pending timeouts
  if (window.pendingTimeouts) {
    window.pendingTimeouts.forEach(clearTimeout);
    window.pendingTimeouts = [];
  }

  // Phase 3: Clear event listeners
  console.log('📋 Phase 3: Clearing event listeners');
  try {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      if (button.onclick) {
        button.onclick = null;
      }
    });
  } catch (error) {
    console.warn('Error clearing event listeners:', error.message);
  }

  // Phase 4: Memory cleanup
  console.log('📋 Phase 4: Memory cleanup');
  try {
    // Clear global variables
    const globalsToClean = [
      'faceTracker',
      'FaceTracker',
      'currentSettings',
      'keys',
      'keyButtons',
      'currentGestureState'
    ];

    globalsToClean.forEach(globalVar => {
      if (window[globalVar]) {
        delete window[globalVar];
      }
    });

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  } catch (error) {
    console.warn('Error during memory cleanup:', error.message);
  }

  // Phase 5: Final verification
  console.log('📋 Phase 5: Final verification');
  console.log('✅ Comprehensive Aura cleanup completed');
};

// Check if auraAPI is available
if (typeof window.auraAPI === 'undefined') {
  console.error('❌ auraAPI not available - preload script may not be loaded');
} else {
  console.log('✅ auraAPI available');
}

// Debug information for DevTools
console.log('🛠️  Aura Debug Console - Development Mode');
console.log('📋 Available global functions:');
console.log('   - window.cleanupAura(): Force cleanup');
console.log('   - window.faceTracker: Current face tracker instance');
console.log('   - window.auraAPI: IPC communication object');
console.log('   - currentSettings: Current profile settings');
console.log('🎮 Available actions:');
console.log('   - F12 or Ctrl+Shift+I: Toggle DevTools');
console.log('   - CONFIG button: Open settings panel');
console.log('   - CALIBRAR button: Start calibration');
console.log('   - PAUSA button: Emergency pause');
console.log('📊 Debug shortcuts:');
console.log('   - console.log(faceTracker): Check face tracker status');
console.log('   - console.log(currentSettings): View current settings');

// Development helpers
window.debugAura = {
  getStatus: () => ({
    faceTracker: !!faceTracker,
    settings: !!currentSettings,
    auraAPI: !!window.auraAPI,
    platform: navigator.platform,
    userAgent: navigator.userAgent
  }),

  forceCleanup: () => {
    console.log('🔧 Forcing cleanup...');
    if (window.cleanupAura) window.cleanupAura();
  },

  testIPC: () => {
    console.log('🔄 Testing IPC communication...');
    window.auraAPI.send('get-platform-info');
  },

  getLogs: () => {
    console.log('📝 Recent console logs:');
    // This will show recent logs in the console
  }
};

console.log('🛠️  Debug helpers available at window.debugAura');
console.log('💡 Type debugAura.getStatus() to check system status');

// Show debug indicator if DevTools are available
function updateDebugIndicator() {
  const debugIndicator = document.getElementById('debug-indicator');
  if (debugIndicator) {
    // Check if DevTools are opened (this is a simple heuristic)
    const hasDevTools = window.outerHeight < 600 || window.outerWidth < 800 ||
                       document.body.classList.contains('devtools-opened') ||
                       window.location.search.includes('devtools');

    if (hasDevTools) {
      debugIndicator.style.display = 'inline-block';
      console.log('🛠️  Debug indicator activated');
    } else {
      debugIndicator.style.display = 'none';
    }
  }
}

// Check for DevTools periodically
setInterval(updateDebugIndicator, 2000);
updateDebugIndicator(); // Initial check

// Add debug indicator toggle function
window.debugAura.showDebugIndicator = () => {
  const debugIndicator = document.getElementById('debug-indicator');
  if (debugIndicator) {
    debugIndicator.style.display = 'inline-block';
    console.log('🛠️  Debug indicator manually activated');
  }
};

window.debugAura.hideDebugIndicator = () => {
  const debugIndicator = document.getElementById('debug-indicator');
  if (debugIndicator) {
    debugIndicator.style.display = 'none';
    console.log('🛠️  Debug indicator manually hidden');
  }
};

// Check if MediaPipe scripts are loaded
window.addEventListener('load', () => {
  console.log('📦 Window loaded, checking MediaPipe...');
  console.log('FaceMesh loaded:', typeof FaceMesh !== 'undefined');
  console.log('Camera loaded:', typeof Camera !== 'undefined');
});

// auraAPI is provided by the preload script via contextBridge

// Debug: Log eyebrow and mouth gestures occasionally
window.debugInterval = setInterval(() => {
  const tracker = window.faceTracker;
  if (tracker && tracker.lastGestures) {
    if (tracker.lastGestures.eyebrowRaise || tracker.lastGestures.mouthOpen) {
      console.log('Gesture Detected:', tracker.lastGestures);
    }
  }
}, 500);

// Use auraAPI for profile loading
auraAPI.on('profile-loaded', (event, profile) => {
  console.log('Profile loaded in UI:', profile.name);
  if (profile.rules) {
    updateRulesList(profile.rules);
  }
});

const video = document.getElementById('video');
let faceTracker = null;
let scanMode = false;
let scanIndex = 0;
let scanInterval = null;
const keys = 'ABCDEFGHIJ KLMNOPQRST UVWXYZ,.'.split('');

window.onload = () => {
  // Wait for MediaPipe to be loaded before initializing FaceTracker
  if (typeof FaceMesh !== 'undefined' && typeof Camera !== 'undefined') {
    initializeFaceTracker();
  } else {
    // Wait for MediaPipe scripts to load
    window.mediaPipeCheckInterval = setInterval(() => {
      if (typeof FaceMesh !== 'undefined' && typeof Camera !== 'undefined') {
        clearInterval(window.mediaPipeCheckInterval);
        window.mediaPipeCheckInterval = null;
        initializeFaceTracker();
      }
    }, 100);
  }
  createKeyboard();
};

function initializeFaceTracker() {
  try {
    console.log('Initializing FaceTracker...');
    console.log('FaceMesh available:', typeof FaceMesh);
    console.log('Camera available:', typeof Camera);

    if (typeof FaceMesh === 'undefined') {
      throw new Error('FaceMesh is not loaded. MediaPipe scripts may not be available.');
    }

    // Get current profile settings for thresholds
    auraAPI.send('get-profile-settings');

    // Initialize with default thresholds, will be updated when profile loads
    faceTracker = new FaceTracker({});
    window.faceTracker = faceTracker;

    const video = document.getElementById('video');
    if (video) {
      console.log('Starting FaceTracker with video element');
      faceTracker.start(video);
      console.log('✅ FaceTracker initialized successfully');

      // Show camera status
      setTimeout(() => {
        const cameraStatus = document.getElementById('camera-status');
        cameraStatus.style.display = 'block';
        cameraStatus.style.color = '#00ffcc';
        cameraStatus.innerHTML = '📹 Cámara activa - Procesamiento facial OK';
      }, 2000); // Wait a bit for camera to actually start
    } else {
      console.error('❌ Video element not found');
    }
  } catch (error) {
    console.error('❌ Error initializing FaceTracker:', error);
    console.error('Stack trace:', error.stack);
  }
}

let keyButtons = [];

function createKeyboard() {
  const keyboard = document.getElementById('keyboard');
  keyboard.innerHTML = '';
  keys.forEach((key, index) => {
    const button = document.createElement('button');
    button.className = 'key';
    button.textContent = key;
    button.onclick = () => {
      if (!scanMode) {
        auraAPI.send('type-text', key);
      }
    };
    keyboard.appendChild(button);
    keyButtons.push(button);
  });
}

function startScanning() {
  scanIndex = 0;
  updateScanHighlight();
  scanInterval = setInterval(() => {
    scanIndex = (scanIndex + 1) % keys.length;
    updateScanHighlight();
  }, 1200);
}

function stopScanning() {
  if (scanInterval) { clearInterval(scanInterval); scanInterval = null; }
  keyButtons.forEach(btn => {
    btn.style.borderColor = '';
    btn.style.boxShadow = '';
  });
}

function updateScanHighlight() {
  keyButtons.forEach((btn, i) => {
    btn.style.borderColor = i === scanIndex ? '#00ffcc' : '';
    btn.style.boxShadow = i === scanIndex ? '0 0 10px #00ffcc' : '';
  });
}

document.getElementById('calibrate').onclick = () => {
  console.log('🎯 Calibrate button clicked');
  auraAPI.send('calibrate');
  // Visual feedback
  const calibrateBtn = document.getElementById('calibrate');
  const originalText = calibrateBtn.textContent;
  calibrateBtn.textContent = '🎯 CALIBRANDO...';
  calibrateBtn.disabled = true;
  setTimeout(() => {
    calibrateBtn.textContent = originalText;
    calibrateBtn.disabled = false;
  }, 5000);
};

document.getElementById('pause').onclick = () => {
  console.log('⏸️ Pause button clicked');
  auraAPI.send('pause');
};
document.getElementById('undo').onclick = () => auraAPI.send('undo');

document.getElementById('toggleScan').onclick = () => {
  scanMode = !scanMode;
  const btn = document.getElementById('toggleScan');
  if (scanMode) {
    startScanning();
    btn.textContent = 'DETENER ESCANEO';
  } else {
    stopScanning();
    btn.textContent = 'ESCANEO';
  }
};

document.getElementById('volumeUp').onclick = () => auraAPI.send('volume-up');
document.getElementById('volumeDown').onclick = () => auraAPI.send('volume-down');

// Advanced controls
document.getElementById('copy').onclick = () => auraAPI.send('copy');
document.getElementById('paste').onclick = () => auraAPI.send('paste');
document.getElementById('rightClick').onclick = () => auraAPI.send('right-click');
document.getElementById('scrollUp').onclick = () => auraAPI.send('scroll-up');
document.getElementById('scrollDown').onclick = () => auraAPI.send('scroll-down');
document.getElementById('minimize').onclick = () => auraAPI.send('minimize-window');
document.getElementById('closeWindow').onclick = () => auraAPI.send('close-window');

// Handle action select change to show/hide text input
document.getElementById('actionSelect').onchange = (e) => {
  const textInput = document.getElementById('actionParam');
  textInput.style.display = e.target.value === 'type' ? 'block' : 'none';
};

document.getElementById('addRule').onclick = () => {
  const gesture = document.getElementById('gestureSelect').value;
  const action = document.getElementById('actionSelect').value;
  const param = action === 'type' ? document.getElementById('actionParam').value : '';

  // Validation
  if (action === 'type' && !param.trim()) {
    alert('Por favor ingrese el texto a escribir');
    return;
  }

  const rule = { gesture, action, param };
  auraAPI.send('add-rule', rule);

  // Clear input if it was shown
  if (action === 'type') {
    document.getElementById('actionParam').value = '';
  }
};

// Action descriptions for better UI
const actionDescriptions = {
  'click': 'Click izquierdo',
  'right-click': 'Click derecho',
  'middle-click': 'Click central',
  'scroll-up': 'Scroll arriba',
  'scroll-down': 'Scroll abajo',
  'type': 'Escribir texto',
  'copy': 'Copiar',
  'paste': 'Pegar',
  'cut': 'Cortar',
  'select-all': 'Seleccionar todo',
  'undo': 'Deshacer',
  'save-file': 'Guardar archivo',
  'volume-up': 'Subir volumen',
  'volume-down': 'Bajar volumen',
  'minimize-window': 'Minimizar ventana',
  'maximize-window': 'Maximizar ventana',
  'close-window': 'Cerrar ventana',
  'read-text': 'Leer texto'
};

function updateRulesList(rules) {
  const list = document.getElementById('rulesList');
  list.innerHTML = '';
  rules.forEach((rule, index) => {
    const li = document.createElement('li');
    li.className = 'rule-item';
    const actionDesc = actionDescriptions[rule.action] || rule.action;
    const paramText = rule.param ? ` "${rule.param}"` : '';
    li.textContent = `${rule.gesture} → ${actionDesc}${paramText}`;

    // Add delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✕';
    deleteBtn.style.cssText = 'margin-left: 10px; background: #ff4444; border: none; color: white; cursor: pointer; padding: 2px 6px; border-radius: 3px; font-size: 12px;';
    deleteBtn.onclick = () => {
      if (confirm('¿Eliminar esta regla?')) {
        auraAPI.send('remove-rule', index);
      }
    };
    li.appendChild(deleteBtn);

    list.appendChild(li);
  });
}

// Listen for rule updates
auraAPI.on('rules-updated', (event, rules) => {
  updateRulesList(rules);
});

// Listen for rule errors
auraAPI.on('rule-error', (event, message) => {
  alert(`Error: ${message}`);
});

// Platform information
auraAPI.on('platform-info', (event, info) => {
  const platformElement = document.getElementById('platform-info');
  const statusIcon = info.supported ? '✅' : '⚠️';
  const statusColor = info.supported ? '#00ffcc' : '#ffaa00';

  platformElement.innerHTML = `
    <span style="color: ${statusColor};">${statusIcon} ${info.name}</span>
    ${info.supported ? '' : ' - Soporte limitado'}
  `;
  platformElement.style.color = statusColor;
});

// Request platform info on load
document.addEventListener('DOMContentLoaded', () => {
  auraAPI.send('get-platform-info');

  // Verify button event listeners are attached
  console.log('✅ DOM loaded - setting up button event listeners');
  console.log('Settings button:', document.getElementById('settings') ? 'Found' : 'Not found');
  console.log('Calibrate button:', document.getElementById('calibrate') ? 'Found' : 'Not found');
  console.log('Pause button:', document.getElementById('pause') ? 'Found' : 'Not found');
});

// Camera error handler
auraAPI.on('camera-error', (event, errorData) => {
  const cameraStatus = document.getElementById('camera-status');
  cameraStatus.style.display = 'block';
  cameraStatus.style.color = '#ff6b6b';
  cameraStatus.innerHTML = '⚠️ Cámara no disponible - Funciones limitadas';

  console.warn('Camera error displayed to user:', errorData);
});

// Calibration event handlers
auraAPI.on('start-calibration', () => {
  console.log('Calibration started');
  // The button visual feedback is already handled above
});

// Calibration status handler
auraAPI.on('calibration-status', (event, status) => {
  const calibrationStatus = document.getElementById('calibration-status');
  if (status.isCalibrating) {
    calibrationStatus.style.display = 'block';
    calibrationStatus.style.color = '#00ffcc';
    calibrationStatus.innerHTML = '🤖 Calibrando gestos automáticamente...';
  } else if (status.completed) {
    calibrationStatus.style.display = 'block';
    calibrationStatus.style.color = '#00ffcc';
    calibrationStatus.innerHTML = '✅ Calibración completada - Gestos optimizados';
    setTimeout(() => {
      calibrationStatus.style.display = 'none';
    }, 3000);
  }
});

// Settings panel functionality
let currentSettings = {};

document.getElementById('settings').onclick = () => {
  console.log('⚙️ Settings button clicked');
  const panel = document.getElementById('settingsPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  console.log('Settings panel visibility:', panel.style.display);
  if (panel.style.display === 'block') {
    loadCurrentSettings();
  }
};

document.getElementById('closeSettings').onclick = () => {
  document.getElementById('settingsPanel').style.display = 'none';
};

// Real-time slider value updates
const sliders = [
  'dwellTime', 'executionCooldown', 'emergencyTime',
  'stabilityThreshold', 'deadZonePercent',
  'blinkThreshold', 'eyebrowThreshold', 'mouthThreshold',
  'fatigueReduction', 'errorTolerance'
];

sliders.forEach(id => {
  const slider = document.getElementById(id);
  const valueSpan = document.getElementById(id + 'Value');

  if (slider && valueSpan) {
    slider.oninput = () => {
      const value = parseFloat(slider.value);
      const displayValue = id.includes('Percent') ? value :
                          id.includes('Threshold') && id !== 'stabilityThreshold' ? value.toFixed(3) :
                          value;
      valueSpan.textContent = displayValue;
    };
  }
});

function loadCurrentSettings() {
  // Request current profile settings from main process
  auraAPI.send('get-profile-settings');
}

auraAPI.on('profile-settings-loaded', (event, settings) => {
  currentSettings = settings;

  // Update FaceTracker thresholds if available
  if (faceTracker && settings.thresholds) {
    faceTracker.updateThresholds(settings.thresholds);
    console.log('FaceTracker thresholds updated from profile');
  }

  updateSettingsUI(settings);
});

function updateSettingsUI(settings) {
  if (!settings.thresholds) return;

  // Update slider values and displays
  const mappings = {
    dwellTime: 'dwellValue',
    executionCooldown: 'cooldownValue',
    emergencyTime: 'emergencyValue',
    stabilityThreshold: 'stabilityValue',
    deadZonePercent: 'deadZoneValue',
    blinkThreshold: 'blinkValue',
    eyebrowThreshold: 'eyebrowValue',
    mouthThreshold: 'mouthValue'
  };

  Object.keys(mappings).forEach(key => {
    const slider = document.getElementById(key);
    const valueSpan = document.getElementById(mappings[key]);
    if (slider && valueSpan && settings.thresholds[key] !== undefined) {
      slider.value = settings.thresholds[key];
      const displayValue = key === 'deadZonePercent' ? settings.thresholds[key] :
                          ['blinkThreshold', 'eyebrowThreshold', 'mouthThreshold'].includes(key) ?
                          settings.thresholds[key].toFixed(3) : settings.thresholds[key];
      valueSpan.textContent = displayValue;
    }
  });

  // Update adaptive settings
  if (settings.adaptive) {
    document.getElementById('adaptiveEnabled').checked = settings.adaptive.enabled;
    document.getElementById('autoCalibration').checked = settings.adaptive.autoCalibration !== false; // Default true
    document.getElementById('fatigueReduction').value = (settings.adaptive.fatigueReduction * 100) || 80;
    document.getElementById('errorTolerance').value = (settings.adaptive.errorTolerance * 100) || 120;
    document.getElementById('fatigueValue').textContent = (settings.adaptive.fatigueReduction * 100) || 80;
    document.getElementById('toleranceValue').textContent = (settings.adaptive.errorTolerance * 100) || 120;
  }
}

document.getElementById('saveSettings').onclick = () => {
  const newSettings = {
    thresholds: {
      dwellTime: parseInt(document.getElementById('dwellTime').value),
      executionCooldown: parseInt(document.getElementById('executionCooldown').value),
      emergencyTime: parseInt(document.getElementById('emergencyTime').value),
      stabilityThreshold: parseInt(document.getElementById('stabilityThreshold').value),
      deadZonePercent: parseFloat(document.getElementById('deadZonePercent').value) / 100,
      blinkThreshold: parseFloat(document.getElementById('blinkThreshold').value),
      eyebrowThreshold: parseFloat(document.getElementById('eyebrowThreshold').value),
      mouthThreshold: parseFloat(document.getElementById('mouthThreshold').value)
    },
    adaptive: {
      enabled: document.getElementById('adaptiveEnabled').checked,
      autoCalibration: document.getElementById('autoCalibration').checked,
      fatigueReduction: parseFloat(document.getElementById('fatigueReduction').value) / 100,
      errorTolerance: parseFloat(document.getElementById('errorTolerance').value) / 100,
      learningRate: 0.1
    }
  };

  auraAPI.send('save-profile-settings', newSettings);
};

document.getElementById('resetSettings').onclick = () => {
  if (confirm('¿Restablecer configuración a valores predeterminados?')) {
    auraAPI.send('reset-profile-settings');
  }
};

// Emergency pause handler
auraAPI.on('emergency-pause', () => {
  console.log('Emergency pause triggered - stopping all actions');
  if (faceTracker) {
    faceTracker.stop();
  }
  // Visual feedback
  const pauseBtn = document.getElementById('pause');
  if (pauseBtn) {
    const originalText = pauseBtn.textContent;
    pauseBtn.textContent = '⏸️ PAUSADO';
    pauseBtn.style.backgroundColor = '#ff4444';
    setTimeout(() => {
      pauseBtn.textContent = originalText;
      pauseBtn.style.backgroundColor = '';
    }, 2000);
  }
});

// Application closing handler - comprehensive cleanup
auraAPI.on('application-closing', () => {
  console.log('🧹 Application closing signal received - performing renderer cleanup');

  try {
    // Stop face tracker immediately
    if (faceTracker) {
      console.log('🛑 Stopping face tracker...');
      faceTracker.stop();
      faceTracker = null;
    }

    // Clear all timers and intervals
    console.log('🕐 Clearing all timers and intervals...');
    if (typeof window.cleanupAura === 'function') {
      window.cleanupAura();
    }

    // Clear any pending timeouts
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
    }

    // Clear any pending intervals
    const highestIntervalId = setInterval(() => {}, 1000);
    for (let i = 0; i < highestIntervalId; i++) {
      clearInterval(i);
    }

    // Remove all event listeners from DOM elements
    console.log('🔄 Removing event listeners...');
    const buttons = ['settings', 'calibrate', 'pause'];
    buttons.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        const clone = element.cloneNode(true);
        element.parentNode.replaceChild(clone, element);
      }
    });

    // Clear any remaining Aura API listeners
    console.log('🔌 Cleaning up IPC listeners...');
    // Note: auraAPI cleanup is handled by Electron automatically

    console.log('✅ Renderer cleanup completed');

  } catch (error) {
    console.error('❌ Error during renderer cleanup:', error);
  }
});

// Listen for settings saved confirmation
auraAPI.on('settings-saved', () => {
  // Update FaceTracker with new settings immediately
  if (faceTracker) {
    const newThresholds = {
      dwellTime: parseInt(document.getElementById('dwellTime').value),
      executionCooldown: parseInt(document.getElementById('executionCooldown').value),
      emergencyTime: parseInt(document.getElementById('emergencyTime').value),
      stabilityThreshold: parseInt(document.getElementById('stabilityThreshold').value),
      deadZonePercent: parseFloat(document.getElementById('deadZonePercent').value) / 100,
      blinkThreshold: parseFloat(document.getElementById('blinkThreshold').value),
      eyebrowThreshold: parseFloat(document.getElementById('eyebrowThreshold').value),
      mouthThreshold: parseFloat(document.getElementById('mouthThreshold').value)
    };
    faceTracker.updateThresholds(newThresholds);
    console.log('FaceTracker updated with new settings');
  }

  alert('Configuración guardada correctamente');
  document.getElementById('settingsPanel').style.display = 'none';
});

// Also update FaceTracker when settings are reset
auraAPI.on('settings-saved', () => {
  if (faceTracker) {
    // Reset to default thresholds
    const defaultThresholds = {
      dwellTime: 1000,
      stabilityThreshold: 10,
      deadZonePercent: 0.1,
      blinkThreshold: 0.02,
      eyebrowThreshold: 0.05,
      mouthThreshold: 0.03,
      emergencyTime: 2000,
      executionCooldown: 800
    };
    faceTracker.updateThresholds(defaultThresholds);
    console.log('FaceTracker reset to default settings');
  }
});

// Cleanup on window unload
window.addEventListener('beforeunload', () => {
  console.log('🧹 Window unloading, cleaning up...');
  window.cleanupAura();
});

// Store timeouts for cleanup
window.pendingTimeouts = window.pendingTimeouts || [];
const originalSetTimeout = window.setTimeout;
window.setTimeout = function(callback, delay) {
  const id = originalSetTimeout(callback, delay);
  window.pendingTimeouts.push(id);
  return id;
};

// Override clearTimeout to remove from pending list
const originalClearTimeout = window.clearTimeout;
window.clearTimeout = function(id) {
  const index = window.pendingTimeouts.indexOf(id);
  if (index > -1) {
    window.pendingTimeouts.splice(index, 1);
  }
  return originalClearTimeout(id);
};

auraAPI.on('action-executed', (event, message) => {
  const feedback = document.getElementById('feedback');
  feedback.textContent = message;
  feedback.style.display = 'block';
  setTimeout(() => feedback.style.display = 'none', 1500);
});

auraAPI.on('blink-detected', () => {
  if (scanMode) {
    const selectedKey = keys[scanIndex];
    auraAPI.send('type-text', selectedKey);
  }
});
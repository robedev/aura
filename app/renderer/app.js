// Renderer process for Aura
console.log('🚀 Aura renderer loaded');

try {

  let cleanupDone = false;
  let faceTracker = null;

  // Global cleanup function
  window.cleanupAura = function () {
    if (cleanupDone) return;
    cleanupDone = true;
    console.log('🧹 Performing comprehensive Aura cleanup...');

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
    const highestIntervalId = setInterval(() => { }, 1000);
    for (let i = 0; i < highestIntervalId; i++) {
      clearInterval(i);
    }

    // Clear any remaining timeouts by ID
    const highestTimeoutId = setTimeout(() => { }, 0);
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
    console.log('Phase 5: Final verification');
    console.log('Comprehensive Aura cleanup completed');
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
    if (profile.learnings) {
      predictor.loadLearnings(profile.learnings);
    }
    // Onboarding (N3): mostrar el tutorial en el primer arranque
    if (!profile.onboardingCompleted) {
      showOnboarding();
    }
  });

  let isSystemPaused = false;
  const predictor = new PredictionEngine();
  let smartKeyboardState = {
    currentInput: '',
    suggestions: [],
    scanRowIndex: -1,
    scanKeyIndex: -1,
    scanSuggestionIndex: -1, // índice del chip activo cuando se escanea la barra de predicciones
    isScanningRow: true, // true = scan rows, false = scan keys in row
    activeRow: null, // -1 = barra de predicciones, 0..N = fila del teclado
    scanInterval: null
  };

  // Frases comunes para comunicación rápida
  const QUICK_PHRASES = [
    'Hola', 'Gracias', 'Por favor', 'Sí', 'No',
    'Ayuda', 'Bien', 'Mal', '¿Cómo estás?', 'Adiós',
    'Tengo sed', 'Tengo hambre', 'Baño', 'Dolor', 'Llama a'
  ];
  let isPhraseMode = false;
  let scanMode = false;

  // Keyboard Layout: Optimized for frequency (not strictly QWERTY) but familiar
  const KEYBOARD_LAYOUT = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', 'SPACE'],
    ['ENTER', 'BACKSPACE', 'CLEAR', 'SPEAK', 'FRASES']
  ];

  window.onload = async () => {
    // Initialize Predictor with correct path relative to index.html
    await predictor.loadDictionary('data/spanish-dict.json');

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

    renderSmartKeyboard();
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
      const canvas = document.getElementById('canvas');
      if (video) {
        console.log('Starting FaceTracker with video and canvas elements');
        faceTracker.start(video, canvas);
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

  function renderSmartKeyboard() {
    const container = document.getElementById('smartKeyboard');
    container.innerHTML = '';

    // 1. Prediction Bar
    const predictBar = document.createElement('div');
    predictBar.className = 'prediction-bar';
    predictBar.id = 'predictionBar';
    updatePredictionsUI(smartKeyboardState.suggestions || []); 
    container.appendChild(predictBar);

    // 2. Current Input Display
    const inputDisplay = document.createElement('div');
    inputDisplay.className = 'current-input-display';
    inputDisplay.id = 'inputDisplay';
    inputDisplay.textContent = smartKeyboardState.currentInput || '...';
    container.appendChild(inputDisplay);

    // 3. Keyboard Grid or Phrase Grid
    const grid = document.createElement('div');
    grid.className = 'keyboard-grid';
    grid.id = 'keyboardGrid';

    if (isPhraseMode) {
      // Render phrases grid
      // Split phrases into rows of 3 for better visibility
      const rows = [];
      for (let i = 0; i < QUICK_PHRASES.length; i += 3) {
        rows.push(QUICK_PHRASES.slice(i, i + 3));
      }
      // Add back button row
      rows.push(['VOLVER']);

      rows.forEach((rowPhrases, rowIndex) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        rowDiv.id = `row-${rowIndex}`;

        rowPhrases.forEach((phrase, pIndex) => {
          const btn = document.createElement('button');
          btn.className = 'key-btn';
          btn.textContent = phrase;
          btn.style.flex = '1'; // Expand to fill
          
          if (phrase === 'VOLVER') {
             btn.classList.add('action');
             btn.onclick = () => {
               isPhraseMode = false;
               renderSmartKeyboard();
             };
          } else {
             btn.onclick = () => {
               smartKeyboardState.currentInput += phrase + ' ';
               document.getElementById('inputDisplay').textContent = smartKeyboardState.currentInput;
               predictor.learn(phrase);
             };
          }
          const dwellBar = document.createElement('div');
          dwellBar.className = 'dwell-indicator';
          btn.appendChild(dwellBar);
          rowDiv.appendChild(btn);
        });
        grid.appendChild(rowDiv);
      });

    } else {
      // Render standard keyboard
      KEYBOARD_LAYOUT.forEach((rowKeys, rowIndex) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        rowDiv.id = `row-${rowIndex}`;

        rowKeys.forEach((key, keyIndex) => {
          const btn = document.createElement('button');
          btn.className = 'key-btn';
          btn.textContent = key === 'SPACE' ? '␣' : key;
          btn.dataset.key = key;

          // Special styling
          if (['ENTER', 'BACKSPACE', 'CLEAR', 'SPEAK', 'FRASES'].includes(key)) btn.classList.add('action');
          if (key === 'SPACE') btn.classList.add('key-space');
          if (key === 'BACKSPACE') {
            btn.classList.add('key-backspace');
            btn.innerHTML = '⌫';
          }
          if (key === 'ENTER') {
            btn.classList.add('key-enter');
            btn.innerHTML = '↵';
          }

          btn.onclick = () => handleKeyPress(key);
          const dwellBar = document.createElement('div');
          dwellBar.className = 'dwell-indicator';
          btn.appendChild(dwellBar);
          rowDiv.appendChild(btn);
        });

        grid.appendChild(rowDiv);
      });
    }

    container.appendChild(grid);
  }

  function createSuggestionChip(word, isAI = false) {
    const chip = document.createElement('div');
    chip.className = isAI ? 'suggestion-chip ai' : 'suggestion-chip';
    chip.textContent = isAI ? `✨ ${word}` : word;
    chip.onclick = () => handlePredictionSelect(word);
    const dwellBar = document.createElement('div');
    dwellBar.className = 'dwell-indicator';
    chip.appendChild(dwellBar);
    return chip;
  }

  function updatePredictionsUI(suggestions) {
    const bar = document.getElementById('predictionBar');
    if (!bar) return;
    bar.innerHTML = '';

    suggestions.forEach(word => {
      bar.appendChild(createSuggestionChip(word));
    });
  }

  function handleKeyPress(key) {
    const display = document.getElementById('inputDisplay');

    if (key === 'BACKSPACE') {
      smartKeyboardState.currentInput = smartKeyboardState.currentInput.slice(0, -1);
    } else if (key === 'CLEAR') {
      smartKeyboardState.currentInput = '';
    } else if (key === 'SPACE') {
      // Learn last word before space
      const lastWord = smartKeyboardState.currentInput.split(' ').pop();
      if (lastWord) predictor.learn(lastWord);

      smartKeyboardState.currentInput += ' ';
    } else if (key === 'ENTER') {
      auraAPI.send('type-text', smartKeyboardState.currentInput);
      smartKeyboardState.currentInput = '';
    } else if (key === 'SPEAK') {
      auraAPI.send('speak-text', smartKeyboardState.currentInput); 
    } else if (key === 'FRASES') {
      isPhraseMode = true;
      renderSmartKeyboard();
      return; // Stop processing
    } else {
      smartKeyboardState.currentInput += key.toLowerCase();
    }

    // Update Display
    display.textContent = smartKeyboardState.currentInput || '|';

    // Update Predictions
    const words = smartKeyboardState.currentInput.trim().split(' ');
    const currentWord = words[words.length - 1]; // Word being typed

    let suggestions = [];
    if (currentWord && !smartKeyboardState.currentInput.endsWith(' ')) {
      // Predict completion
      suggestions = predictor.predict(currentWord);
    } else {
      // Next word prediction
      suggestions = predictor.predictNextWord(words[words.length - 2] || '');
    }

    smartKeyboardState.suggestions = suggestions;
    updatePredictionsUI(suggestions);

    // Sugerencias IA (N1): pedir refuerzo cuando el predictor local se queda corto
    maybeRequestAISuggestions(suggestions);
  }

  // --- Sugerencias IA (N1) ---
  let aiDebounceTimer = null;

  function maybeRequestAISuggestions(localSuggestions) {
    const text = smartKeyboardState.currentInput;
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    // Solo con 3+ palabras de contexto y menos de 3 sugerencias locales
    if (localSuggestions.length >= 3 || wordCount < 3) return;

    clearTimeout(aiDebounceTimer);
    aiDebounceTimer = setTimeout(() => {
      auraAPI.send('ai-suggest', smartKeyboardState.currentInput);
    }, 600); // debounce: esperar a que el usuario deje de escribir
  }

  auraAPI.on('ai-suggestions', (event, data) => {
    if (!data || !Array.isArray(data.suggestions) || data.suggestions.length === 0) return;
    // Descartar respuestas obsoletas: el usuario siguió escribiendo
    if (data.text !== smartKeyboardState.currentInput) return;

    const bar = document.getElementById('predictionBar');
    if (!bar) return;

    data.suggestions.forEach(word => {
      bar.appendChild(createSuggestionChip(word, true));
    });

    // Incluir en el estado para que el escaneo también recorra los chips IA
    smartKeyboardState.suggestions = smartKeyboardState.suggestions.concat(data.suggestions);
  });

  function handlePredictionSelect(word) {
    const inputs = smartKeyboardState.currentInput.trim().split(' ');

    // Replace current partial word with selected word
    if (!smartKeyboardState.currentInput.endsWith(' ')) {
      inputs.pop(); // Remove partial
    }

    inputs.push(word);
    smartKeyboardState.currentInput = inputs.join(' ') + ' ';

    document.getElementById('inputDisplay').textContent = smartKeyboardState.currentInput;

    // Predict NEXT word immediately
    const nextSuggestions = predictor.predictNextWord(word);
    updatePredictionsUI(nextSuggestions);

    // Learn this usage
    predictor.learn(word);
  }


  // --- New Smart Scanning Logic (Row -> Column) ---

  function startSmartScanning() {
    if (smartKeyboardState.scanInterval) clearInterval(smartKeyboardState.scanInterval);

    smartKeyboardState.isScanningRow = true;
    smartKeyboardState.scanRowIndex = -2; // el primer paso avanza a -1 (barra de predicciones)
    smartKeyboardState.scanKeyIndex = -1;
    smartKeyboardState.scanSuggestionIndex = -1;

    // Período de escaneo sincronizado con el dwellTime del perfil;
    // la variable CSS anima el .dwell-indicator a la misma velocidad
    const scanPeriod = currentSettings?.thresholds?.dwellTime || 1000;
    document.documentElement.style.setProperty('--dwell-duration', `${scanPeriod}ms`);

    smartKeyboardState.scanInterval = setInterval(smartScanStep, scanPeriod);
  }

  function smartScanStep() {
    clearHighlights();

    if (smartKeyboardState.isScanningRow) {
      // Scan Rows + Prediction Bar (Index -1)
      smartKeyboardState.scanRowIndex++;
      // Contar filas desde el DOM: el modo frases tiene distinto número de filas
      const totalRows = document.querySelectorAll('#keyboardGrid .keyboard-row').length;

      // -1 = Prediction Bar, 0..N = Rows
      if (smartKeyboardState.scanRowIndex >= totalRows) {
        smartKeyboardState.scanRowIndex = -1; // Loop back to predictions
      }

      // Saltar la barra de predicciones si no hay sugerencias que seleccionar
      if (smartKeyboardState.scanRowIndex === -1 && smartKeyboardState.suggestions.length === 0) {
        smartKeyboardState.scanRowIndex = 0;
      }

      highlightRow(smartKeyboardState.scanRowIndex);

    } else if (smartKeyboardState.activeRow === -1) {
      // Scan de chips dentro de la barra de predicciones
      const chips = document.querySelectorAll('#predictionBar .suggestion-chip');
      if (chips.length === 0) {
        // Las sugerencias desaparecieron: volver al escaneo de filas
        smartKeyboardState.isScanningRow = true;
        smartKeyboardState.scanRowIndex = -1;
        return;
      }
      smartKeyboardState.scanSuggestionIndex = (smartKeyboardState.scanSuggestionIndex + 1) % chips.length;
      highlightKey(chips[smartKeyboardState.scanSuggestionIndex]);

    } else {
      // Scan Keys in current Row
      const rowKeys = document.querySelectorAll(`#row-${smartKeyboardState.activeRow} .key-btn`);
      if (rowKeys.length === 0) {
        smartKeyboardState.isScanningRow = true;
        smartKeyboardState.scanRowIndex = -1;
        return;
      }
      smartKeyboardState.scanKeyIndex = (smartKeyboardState.scanKeyIndex + 1) % rowKeys.length;

      highlightKey(rowKeys[smartKeyboardState.scanKeyIndex]);
    }
  }

  function stopSmartScanning() {
    if (smartKeyboardState.scanInterval) clearInterval(smartKeyboardState.scanInterval);
    smartKeyboardState.scanInterval = null;
    smartKeyboardState.scanSuggestionIndex = -1;
    clearHighlights();
  }

  // Visual Helpers
  function highlightRow(index) {
    if (index === -1) {
      document.getElementById('predictionBar').classList.add('active'); // Style for active bar
    } else {
      const row = document.getElementById(`row-${index}`);
      if (row) row.classList.add('scanning-active');
    }
  }

  function highlightKey(element) {
    if (element) element.classList.add('scanning-active');
  }

  function clearHighlights() {
    document.querySelectorAll('.scanning-active').forEach(el => el.classList.remove('scanning-active'));
    document.getElementById('predictionBar')?.classList.remove('active');
  }

  // Handle Selection (activación por gesto)
  function handleSmartSelect() {
    if (!scanMode) return;

    if (smartKeyboardState.isScanningRow) {
      // Row Selected -> Switch to Column Scan
      if (smartKeyboardState.scanRowIndex === -1) {
        // Barra de predicciones seleccionada -> escanear los chips individuales
        if (smartKeyboardState.suggestions.length > 0) {
          smartKeyboardState.isScanningRow = false;
          smartKeyboardState.activeRow = -1;
          smartKeyboardState.scanSuggestionIndex = -1;
        }
      } else {
        smartKeyboardState.isScanningRow = false;
        smartKeyboardState.activeRow = smartKeyboardState.scanRowIndex;
        smartKeyboardState.scanKeyIndex = -1; // Reset key index
      }
    } else if (smartKeyboardState.activeRow === -1) {
      // Chip de predicción seleccionado -> insertarlo y reiniciar ciclo
      const chips = document.querySelectorAll('#predictionBar .suggestion-chip');
      const chip = chips[smartKeyboardState.scanSuggestionIndex];
      if (chip) chip.click();

      smartKeyboardState.isScanningRow = true;
      smartKeyboardState.scanRowIndex = -2; // reiniciar desde la barra de predicciones
      smartKeyboardState.scanSuggestionIndex = -1;
    } else {
      // Key Selected -> Type it and return to Row Scan
      const rowKeys = document.querySelectorAll(`#row-${smartKeyboardState.activeRow} .key-btn`);
      const btn = rowKeys[smartKeyboardState.scanKeyIndex];
      if (btn) btn.click();

      // Volver al escaneo de filas empezando por la barra de predicciones,
      // que ahora muestra sugerencias actualizadas para lo recién escrito
      smartKeyboardState.isScanningRow = true;
      smartKeyboardState.scanRowIndex = -2;
      smartKeyboardState.scanKeyIndex = -1;
    }
  }

  document.getElementById('toggleAssistant').onclick = () => {
    const container = document.getElementById('assistantButtons');
    const icon = document.getElementById('assistantToggleIcon');
    const isHidden = container.style.display === 'none';
    
    if (isHidden) {
      container.style.display = 'grid';
      icon.textContent = '▲';
      // Auto-resize window if needed
      if (window.outerHeight < 600) {
        auraAPI.send('resize-window', 900, 800);
      }
    } else {
      container.style.display = 'none';
      icon.textContent = '▼';
    }
  };

  document.getElementById('toggleApps').onclick = () => {
    const container = document.getElementById('appsButtons');
    const icon = document.getElementById('appsToggleIcon');
    const isHidden = container.style.display === 'none';
    
    if (isHidden) {
      container.style.display = 'grid';
      icon.textContent = '▲';
    } else {
      container.style.display = 'none';
      icon.textContent = '▼';
    }
  };
  
  document.getElementById('openBrowser').onclick = () => auraAPI.send('open-app', 'browser');
  document.getElementById('openFiles').onclick = () => auraAPI.send('open-app', 'files');

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

  // --- Wizard de calibración de gestos (M2) ---
  const WIZARD_STEPS = [
    { id: 'neutral', title: 'Paso 1 de 5 · Expresión neutral', instruction: 'Mantén tu rostro relajado, con expresión neutral, mirando a la cámara.' },
    { id: 'eyebrow', title: 'Paso 2 de 5 · Cejas', instruction: 'Levanta las cejas todo lo que puedas y mantenlas arriba.' },
    { id: 'mouth', title: 'Paso 3 de 5 · Boca', instruction: 'Abre la boca ampliamente y mantenla abierta.' },
    { id: 'tiltLeft', title: 'Paso 4 de 5 · Cabeza a la izquierda', instruction: 'Inclina la cabeza hacia tu hombro izquierdo y mantén la posición.' },
    { id: 'tiltRight', title: 'Paso 5 de 5 · Cabeza a la derecha', instruction: 'Inclina la cabeza hacia tu hombro derecho y mantén la posición.' }
  ];
  const WIZARD_STEP_DURATION = 3000;
  const WIZARD_PREP_SECONDS = 2;
  let wizardResults = {};
  let wizardPhase = 'intro'; // 'intro' | 'running' | 'summary'
  let wizardProposedThresholds = null;
  let wizardTimers = [];

  function clearWizardTimers() {
    wizardTimers.forEach(id => {
      clearInterval(id);
      clearTimeout(id);
    });
    wizardTimers = [];
  }

  function openCalibrationWizard() {
    if (!faceTracker) {
      alert('El seguimiento facial no está activo. Inicia la cámara antes de calibrar.');
      return;
    }
    wizardPhase = 'intro';
    wizardResults = {};
    wizardProposedThresholds = null;
    document.getElementById('wizardTitle').textContent = '🧭 Calibración de Gestos';
    document.getElementById('wizardInstruction').textContent =
      'Este asistente medirá el rango de tus gestos para calcular umbrales personalizados. Son 5 pasos de 3 segundos cada uno.';
    document.getElementById('wizardProgress').textContent = '';
    const startBtn = document.getElementById('wizardStart');
    startBtn.textContent = 'COMENZAR';
    startBtn.style.display = '';
    document.getElementById('calibrationWizard').style.display = 'flex';
  }

  function closeCalibrationWizard() {
    clearWizardTimers();
    if (faceTracker) faceTracker.cancelGestureCalibration();
    document.getElementById('calibrationWizard').style.display = 'none';
  }

  function runWizardStep(index) {
    if (index >= WIZARD_STEPS.length) {
      finishWizard();
      return;
    }
    const step = WIZARD_STEPS[index];
    const progress = document.getElementById('wizardProgress');
    document.getElementById('wizardTitle').textContent = step.title;
    document.getElementById('wizardInstruction').textContent = step.instruction;
    document.getElementById('wizardStart').style.display = 'none';

    // Cuenta atrás de preparación antes de medir
    let prepLeft = WIZARD_PREP_SECONDS;
    progress.textContent = `Prepárate... ${prepLeft}`;
    const prepInterval = setInterval(() => {
      prepLeft--;
      if (prepLeft > 0) {
        progress.textContent = `Prepárate... ${prepLeft}`;
        return;
      }
      clearInterval(prepInterval);

      // Fase de medición: FaceTracker recolecta muestras faciales
      let measureLeft = WIZARD_STEP_DURATION / 1000;
      progress.textContent = `Midiendo... ${measureLeft}`;
      const measureInterval = setInterval(() => {
        measureLeft--;
        if (measureLeft > 0) progress.textContent = `Midiendo... ${measureLeft}`;
      }, 1000);
      wizardTimers.push(measureInterval);

      faceTracker.startCalibrationStep(step.id, WIZARD_STEP_DURATION, (result) => {
        clearInterval(measureInterval);
        if (!result) {
          progress.textContent = '⚠️ No se detectó tu rostro. Repitiendo paso...';
          wizardTimers.push(setTimeout(() => runWizardStep(index), 1500));
          return;
        }
        wizardResults[step.id] = result;
        progress.textContent = '✅';
        wizardTimers.push(setTimeout(() => runWizardStep(index + 1), 800));
      });
    }, 1000);
    wizardTimers.push(prepInterval);
  }

  function finishWizard() {
    const baseline = wizardResults.neutral;
    const current = faceTracker.getCurrentThresholds();
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    // Umbral = baseline + 60% del rango detectado. Si un gesto no superó su
    // baseline (no se realizó), se conserva el umbral actual para ese gesto.
    const proposed = {
      eyebrowThreshold: current.eyebrowThreshold,
      mouthThreshold: current.mouthThreshold,
      headTiltThreshold: current.headTiltThreshold
    };

    if (baseline) {
      if (wizardResults.eyebrow && wizardResults.eyebrow.max.eyebrow > baseline.avg.eyebrow) {
        proposed.eyebrowThreshold = clamp(
          baseline.avg.eyebrow + 0.6 * (wizardResults.eyebrow.max.eyebrow - baseline.avg.eyebrow),
          0.08, 0.25
        );
      }
      if (wizardResults.mouth && wizardResults.mouth.max.mouth > baseline.avg.mouth) {
        proposed.mouthThreshold = clamp(
          baseline.avg.mouth + 0.6 * (wizardResults.mouth.max.mouth - baseline.avg.mouth),
          0.05, 0.15
        );
      }
      // La detección compara earYDiff contra el umbral en valor absoluto:
      // usar el mayor rango de ambos lados para un umbral simétrico
      const tiltLeftRange = wizardResults.tiltLeft ? Math.abs(wizardResults.tiltLeft.max.tilt) : 0;
      const tiltRightRange = wizardResults.tiltRight ? Math.abs(wizardResults.tiltRight.min.tilt) : 0;
      const tiltRange = Math.max(tiltLeftRange, tiltRightRange);
      if (tiltRange > 0) {
        proposed.headTiltThreshold = clamp(0.6 * tiltRange, 0.02, 0.2);
      }
    }

    wizardProposedThresholds = proposed;
    wizardPhase = 'summary';

    document.getElementById('wizardTitle').textContent = '✅ Calibración completada';
    document.getElementById('wizardInstruction').innerHTML =
      'Umbrales calculados para ti:<br>' +
      `Cejas: <b>${proposed.eyebrowThreshold.toFixed(3)}</b> · ` +
      `Boca: <b>${proposed.mouthThreshold.toFixed(3)}</b> · ` +
      `Inclinación: <b>${proposed.headTiltThreshold.toFixed(3)}</b>`;
    document.getElementById('wizardProgress').textContent = '';
    const startBtn = document.getElementById('wizardStart');
    startBtn.textContent = '💾 GUARDAR';
    startBtn.style.display = '';
  }

  document.getElementById('calibrateGestures').onclick = openCalibrationWizard;

  document.getElementById('wizardStart').onclick = () => {
    if (wizardPhase === 'intro') {
      wizardPhase = 'running';
      runWizardStep(0);
    } else if (wizardPhase === 'summary' && wizardProposedThresholds) {
      faceTracker.applyCalibratedThresholds(wizardProposedThresholds);
      closeCalibrationWizard();
      alert('Umbrales calibrados guardados correctamente');
    }
  };

  document.getElementById('wizardCancel').onclick = closeCalibrationWizard;

  // --- Onboarding wizard (N3): tutorial guiado de primer arranque ---
  const ONBOARDING_GESTURES = [
    { id: 'eyebrowRaise', label: 'Levanta las cejas' },
    { id: 'mouthOpen', label: 'Abre la boca' },
    { id: 'headTiltLeft', label: 'Inclina la cabeza a la izquierda' },
    { id: 'headTiltRight', label: 'Inclina la cabeza a la derecha' }
  ];

  // Acciones propuestas en el paso 5, en orden de utilidad. El click izquierdo
  // ya es nativo (mouthOpen en la máquina de estados), por eso no se propone.
  const ONBOARDING_RULE_ACTIONS = [
    { action: 'right-click', label: 'Click derecho' },
    { action: 'scroll-down', label: 'Scroll abajo' },
    { action: 'scroll-up', label: 'Scroll arriba' }
  ];

  // Variantes sostenidas para las reglas: menos falsos positivos en uso real
  const ONBOARDING_GESTURE_FOR_RULE = {
    eyebrowRaise: 'eyebrowRaise',
    headTiltLeft: 'headTiltLeftSustained',
    headTiltRight: 'headTiltRightSustained'
  };

  let onboardingStep = 0;
  let onboardingGestureOrder = []; // orden en que el usuario logró cada gesto (comodidad)
  let onboardingPollInterval = null;
  let onboardingCountdownInterval = null;

  function clearOnboardingTimers() {
    if (onboardingPollInterval) clearInterval(onboardingPollInterval);
    if (onboardingCountdownInterval) clearInterval(onboardingCountdownInterval);
    onboardingPollInterval = null;
    onboardingCountdownInterval = null;
  }

  function renderOnboardingDots() {
    const dots = document.getElementById('onboardingSteps');
    dots.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const dot = document.createElement('div');
      dot.className = 'onboarding-step-dot' + (i === onboardingStep ? ' active' : '');
      dots.appendChild(dot);
    }
  }

  function showOnboarding() {
    onboardingStep = 0;
    onboardingGestureOrder = [];
    document.getElementById('onboardingOverlay').style.display = 'flex';
    renderOnboardingStep();
  }

  function finishOnboarding() {
    clearOnboardingTimers();
    document.getElementById('onboardingOverlay').style.display = 'none';
    auraAPI.send('onboarding-completed');
  }

  function renderOnboardingStep() {
    clearOnboardingTimers();
    renderOnboardingDots();
    const title = document.getElementById('onboardingTitle');
    const body = document.getElementById('onboardingBody');
    const nextBtn = document.getElementById('onboardingNext');
    nextBtn.style.display = '';
    nextBtn.textContent = 'SIGUIENTE →';

    switch (onboardingStep) {
      case 0: // Bienvenida
        title.textContent = '👋 Bienvenido a Aura';
        body.innerHTML =
          '<p>Aura te permite controlar el ordenador con <b>gestos faciales</b>: ' +
          'mueve el cursor con la cabeza, haz click abriendo la boca y ejecuta ' +
          'acciones con las cejas o inclinando la cabeza.</p>' +
          '<p>Este tutorial te guiará en <b>4 pasos</b> para dejarlo todo configurado.</p>';
        break;

      case 1: // Posición de cámara con detección en vivo
        title.textContent = '📹 Posición de la cámara';
        body.innerHTML =
          '<p>Colócate frente a la cámara con el rostro centrado en el encuadre ' +
          'y buena iluminación frontal.</p>' +
          '<p id="onboardingFaceStatus" style="font-weight: bold;">Buscando tu rostro...</p>';
        onboardingPollInterval = setInterval(() => {
          const status = document.getElementById('onboardingFaceStatus');
          if (!status) return;
          if (faceTracker && faceTracker.state !== 'inactive') {
            status.textContent = '✅ Rostro detectado correctamente';
            status.style.color = '#00ffcc';
          } else {
            status.textContent = '🔍 Buscando tu rostro...';
            status.style.color = '#ffaa00';
          }
        }, 300);
        break;

      case 2: // Calibración de posición neutral
        title.textContent = '🎯 Calibración de posición neutral';
        body.innerHTML =
          '<p>Mira al centro de la pantalla con la cabeza en tu posición ' +
          'natural de descanso y mantenla durante la cuenta atrás.</p>' +
          '<div class="onboarding-countdown" id="onboardingCountdown">3</div>';
        nextBtn.style.display = 'none';
        auraAPI.send('calibrate');
        let countdown = 3;
        onboardingCountdownInterval = setInterval(() => {
          countdown--;
          const el = document.getElementById('onboardingCountdown');
          if (!el) return;
          if (countdown > 0) {
            el.textContent = countdown;
          } else {
            clearInterval(onboardingCountdownInterval);
            el.textContent = '✅';
            setTimeout(() => { onboardingStep++; renderOnboardingStep(); }, 800);
          }
        }, 1000);
        break;

      case 3: // Prueba de gestos con feedback en vivo
        title.textContent = '🎭 Prueba tus gestos';
        body.innerHTML =
          '<p>Realiza cada gesto de la lista. Se marcarán al detectarse:</p>' +
          '<ul class="gesture-checklist" id="gestureChecklist">' +
          ONBOARDING_GESTURES.map(g =>
            `<li id="onb-gesture-${g.id}">⬜ ${g.label}</li>`
          ).join('') +
          '</ul>';
        onboardingPollInterval = setInterval(() => {
          if (!faceTracker || !faceTracker.lastGestures) return;
          ONBOARDING_GESTURES.forEach(g => {
            if (faceTracker.lastGestures[g.id] && !onboardingGestureOrder.includes(g.id)) {
              onboardingGestureOrder.push(g.id);
              const li = document.getElementById(`onb-gesture-${g.id}`);
              if (li) {
                li.textContent = `✅ ${g.label}`;
                li.classList.add('done');
              }
            }
          });
        }, 200);
        break;

      case 4: { // Reglas iniciales según los gestos más cómodos
        title.textContent = '⚡ Reglas recomendadas';
        // Ranking de comodidad: orden en que logró cada gesto (sin mouthOpen,
        // que ya es el click nativo). Fallback si no probó ninguno.
        const ranked = onboardingGestureOrder.filter(g => g !== 'mouthOpen');
        if (ranked.length === 0) ranked.push('eyebrowRaise', 'headTiltLeft', 'headTiltRight');

        const proposedRules = ranked.slice(0, 3).map((gestureId, i) => ({
          gesture: ONBOARDING_GESTURE_FOR_RULE[gestureId] || gestureId,
          gestureLabel: gestureTranslations[ONBOARDING_GESTURE_FOR_RULE[gestureId] || gestureId] || gestureId,
          ...ONBOARDING_RULE_ACTIONS[i]
        }));

        body.innerHTML =
          '<p>Según los gestos que te resultaron más cómodos, te proponemos estas reglas:</p>' +
          '<ul class="proposed-rules">' +
          proposedRules.map(r => `<li>${r.gestureLabel} → <b>${r.label}</b></li>`).join('') +
          '</ul>' +
          '<p style="font-size: 0.85rem; opacity: 0.7;">Podrás modificarlas en cualquier momento desde el panel de reglas.</p>';

        nextBtn.textContent = '✅ APLICAR Y TERMINAR';
        nextBtn.onclick = () => {
          proposedRules.forEach(r => {
            auraAPI.send('add-rule', { gesture: r.gesture, action: r.action, param: '', priority: 0 });
          });
          finishOnboarding();
          // Restaurar el handler estándar del botón
          nextBtn.onclick = onboardingNextHandler;
        };
        break;
      }
    }
  }

  function onboardingNextHandler() {
    onboardingStep++;
    if (onboardingStep > 4) {
      finishOnboarding();
    } else {
      renderOnboardingStep();
    }
  }

  document.getElementById('onboardingNext').onclick = onboardingNextHandler;
  document.getElementById('onboardingSkip').onclick = finishOnboarding;

  document.getElementById('pause').onclick = () => {
    console.log('⏯️ Pause/Resume button clicked');

    if (isSystemPaused) {
      // Resume
      console.log('▶️ Resuming system...');
      const video = document.getElementById('video');
      if (video && faceTracker) {
        faceTracker.start(video);
        isSystemPaused = false;
        auraAPI.send('tts-announce', 'resumed');

        // Update UI
        const pauseBtn = document.getElementById('pause');
        pauseBtn.textContent = 'PAUSA';
        pauseBtn.style.backgroundColor = '';
        pauseBtn.style.color = '#ff4444';
        pauseBtn.style.borderColor = '#ff4444';
      }
    } else {
      // Pause
      console.log('⏸️ Pausing system...');
      auraAPI.send('pause');
      // UI update is handled by emergency-pause listener
    }
  };
  document.getElementById('undo').onclick = () => auraAPI.send('undo');

  document.getElementById('toggleScan').onclick = () => {
    scanMode = !scanMode;
    const btn = document.getElementById('toggleScan');
    if (scanMode) {
      startSmartScanning();
      btn.textContent = 'DETENER ESCANEO';
    } else {
      stopSmartScanning();
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

  // Minimal mode toggle
  let isMinimalMode = false;

  document.getElementById('minimalMode').onclick = () => {
    console.log('🔲 Minimal mode button clicked');
    auraAPI.send('toggle-minimal-mode');
  };

  document.getElementById('exitMinimalMode').onclick = () => {
    console.log('🔳 Exit minimal mode clicked');
    auraAPI.send('toggle-minimal-mode');
  };

  // Listen for minimal mode changes
  auraAPI.on('minimal-mode-changed', (event, minimal) => {
    isMinimalMode = minimal;
    const minimalBtn = document.getElementById('minimalMode');
    
    if (minimal) {
      document.body.classList.add('minimal-mode');
      minimalBtn.textContent = '🔳';
      minimalBtn.title = 'Modo completo';
      console.log('✅ Minimal mode activated');
    } else {
      document.body.classList.remove('minimal-mode');
      minimalBtn.textContent = '🔲';
      minimalBtn.title = 'Modo minimalista - Solo cámara';
      console.log('✅ Full mode activated');
    }
  });

  // Double-click on video to toggle minimal mode
  document.getElementById('video').addEventListener('dblclick', () => {
    auraAPI.send('toggle-minimal-mode');
  });

  // Handle action select change to show/hide text input
  document.getElementById('actionSelect').onchange = (e) => {
    const textInput = document.getElementById('actionParam');
    textInput.style.display = e.target.value === 'type' ? 'block' : 'none';
  };

  // Poblar el selector de gesto alternativo (OR) con los mismos gestos del principal
  const orSelect = document.getElementById('gestureSelectOr');
  Array.from(document.getElementById('gestureSelect').options).forEach(opt => {
    orSelect.add(new Option(`O: ${opt.text}`, opt.value));
  });

  // Slider de prioridad de regla
  document.getElementById('rulePriority').oninput = (e) => {
    document.getElementById('rulePriorityValue').textContent = e.target.value;
  };

  document.getElementById('addRule').onclick = () => {
    const gesture = document.getElementById('gestureSelect').value;
    const action = document.getElementById('actionSelect').value;
    const param = action === 'type' ? document.getElementById('actionParam').value : '';
    const orGesture = document.getElementById('gestureSelectOr').value;
    const priority = parseInt(document.getElementById('rulePriority').value) || 0;

    // Validation
    if (action === 'type' && !param.trim()) {
      alert('Por favor ingrese el texto a escribir');
      return;
    }

    const rule = { gesture, action, param, priority };
    // Gesto alternativo seleccionado: la regla se activa con cualquiera de los dos (OR)
    if (orGesture && orGesture !== gesture) {
      rule.anyOf = [gesture, orGesture];
    }
    auraAPI.send('add-rule', rule);

    // Clear inputs
    if (action === 'type') {
      document.getElementById('actionParam').value = '';
    }
    document.getElementById('gestureSelectOr').value = '';
    document.getElementById('rulePriority').value = 0;
    document.getElementById('rulePriorityValue').textContent = '0';
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

  // Gesture descriptions for better UI
  const gestureTranslations = {
    'dwellGaze': 'Mirada fija',
    'eyebrowRaise': 'Levantar cejas',
    'eyebrowRaiseLeft': 'Levantar ceja izq',
    'eyebrowRaiseRight': 'Levantar ceja der',
    'mouthOpen': 'Abrir boca',
    'mouthOpenSustained': 'Abrir boca (sostenido)',
    'headTiltLeft': 'Inclinar cabeza izq',
    'headTiltRight': 'Inclinar cabeza der',
    'headTiltLeftSustained': 'Inclinación izq (sostenida)',
    'headTiltRightSustained': 'Inclinación der (sostenida)',
    'smileLeft': 'Sonrisa leve izq',
    'smileRight': 'Sonrisa leve der',
    'dwellPlusEyebrowRaise': 'Mirada + Ceja',
    'dwellPlusMouthOpen': 'Mirada + Boca',
    'gazeUp': 'Mirar arriba',
    'gazeExtremeLeft': 'Mirada extrema izq',
    'gazeExtremeRight': 'Mirada extrema der',
    'pauseCompound': 'Gesto pausa'
  };

  function updateRulesList(rules) {
    const list = document.getElementById('rulesList');
    list.innerHTML = '';
    rules.forEach((rule, index) => {
      const li = document.createElement('li');
      li.className = 'rule-item';
      const actionDesc = actionDescriptions[rule.action] || rule.action;
      const gestureDesc = Array.isArray(rule.anyOf) && rule.anyOf.length > 0
        ? rule.anyOf.map(g => gestureTranslations[g] || g).join(' Ó ')
        : (gestureTranslations[rule.gesture] || rule.gesture);
      const paramText = rule.param ? ` "${rule.param}"` : '';
      const prioText = rule.priority ? ` [P${rule.priority}]` : '';
      li.textContent = `${gestureDesc} → ${actionDesc}${paramText}${prioText}`;

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

    let inputToolInfo = '';
    if (info.inputTool) {
      const toolOk = info.inputTool.includes('✓');
      inputToolInfo = ` | <span style="color: ${toolOk ? '#00ffcc' : '#ff6b6b'};">${info.inputTool}</span>`;
    }

    platformElement.innerHTML = `
    <span style="color: ${statusColor};">${statusIcon} ${info.name}</span>
    ${info.supported ? '' : ' - Soporte limitado'}${inputToolInfo}
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

  // Keyboard Toggle Logic
  document.getElementById('toggleKeyboard').onclick = () => {
    const keyboardContainer = document.getElementById('smartKeyboard');
    const toggleBtn = document.getElementById('toggleKeyboard');
    const isHidden = keyboardContainer.style.display === 'none' || !keyboardContainer.style.display;

    if (isHidden) {
      keyboardContainer.style.display = 'flex';
      toggleBtn.style.backgroundColor = '';
      toggleBtn.style.color = 'var(--accent, #00ffcc)';
    } else {
      keyboardContainer.style.display = 'none';
      toggleBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      toggleBtn.style.color = '#888';
    }
  };

  // Set initial button style (keyboard is hidden by default)
  const toggleBtn = document.getElementById('toggleKeyboard');
  toggleBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
  toggleBtn.style.color = '#888';

  document.getElementById('settings').onclick = () => {
    console.log('⚙️ Settings button clicked');
    const panel = document.getElementById('settingsPanel');
    const isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? 'block' : 'none';

    if (isHidden) {
      // Opening settings - Expand window
      loadCurrentSettings();
      auraAPI.send('resize-window', 900, 1000);
    } else {
      // Closing settings - Restore window
      auraAPI.send('resize-window', 900, 700);
    }
  };

  document.getElementById('closeSettings').onclick = () => {
    document.getElementById('settingsPanel').style.display = 'none';
    auraAPI.send('resize-window', 900, 700);
  };

  // Real-time slider value updates
  const sliders = [
    'dwellTime', 'executionCooldown', 'emergencyTime',
    'mouseSensitivity', 'stabilityThreshold', 'deadZonePercent',
    'headTiltThreshold', 'eyebrowThreshold', 'mouthThreshold',
    'fatigueReduction', 'errorTolerance'
  ];

  sliders.forEach(id => {
    const slider = document.getElementById(id);
    const valueSpan = document.getElementById(id + 'Value');

    if (slider && valueSpan) {
      slider.oninput = () => {
        const value = parseFloat(slider.value);
        let displayValue;
        if (id === 'mouseSensitivity') {
          displayValue = value.toFixed(1);
          // Update FaceTracker sensitivity in real-time
          if (faceTracker) {
            faceTracker.updateSensitivity(value);
          }
        } else if (id.includes('Percent')) {
          displayValue = value;
        } else if (id.includes('Threshold') && id !== 'stabilityThreshold') {
          displayValue = value.toFixed(3);
        } else {
          displayValue = value;
        }
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
      mouseSensitivity: 'mouseSensitivityValue',
      stabilityThreshold: 'stabilityValue',
      deadZonePercent: 'deadZoneValue',
      headTiltThreshold: 'headTiltValue',
      eyebrowThreshold: 'eyebrowValue',
      mouthThreshold: 'mouthValue'
    };

    Object.keys(mappings).forEach(key => {
      const slider = document.getElementById(key);
      const valueSpan = document.getElementById(mappings[key]);
      if (slider && valueSpan && settings.thresholds[key] !== undefined) {
        slider.value = settings.thresholds[key];
        let displayValue;
        if (key === 'mouseSensitivity') {
          displayValue = settings.thresholds[key].toFixed(1);
        } else if (key === 'deadZonePercent') {
          // Convert decimal to percentage for display
          displayValue = Math.round(settings.thresholds[key] * 100);
          slider.value = displayValue;
        } else if (['blinkThreshold', 'eyebrowThreshold', 'mouthThreshold', 'headTiltThreshold'].includes(key)) {
          displayValue = settings.thresholds[key].toFixed(3);
        } else {
          displayValue = settings.thresholds[key];
        }
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
        mouseSensitivity: parseFloat(document.getElementById('mouseSensitivity').value),
        stabilityThreshold: parseInt(document.getElementById('stabilityThreshold').value),
        deadZonePercent: parseFloat(document.getElementById('deadZonePercent').value) / 100,
        headTiltThreshold: parseFloat(document.getElementById('headTiltThreshold').value),
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

    isSystemPaused = true;

    // Visual feedback - Persistent state
    const pauseBtn = document.getElementById('pause');
    if (pauseBtn) {
      pauseBtn.textContent = '▶ REANUDAR';
      pauseBtn.style.backgroundColor = '#00ffcc'; // Green for resume
      pauseBtn.style.color = '#000';
      pauseBtn.style.borderColor = '#00ffcc';
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
      const highestTimeoutId = setTimeout(() => { }, 0);
      for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
      }

      // Clear any pending intervals
      const highestIntervalId = setInterval(() => { }, 1000);
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
        mouseSensitivity: parseFloat(document.getElementById('mouseSensitivity').value),
        stabilityThreshold: parseInt(document.getElementById('stabilityThreshold').value),
        deadZonePercent: parseFloat(document.getElementById('deadZonePercent').value) / 100,
        headTiltThreshold: parseFloat(document.getElementById('headTiltThreshold').value),
        eyebrowThreshold: parseFloat(document.getElementById('eyebrowThreshold').value),
        mouthThreshold: parseFloat(document.getElementById('mouthThreshold').value)
      };
      faceTracker.updateThresholds(newThresholds);
      faceTracker.updateSensitivity(newThresholds.mouseSensitivity);
      console.log('FaceTracker updated with new settings');
    }

    alert('Configuración guardada correctamente');
    document.getElementById('settingsPanel').style.display = 'none';
    auraAPI.send('resize-window', 900, 700);
  });

  // Actualizar FaceTracker y formulario cuando se restablece la configuración
  auraAPI.on('settings-reset', () => {
    const defaultThresholds = {
      dwellTime: 1000,
      stabilityThreshold: 10,
      deadZonePercent: 0.03,
      headTiltThreshold: 0.15,
      eyebrowThreshold: 0.15,
      mouthThreshold: 0.08,
      emergencyTime: 2000,
      executionCooldown: 800,
      mouseSensitivity: 3.0
    };
    if (faceTracker) {
      faceTracker.updateThresholds(defaultThresholds);
      console.log('✅ FaceTracker restablecido a valores predeterminados');
    }
    // Actualizar valores del formulario si el panel de ajustes está abierto
    const fieldMap = {
      dwellTime: 'dwellValue',
      executionCooldown: 'executionCooldownValue',
      emergencyTime: 'emergencyTimeValue',
      mouseSensitivity: 'mouseSensitivityValue',
      stabilityThreshold: 'stabilityThresholdValue',
      deadZonePercent: 'deadZonePercentValue',
      headTiltThreshold: 'headTiltThresholdValue',
      eyebrowThreshold: 'eyebrowThresholdValue',
      mouthThreshold: 'mouthThresholdValue'
    };
    Object.entries(fieldMap).forEach(([field, displayId]) => {
      const input = document.getElementById(field);
      const display = document.getElementById(displayId);
      if (input && defaultThresholds[field] !== undefined) {
        const val = field === 'deadZonePercent'
          ? (defaultThresholds[field] * 100).toFixed(1)
          : defaultThresholds[field];
        input.value = val;
        if (display) display.textContent = val;
      }
    });
    alert('Configuración restablecida a valores predeterminados');
    document.getElementById('settingsPanel').style.display = 'none';
    auraAPI.send('resize-window', 900, 700);
  });

  // --- Panel de estadísticas de uso (M6) ---

  function renderStatsPanel() {
    const content = document.getElementById('statsContent');
    const stats = faceTracker ? faceTracker.usageStats : null;
    const history = currentSettings?.calibration?.adaptationHistory || [];
    const learnings = predictor.getLearnings ? predictor.getLearnings() : { words: [] };

    const sessionMinutes = stats ? Math.max(1, Math.round((Date.now() - stats.sessionStartTime) / 60000)) : 0;
    const total = stats ? stats.totalActions : 0;
    const accidental = stats ? stats.accidentalActivations : 0;
    const accidentalRate = total > 0 ? Math.round((accidental / total) * 100) : 0;
    const fatigue = stats ? Math.round(stats.fatigueLevel * 100) : 0;

    // Top 5 de acciones de la sesión actual
    const freq = {};
    (stats?.actionHistory || []).forEach(a => { freq[a.action] = (freq[a.action] || 0) + 1; });
    const topActions = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxCount = topActions.length ? topActions[0][1] : 1;

    const recentWords = (learnings.words || []).slice(-10).reverse();

    content.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><h4>⏱ Sesión actual</h4><p>${sessionMinutes} min</p></div>
        <div class="stat-card"><h4>⚡ Acciones</h4><p>${total}</p></div>
        <div class="stat-card"><h4>⚠️ Accidentales</h4><p>${accidentalRate}%</p></div>
        <div class="stat-card"><h4>😴 Fatiga</h4><p>${fatigue}%</p></div>
      </div>
      <div class="stats-section">
        <h4>Acciones más ejecutadas (sesión actual)</h4>
        ${topActions.length
          ? '<ul>' + topActions.map(([action, count]) =>
              `<li>${action}: ${count}<span class="stats-bar" style="width: ${Math.round((count / maxCount) * 120)}px"></span></li>`
            ).join('') + '</ul>'
          : '<p style="opacity: 0.6;">Sin acciones registradas todavía en esta sesión.</p>'}
      </div>
      <div class="stats-section">
        <h4>Palabras aprendidas recientes (teclado inteligente)</h4>
        <p>${recentWords.length ? recentWords.join(', ') : '<span style="opacity: 0.6;">Ninguna todavía.</span>'}</p>
      </div>
      <div class="stats-section">
        <h4>Historial de adaptación</h4>
        <p>${history.length} registro(s) de sesiones anteriores</p>
      </div>
    `;

    drawThresholdChart(history);
  }

  function drawThresholdChart(history) {
    const canvas = document.getElementById('statsChart');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const points = history
      .map(h => h.adaptiveThresholds?.dwellTime)
      .filter(v => typeof v === 'number');

    ctx.font = '12px sans-serif';
    if (points.length < 2) {
      ctx.fillStyle = 'rgba(224, 224, 255, 0.5)';
      ctx.fillText('Sin historial suficiente para el gráfico (se genera con el uso)', 20, canvas.height / 2);
      return;
    }

    const pad = 35;
    const w = canvas.width - pad * 2;
    const h = canvas.height - pad * 2;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;

    // Ejes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, pad + h);
    ctx.lineTo(pad + w, pad + h);
    ctx.stroke();

    // Etiquetas min/max
    ctx.fillStyle = 'rgba(224, 224, 255, 0.6)';
    ctx.fillText(`${Math.round(max)}ms`, 2, pad + 4);
    ctx.fillText(`${Math.round(min)}ms`, 2, pad + h);

    // Línea de evolución del dwell time
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((v, i) => {
      const x = pad + (i / (points.length - 1)) * w;
      const y = pad + h - ((v - min) / range) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  document.getElementById('statsBtn').onclick = () => {
    const panel = document.getElementById('statsPanel');
    const isHidden = panel.style.display === 'none' || !panel.style.display;
    if (isHidden) {
      auraAPI.send('get-profile-settings'); // refrescar adaptationHistory
      renderStatsPanel();
      panel.style.display = 'block';
      auraAPI.send('resize-window', 900, 1000);
    } else {
      panel.style.display = 'none';
      auraAPI.send('resize-window', 900, 700);
    }
  };

  document.getElementById('closeStats').onclick = () => {
    document.getElementById('statsPanel').style.display = 'none';
    auraAPI.send('resize-window', 900, 700);
  };

  // --- Multi-perfil (M5) ---

  auraAPI.on('profiles-list', (event, data) => {
    const select = document.getElementById('profileSelect');
    select.innerHTML = '';
    data.profiles.forEach(name => select.add(new Option(name, name)));
    select.value = data.current;
  });

  document.getElementById('profileSelect').onchange = (e) => {
    auraAPI.send('switch-profile', e.target.value);
  };

  document.getElementById('newProfile').onclick = () => {
    const name = prompt('Nombre del nuevo perfil (ej. Trabajo, Hogar, Terapia):');
    if (name && name.trim()) {
      auraAPI.send('create-profile', name.trim());
    }
  };

  auraAPI.send('list-profiles');

  // --- Exportar/importar perfiles (N6) ---

  document.getElementById('exportProfile').onclick = () => auraAPI.send('export-profile');

  document.getElementById('importProfile').onclick = () => {
    if (confirm('Importar reemplazará la configuración del perfil actual. ¿Continuar?')) {
      auraAPI.send('import-profile');
    }
  };

  // --- Acciones de plugins (N4) ---

  auraAPI.on('plugin-actions', (event, actions) => {
    const select = document.getElementById('actionSelect');
    actions.forEach(a => {
      if (![...select.options].some(opt => opt.value === a.id)) {
        select.add(new Option(a.label, a.id));
      }
      actionDescriptions[a.id] = a.label; // para mostrar en la lista de reglas
    });
    if (actions.length > 0) console.log(`🔌 ${actions.length} acción(es) de plugin disponibles`);
  });

  auraAPI.send('get-plugin-actions');

  // --- Eye-spelling (N2, experimental) ---

  const EYE_GRID = [
    ['A', 'B', 'C', 'D', 'E', 'F'],
    ['G', 'H', 'I', 'J', 'K', 'L'],
    ['M', 'N', 'O', 'P', 'Q', 'R'],
    ['S', 'T', 'U', 'V', 'W', 'X'],
    ['Y', 'Z', 'Ñ', '␣', '⌫', '✕']
  ];
  const EYE_CAL_POINTS = [
    { x: 0.1, y: 0.15 }, { x: 0.5, y: 0.15 }, { x: 0.9, y: 0.15 },
    { x: 0.1, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.9, y: 0.5 },
    { x: 0.1, y: 0.85 }, { x: 0.5, y: 0.85 }, { x: 0.9, y: 0.85 }
  ];
  const EYE_DWELL_MS = 1500;
  let eyeSpellingLoop = null;
  let eyeDwell = { key: null, start: 0 };
  let eyeText = '';

  function startEyeSpelling() {
    if (!faceTracker) {
      alert('El seguimiento facial no está activo. Inicia la cámara antes de usar el deletreo.');
      return;
    }
    eyeText = '';
    document.getElementById('eyeSpellingText').textContent = '';
    document.getElementById('eyeSpellingOverlay').style.display = 'flex';
    faceTracker.setEyeSpellingActive(true);
    runEyeCalibration();
  }

  function stopEyeSpelling() {
    if (eyeSpellingLoop) clearInterval(eyeSpellingLoop);
    eyeSpellingLoop = null;
    if (faceTracker) faceTracker.setEyeSpellingActive(false);
    document.getElementById('eyeSpellingOverlay').style.display = 'none';

    // Volcar el texto deletreado al teclado inteligente
    if (eyeText.trim()) {
      smartKeyboardState.currentInput += eyeText;
      const display = document.getElementById('inputDisplay');
      if (display) display.textContent = smartKeyboardState.currentInput;
    }
  }

  function runEyeCalibration() {
    const stage = document.getElementById('eyeSpellingStage');
    stage.innerHTML =
      '<div class="eye-cal-message">👁 <b>Calibración ocular</b><br>' +
      'Sigue el punto con la mirada, <b>sin mover la cabeza</b>.<br>' +
      '<span id="eyeCalProgress" style="color: var(--accent, #00ffcc); font-weight: bold;">Punto 1 de 9</span></div>' +
      '<div class="eye-cal-dot" id="eyeCalDot" style="left: 50%; top: 65%;"></div>';

    const pairs = [];
    let pointIndex = 0;
    let retried = false;

    const nextPoint = () => {
      if (!faceTracker || !faceTracker.eyeSpellingActive) return; // overlay cerrado
      if (pointIndex >= EYE_CAL_POINTS.length) {
        finishEyeCalibration(pairs);
        return;
      }
      const point = EYE_CAL_POINTS[pointIndex];
      const dot = document.getElementById('eyeCalDot');
      const progressEl = document.getElementById('eyeCalProgress');
      if (!dot) return;
      if (progressEl) progressEl.textContent = `Punto ${pointIndex + 1} de ${EYE_CAL_POINTS.length}`;
      dot.style.left = `${point.x * 100}%`;
      dot.style.top = `${point.y * 100}%`;
      dot.classList.remove('measuring');

      // 1s para que la mirada llegue al punto, luego 1.5s de medición
      setTimeout(() => {
        const dotCheck = document.getElementById('eyeCalDot');
        if (!dotCheck || !faceTracker.eyeSpellingActive) return;
        dotCheck.classList.add('measuring');
        faceTracker.startEyeCalibrationPoint(point, 1500, (result) => {
          if (result) {
            pairs.push(result);
            retried = false;
            pointIndex++;
          } else if (!retried) {
            // Sin mirada detectada: reintentar este punto una vez
            retried = true;
            const p = document.getElementById('eyeCalProgress');
            if (p) p.textContent = '⚠️ Mirada no detectada, repitiendo punto...';
          } else {
            // Segundo fallo: saltar el punto (buildEyeMapping exige mínimo 6)
            retried = false;
            pointIndex++;
          }
          nextPoint();
        });
      }, 1000);
    };

    nextPoint();
  }

  function finishEyeCalibration(pairs) {
    const mapping = faceTracker.buildEyeMapping(pairs);
    if (mapping) {
      renderEyeGrid();
      return;
    }
    // Calibración fallida: explicar causa y ofrecer reintento sin salir del modo
    const stage = document.getElementById('eyeSpellingStage');
    stage.innerHTML =
      '<div class="eye-cal-message">❌ <b>Calibración insuficiente</b><br>' +
      `${pairs.length} de ${EYE_CAL_POINTS.length} puntos válidos, o la mirada varió muy poco entre puntos.<br><br>` +
      'Consejos:<br>' +
      '· Acércate a la cámara (rostro grande y centrado)<br>' +
      '· Ilumina tu cara de frente, sin contraluz<br>' +
      '· Mueve <b>solo los ojos</b>, no la cabeza<br><br>' +
      '<button id="eyeCalRetry">🔄 REINTENTAR CALIBRACIÓN</button></div>';
    document.getElementById('eyeCalRetry').onclick = runEyeCalibration;
  }

  function renderEyeGrid() {
    const stage = document.getElementById('eyeSpellingStage');
    stage.innerHTML = '';
    EYE_GRID.forEach(row => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'eye-grid-row';
      row.forEach(key => {
        const cell = document.createElement('div');
        cell.className = 'eye-grid-cell';
        cell.dataset.key = key;
        cell.textContent = key;
        const progress = document.createElement('div');
        progress.className = 'eye-cell-progress';
        cell.appendChild(progress);
        rowDiv.appendChild(cell);
      });
      stage.appendChild(rowDiv);
    });

    eyeDwell = { key: null, start: 0 };
    eyeSpellingLoop = setInterval(eyeSpellingStep, 100);
  }

  function eyeSpellingStep() {
    const pos = faceTracker ? faceTracker.getGazeScreenPosition() : null;
    if (!pos) return;

    const col = Math.min(EYE_GRID[0].length - 1, Math.floor(pos.x * EYE_GRID[0].length));
    const row = Math.min(EYE_GRID.length - 1, Math.floor(pos.y * EYE_GRID.length));
    const key = EYE_GRID[row][col];
    const cells = document.querySelectorAll('.eye-grid-cell');

    cells.forEach(cell => {
      const active = cell.dataset.key === key;
      cell.classList.toggle('gazed', active);
      if (!active) {
        const progress = cell.querySelector('.eye-cell-progress');
        if (progress) progress.style.transform = 'scaleX(0)';
      }
    });

    const now = Date.now();
    if (eyeDwell.key !== key) {
      eyeDwell = { key, start: now };
    }
    const elapsed = now - eyeDwell.start;
    const activeCell = [...cells].find(cell => cell.dataset.key === key);
    const activeProgress = activeCell ? activeCell.querySelector('.eye-cell-progress') : null;
    if (activeProgress) {
      activeProgress.style.transform = `scaleX(${Math.min(1, elapsed / EYE_DWELL_MS)})`;
    }

    if (elapsed >= EYE_DWELL_MS) {
      selectEyeKey(key);
      eyeDwell = { key: null, start: 0 };
    }
  }

  function selectEyeKey(key) {
    if (key === '✕') {
      stopEyeSpelling();
      return;
    }
    if (key === '␣') {
      eyeText += ' ';
    } else if (key === '⌫') {
      eyeText = eyeText.slice(0, -1);
    } else {
      eyeText += key.toLowerCase();
    }
    document.getElementById('eyeSpellingText').textContent = eyeText;
  }

  document.getElementById('eyeSpelling').onclick = startEyeSpelling;
  document.getElementById('eyeSpellingClose').onclick = stopEyeSpelling;

  // Cleanup on window unload
  window.addEventListener('beforeunload', () => {
    console.log('🧹 Window unloading, cleaning up...');
    if (predictor && predictor.userDictionary.length > 0) {
      auraAPI.send('save-learnings', predictor.getLearnings());
    }
    window.cleanupAura();
  });

  // Store timeouts for cleanup
  window.pendingTimeouts = window.pendingTimeouts || [];
  const originalSetTimeout = window.setTimeout;
  window.setTimeout = function (callback, delay) {
    const id = originalSetTimeout(callback, delay);
    window.pendingTimeouts.push(id);
    return id;
  };

  // Override clearTimeout to remove from pending list
  const originalClearTimeout = window.clearTimeout;
  window.clearTimeout = function (id) {
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
      handleSmartSelect();
    }
  });

} catch (error) {
  console.error('❌ Unhandled error in app.js:', error);
  console.error(error.stack);
}
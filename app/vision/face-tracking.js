// Face tracking module using MediaPipe
// Classes are loaded from script tags in index.html

class FaceTracker {
  constructor(thresholds = {}) {
    console.log('Creating FaceTracker with thresholds:', thresholds);

    try {
      this.faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });

      this.faceMesh.setOptions({
        maxNumFaces: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.faceMesh.onResults(this.onResults.bind(this));
      console.log('✅ FaceMesh initialized successfully');
    } catch (error) {
      console.error('❌ Error creating FaceMesh:', error);
      throw error;
    }

    // IPC listeners will be initialized when start() is called
    this.ipcInitialized = false;

    // Load thresholds from profile or use defaults
    this.thresholds = {
      dwellTime: thresholds.dwellTime || 1000,
      stabilityThreshold: thresholds.stabilityThreshold || 10,
      deadZonePercent: thresholds.deadZonePercent || 0.03, // Reduced from 0.1 to allow more movement
      blinkThreshold: thresholds.blinkThreshold || 0.30,
      eyebrowThreshold: thresholds.eyebrowThreshold || 0.20,
      mouthThreshold: thresholds.mouthThreshold || 0.15,
      emergencyTime: thresholds.emergencyTime || 2000,
      executionCooldown: thresholds.executionCooldown || 800,
      headTiltThreshold: thresholds.headTiltThreshold || 0.15 // New threshold for head tilt
    };

    // State machine
    this.state = 'inactive'; // 'inactive', 'observing', 'preselection', 'executing'
    this.stateTimer = null;
    this.preselectionStart = null;
    this.lastMousePos = null;
    this.stableStart = null;
    this.filteredX = null;
    this.filteredY = null;
    this.alpha = 0.4; // Exponential filter alpha (increased for faster response)
    this.adaptiveSensitivity = 3.0; // Adaptive factor (increased for more noticeable movement)
    this.emergencyStart = null;

    this.neutralPose = null; // Store neutral pose for calibration
    this.calibrating = false;

    // Trackers for sustained and compound gestures
    this.sustainedStates = {
      mouthOpen: { start: null, duration: 500 },
      headTiltLeft: { start: null, duration: 1000 },
      headTiltRight: { start: null, duration: 1000 }
    };
    this.pauseStart = null;
    this.lastRawPos = null;
    this.filteredDelta = null;

    // Adaptive learning data
    this.usageStats = {
      totalActions: 0,
      accidentalActivations: 0,
      fatigueLevel: 0,
      lastActivityTime: Date.now(),
      sessionStartTime: Date.now(),
      actionHistory: [],
      errorPatterns: []
    };

    // Calibration data for automatic threshold adjustment
    this.calibrationData = {
      isCalibrating: false,
      calibrationStart: null,
      calibrationDuration: 3000, // 3 seconds
      samples: [],
      calibratedThresholds: null
    };

    // Adaptive thresholds (will be adjusted based on user behavior)
    this.adaptiveThresholds = {
      dwellTime: this.thresholds.dwellTime,
      stabilityThreshold: this.thresholds.stabilityThreshold,
      headTiltThreshold: this.thresholds.headTiltThreshold
    };
  }

  start(videoElement) {
    console.log('Starting FaceTracker camera...');

    // Initialize IPC listeners on start (when auraAPI is guaranteed to exist)
    if (!this.ipcInitialized) {
      this.initIPCListeners();
      this.ipcInitialized = true;
    }

    try {
      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          await this.faceMesh.send({ image: videoElement });
        },
        width: 1280,
        height: 720
      });

      this.camera.start();
      console.log('✅ Camera started successfully');
    } catch (error) {
      console.error('❌ Error starting camera:', error);

      // Provide helpful error messages for common camera issues
      if (error.name === 'NotReadableError') {
        console.error('💡 Posibles soluciones para error de cámara:');
        console.error('   1. Verifica que tengas una webcam conectada');
        console.error('   2. Otorga permisos de cámara a la aplicación');
        console.error('   3. Cierra otras aplicaciones que usen la cámara');
        console.error('   4. Reinicia la aplicación');
      } else if (error.name === 'NotAllowedError') {
        console.error('💡 La aplicación no tiene permisos para acceder a la cámara');
        console.error('   Ve a Configuración > Privacidad > Cámara y permite el acceso');
      }

      // Don't throw error, just log it and continue without camera
      console.warn('⚠️  Continuando sin cámara - algunas funciones estarán limitadas');

      // Send error to main process for UI notification
      if (window.auraAPI) {
        window.auraAPI.send('camera-error', {
          error: error.name,
          message: error.message
        });
      }
    }
  }

  // Initialize IPC listeners - called once from constructor
  initIPCListeners() {
    const ipc = window.auraAPI;
    if (!ipc) {
      console.warn('auraAPI not available yet, IPC listeners not initialized');
      return;
    }

    // Handle calibration request from renderer
    ipc.on('start-calibration', () => {
      this.calibrating = true;
      console.log('FaceTracker: Calibration mode ON');
    });

    // Receive initial profile for neutralPose and thresholds
    ipc.on('profile-loaded', (event, profile) => {
      if (profile.calibration && profile.calibration.neutralPose) {
        this.neutralPose = profile.calibration.neutralPose;
        console.log('FaceTracker: Initial calibration loaded');
      }
      
      // Load calibrated thresholds if available
      if (profile.calibration && profile.calibration.calibratedThresholds) {
        this.calibrationData.calibratedThresholds = profile.calibration.calibratedThresholds;
        console.log('FaceTracker: Saved calibrated thresholds loaded');
      }

      // Update thresholds if profile has new settings
      if (profile.thresholds) {
        this.thresholds = { ...this.thresholds, ...profile.thresholds };
        this.resetSession(); // Reset adaptive learning for new session

        // Load historical adaptation data
        if (profile.calibration && profile.calibration.adaptationHistory) {
          this.loadHistoricalAdaptation(profile.calibration.adaptationHistory);
        }
      }
    });

    console.log('✅ FaceTracker IPC listeners initialized');
  }

  onResults(results) {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      // No face, go to inactive
      this.setState('inactive');
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    // console.log('👤 Face detected, current state:', this.state);

    // Automatic calibration during first few seconds (if enabled)
    if (!this.calibrationData.calibratedThresholds && !this.calibrating && this.thresholds.adaptive?.autoCalibration) {
      this.performAutomaticCalibration(landmarks);
    }

    // Get current thresholds (may include adaptive adjustments or calibrated values)
    const currentThresholds = this.getCurrentThresholds();

    // Detect gestures
    const gestures = this.detectGestures(landmarks);

    // Emergency check
    // Temporarily disabled for testing
    // if (gestures.bothEyesClosed) {
    //   if (!this.emergencyStart) {
    //     this.emergencyStart = Date.now();
    //   } else if (Date.now() - this.emergencyStart > currentThresholds.emergencyTime) {
    //     ipc.send('pause');
    //     this.emergencyStart = null;
    //   }
    // } else {
    //   this.emergencyStart = null;
    // }

    // State machine logic
    switch (this.state) {
      case 'inactive':
        if (gestures.faceDetected) {
          console.log('🔄 Transitioning from inactive to observing');
          this.setState('observing');
        }
        break;
      case 'observing':
        // Calculate head position for mouse control only in observing
        // console.log('🖱️  In observing state - calculating mouse position');
        const nose = landmarks[1];
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;

        // Calibration logic
        if (this.calibrating || !this.neutralPose) {
          this.neutralPose = { x: nose.x, y: nose.y };
          if (this.calibrating) {
             this.calibrating = false;
             console.log('FaceTracker: Calibrated at', this.neutralPose);
             ipc.send('calibrate-save', this.neutralPose);
          }
        }

        const refX = this.neutralPose ? this.neutralPose.x : 0.5;
        const refY = this.neutralPose ? this.neutralPose.y : 0.5;

        // Calculate raw position (0.0 to 1.0) relative to neutral pose
        // Inverted X for mirror effect
        const rawX = refX - (nose.x - refX); 
        const rawY = nose.y - refY;

        // Calculate DELTA from last frame's raw position
        if (!this.lastRawPos) {
            this.lastRawPos = { x: rawX, y: rawY };
            return; // Skip first frame
        }

        const deltaXRaw = rawX - this.lastRawPos.x;
        const deltaYRaw = rawY - this.lastRawPos.y;
        
        // Update stability for dwellGaze
        const dist = Math.sqrt(deltaXRaw**2 + deltaYRaw**2);
        // Stability threshold is typically 10-30 pixels. In normalized 0-1 coords, 
        // 10 pixels on a 1920 screen is approx 0.005.
        const normalizedStabilityThreshold = (currentThresholds.stabilityThreshold || 10) / 2000;
        
        if (dist < normalizedStabilityThreshold) {
            if (!this.stableStart) this.stableStart = Date.now();
        } else {
            this.stableStart = null;
        }
        
        // Update last pos
        this.lastRawPos = { x: rawX, y: rawY };

        // Apply sensitivity and screen scale to delta
        // Sensitivity: 3.0 means reasonable speed. 
        // Screen scale: 1920x1080 typical.
        // We use a multiplier to convert normalized delta (e.g. 0.001) to pixels
        const speedMultiplier = 3000 * (this.adaptiveSensitivity || 1.0); 
        
        let dx = deltaXRaw * speedMultiplier;
        let dy = deltaYRaw * speedMultiplier;

        // Apply Dead Zone to DELTA (ignore very small movements)
        const deadZone = this.getCurrentThresholds().deadZonePercent * 10; // Simple threshold
        
        // Sophisticated Smoothing: Adaptive Weighted Moving Average
        // If movement is fast, use less smoothing (responsive).
        // If movement is slow, use more smoothing (stable).
        
        const movementMagnitude = Math.sqrt(dx*dx + dy*dy);
        
        // Dynamic Alpha: 
        // fast movement (>50px) -> alpha ~ 0.8 (responsive)
        // slow movement (<5px)  -> alpha ~ 0.1 (very smooth)
        let dynamicAlpha = Math.min(0.9, Math.max(0.05, movementMagnitude / 60));
        
        // Deadzone check with ramping (avoids jerky start)
        if (movementMagnitude < deadZone) {
            dx = 0;
            dy = 0;
            // When stopped, reset filter to current pos to avoid "drift" on restart
            if (this.filteredDelta) {
                 this.filteredDelta.x = 0;
                 this.filteredDelta.y = 0;
            }
        } else {
            // Soften the transition out of deadzone
            const ratio = (movementMagnitude - deadZone) / movementMagnitude;
            dx *= ratio;
            dy *= ratio;
        }

        // Apply smoothing to DELTA
        if (!this.filteredDelta) {
            this.filteredDelta = { x: dx, y: dy };
        } else {
            this.filteredDelta.x = dynamicAlpha * dx + (1 - dynamicAlpha) * this.filteredDelta.x;
            this.filteredDelta.y = dynamicAlpha * dy + (1 - dynamicAlpha) * this.filteredDelta.y;
        }
        
        // Use accumulated fraction to prevent pixel loss on slow movements
        if (!this.residualMouse) this.residualMouse = { x: 0, y: 0 };
        
        const totalMoveX = this.filteredDelta.x + this.residualMouse.x;
        const totalMoveY = this.filteredDelta.y + this.residualMouse.y;
        
        const moveX = Math.round(totalMoveX);
        const moveY = Math.round(totalMoveY);
        
        // Store remainder for next frame
        this.residualMouse.x = totalMoveX - moveX;
        this.residualMouse.y = totalMoveY - moveY;

        if (moveX !== 0 || moveY !== 0) {
             // Throttle IPC
             const now = Date.now();
             if (!this.lastMoveTime || now - this.lastMoveTime > 15) {
                 window.auraAPI.send('move-mouse-relative', moveX, moveY);
                 this.lastMoveTime = now;
             }
        }
        
        // Check dwell (Legacy logic kept but unused for movement)
        /*
        if (this.lastMousePos) { ... }
        */

        // Alternative: mouth gesture to preselection (ONLY way to enter preselection now)
        // The dwell time was causing the system to enter preselection state too quickly,
        // preventing continuous mouse movement. Users can still enter preselection by opening mouth.
        /*
        if (this.lastMousePos) {
          const distance = Math.sqrt((filteredX - this.lastMousePos.x) ** 2 + (filteredY - this.lastMousePos.y) ** 2);
          if (distance < currentThresholds.stabilityThreshold) {
            if (!this.stableStart) {
              this.stableStart = Date.now();
            } else if (Date.now() - this.stableStart > currentThresholds.dwellTime) {
              this.setState('preselection');
            }
          } else {
            this.stableStart = null;
          }
        }
        this.lastMousePos = { x: filteredX, y: filteredY };
        */

        // Alternative: mouth gesture to preselection (ONLY way to enter preselection now)
        if (gestures.mouthOpen) {
          this.setState('preselection');
        }
        break;
      case 'preselection':
        // Confirm action with mouthOpen (replacing blink)
        if (gestures.mouthOpen) {
          this.setState('executing');
          this.recordAction('click');
          window.auraAPI.send('click-mouse', 'left');
        } else if (this.preselectionStart && Date.now() - this.preselectionStart > 3000) {
          // Timeout - possible accidental activation if happened too quickly
          if (Date.now() - this.preselectionStart < 500) {
            this.recordAccidentalActivation();
          }
          this.setState('observing');
        }
        break;
      case 'executing':
        // After action, go back to observing after timeout
        if (!this.stateTimer) {
          this.stateTimer = setTimeout(() => {
            this.setState('observing');
          }, 1000);
        }
        break;
      default:
        break;
    }

    // Send gesture data to main for rules engine
    this.lastGestures = gestures; // For debug
    window.auraAPI.send('gesture-update', gestures);

    // Send mouth event specifically for keyboard scanning (replacing blink)
    if (gestures.mouthOpen) {
      window.auraAPI.send('blink-detected'); // Keep event name for compatibility or change it? 
      // Better to keep the semantic meaning if the listener expects "activation"
      // But for clarity let's assume the listener handles generic activation
    }
  }

  detectGestures(landmarks) {
    const currentThresholds = this.getCurrentThresholds();
    const now = Date.now();

    const gestures = {
      faceDetected: true,
      eyebrowRaise: false,
      eyebrowRaiseLeft: false,
      eyebrowRaiseRight: false,
      mouthOpen: false,
      mouthOpenSustained: false,
      smileLeft: false,
      smileRight: false,
      headTiltLeft: false,
      headTiltRight: false,
      headTiltLeftSustained: false,
      headTiltRightSustained: false,
      dwellGaze: false,
      gazeUp: false,
      gazeExtremeLeft: false,
      gazeExtremeRight: false,
      pauseCompound: false
    };

    // 1. Head Tilt (Roll) - Using ear landmarks
    const leftEar = landmarks[234];
    const rightEar = landmarks[454];
    const earYDiff = leftEar.y - rightEar.y;

    if (earYDiff > (currentThresholds.headTiltThreshold || 0.05)) {
      gestures.headTiltLeft = true;
      if (!this.sustainedStates.headTiltLeft.start) this.sustainedStates.headTiltLeft.start = now;
      if (now - this.sustainedStates.headTiltLeft.start > this.sustainedStates.headTiltLeft.duration) {
        gestures.headTiltLeftSustained = true;
      }
    } else {
      this.sustainedStates.headTiltLeft.start = null;
    }

    if (earYDiff < -(currentThresholds.headTiltThreshold || 0.05)) {
      gestures.headTiltRight = true;
      if (!this.sustainedStates.headTiltRight.start) this.sustainedStates.headTiltRight.start = now;
      if (now - this.sustainedStates.headTiltRight.start > this.sustainedStates.headTiltRight.duration) {
        gestures.headTiltRightSustained = true;
      }
    } else {
      this.sustainedStates.headTiltRight.start = null;
    }

    // 2. Eyebrows (Unilateral detection)
    const leftEyeUpper = landmarks[159];
    const leftEyebrow = landmarks[70];
    const rightEyeUpper = landmarks[386];
    const rightEyebrow = landmarks[300];

    const leftRaise = leftEyeUpper.y - leftEyebrow.y;
    const rightRaise = rightEyeUpper.y - rightEyebrow.y;

    if (leftRaise > currentThresholds.eyebrowThreshold) gestures.eyebrowRaiseLeft = true;
    if (rightRaise > currentThresholds.eyebrowThreshold) gestures.eyebrowRaiseRight = true;
    gestures.eyebrowRaise = gestures.eyebrowRaiseLeft || gestures.eyebrowRaiseRight;

    // 3. Mouth (Opening and sustained)
    const mouthUpper = landmarks[13];
    const mouthLower = landmarks[14];
    const mouthGap = Math.abs(mouthUpper.y - mouthLower.y);

    if (mouthGap > currentThresholds.mouthThreshold) {
      gestures.mouthOpen = true;
      if (!this.sustainedStates.mouthOpen.start) this.sustainedStates.mouthOpen.start = now;
      if (now - this.sustainedStates.mouthOpen.start > this.sustainedStates.mouthOpen.duration) {
        gestures.mouthOpenSustained = true;
      }
    } else {
      this.sustainedStates.mouthOpen.start = null;
    }

    // 4. Smile (Asymmetric) - Detect mouth corner elevation
    const mouthLeftCorner = landmarks[61];
    const mouthRightCorner = landmarks[291];
    
    // Y increases downwards, so a smile (corner moving UP) means Y decreases.
    // We compare each corner relative to the mouth center/baseline.
    const mouthCenterY = (mouthUpper.y + mouthLower.y) / 2;
    const smileThreshold = 0.015;
    
    if (mouthCenterY - mouthLeftCorner.y > smileThreshold) gestures.smileLeft = true;
    if (mouthCenterY - mouthRightCorner.y > smileThreshold) gestures.smileRight = true;

    // 5. Gaze / Iris (Extreme movements)
    if (landmarks.length > 473) {
      const leftIris = landmarks[468];
      const rightIris = landmarks[473];
      
      const leftEyeOuter = landmarks[33];
      const leftEyeInner = landmarks[133];
      const rightEyeInner = landmarks[362];
      const rightEyeOuter = landmarks[263];
      
      const leftEyeCenter = { x: (leftEyeOuter.x + leftEyeInner.x) / 2, y: (leftEyeOuter.y + leftEyeInner.y) / 2 };
      const rightEyeCenter = { x: (rightEyeOuter.x + rightEyeInner.x) / 2, y: (rightEyeOuter.y + rightEyeInner.y) / 2 };
      
      const avgGazeX = (leftIris.x - leftEyeCenter.x + rightIris.x - rightEyeCenter.x) / 2;
      const avgGazeY = (leftIris.y - leftEyeCenter.y + rightIris.y - rightEyeCenter.y) / 2;
      
      const gazeThresholdX = 0.02;
      const gazeThresholdY = 0.01;
      
      if (avgGazeY < -gazeThresholdY) gestures.gazeUp = true;
      if (avgGazeX < -gazeThresholdX) gestures.gazeExtremeLeft = true;
      if (avgGazeX > gazeThresholdX) gestures.gazeExtremeRight = true;
    }

    // 6. Dwell Gaze (Stability detection)
    if (this.stableStart && (now - this.stableStart > currentThresholds.dwellTime)) {
      gestures.dwellGaze = true;
    }

    // 7. Pause Compound
    // Gesto compuesto de pausa: Mirada arriba + ceja levantada + boca cerrada (1s)
    if (gestures.gazeUp && gestures.eyebrowRaise && !gestures.mouthOpen) {
      if (!this.pauseStart) this.pauseStart = now;
      if (now - this.pauseStart > 1000) gestures.pauseCompound = true;
    } else {
      this.pauseStart = null;
    }

    // 8. Combined Gestures (Recommended for AURA)
    gestures.dwellPlusEyebrowRaise = gestures.dwellGaze && gestures.eyebrowRaise;
    gestures.dwellPlusMouthOpen = gestures.dwellGaze && gestures.mouthOpen;

    return gestures;
  }

  setState(newState) {
    console.log(`State change: ${this.state} -> ${newState}`);
    this.state = newState;
    if (this.stateTimer) {
      clearTimeout(this.stateTimer);
      this.stateTimer = null;
    }
    if (newState === 'preselection') {
      this.preselectionStart = Date.now();
    } else {
      this.preselectionStart = null;
    }
    // Send state update to main
    window.auraAPI.send('state-update', newState);
  }

  // Adaptive learning methods
  recordAction(action, confidence = 1.0) {
    if (!this.thresholds.adaptive?.enabled) return;

    const now = Date.now();
    this.usageStats.totalActions++;
    this.usageStats.lastActivityTime = now;

    // Record action in history (last 100 actions)
    this.usageStats.actionHistory.push({
      timestamp: now,
      action: action,
      confidence: confidence,
      fatigueLevel: this.usageStats.fatigueLevel
    });

    if (this.usageStats.actionHistory.length > 100) {
      this.usageStats.actionHistory.shift();
    }

    // Update fatigue level based on session duration and action frequency
    this.updateFatigueLevel();

    // Analyze patterns and adjust thresholds
    this.analyzeAndAdapt();

    // Send adaptation data to main process for persistence
    const ipc = window.auraAPI;
    ipc.send('adaptation-update', {
      usageStats: this.usageStats,
      adaptiveThresholds: this.adaptiveThresholds
    });
  }

  recordAccidentalActivation() {
    this.usageStats.accidentalActivations++;
    this.usageStats.errorPatterns.push({
      timestamp: Date.now(),
      type: 'accidental_activation',
      context: this.state
    });

    // Increase tolerance temporarily after accidental activation
    if (this.thresholds.adaptive?.enabled) {
      this.adaptiveThresholds.dwellTime = Math.min(
        this.adaptiveThresholds.dwellTime * this.thresholds.adaptive.errorTolerance,
        this.thresholds.dwellTime * 2
      );
    }
  }

  updateFatigueLevel() {
    const sessionDuration = (Date.now() - this.usageStats.sessionStartTime) / 1000 / 60; // minutes
    const actionsPerMinute = this.usageStats.totalActions / Math.max(sessionDuration, 1);

    // Fatigue increases with session duration and action frequency
    this.usageStats.fatigueLevel = Math.min(
      (sessionDuration * 0.1) + (actionsPerMinute * 2),
      1.0
    );

    // Apply fatigue reduction if enabled
    if (this.thresholds.adaptive?.enabled && this.usageStats.fatigueLevel > 0.3) {
      const reductionFactor = this.thresholds.adaptive.fatigueReduction;
      this.adaptiveThresholds.dwellTime = Math.max(
        this.thresholds.dwellTime * reductionFactor,
        300 // minimum 300ms
      );
      this.adaptiveThresholds.stabilityThreshold = Math.max(
        this.thresholds.stabilityThreshold * reductionFactor,
        5 // minimum 5px
      );
    }
  }

  analyzeAndAdapt() {
    if (this.usageStats.actionHistory.length < 10) return;

    const recentActions = this.usageStats.actionHistory.slice(-20);
    const accidentalRate = this.usageStats.accidentalActivations / Math.max(this.usageStats.totalActions, 1);

    // If high accidental activation rate, increase thresholds
    if (accidentalRate > 0.1) {
      this.adaptiveThresholds.dwellTime = Math.min(
        this.adaptiveThresholds.dwellTime * 1.1,
        this.thresholds.dwellTime * 1.5
      );
      this.adaptiveThresholds.stabilityThreshold = Math.min(
        this.adaptiveThresholds.stabilityThreshold * 1.1,
        this.thresholds.stabilityThreshold * 1.5
      );
    }

    // If low accidental rate and user is experienced, decrease thresholds slightly
    else if (accidentalRate < 0.02 && this.usageStats.totalActions > 50) {
      this.adaptiveThresholds.dwellTime = Math.max(
        this.adaptiveThresholds.dwellTime * 0.95,
        this.thresholds.dwellTime * 0.7
      );
    }

    // Analyze blink patterns for optimal threshold
    const blinkActions = recentActions.filter(a => a.action.includes('click') || a.action.includes('blink'));
    if (blinkActions.length > 5) {
      // Could implement more sophisticated blink analysis here
    }
  }

  getCurrentThresholds() {
    // Return adaptive thresholds if enabled, otherwise base thresholds
    if (this.thresholds.adaptive?.enabled) {
      return {
        ...this.thresholds,
        dwellTime: this.adaptiveThresholds.dwellTime,
        stabilityThreshold: this.adaptiveThresholds.stabilityThreshold,
        blinkThreshold: this.adaptiveThresholds.blinkThreshold
      };
    }
    return this.thresholds;
  }

  loadHistoricalAdaptation(history) {
    if (!history || history.length === 0) return;

    // Analyze recent history (last 10 sessions) to improve initial thresholds
    const recentSessions = history.slice(-10);
    let totalAccidentalRate = 0;
    let totalActions = 0;
    let optimalDwellTimes = [];
    let optimalStabilityThresholds = [];

    recentSessions.forEach(session => {
      if (session.usageStats) {
        totalActions += session.usageStats.totalActions || 0;
        const accidentalRate = (session.usageStats.accidentalActivations || 0) /
          Math.max(session.usageStats.totalActions || 1, 1);
        totalAccidentalRate += accidentalRate;

        // Collect successful threshold adaptations
        if (session.adaptiveThresholds && accidentalRate < 0.05) {
          optimalDwellTimes.push(session.adaptiveThresholds.dwellTime);
          optimalStabilityThresholds.push(session.adaptiveThresholds.stabilityThreshold);
        }
      }
    });

    const avgAccidentalRate = totalAccidentalRate / recentSessions.length;

    // If user has good historical performance, start with slightly optimized thresholds
    if (totalActions > 100 && avgAccidentalRate < 0.03 && optimalDwellTimes.length > 3) {
      const avgOptimalDwell = optimalDwellTimes.reduce((a, b) => a + b, 0) / optimalDwellTimes.length;
      const avgOptimalStability = optimalStabilityThresholds.reduce((a, b) => a + b, 0) / optimalStabilityThresholds.length;

      // Apply historical optimization (conservative approach)
      this.adaptiveThresholds.dwellTime = Math.max(
        avgOptimalDwell * 0.9, // Slightly more aggressive than historical average
        this.thresholds.dwellTime * 0.8 // But not less than 80% of base threshold
      );

      this.adaptiveThresholds.stabilityThreshold = Math.max(
        avgOptimalStability * 0.9,
        this.thresholds.stabilityThreshold * 0.8
      );

      console.log('FaceTracker: Loaded historical adaptation data for optimized starting thresholds');
    }
  }

  updateThresholds(newThresholds) {
    // Update base thresholds
    this.thresholds = { ...this.thresholds, ...newThresholds };

    // Update sensitivity if provided
    if (newThresholds.mouseSensitivity !== undefined) {
      this.adaptiveSensitivity = newThresholds.mouseSensitivity;
    }

    // Reset adaptive thresholds to match new base thresholds
    this.adaptiveThresholds = {
      dwellTime: this.thresholds.dwellTime,
      stabilityThreshold: this.thresholds.stabilityThreshold,
      headTiltThreshold: this.thresholds.headTiltThreshold
    };

    console.log('FaceTracker thresholds updated:', this.thresholds);
  }

  // Update mouse sensitivity in real-time
  updateSensitivity(sensitivity) {
    this.adaptiveSensitivity = sensitivity;
    console.log('Mouse sensitivity updated to:', sensitivity);
  }

  performAutomaticCalibration(landmarks) {
    const now = Date.now();

    // Start calibration if not started
    if (!this.calibrationData.calibrationStart) {
      this.calibrationData.calibrationStart = now;
      this.calibrationData.isCalibrating = true;
      console.log('🤖 Starting automatic gesture calibration...');

      // Notify UI about calibration start
      if (window.auraAPI) {
        window.auraAPI.send('calibration-status', { isCalibrating: true });
      }
      return;
    }

    // Collect samples during calibration period
    if (now - this.calibrationData.calibrationStart < this.calibrationData.calibrationDuration) {
      // Sample facial measurements
      const leftEyeDistance = Math.abs(landmarks[159].y - landmarks[145].y);
      const rightEyeDistance = Math.abs(landmarks[386].y - landmarks[374].y);
      const eyebrowDistance = landmarks[159].y - landmarks[70].y;
      const mouthDistance = Math.abs(landmarks[13].y - landmarks[14].y);
      const earYDiff = Math.abs(landmarks[234].y - landmarks[454].y); // Abs diff for variance calc

      this.calibrationData.samples.push({
        timestamp: now,
        earYDiff,
        eyebrowDistance,
        mouthDistance
      });

      return;
    }

    // Calibration complete - calculate optimal thresholds
    if (this.calibrationData.samples.length > 10) {
      this.finalizeCalibration();
    }
  }

  finalizeCalibration() {
    const samples = this.calibrationData.samples;

    // Calculate baseline measurements (natural state)
    // Calculate baseline measurements (natural state)
    const avgEarDiff = samples.reduce((sum, s) => sum + s.earYDiff, 0) / samples.length;
    const avgEyebrow = samples.reduce((sum, s) => sum + s.eyebrowDistance, 0) / samples.length;
    const avgMouth = samples.reduce((sum, s) => sum + s.mouthDistance, 0) / samples.length;

    // Calculate standard deviations for sensitivity
    const earYVariance = samples.reduce((sum, s) => sum + Math.pow(s.earYDiff - avgEarDiff, 2), 0) / samples.length;
    const eyebrowVariance = samples.reduce((sum, s) => sum + Math.pow(s.eyebrowDistance - avgEyebrow, 2), 0) / samples.length;
    const mouthVariance = samples.reduce((sum, s) => sum + Math.pow(s.mouthDistance - avgMouth, 2), 0) / samples.length;

    // Set calibrated thresholds based on natural variation + safety margin
    this.calibrationData.calibratedThresholds = {
      headTiltThreshold: Math.max(0.05, Math.sqrt(earYVariance) * 3), // 3x std dev of natural tilt
      eyebrowThreshold: Math.max(avgEyebrow * 0.6, Math.sqrt(eyebrowVariance) * 2.5), // 60% of natural eyebrow position
      mouthThreshold: Math.max(avgMouth * 0.8, Math.sqrt(mouthVariance) * 3) // 80% of natural mouth opening
    };

    // Apply safety bounds
    this.calibrationData.calibratedThresholds.headTiltThreshold = Math.max(0.02, Math.min(0.2, this.calibrationData.calibratedThresholds.headTiltThreshold));
    this.calibrationData.calibratedThresholds.eyebrowThreshold = Math.max(0.08, Math.min(0.25, this.calibrationData.calibratedThresholds.eyebrowThreshold));
    this.calibrationData.calibratedThresholds.mouthThreshold = Math.max(0.05, Math.min(0.15, this.calibrationData.calibratedThresholds.mouthThreshold));

    this.calibrationData.isCalibrating = false;

    console.log('✅ Automatic calibration completed:', this.calibrationData.calibratedThresholds);
    console.log('🎯 Gesture detection optimized for your facial features');

    // Notify UI about calibration completion
    if (window.auraAPI) {
      window.auraAPI.send('calibration-status', { completed: true });
      // Persist calibrated thresholds
      window.auraAPI.send('save-calibrated-thresholds', this.calibrationData.calibratedThresholds);
    }
  }

  getCurrentThresholds() {
    // Return calibrated thresholds if available, otherwise adaptive, otherwise base
    if (this.calibrationData.calibratedThresholds) {
      return {
        ...this.thresholds,
        headTiltThreshold: this.calibrationData.calibratedThresholds.headTiltThreshold,
        eyebrowThreshold: this.calibrationData.calibratedThresholds.eyebrowThreshold,
        mouthThreshold: this.calibrationData.calibratedThresholds.mouthThreshold,
        // Keep adaptive adjustments for dwell time and stability
        dwellTime: this.adaptiveThresholds.dwellTime,
        stabilityThreshold: this.adaptiveThresholds.stabilityThreshold
      };
    }

    if (this.thresholds.adaptive?.enabled) {
      return {
        ...this.thresholds,
        dwellTime: this.adaptiveThresholds.dwellTime,
        stabilityThreshold: this.adaptiveThresholds.stabilityThreshold,
        blinkThreshold: this.adaptiveThresholds.blinkThreshold
      };
    }

    return this.thresholds;
  }

  resetSession() {
    this.usageStats.sessionStartTime = Date.now();
    this.usageStats.fatigueLevel = 0;
    this.usageStats.actionHistory = [];
    // Reset calibration for new session
    this.calibrationData = {
      isCalibrating: false,
      calibrationStart: null,
      calibrationDuration: 3000,
      samples: [],
      calibratedThresholds: this.calibrationData.calibratedThresholds // Keep previous calibration
    };

    // Keep historical optimizations but reset session-specific adaptations
    const baseAdaptive = {
      dwellTime: this.thresholds.dwellTime,
      stabilityThreshold: this.thresholds.stabilityThreshold,
      headTiltThreshold: this.thresholds.headTiltThreshold
    };

    // If we have historical optimizations, start with those instead of base
    if (this.adaptiveThresholds.dwellTime !== this.thresholds.dwellTime ||
      this.adaptiveThresholds.stabilityThreshold !== this.thresholds.stabilityThreshold) {
      // Keep historical optimizations
      baseAdaptive.dwellTime = this.adaptiveThresholds.dwellTime;
      baseAdaptive.stabilityThreshold = this.adaptiveThresholds.stabilityThreshold;
    }

    this.adaptiveThresholds = baseAdaptive;
  }

  stop() {
    console.log('🛑 Stopping FaceTracker...');

    // Clear any pending timers
    if (this.stateTimer) {
      clearTimeout(this.stateTimer);
      this.stateTimer = null;
    }

    if (this.emergencyStart) {
      this.emergencyStart = null;
    }

    // Stop camera
    if (this.camera) {
      try {
        this.camera.stop();
        console.log('✅ Camera stopped');
      } catch (error) {
        console.error('Error stopping camera:', error);
      }
    }

    // Reset state
    this.state = 'inactive';
    this.neutralPose = null;
    this.calibrating = false;

    console.log('✅ FaceTracker stopped completely');
  }
}

// Export for browser environment
window.FaceTracker = FaceTracker;
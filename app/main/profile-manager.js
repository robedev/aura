const fs = require('fs');
const path = require('path');

class ProfileManager {
    constructor(profilePath) {
        this.profilePath = profilePath;
        this.currentProfile = null;
    }

    load() {
        try {
            if (fs.existsSync(this.profilePath)) {
                const data = fs.readFileSync(this.profilePath, 'utf8');
                this.currentProfile = JSON.parse(data);
                // Ensure new properties exist (backward compatibility)
                this.currentProfile.thresholds = {
                    ...this.getDefaultProfile().thresholds,
                    ...this.currentProfile.thresholds
                };
                this.currentProfile.adaptive = {
                    ...this.getDefaultProfile().adaptive,
                    ...this.currentProfile.adaptive
                };
                this.currentProfile.calibration.adaptationHistory = this.currentProfile.calibration.adaptationHistory || [];
                console.log('Profile loaded:', this.currentProfile.name);
            } else {
                console.warn('Profile file not found, creating default.');
                this.currentProfile = this.getDefaultProfile();
                this.save();
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            this.currentProfile = this.getDefaultProfile();
        }
        return this.currentProfile;
    }

    save() {
        try {
            const data = JSON.stringify(this.currentProfile, null, 2);
            fs.writeFileSync(this.profilePath, data, 'utf8');
            console.log('Profile saved successfully.');
        } catch (error) {
            console.error('Error saving profile:', error);
        }
    }

    updateCalibration(neutralPose) {
        if (this.currentProfile) {
            this.currentProfile.calibration.neutralPose = neutralPose;
            this.currentProfile.calibration.lastCalibrated = new Date().toISOString();
            this.save();
        }
    }

    updateCalibratedThresholds(thresholds) {
        if (this.currentProfile) {
            this.currentProfile.calibration.calibratedThresholds = thresholds;
            this.save();
        }
    }

    addRule(rule) {
        if (this.currentProfile) {
            this.currentProfile.rules.push(rule);
            this.save();
        }
    }

    removeRule(index) {
        if (this.currentProfile && this.currentProfile.rules[index]) {
            this.currentProfile.rules.splice(index, 1);
            this.save();
        }
    }

    getDefaultProfile() {
        return {
            name: "Perfil Predeterminado",
            sensitivity: {
                headMovement: 0.5,
                blinkThreshold: 0.02
            },
            gestures: {
                enabled: ["head_move", "blink_click"]
            },
            thresholds: {
                dwellTime: 1000,           // ms para preselección
                mouseSensitivity: 3.0,     // sensibilidad del mouse
                stabilityThreshold: 10,    // pixels para estabilidad
                deadZonePercent: 0.03,     // porcentaje zona muerta (reducido)
                blinkThreshold: 0.25,      // umbral parpadeo (más alto para evitar falsos positivos)
                eyebrowThreshold: 0.15,    // umbral cejas (más alto para evitar falsos positivos)
                mouthThreshold: 0.08,      // umbral boca (más alto para evitar falsos positivos)
                emergencyTime: 2000,       // ms para pausa emergencia
                executionCooldown: 800     // ms entre acciones
            },
            adaptive: {
                enabled: true,
                autoCalibration: true,     // calibración automática inicial
                fatigueReduction: 0.8,     // factor reducción por fatiga
                errorTolerance: 1.2,       // factor tolerancia errores
                learningRate: 0.1         // tasa aprendizaje adaptativo
            },
            rules: [],
            calibration: {
                neutralPose: null,
                lastCalibrated: null,
                adaptationHistory: []      // historial para aprendizaje
            }
        };
    }
}

module.exports = ProfileManager;

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
                this.currentProfile = this.normalizeProfile(JSON.parse(data));
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

    // Garantiza que un perfil (cargado o importado) tenga todas las
    // propiedades nuevas (backward compatibility)
    normalizeProfile(profile) {
        const defaults = this.getDefaultProfile();
        profile.thresholds = { ...defaults.thresholds, ...profile.thresholds };
        profile.adaptive = { ...defaults.adaptive, ...profile.adaptive };
        profile.calibration = profile.calibration || defaults.calibration;
        profile.calibration.adaptationHistory = profile.calibration.adaptationHistory || [];
        profile.learnings = profile.learnings || { words: [], bigrams: {} };
        profile.ttsAnnouncements = { ...defaults.ttsAnnouncements, ...profile.ttsAnnouncements };
        profile.rules = profile.rules || [];
        return profile;
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

    // --- Multi-perfil (M5) ---

    // Sanea el nombre para usarlo como nombre de archivo:
    // evita path traversal y caracteres problemáticos
    sanitizeName(name) {
        if (typeof name !== 'string') return null;
        const safe = name.trim().toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar acentos
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9_-]/g, '');
        return safe.length > 0 ? safe : null;
    }

    currentProfileFileName() {
        return path.basename(this.profilePath, '.json');
    }

    listProfiles() {
        const dir = path.dirname(this.profilePath);
        try {
            return fs.readdirSync(dir)
                .filter(f => f.endsWith('.json'))
                .map(f => path.basename(f, '.json'))
                .sort();
        } catch (error) {
            console.error('Error listing profiles:', error);
            return [this.currentProfileFileName()];
        }
    }

    switchProfile(name) {
        const safe = this.sanitizeName(name);
        if (!safe) return null;
        const newPath = path.join(path.dirname(this.profilePath), `${safe}.json`);
        if (!fs.existsSync(newPath)) {
            console.warn(`Profile "${safe}" not found`);
            return null;
        }
        this.save(); // persistir el perfil actual antes de cambiar
        this.profilePath = newPath;
        return this.load();
    }

    createProfile(name) {
        const safe = this.sanitizeName(name);
        if (!safe) return null;
        const newPath = path.join(path.dirname(this.profilePath), `${safe}.json`);
        if (fs.existsSync(newPath)) {
            console.warn(`Profile "${safe}" already exists`);
            return null;
        }
        this.save(); // persistir el perfil actual antes de cambiar
        this.profilePath = newPath;
        this.currentProfile = this.getDefaultProfile();
        this.currentProfile.name = name.trim();
        this.currentProfile.onboardingCompleted = true; // el usuario ya vio el tutorial
        this.save();
        return this.currentProfile;
    }

    // --- Exportar/importar perfiles (N6) ---

    validateProfileData(data) {
        return !!(data && typeof data === 'object' &&
            data.thresholds && typeof data.thresholds === 'object' &&
            Array.isArray(data.rules) &&
            data.calibration && typeof data.calibration === 'object');
    }

    importProfile(data) {
        if (!this.validateProfileData(data)) return false;
        this.currentProfile = this.normalizeProfile(data);
        this.currentProfile.onboardingCompleted = true;
        this.save();
        return true;
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
                adaptationHistory: []
            },
            learnings: {
                words: [],
                bigrams: {}
            },
            ttsAnnouncements: {
                enabled: true,      // anuncios de voz activados
                fatigue: true,      // anunciar detección de fatiga
                actions: false      // anunciar cada acción ejecutada (verboso)
            },
            onboardingCompleted: false
        };
    }
}

module.exports = ProfileManager;

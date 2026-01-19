# Project knowledge

This file gives Codebuff context about your project: goals, commands, conventions, and gotchas.

## Instrucciones para el asistente
- **Responder siempre en español**

## Overview
Aura is an Electron desktop app for facial gesture-based computer control, designed for people with quadriplegia. It uses MediaPipe Face Mesh for real-time landmark detection and translates head/face movements into mouse, keyboard, and system actions. Features adaptive AI that learns user patterns.

## Quickstart
- Setup: `npm install && npm run install-deps`
- Dev: `npm start`
- Test: `npm test` (unit), `npm run test-cleanup` (process cleanup), `npm run test-gestures` (gesture detection)
- Build: `npm run dist` (creates platform installers)
- Check platform compatibility: `npm run check-platform`

## Architecture
- Key directories:
  - `app/main/` - Electron main process (main.js, os-controller.js, profile-manager.js, rules-engine.js)
  - `app/renderer/` - UI (app.js, index.html, styles/, services/)
  - `app/vision/` - Face tracking with MediaPipe (face-tracking.js)
  - `app/profiles/` - User profile JSON configs
  - `scripts/` - Platform setup and testing utilities
- Data flow: Webcam → MediaPipe Face Mesh → Gesture detection → IPC → OS Controller → System actions (xdotool/PowerShell/AppleScript)
- State machine: inactive → observing → preselection → executing

## Conventions
- Language: Comments and UI in Spanish
- Formatting: ES6+ JavaScript, no TypeScript
- Platform abstraction: os-controller.js handles Linux (xdotool), Windows (PowerShell), macOS (AppleScript)
- IPC: Use `window.auraAPI.send()` from renderer, `ipcMain.on()` in main
- Profiles: JSON files in `app/profiles/`, loaded via profile-manager.js

## Things to avoid
- Don't leave orphan processes (xdotool, espeak) - always clean up in os-controller.js
- Don't send data to cloud - all processing is local for privacy
- Don't assume global npm installs - use project-local dependencies
- Avoid blocking the main process - use async/await for OS commands

## Gotchas
- MediaPipe loads via CDN in renderer (check CSP in index.html if issues)
- Linux requires xdotool, espeak/festival; Windows needs PowerShell; macOS needs Accessibility permissions
- Graceful shutdown is critical - see `performGracefulShutdown()` and `releaseAllKeys()` to prevent stuck keys
- Calibration stores neutral head position in profile JSON

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Aura is an Electron desktop accessibility application that translates facial gestures into mouse, keyboard, and system actions for people with quadriplegia. Core pipeline: Webcam → MediaPipe Face Mesh (via CDN) → Gesture detection → IPC → OS Controller → system actions (xdotool/PowerShell/AppleScript).

## Commands

```bash
pnpm install && pnpm run install-deps   # Initial setup
pnpm start                             # Dev mode (opens DevTools)
pnpm run check-platform                # Verify system dependencies and hardware
pnpm run test-gestures                 # Gesture detection stability + false positive analysis
pnpm run test-cleanup                  # Verify no orphaned processes remain after shutdown
pnpm run dist                          # Build distributable packages (dist/)
```

`pnpm test` is a placeholder — there is no unit test framework.

## Architecture

```
app/main/           Electron main process
  main.js           App init, IPC coordination, graceful shutdown
  os-controller.js  Cross-platform OS commands (xdotool/PowerShell/AppleScript)
  profile-manager.js User config persistence
  rules-engine.js   Gesture → action mapping (priority + anyOf/OR support)
  ai-service.js     Claude AI keyboard suggestions (Haiku 4.5); disabled without ANTHROPIC_API_KEY
app/renderer/       Renderer process (HTML/CSS/JS)
  app.js            UI logic, gesture detection coordination
  services/         Predictor.js (adaptive AI)
app/vision/
  face-tracking.js  MediaPipe Face Mesh integration, landmark-to-gesture translation
app/profiles/       User profile JSON configs (calibration, sensitivity, rules)
scripts/            Platform setup and integration test utilities
```

IPC bridge: renderer uses `window.auraAPI.send()` and `window.auraAPI.on()` (exposed via `preload.js`); main process handles with `ipcMain.on()`.

Gesture state machine: `inactive → observing → preselection → executing`

## Critical rules

**Resource cleanup is non-negotiable.** Orphaned `xdotool` or `espeak` processes break accessibility for the user. Every new code path that spawns a subprocess must call cleanup in `os-controller.js`. When in doubt, trace how `performGracefulShutdown()` and `releaseAllKeys()` work.

**No cloud transmission.** All face tracking and gesture recognition is local. Never add any code that transmits video frames, landmark data, or user behavior off-device. Sole documented exception: `ai-service.js` sends only the partial text typed in the smart keyboard to the Anthropic API, and only when the user has explicitly configured `ANTHROPIC_API_KEY` (env var or `.env`, see `.env.example`).

**Async main process.** Never block the Electron main process — use `async/await` for all OS commands.

## Code conventions

- **ES6+ JavaScript, CommonJS** (`require`/`module.exports`) — no TypeScript, no ESLint, no Prettier
- **Comments and UI strings in Spanish**
- **Logging**: use `console.log` with emoji prefixes (🚀 ✅ ❌ ⚠️ 🛠️) — consistent with existing code
- Naming: `camelCase` for variables/functions, `PascalCase` for classes, `kebab-case` for files, `UPPER_SNAKE_CASE` for constants
- **All cross-platform OS operations go through `os-controller.js`** — do not add platform-specific `exec` calls elsewhere
- Commit messages: English, prefixed (`feat:`, `fix:`, `docs:`, `refactor:`), squash merge

## Platform-specific: Linux Wayland

When developing on Wayland, `ydotoold` must be running before launching the app:

```bash
ydotoold &    # Required for ydotool socket at /tmp/.ydotool_socket
pnpm start
```

`xdotool` is the fallback for X11/XWayland. `os-controller.js` detects which is available.

**First-time setup** (run once to avoid KDE Polkit permission dialogs and run `ydotoold` without sudo):

```bash
# Allow the 'input' group to access /dev/uinput
echo 'KERNEL=="uinput", GROUP="input", MODE="0660", OPTIONS+="static_node=uinput"' | sudo tee /etc/udev/rules.d/60-uinput.rules

# Add your user to the 'input' group
sudo usermod -a -G input $USER

# Reload udev rules
sudo udevadm control --reload-rules && sudo udevadm trigger
```

Log out and back in after running these commands. After that, `ydotoold` runs without `sudo` and KDE will not show the "Controlar dispositivos de entrada" Polkit dialog.

## MediaPipe

Face Mesh, Camera Utils, and Drawing Utils load from CDN (`cdn.jsdelivr.net`) in the renderer. If tracking breaks, check the CSP policy in `app/renderer/index.html` first.

## User profiles

Stored in `app/profiles/default.json` — includes sensitivity thresholds, gesture rules, and calibration data (neutral head pose). The file is gitignored except for the default template. Calibration runs automatically on startup (3-second hold).

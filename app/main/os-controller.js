const { exec, spawn } = require('child_process');

class OSController {
    constructor() {
        this.platform = process.platform; // 'linux', 'win32', 'darwin'
        this.actionHistory = [];
        this.runningProcesses = new Set(); // Track running processes
        this.initializePlatformSupport();
    }

    initializePlatformSupport() {
        console.log(`OSController: Initializing for platform ${this.platform}`);

        // Check if required tools are available
        switch (this.platform) {
            case 'linux':
                this.checkLinuxDependencies();
                break;
            case 'win32':
                this.checkWindowsDependencies();
                break;
            case 'darwin':
                this.checkMacDependencies();
                break;
            default:
                console.warn(`OSController: Unsupported platform ${this.platform}`);
        }
    }

    // Execute command with process tracking
    executeCommand(command, callback = null) {
        const child = spawn(command, [], {
            shell: true,
            detached: false,
            stdio: 'ignore' // Don't inherit stdio to avoid interference
        });

        // Track the process
        this.runningProcesses.add(child);

        // Remove from tracking when process ends
        child.on('exit', (code) => {
            this.runningProcesses.delete(child);
            if (callback) callback(code);
        });

        child.on('error', (error) => {
            this.runningProcesses.delete(child);
            console.error('Command execution error:', error);
            if (callback) callback(-1);
        });

        // Safety timeout - kill process if it runs too long
        setTimeout(() => {
            if (this.runningProcesses.has(child)) {
                console.warn('Command timeout, terminating:', command);
                try {
                    child.kill('SIGTERM');
                } catch (e) {
                    // Ignore errors when killing timed out processes
                }
                this.runningProcesses.delete(child);
            }
        }, 5000); // 5 second timeout

        return child;
    }

    checkLinuxDependencies() {
        // Check if xdotool is available
        exec('which xdotool', (error) => {
            if (error) {
                console.error('OSController: xdotool not found. Please install: sudo apt-get install xdotool');
            }
        });
    }

    checkWindowsDependencies() {
        // For Windows, we'll use a combination of native APIs and PowerShell
        // This is a placeholder - actual implementation would require native modules
        console.log('OSController: Windows support requires native modules (TBD)');
    }

    checkMacDependencies() {
        // For macOS, we'll use osascript and accessibility APIs
        exec('which osascript', (error) => {
            if (error) {
                console.warn('OSController: osascript not found - macOS scripting limited');
            }
        });
    }

    moveMouse(x, y) {
        const coords = { x: Math.round(x), y: Math.round(y) };

        switch (this.platform) {
            case 'linux':
                this.executeCommand(`xdotool mousemove ${coords.x} ${coords.y}`, (code) => {
                    if (code !== 0) console.error('OSController: Linux mouse move error, exit code:', code);
                });
                break;

            case 'win32':
                // Windows implementation using PowerShell
                const psCommand = `
                    Add-Type -AssemblyName System.Windows.Forms;
                    [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${coords.x}, ${coords.y});
                `;
                this.executeCommand(`powershell -Command "${psCommand}"`, (code) => {
                    if (code !== 0) console.error('OSController: Windows mouse move error, exit code:', code);
                });
                break;

            case 'darwin':
                // macOS implementation using AppleScript
                const appleScript = `
                    tell application "System Events"
                        set position of mouse to {${coords.x}, ${coords.y}}
                    end tell
                `;
                this.executeCommand(`osascript -e '${appleScript}'`, (code) => {
                    if (code !== 0) console.error('OSController: macOS mouse move error, exit code:', code);
                });
                break;

            default:
                console.error(`OSController: Unsupported platform ${this.platform} for mouse move`);
        }

        this.actionHistory.push({ type: 'move', x: coords.x, y: coords.y });
    }

    clickMouse(button) {
        const buttonMap = { left: 1, right: 2, middle: 3 };
        const btn = buttonMap[button] || 1;

        switch (this.platform) {
            case 'linux':
                exec(`xdotool click ${btn}`, (error) => {
                    if (error) console.error('OSController: Linux click error:', error);
                });
                break;

            case 'win32':
                // Windows click using PowerShell
                const windowsButtonName = button === 'left' ? 'Left' :
                                        button === 'right' ? 'Right' : 'Middle';
                const psCommand = `
                    Add-Type -AssemblyName System.Windows.Forms;
                    [System.Windows.Forms.SendKeys]::SendWait('{${windowsButtonName}CLICK}');
                `;
                exec(`powershell -Command "${psCommand}"`, (error) => {
                    if (error) console.error('OSController: Windows click error:', error);
                });
                break;

            case 'darwin':
                // macOS click using AppleScript
                const macButtonName = button === 'left' ? 'button 1' :
                                    button === 'right' ? 'button 2' : 'button 3';
                const appleScript = `
                    tell application "System Events"
                        click ${macButtonName}
                    end tell
                `;
                exec(`osascript -e '${appleScript}'`, (error) => {
                    if (error) console.error('OSController: macOS click error:', error);
                });
                break;

            default:
                console.error(`OSController: Unsupported platform ${this.platform} for mouse click`);
        }

        this.actionHistory.push({ type: 'click', button });
    }

    // Advanced mouse functions
    scrollMouse(direction, amount = 3) {
        const scrollDirection = direction === 'up' ? 4 : 5; // 4=up, 5=down

        switch (this.platform) {
            case 'linux':
                const scrollCmd = direction === 'up' ? 'up' : 'down';
                exec(`xdotool click ${scrollDirection}`, (error) => {
                    if (error) console.error('OSController: Linux scroll error:', error);
                });
                break;

            case 'win32':
                // Windows scroll using mouse_event
                const psCommand = `
                    Add-Type -TypeDefinition @"
                    using System.Runtime.InteropServices;
                    public class Mouse {
                        [DllImport("user32.dll")]
                        public static extern void mouse_event(uint dwFlags, uint dx, uint dy, int dwData, IntPtr dwExtraInfo);
                    }
                    "@;
                    [Mouse]::mouse_event(0x0800, 0, 0, ${direction === 'up' ? 120 : -120}, [IntPtr]::Zero);
                `;
                exec(`powershell -Command "${psCommand}"`, (error) => {
                    if (error) console.error('OSController: Windows scroll error:', error);
                });
                break;

            case 'darwin':
                // macOS scroll using AppleScript (simulate scroll wheel)
                const appleScript = `
                    tell application "System Events"
                        scroll wheel ${direction === 'up' ? 1 : -1} 3
                    end tell
                `;
                exec(`osascript -e '${appleScript}'`, (error) => {
                    if (error) console.error('OSController: macOS scroll error:', error);
                });
                break;

            default:
                console.error(`OSController: Unsupported platform ${this.platform} for mouse scroll`);
        }

        this.actionHistory.push({ type: 'scroll', direction, amount });
    }

    dragMouse(startX, startY, endX, endY) {
        switch (this.platform) {
            case 'linux':
                exec(`xdotool mousedown 1 mousemove ${endX} ${endY} mouseup 1`, (error) => {
                    if (error) console.error('OSController: Linux drag error:', error);
                });
                break;

            case 'win32':
                // Windows drag using PowerShell
                const psCommand = `
                    Add-Type -AssemblyName System.Windows.Forms;
                    [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${startX}, ${startY});
                    Start-Sleep -Milliseconds 100;
                    [System.Windows.Forms.SendKeys]::SendWait('{LEFTDOWN}');
                    Start-Sleep -Milliseconds 100;
                    [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${endX}, ${endY});
                    Start-Sleep -Milliseconds 100;
                    [System.Windows.Forms.SendKeys]::SendWait('{LEFTUP}');
                `;
                exec(`powershell -Command "${psCommand}"`, (error) => {
                    if (error) console.error('OSController: Windows drag error:', error);
                });
                break;

            case 'darwin':
                // macOS drag using AppleScript
                const appleScript = `
                    tell application "System Events"
                        set mousePos to {${startX}, ${startY}}
                        -- Note: Complex drag operations may require additional scripting
                    end tell
                `;
                exec(`osascript -e '${appleScript}'`, (error) => {
                    if (error) console.error('OSController: macOS drag error:', error);
                });
                break;

            default:
                console.error(`OSController: Unsupported platform ${this.platform} for mouse drag`);
        }

        this.actionHistory.push({ type: 'drag', startX, startY, endX, endY });
    }

    typeText(text) {
        // Escape special characters for shell commands
        const escapedText = text.replace(/"/g, '\\"').replace(/'/g, "\\'");

        switch (this.platform) {
            case 'linux':
                exec(`xdotool type "${escapedText}"`, (error) => {
                    if (error) console.error('OSController: Linux type error:', error);
                });
                break;

            case 'win32':
                // Windows using PowerShell
                const psCommand = `
                    Add-Type -AssemblyName System.Windows.Forms;
                    [System.Windows.Forms.SendKeys]::SendWait('${escapedText.replace(/'/g, "''")}');
                `;
                exec(`powershell -Command "${psCommand}"`, (error) => {
                    if (error) console.error('OSController: Windows type error:', error);
                });
                break;

            case 'darwin':
                // macOS using AppleScript
                const appleScript = `
                    tell application "System Events"
                        keystroke "${escapedText}"
                    end tell
                `;
                exec(`osascript -e '${appleScript}'`, (error) => {
                    if (error) console.error('OSController: macOS type error:', error);
                });
                break;

            default:
                console.error(`OSController: Unsupported platform ${this.platform} for typing`);
        }

        this.actionHistory.push({ type: 'type', text });
    }

    volumeUp() {
        switch (this.platform) {
            case 'linux':
                exec('amixer set Master 5%+', (error) => {
                    if (error) console.error('OSController: Linux volume up error:', error);
                });
                break;

            case 'win32':
                // Windows volume up using PowerShell
                exec('powershell -Command "(New-Object -ComObject WScript.Shell).SendKeys([char]175)"', (error) => {
                    if (error) console.error('OSController: Windows volume up error:', error);
                });
                break;

            case 'darwin':
                // macOS volume up using AppleScript
                exec('osascript -e "set volume output volume (output volume of (get volume settings) + 10)"', (error) => {
                    if (error) console.error('OSController: macOS volume up error:', error);
                });
                break;

            default:
                console.error(`OSController: Unsupported platform ${this.platform} for volume up`);
        }
    }

    volumeDown() {
        switch (this.platform) {
            case 'linux':
                exec('amixer set Master 5%-', (error) => {
                    if (error) console.error('OSController: Linux volume down error:', error);
                });
                break;

            case 'win32':
                // Windows volume down using PowerShell
                exec('powershell -Command "(New-Object -ComObject WScript.Shell).SendKeys([char]174)"', (error) => {
                    if (error) console.error('OSController: Windows volume down error:', error);
                });
                break;

            case 'darwin':
                // macOS volume down using AppleScript
                exec('osascript -e "set volume output volume (output volume of (get volume settings) - 10)"', (error) => {
                    if (error) console.error('OSController: macOS volume down error:', error);
                });
                break;

            default:
                console.error(`OSController: Unsupported platform ${this.platform} for volume down`);
        }
    }

    openApp(appName) {
        const appCommands = {
            linux: {
                'notepad': 'kate',
                'terminal': 'gnome-terminal',
                'browser': 'firefox',
                'calculator': 'gnome-calculator'
            },
            win32: {
                'notepad': 'notepad.exe',
                'terminal': 'cmd.exe',
                'browser': 'start chrome',
                'calculator': 'calc.exe'
            },
            darwin: {
                'notepad': 'open -a TextEdit',
                'terminal': 'open -a Terminal',
                'browser': 'open -a Safari',
                'calculator': 'open -a Calculator'
            }
        };

        const platformApps = appCommands[this.platform] || {};
        const cmd = platformApps[appName] || appName;

        switch (this.platform) {
            case 'linux':
            case 'win32':
                exec(cmd, (error) => {
                    if (error) console.error(`OSController: ${this.platform} open app error:`, error);
                });
                break;

            case 'darwin':
                exec(cmd, (error) => {
                    if (error) console.error('OSController: macOS open app error:', error);
                });
                break;

            default:
                console.error(`OSController: Unsupported platform ${this.platform} for opening apps`);
        }
    }

    readText(text) {
        const escapedText = text.replace(/"/g, '\\"').replace(/'/g, "\\'");

        switch (this.platform) {
            case 'linux':
                // Try espeak first, then festival as fallback
                exec(`espeak "${escapedText}" || festival --tts <<< "${escapedText}"`, (error) => {
                    if (error) console.error('OSController: Linux TTS error:', error);
                });
                break;

            case 'win32':
                // Windows TTS using PowerShell
                const psCommand = `
                    Add-Type -AssemblyName System.Speech;
                    (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${escapedText.replace(/'/g, "''")}');
                `;
                exec(`powershell -Command "${psCommand}"`, (error) => {
                    if (error) console.error('OSController: Windows TTS error:', error);
                });
                break;

            case 'darwin':
                // macOS TTS using say command
                exec(`say "${escapedText}"`, (error) => {
                    if (error) console.error('OSController: macOS TTS error:', error);
                });
                break;

            default:
                console.error(`OSController: Unsupported platform ${this.platform} for TTS`);
        }
    }

    undo() {
        const lastAction = this.actionHistory.pop();
        if (lastAction) {
            switch (lastAction.type) {
                case 'type':
                    // Send backspaces to delete the typed text
                    const backspaces = '\b'.repeat(lastAction.text.length);
                    this.typeText(backspaces);
                    break;

                case 'click':
                    // For clicks, we can't really undo, but we can provide feedback
                    console.log('OSController: Cannot undo mouse click');
                    break;

                case 'move':
                    // Could potentially move mouse back, but complex to implement reliably
                    console.log('OSController: Cannot undo mouse move');
                    break;

                default:
                    console.log(`OSController: Cannot undo action type: ${lastAction.type}`);
            }
        }
    }

    // Window management
    minimizeWindow() {
        switch (this.platform) {
            case 'linux':
                exec('xdotool getactivewindow windowminimize', (error) => {
                    if (error) console.error('OSController: Linux minimize error:', error);
                });
                break;
            case 'win32':
                exec('powershell -Command "(New-Object -ComObject WScript.Shell).SendKeys(\'%{DOWN}\')"', (error) => {
                    if (error) console.error('OSController: Windows minimize error:', error);
                });
                break;
            case 'darwin':
                exec('osascript -e \'tell application "System Events" to keystroke "m" using command down\'', (error) => {
                    if (error) console.error('OSController: macOS minimize error:', error);
                });
                break;
        }
        this.actionHistory.push({ type: 'window', action: 'minimize' });
    }

    maximizeWindow() {
        switch (this.platform) {
            case 'linux':
                exec('xdotool getactivewindow windowsize 100% 100%', (error) => {
                    if (error) console.error('OSController: Linux maximize error:', error);
                });
                break;
            case 'win32':
                exec('powershell -Command "(New-Object -ComObject WScript.Shell).SendKeys(\'%{UP}\')"', (error) => {
                    if (error) console.error('OSController: Windows maximize error:', error);
                });
                break;
            case 'darwin':
                exec('osascript -e \'tell application "System Events" to keystroke "f" using {command down, control down}\'', (error) => {
                    if (error) console.error('OSController: macOS maximize error:', error);
                });
                break;
        }
        this.actionHistory.push({ type: 'window', action: 'maximize' });
    }

    closeWindow() {
        switch (this.platform) {
            case 'linux':
                exec('xdotool getactivewindow windowclose', (error) => {
                    if (error) console.error('OSController: Linux close error:', error);
                });
                break;
            case 'win32':
                exec('powershell -Command "(New-Object -ComObject WScript.Shell).SendKeys(\'%{F4}\')"', (error) => {
                    if (error) console.error('OSController: Windows close error:', error);
                });
                break;
            case 'darwin':
                exec('osascript -e \'tell application "System Events" to keystroke "w" using command down\'', (error) => {
                    if (error) console.error('OSController: macOS close error:', error);
                });
                break;
        }
        this.actionHistory.push({ type: 'window', action: 'close' });
    }

    // Advanced keyboard shortcuts
    sendShortcut(modifiers, key) {
        // modifiers: array like ['ctrl', 'alt'], key: string like 'c'
        const modMap = {
            ctrl: 'ctrl',
            alt: 'alt',
            shift: 'shift',
            meta: 'super' // Windows key or Cmd
        };

        switch (this.platform) {
            case 'linux':
                const xdotoolMods = modifiers.map(m => modMap[m] || m).join('+');
                this.executeCommand(`xdotool key ${xdotoolMods}+${key}`, (code) => {
                    if (code !== 0) console.error('OSController: Linux shortcut error, exit code:', code);
                });
                break;

            case 'win32':
                const psMods = modifiers.map(m => {
                    switch(m) {
                        case 'ctrl': return '^';
                        case 'alt': return '%';
                        case 'shift': return '+';
                        case 'meta': return '^{ESC}'; // Windows key
                        default: return '';
                    }
                }).join('');
                this.executeCommand(`powershell -Command "(New-Object -ComObject WScript.Shell).SendKeys('${psMods}{${key.toUpperCase()}}')"`, (code) => {
                    if (code !== 0) console.error('OSController: Windows shortcut error, exit code:', code);
                });
                break;

            case 'darwin':
                const applescriptMods = modifiers.map(m => {
                    switch(m) {
                        case 'ctrl': return 'control';
                        case 'alt': return 'option';
                        case 'shift': return 'shift';
                        case 'meta': return 'command';
                        default: return m;
                    }
                });
                const modString = applescriptMods.join(' down, ') + ' down';
                this.executeCommand(`osascript -e 'tell application "System Events" to keystroke "${key}" using {${modString}}'`, (code) => {
                    if (code !== 0) console.error('OSController: macOS shortcut error, exit code:', code);
                });
                break;
        }

        this.actionHistory.push({ type: 'shortcut', modifiers, key });
    }

    // Predefined common shortcuts
    copy() { this.sendShortcut(['ctrl'], 'c'); }
    paste() { this.sendShortcut(['ctrl'], 'v'); }
    cut() { this.sendShortcut(['ctrl'], 'x'); }
    selectAll() { this.sendShortcut(['ctrl'], 'a'); }
    undoAction() { this.sendShortcut(['ctrl'], 'z'); }
    save() { this.sendShortcut(['ctrl'], 's'); }
    newTab() { this.sendShortcut(['ctrl'], 't'); }
    closeTab() { this.sendShortcut(['ctrl'], 'w'); }

    // Cleanup running processes
    async cleanup() {
        console.log('🧹 Starting comprehensive OSController cleanup...');

        const startTime = Date.now();
        const cleanupPromises = [];

        // Phase 1: Graceful termination of tracked processes
        console.log('📋 Phase 1: Graceful termination of tracked processes');
        for (const childProcess of this.runningProcesses) {
            const cleanupPromise = new Promise((resolve) => {
                try {
                    const pid = childProcess.pid;
                    console.log(`🔄 Terminating process PID ${pid} gracefully...`);

                    if (this.platform === 'linux' || this.platform === 'darwin') {
                        // Send SIGTERM first
                        try {
                            process.kill(pid, 'SIGTERM');
                        } catch (error) {
                            console.warn(`SIGTERM failed for PID ${pid}:`, error.message);
                        }

                        // Wait 2 seconds, then try SIGKILL if still running
                        setTimeout(() => {
                            try {
                                process.kill(pid, 'SIGKILL');
                                console.log(`💀 Force killed PID ${pid} with SIGKILL`);
                            } catch (error) {
                                // Process already terminated
                            }
                            resolve();
                        }, 2000);

                    } else if (this.platform === 'win32') {
                        // Windows termination
                        childProcess.kill();
                        setTimeout(() => {
                            try {
                                childProcess.kill('SIGKILL');
                            } catch (error) {
                                // Process already terminated
                            }
                            resolve();
                        }, 2000);
                    }
                } catch (error) {
                    console.error(`Error terminating process:`, error);
                    resolve(); // Continue with cleanup
                }
            });
            cleanupPromises.push(cleanupPromise);
        }

        // Phase 2: System-wide cleanup of Aura-related processes
        console.log('📋 Phase 2: System-wide cleanup of Aura-related processes');

        if (this.platform === 'linux') {
            // Kill any remaining xdotool processes
            const xdotoolCleanup = this.executeCommandAsync('pkill -f xdotool || true')
                .then(() => console.log('✅ Killed any remaining xdotool processes'));

            // Kill any remaining espeak processes
            const espeakCleanup = this.executeCommandAsync('pkill -f espeak || pkill -f festival || true')
                .then(() => console.log('✅ Killed any remaining TTS processes'));

            cleanupPromises.push(xdotoolCleanup, espeakCleanup);

        } else if (this.platform === 'win32') {
            // Kill PowerShell processes related to Aura
            const powershellCleanup = this.executeCommandAsync('taskkill /F /IM powershell.exe /FI "WINDOWTITLE eq Aura*" || true')
                .then(() => console.log('✅ Killed any remaining PowerShell processes'));

            cleanupPromises.push(powershellCleanup);

        } else if (this.platform === 'darwin') {
            // Kill AppleScript processes
            const applescriptCleanup = this.executeCommandAsync('pkill -f osascript || true')
                .then(() => console.log('✅ Killed any remaining AppleScript processes'));

            cleanupPromises.push(applescriptCleanup);
        }

        // Phase 3: Wait for all cleanup operations to complete
        console.log('📋 Phase 3: Waiting for cleanup completion');
        try {
            await Promise.all(cleanupPromises);
        } catch (error) {
            console.error('Error during cleanup:', error);
        }

        // Phase 4: Final verification and forced cleanup
        console.log('📋 Phase 4: Final verification and forced cleanup');
        await this.finalCleanupSweep();

        // Clear tracking
        this.runningProcesses.clear();

        const duration = Date.now() - startTime;
        console.log(`✅ OSController cleanup completed in ${duration}ms`);
    }

    async executeCommandAsync(command) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, [], {
                shell: true,
                stdio: 'ignore'
            });

            child.on('exit', (code) => {
                if (code === 0 || code === 1) { // Allow exit code 1 (no processes found)
                    resolve();
                } else {
                    reject(new Error(`Command failed with exit code ${code}`));
                }
            });

            child.on('error', (error) => {
                reject(error);
            });
        });
    }

    async finalCleanupSweep() {
        console.log('🔍 Performing final cleanup sweep...');

        try {
            if (this.platform === 'linux') {
                // Use pgrep to find any processes that might be related to our operations
                const result = await new Promise((resolve) => {
                    const child = spawn('pgrep', ['-f', 'xdotool|espeak|festival'], {
                        stdio: ['ignore', 'pipe', 'ignore']
                    });

                    let output = '';
                    child.stdout.on('data', (data) => {
                        output += data.toString();
                    });

                    child.on('exit', () => {
                        resolve(output.trim().split('\n').filter(Boolean));
                    });
                });

                if (result.length > 0) {
                    console.log(`🚨 Found ${result.length} potentially orphaned processes, force killing...`);
                    for (const pid of result) {
                        try {
                            process.kill(parseInt(pid), 'SIGKILL');
                            console.log(`💀 Force killed orphaned PID ${pid}`);
                        } catch (error) {
                            // Process might have already terminated
                        }
                    }
                }

            } else if (this.platform === 'win32') {
                // Windows final sweep - kill any hanging processes
                await this.executeCommandAsync('taskkill /F /IM xdotool.exe || taskkill /F /IM espeak.exe || true');

            } else if (this.platform === 'darwin') {
                // macOS final sweep
                await this.executeCommandAsync('pkill -9 -f "xdotool|espeak|festival|osascript" || true');
            }
        } catch (error) {
            console.warn('Final cleanup sweep encountered error:', error.message);
        }
    }

    getPlatformInfo() {
        const platformNames = {
            linux: 'Linux',
            win32: 'Windows',
            darwin: 'macOS'
        };

        return {
            platform: this.platform,
            name: platformNames[this.platform] || 'Unknown',
            supported: ['linux', 'win32', 'darwin'].includes(this.platform)
        };
    }
}

module.exports = new OSController();

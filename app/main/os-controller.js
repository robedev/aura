const { exec, spawn } = require('child_process');
const fs = require('fs');

class OSController {
    constructor() {
        this.platform = process.platform; // 'linux', 'win32', 'darwin'
        this.actionHistory = [];
        this.runningProcesses = new Set(); // Track running processes
        
        // Linux display server detection
        this.isWayland = false;
        this.hasYdotool = false;
        this.hasXdotool = false;
        this.canUseYdotool = false; // Permission flag
        
        this.originalCursorSize = null; // Store original cursor size

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

    // Cursor management
    setLargeCursor(enable) {
        if (this.platform !== 'linux') return;

        const { exec } = require('child_process');
        const desktopEnv = process.env.XDG_CURRENT_DESKTOP || '';
        console.log(`OSController: Detected Desktop Environment: ${desktopEnv}`);

        if (enable) {
            // GNOME / Unity / Cinnamon / MATE (GTK based)
            if (desktopEnv.includes('GNOME') || desktopEnv.includes('Unity') || desktopEnv.includes('Cinnamon') || desktopEnv.includes('MATE') || desktopEnv === 'ubuntu:GNOME') {
                exec('gsettings get org.gnome.desktop.interface cursor-size', (error, stdout) => {
                    if (!error && stdout) {
                        const currentSize = parseInt(stdout.trim(), 10);
                        if (!isNaN(currentSize)) {
                            if (this.originalCursorSize === null) this.originalCursorSize = currentSize;
                            const newSize = Math.max(48, currentSize * 2); // At least 48px
                            console.log(`OSController: Setting GNOME cursor size to ${newSize}`);
                            this.executeCommand(`gsettings set org.gnome.desktop.interface cursor-size ${newSize}`);
                        }
                    }
                });
            }
            // KDE Plasma
            else if (desktopEnv.includes('KDE')) {
                // KDE requires writing config and reloading
                // Try to read current size first? KDE defaults are often 24
                if (this.originalCursorSize === null) this.originalCursorSize = 24; // Default guess
                const newSize = 48;
                console.log(`OSController: Setting KDE cursor size to ${newSize}`);
                this.executeCommand(`kwriteconfig5 --file kcminputrc --group Mouse --key cursorSize ${newSize}`);
                this.executeCommand(`kwriteconfig6 --file kcminputrc --group Mouse --key cursorSize ${newSize}`); // For Plasma 6
                // Reload configuration
                this.executeCommand('qdbus org.kde.KWin /KWin reconfigure');
                this.executeCommand('kcminit mouse');
            }
            // Hyprland
            else if (desktopEnv.includes('Hyprland')) {
                 if (this.originalCursorSize === null) this.originalCursorSize = 24;
                 const newSize = 48;
                 console.log(`OSController: Setting Hyprland cursor size to ${newSize}`);
                 this.executeCommand(`hyprctl setcursor "Adwaita" ${newSize}`); // Assuming Adwaita theme
            }
            else {
                console.warn(`OSController: Unknown or unsupported DE for cursor sizing: ${desktopEnv}. Trying gsettings fallback.`);
                // Fallback attempt
                this.executeCommand(`gsettings set org.gnome.desktop.interface cursor-size 48`);
            }
        } else {
            // Restore logic
            if (this.originalCursorSize) {
                console.log(`OSController: Restoring cursor size to ${this.originalCursorSize}`);
                
                if (desktopEnv.includes('GNOME') || desktopEnv.includes('Unity')) {
                    this.executeCommand(`gsettings set org.gnome.desktop.interface cursor-size ${this.originalCursorSize}`);
                } 
                else if (desktopEnv.includes('KDE')) {
                    this.executeCommand(`kwriteconfig5 --file kcminputrc --group Mouse --key cursorSize ${this.originalCursorSize}`);
                    this.executeCommand(`kwriteconfig6 --file kcminputrc --group Mouse --key cursorSize ${this.originalCursorSize}`);
                    this.executeCommand('qdbus org.kde.KWin /KWin reconfigure');
                    this.executeCommand('kcminit mouse');
                }
                else if (desktopEnv.includes('Hyprland')) {
                    this.executeCommand(`hyprctl setcursor "Adwaita" ${this.originalCursorSize}`);
                }
                else {
                    this.executeCommand(`gsettings set org.gnome.desktop.interface cursor-size ${this.originalCursorSize}`);
                }
                
                this.originalCursorSize = null;
            }
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
        // Detect display server (Wayland vs X11)
        const sessionType = process.env.XDG_SESSION_TYPE;
        const waylandDisplay = process.env.WAYLAND_DISPLAY;
        
        this.isWayland = sessionType === 'wayland' || !!waylandDisplay;
        
        if (this.isWayland) {
            console.log('OSController: Wayland session detected');
        } else {
            console.log('OSController: X11 session detected');
        }
        
        // Check if ydotool is available (works on both Wayland and X11)
        exec('which ydotool', (error) => {
            if (!error) {
                this.hasYdotool = true;
                console.log('OSController: ydotool found ✓');
                
                // Check if ydotoold daemon is running
                exec('pgrep ydotoold', (daemonError) => {
                    if (daemonError) {
                        console.warn('OSController: ydotoold daemon not running. Start it with: sudo ydotoold &');
                        console.warn('OSController: Or add to systemd: sudo systemctl enable --now ydotool');
                    } else {
                        console.log('OSController: ydotoold daemon running ✓');
                        
                        // Check socket permissions
                        const socketPath = process.env.YDOTOOL_SOCKET || '/tmp/.ydotool_socket';
                        fs.access(socketPath, fs.constants.W_OK, (err) => {
                            if (err) {
                                console.error('\n❌ CRITICAL: No permission to write to ydotool socket!');
                                console.error(`   Path: ${socketPath}`);
                                console.error('   Fix command: sudo chmod 666 ' + socketPath);
                                console.error('   Without this, mouse control will NOT work.\n');
                                this.canUseYdotool = false;
                            } else {
                                console.log('OSController: ydotool socket writable ✓');
                                this.canUseYdotool = true;
                            }
                        });
                    }
                });
            } else {
                console.log('OSController: ydotool not found');
                if (this.isWayland) {
                    console.error('OSController: ⚠️ Wayland detected but ydotool not installed!');
                    console.error('OSController: Install ydotool for mouse control on Wayland:');
                    console.error('OSController:   Ubuntu/Debian: sudo apt install ydotool');
                    console.error('OSController:   Fedora: sudo dnf install ydotool');
                    console.error('OSController:   Arch: sudo pacman -S ydotool');
                    console.error('OSController: Then start the daemon: sudo ydotoold &');
                }
            }
        });
        
        // Check if xdotool is available (X11 only)
        exec('which xdotool', (error) => {
            if (!error) {
                this.hasXdotool = true;
                console.log('OSController: xdotool found ✓');
            } else {
                console.log('OSController: xdotool not found');
                if (!this.isWayland) {
                    console.error('OSController: Install xdotool: sudo apt-get install xdotool');
                }
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

    moveMouseRelative(dx, dy) {
        if (isNaN(dx) || isNaN(dy) || (dx === 0 && dy === 0)) return;

        // Apply gain/sensitivity at OS level if needed (optional)
        const moveX = Math.round(dx);
        const moveY = Math.round(dy);

        switch (this.platform) {
            case 'linux':
                if (this.isWayland || (this.hasYdotool && !this.hasXdotool)) {
                    if (!this.canUseYdotool) return;
                    const socketPath = process.env.YDOTOOL_SOCKET || '/tmp/.ydotool_socket';
                    // ydotool mousemove (without -a is relative)
                    this.executeCommand(`YDOTOOL_SOCKET=${socketPath} ydotool mousemove -x ${moveX} -y ${moveY}`);
                } else {
                    this.executeCommand(`xdotool mousemove_relative -- ${moveX} ${moveY}`);
                }
                break;

            case 'win32':
                // Windows relative move requires native call or complex powershell
                // Fallback to getting current pos + delta (less precise but functional without native modules)
                // Note: Getting cursor pos in pure PowerShell is slow, better to just rely on absolute if possible
                // But for consistency:
                /* 
                   Ideally we would use mouse_event with MOUSEEVENTF_MOVE (0x0001)
                */
                const psCommand = `
                    Add-Type -TypeDefinition @"
                    using System.Runtime.InteropServices;
                    public class Mouse {
                        [DllImport("user32.dll")]
                        public static extern void mouse_event(uint dwFlags, int dx, int dy, int dwData, int dwExtraInfo);
                    }
                    "@;
                    [Mouse]::mouse_event(0x0001, ${moveX}, ${moveY}, 0, 0);
                `;
                this.executeCommand(`powershell -Command "${psCommand}"`, (code) => {
                     if (code !== 0) console.error('OSController: Windows relative move error', code);
                });
                break;

            case 'darwin':
                // macOS relative move - clunky with Applescript, better to use absolute mapping in tracker
                // But if forced:
                const appleScript = `
                    try
                        tell application "System Events"
                            set {currX, currY} to position of mouse
                            set position of mouse to {currX + ${moveX}, currY + ${moveY}}
                        end tell
                    end try
                `;
                this.executeCommand(`osascript -e '${appleScript}'`);
                break;
        }
        
        this.actionHistory.push({ type: 'move_relative', dx, dy });
    }

    moveMouse(x, y) {
        // Validate and clamp coordinates to reasonable bounds
        const screenWidth = 3840;  // Max reasonable screen width
        const screenHeight = 2160; // Max reasonable screen height
        
        // Ensure inputs are numbers
        if (isNaN(x) || isNaN(y)) {
            console.warn('OSController: Ignored invalid coordinates (NaN)');
            return;
        }

        const coords = { 
            x: Math.max(0, Math.min(Math.round(x), screenWidth)), 
            y: Math.max(0, Math.min(Math.round(y), screenHeight)) 
        };
        
        // Detailed debug for troubleshooting fixed cursor
        if (Math.random() < 0.05) {
             console.log(`OSController: ACTION -> move ${coords.x}, ${coords.y}`);
        }

        switch (this.platform) {
            case 'linux':
                // Use ydotool for Wayland, or if available and xdotool fails
                if (this.isWayland || (this.hasYdotool && !this.hasXdotool)) {
                    if (!this.canUseYdotool) return; // Prevent log spam if permissions are missing

                    // Use YDOTOOL_SOCKET env var to find the daemon socket
                    const socketPath = process.env.YDOTOOL_SOCKET || '/tmp/.ydotool_socket';
                    this.executeCommand(`YDOTOOL_SOCKET=${socketPath} ydotool mousemove -a -x ${coords.x} -y ${coords.y}`, (code) => {
                        if (code !== 0) {
                            console.error('OSController: ydotool mouse move error, exit code:', code);
                            if (code === 1) {
                                console.error('OSController: Make sure ydotoold daemon is running: sudo ydotoold &');
                            }
                        }
                    });
                } else {
                    // Use xdotool for X11
                    this.executeCommand(`xdotool mousemove ${coords.x} ${coords.y}`, (code) => {
                        if (code !== 0) {
                            console.error('OSController: xdotool mouse move error, exit code:', code);
                            // Try ydotool as fallback if available
                            if (this.hasYdotool) {
                                console.log('OSController: Trying ydotool as fallback...');
                                const socketPath = process.env.YDOTOOL_SOCKET || '/tmp/.ydotool_socket';
                                this.executeCommand(`YDOTOOL_SOCKET=${socketPath} ydotool mousemove -a -x ${coords.x} -y ${coords.y}`);
                            }
                        }
                    });
                }
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
        // Button mappings are different for xdotool vs ydotool
        const xdotoolButtonMap = { left: 1, right: 3, middle: 2 };
        const ydotoolButtonMap = { left: '0xC0', right: '0xC1', middle: '0xC2' }; // ydotool button codes
        
        switch (this.platform) {
            case 'linux':
                if (this.isWayland || (this.hasYdotool && !this.hasXdotool)) {
                    if (!this.canUseYdotool) return;

                    // ydotool click: 0xC0=left, 0xC1=right, 0xC2=middle
                    const ydoBtn = ydotoolButtonMap[button] || '0xC0';
                    const socketPath = process.env.YDOTOOL_SOCKET || '/tmp/.ydotool_socket';
                    exec(`YDOTOOL_SOCKET=${socketPath} ydotool click ${ydoBtn}`, (error) => {
                        if (error) {
                            console.error('OSController: ydotool click error:', error.message);
                            console.error('OSController: Make sure ydotoold daemon is running');
                        }
                    });
                } else {
                    const xdoBtn = xdotoolButtonMap[button] || 1;
                    exec(`xdotool click ${xdoBtn}`, (error) => {
                        if (error) {
                            console.error('OSController: xdotool click error:', error.message);
                            // Try ydotool as fallback
                            if (this.hasYdotool) {
                                const ydoBtn = ydotoolButtonMap[button] || '0xC0';
                                const socketPath = process.env.YDOTOOL_SOCKET || '/tmp/.ydotool_socket';
                                exec(`YDOTOOL_SOCKET=${socketPath} ydotool click ${ydoBtn}`);
                            }
                        }
                    });
                }
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
        switch (this.platform) {
            case 'linux':
                if (this.isWayland || (this.hasYdotool && !this.hasXdotool)) {
                    // ydotool wheel: negative = up, positive = down
                    const wheelAmount = direction === 'up' ? -3 : 3;
                    const socketPath = process.env.YDOTOOL_SOCKET || '/tmp/.ydotool_socket';
                    exec(`YDOTOOL_SOCKET=${socketPath} ydotool mousemove -w -- 0 ${wheelAmount}`, (error) => {
                        if (error) console.error('OSController: ydotool scroll error:', error.message);
                    });
                } else {
                    const scrollDirection = direction === 'up' ? 4 : 5; // xdotool: 4=up, 5=down
                    exec(`xdotool click ${scrollDirection}`, (error) => {
                        if (error) {
                            console.error('OSController: xdotool scroll error:', error.message);
                            // Try ydotool as fallback
                            if (this.hasYdotool) {
                                const wheelAmount = direction === 'up' ? -3 : 3;
                                const socketPath = process.env.YDOTOOL_SOCKET || '/tmp/.ydotool_socket';
                                exec(`YDOTOOL_SOCKET=${socketPath} ydotool mousemove -w -- 0 ${wheelAmount}`);
                            }
                        }
                    });
                }
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
                if (this.isWayland || (this.hasYdotool && !this.hasXdotool)) {
                    // ydotool doesn't have a simple drag command, simulate with mouse down/move/up
                    const socketPath = process.env.YDOTOOL_SOCKET || '/tmp/.ydotool_socket';
                    exec(`YDOTOOL_SOCKET=${socketPath} ydotool mousemove -a -x ${startX} -y ${startY} && YDOTOOL_SOCKET=${socketPath} ydotool click 0xC0 -D && YDOTOOL_SOCKET=${socketPath} ydotool mousemove -a -x ${endX} -y ${endY} && YDOTOOL_SOCKET=${socketPath} ydotool click 0xC0 -U`, (error) => {
                        if (error) console.error('OSController: ydotool drag error:', error.message);
                    });
                } else {
                    exec(`xdotool mousedown 1 mousemove ${endX} ${endY} mouseup 1`, (error) => {
                        if (error) console.error('OSController: xdotool drag error:', error.message);
                    });
                }
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
                    switch (m) {
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
                    switch (m) {
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

    // Release any held keys before shutdown
    async releaseAllKeys() {
        if (this.platform === 'linux') {
            try {
                console.log('🔓 Releasing all keyboard keys...');

                // CRITICAL: Kill any existing xdotool processes FIRST to prevent conflicts
                console.log('🔪 Killing any existing xdotool processes...');
                await this.executeCommandAsync('pkill -9 xdotool || true');

                // Wait a moment for processes to die
                await new Promise(resolve => setTimeout(resolve, 100));

                // Release keys in smaller batches to prevent hanging
                // Batch 1: Modifiers (most critical)
                const modifiers = 'Meta_L Meta_R Alt_L Alt_R Control_L Control_R Shift_L Shift_R Caps_Lock';
                await this.executeCommandAsync(`xdotool keyup ${modifiers} 2>/dev/null || true`);

                // Batch 2: Common letters (including 'c' which was the problem)
                const commonLetters = 'a b c d e f g h i j k l m n o p q r s t u v w x y z';
                await this.executeCommandAsync(`xdotool keyup ${commonLetters} 2>/dev/null || true`);

                // Batch 3: Numbers and special keys
                const numbersAndSpecials = '0 1 2 3 4 5 6 7 8 9 space Return BackSpace Tab Escape';
                await this.executeCommandAsync(`xdotool keyup ${numbersAndSpecials} 2>/dev/null || true`);

                console.log('✅ All keyboard keys released');
            } catch (error) {
                console.error('⚠️ Error releasing keys:', error.message);
                // Don't throw - we want cleanup to continue
            } finally {
                // Final safety: kill any xdotool processes that might have spawned
                try {
                    await this.executeCommandAsync('pkill -9 xdotool || true');
                } catch (e) {
                    // Ignore
                }
            }
        } else if (this.platform === 'win32') {
            // Windows key release implementation
            try {
                console.log('🔓 Releasing all keyboard keys (Windows)...');
                // Release all keys using PowerShell
                const psCommand = `
                    Add-Type -AssemblyName System.Windows.Forms;
                    [System.Windows.Forms.SendKeys]::Flush();
                `;
                await this.executeCommandAsync(`powershell -Command "${psCommand}" || true`);
                console.log('✅ All keyboard keys released (Windows)');
            } catch (error) {
                console.error('⚠️ Error releasing keys (Windows):', error.message);
            }
        } else if (this.platform === 'darwin') {
            // macOS key release implementation
            try {
                console.log('🔓 Releasing all keyboard keys (macOS)...');
                // macOS doesn't have the same issue, but we'll add a safety measure
                await this.executeCommandAsync(`osascript -e 'tell application "System Events" to key up {command, option, control, shift}' || true`);
                console.log('✅ All keyboard keys released (macOS)');
            } catch (error) {
                console.error('⚠️ Error releasing keys (macOS):', error.message);
            }
        }
    }

    // Cleanup running processes
    async cleanup() {
        console.log('🧹 Starting comprehensive OSController cleanup...');
        const startTime = Date.now();

        // Phase 0: Safety key release
        await this.releaseAllKeys();
        
        // Restore cursor size
        this.setLargeCursor(false);

        // Phase 1: Aggressive termination of tracked processes
        console.log('📋 Phase 1: Termination of tracked processes');
        const killPromises = [];

        for (const childProcess of this.runningProcesses) {
            killPromises.push(new Promise(resolve => {
                try {
                    if (childProcess.pid) {
                        process.kill(childProcess.pid, 'SIGKILL'); // Go straight to SIGKILL
                    }
                } catch (e) { }
                resolve();
            }));
        }

        await Promise.all(killPromises);

        // Phase 2: System-wide cleanup of Aura-related processes
        console.log('📋 Phase 2: System-wide cleanup of Aura-related processes');
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

            child.on('exit', (code, signal) => {
                if (code === 0 || code === 1 || code === null) {
                    resolve();
                } else {
                    reject(new Error(`Command failed with exit code ${code}`));
                }
            });

            child.on('error', (error) => {
                // Don't reject on error during cleanup, just log
                console.warn('Command execution warning:', error.message);
                resolve();
            });
        });
    }

    async finalCleanupSweep() {
        console.log('🔍 Performing final cleanup sweep...');

        try {
            if (this.platform === 'linux') {
                // Aggressive cleanup call
                // Kill specific process names associated with our automation
                const commands = [
                    'pkill -9 -f xdotool || true',
                    'pkill -9 -f ydotool || true',
                    'pkill -9 -f espeak || true',
                    'pkill -9 -f festival || true'
                ];

                for (const cmd of commands) {
                    await this.executeCommandAsync(cmd);
                }

            } else if (this.platform === 'win32') {
                await this.executeCommandAsync('taskkill /F /IM xdotool.exe /IM espeak.exe /IM powershell.exe /FI "WINDOWTITLE eq Aura*" || true');
            } else if (this.platform === 'darwin') {
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

        let displayServer = '';
        if (this.platform === 'linux') {
            displayServer = this.isWayland ? ' (Wayland)' : ' (X11)';
        }

        const inputTool = this.platform === 'linux' 
            ? (this.isWayland 
                ? (this.hasYdotool ? 'ydotool ✓' : 'ydotool ✗ - instalar para control del mouse')
                : (this.hasXdotool ? 'xdotool ✓' : (this.hasYdotool ? 'ydotool ✓' : 'xdotool ✗')))
            : '';

        return {
            platform: this.platform,
            name: platformNames[this.platform] + displayServer || 'Unknown',
            supported: ['linux', 'win32', 'darwin'].includes(this.platform),
            isWayland: this.isWayland,
            inputTool: inputTool
        };
    }
}

module.exports = new OSController();

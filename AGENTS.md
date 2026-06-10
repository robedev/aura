# Aura Agent Guidelines

This document provides guidelines for AI coding agents working on the Aura accessibility application. Aura is an Electron-based facial gesture control system designed for people with quadriplegia.

## Build, Test, and Development Commands

### Core Commands
- `pnpm start` - Launch the Electron application in development mode
- `pnpm run build` - Build the application using electron-builder
- `pnpm run dist` - Build distributable packages for all platforms (Linux: .AppImage + .deb, Windows: .exe, macOS: .dmg)

### Testing Commands
- `pnpm test` - Currently a placeholder (no tests implemented)
- `pnpm run test-gestures` - Automated testing of gesture detection stability and false positive analysis
- `pnpm run test-cleanup` - Verify proper process cleanup (ensures no orphaned processes remain)
- `pnpm run check-platform` - Comprehensive platform compatibility check (dependencies, hardware, permissions)

### Development Setup
- `pnpm run install-deps` - Install platform-specific system dependencies automatically
- `pnpm install` - Install Node.js dependencies

### Single Test Execution
Currently, there is no framework for running individual tests. The testing approach focuses on:
- Integration testing via `pnpm run test-gestures` (analyzes gesture detection behavior)
- Process cleanup verification via `pnpm run test-cleanup`
- Platform compatibility testing via `pnpm run check-platform`

## Code Style Guidelines

### Language and Module System
- **JavaScript ES6+** with CommonJS modules (`require`/`module.exports`)
- **No TypeScript** or type checking currently configured
- **No linting** tools currently configured (ESLint, Prettier, etc.)

### Naming Conventions
- **Variables and functions**: camelCase (`faceTracker`, `startCalibration`)
- **Files**: kebab-case with dashes (`face-tracking.js`, `os-controller.js`)
- **Classes**: PascalCase (`FaceTracker`, `RuleEngine`)
- **Constants**: UPPER_SNAKE_CASE where applicable
- **HTML IDs**: camelCase or kebab-case (`calibrateBtn`, `settings-panel`)

### Code Structure and Organization
- **Modular architecture**: Separate concerns into dedicated files
- **Event-driven design**: Extensive use of IPC communication and event listeners
- **State machines**: Clear state management with defined transitions
- **Comprehensive cleanup**: Every component must implement proper resource cleanup

### Comments and Documentation
- **Comments in Spanish** (following project convention)
- **Extensive logging**: Use console.log with emoji prefixes for debugging
- **Function documentation**: Describe purpose, parameters, and return values
- **TODO comments**: Mark areas needing improvement or future features

### Error Handling
- **Try-catch blocks** around critical operations
- **Graceful degradation**: Continue operation with limited functionality when possible
- **User-friendly error messages**: Translate technical errors to actionable user guidance
- **Process cleanup on errors**: Ensure resources are freed even during failures

### Security and Privacy
- **Local processing only**: All face tracking and gesture recognition happens locally
- **No data transmission**: Facial data never leaves the user's device
- **Permission management**: Explicit camera/microphone permission handling
- **Resource cleanup**: Prevent any background processes or orphaned resources

### Performance Considerations
- **Efficient algorithms**: Use appropriate data structures and algorithms
- **Resource management**: Explicit cleanup of MediaPipe resources, camera streams
- **Memory management**: Avoid memory leaks through proper cleanup patterns
- **UI responsiveness**: Non-blocking operations with async/await patterns

### Platform-Specific Code
- **Abstraction layer**: Use `os-controller.js` for cross-platform operations
- **Conditional logic**: Handle platform differences (Linux/Windows/macOS)
- **Dependency management**: Platform-specific system tools (xdotool, PowerShell, AppleScript)

### Logging and Debugging
- **Emoji-prefixed logs**: Use consistent emoji indicators (🚀 ✅ ❌ ⚠️ 🛠️)
- **Debug helpers**: Global debug objects like `window.debugAura`
- **Development tools**: DevTools integration with hot-reload capabilities
- **Error categorization**: Clear distinction between warnings, errors, and info messages

### Testing Philosophy
- **Integration-focused**: Test complete workflows rather than isolated units
- **User-centric validation**: Ensure features work end-to-end for accessibility users
- **Platform verification**: Automated checks for cross-platform compatibility
- **Resource cleanup validation**: Ensure no processes remain after application closure

### File Organization
```
app/
├── main/           # Electron main process (Node.js)
├── renderer/       # Frontend (HTML/CSS/JS)
├── vision/         # MediaPipe face tracking
└── profiles/       # User configuration profiles
scripts/            # Build and test utilities
```

### Commit Message Conventions
- **English messages**: Use clear, descriptive English commit messages
- **Feature prefixes**: Indicate type of change (feat:, fix:, docs:, refactor:)
- **Descriptive but concise**: Explain what changed and why

### Code Review Checklist
- [ ] Platform compatibility (Linux/Windows/macOS)
- [ ] Proper error handling and user feedback
- [ ] Resource cleanup implementation
- [ ] Security considerations (no data transmission)
- [ ] Accessibility compliance (WCAG guidelines)
- [ ] Performance impact assessment
- [ ] Testing verification (gesture detection, cleanup)
- [ ] Documentation updates (Spanish comments)
- [ ] IPC communication safety
- [ ] State management correctness

### Development Workflow
1. **Feature development**: Create feature branch from main
2. **Platform testing**: Verify on target platforms
3. **Integration testing**: Run `pnpm run test-gestures` and `pnpm run test-cleanup`
4. **Code review**: Follow checklist above
5. **Merge**: Squash merge with clear commit message

### Key Architecture Principles
- **Zero-trust security**: Assume failures and handle gracefully
- **Progressive enhancement**: Core functionality works without advanced features
- **User-first design**: All decisions prioritize accessibility users
- **Maintainable code**: Clear separation of concerns and documentation
- **Future-proofing**: Design for extensibility and adaptation

### Performance Targets
- **Face tracking**: 30+ FPS processing speed
- **Gesture detection**: <100ms response time
- **Memory usage**: <200MB steady state
- **CPU usage**: <20% during active tracking
- **Startup time**: <5 seconds cold start

### Accessibility Guidelines
- **WCAG 2.1 AA compliance**: Follow web accessibility standards
- **Keyboard navigation**: All functions accessible via keyboard alternatives
- **High contrast**: Support for high-contrast color schemes
- **Screen reader compatibility**: Proper ARIA labels and semantic HTML
- **Emergency controls**: Always-available pause/reset functionality

---

*This document should be updated as the project evolves. Last updated: January 2026*</content>
<parameter name="filePath">/home/biomasa/Descargas/Programación/00-EDITORES IA/OpenCode/Aura/AGENTS.md
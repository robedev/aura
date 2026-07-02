# Aura — Características Pendientes de Implementación

> Documento generado el 30/06/2026 tras el Sprint 1 (v0.2.4).
> Organizado por sprint y prioridad de implementación.
>
> **Actualización 01/07/2026:** Sprint 2 completado en v0.3.0 (M2, M3 y M4 implementados).
> **Actualización 01/07/2026:** Sprint 3 completado en v0.4.0 (N5, N3 y N1 implementados).
> **Actualización 01/07/2026:** Sprint 4 completado en v0.5.0 (M6, M5, N6, N4 y N2-experimental implementados). Solo queda el Bug 5 por evaluar.

---

## Sprint 2 — Mejoras de base ✅ COMPLETADO (v0.3.0)

### M2 · Calibración de thresholds por usuario

**Problema actual:** La calibración solo registra la posición neutral de la cabeza (3 segundos al arranque). Los umbrales de detección de gestos (`eyebrowThreshold`, `mouthThreshold`, `headTiltThreshold`) son fijos en el perfil y se ajustan manualmente desde el panel de configuración.

**Objetivo:** Wizard guiado donde el usuario realiza cada gesto una vez y el sistema calcula automáticamente el umbral óptimo para esa persona.

**Flujo propuesto:**
1. Botón "Calibrar gestos" en el panel de configuración abre el wizard
2. Pantalla 1: "Mantén tu expresión neutral 3 segundos" → registra baseline
3. Pantalla 2: "Levanta las cejas todo lo que puedas" → registra `eyebrowMax`
4. Pantalla 3: "Abre la boca ampliamente" → registra `mouthMax`
5. Pantalla 4: "Inclina la cabeza a la izquierda" / "a la derecha" → registra `headTiltMax`
6. El sistema calcula umbrales al 60% del rango máximo detectado
7. Guarda en `profile.calibration.calibratedThresholds` (ya existe la propiedad)

**Archivos a modificar:**
- `app/vision/face-tracking.js` — `performAutomaticCalibration()` ya existe como base; extender para wizard multi-gesto
- `app/main/main.js` — nuevo IPC `start-gesture-calibration` / `gesture-calibration-step`
- `app/main/profile-manager.js` — `updateCalibratedThresholds()` ya existe
- `app/renderer/app.js` — UI del wizard (modal con instrucciones paso a paso)
- `app/renderer/index.html` — añadir modal de calibración

---

### M3 · Motor de reglas con prioridades y condiciones OR

**Problema actual:** `rules-engine.js` solo soporta condiciones AND implícitas (todos los gestos del objeto `condition` deben ser `true`) y ejecuta únicamente la primera regla coincidente. No hay forma de dar preferencia a unas reglas sobre otras.

**Objetivo:** Extender el motor de reglas sin romper compatibilidad con reglas existentes.

**Cambios en el formato de regla:**
```json
{
  "gesture": "mouthOpen",
  "action": "click",
  "param": "",
  "priority": 10,
  "anyOf": ["mouthOpen", "dwellPlusMouthOpen"]
}
```

- `priority` (número, opcional): mayor número = mayor prioridad. Sin `priority`, usa el orden de inserción.
- `anyOf` (array, opcional): la regla se activa si CUALQUIERA de los gestos listados es `true` (OR). Si está presente, ignora `gesture`.
- Compatibilidad: reglas sin `priority` ni `anyOf` se comportan exactamente igual que antes.

**Archivos a modificar:**
- `app/main/rules-engine.js` — refactorizar `evaluate()` para ordenar por `priority` y soportar `anyOf`
- `app/main/main.js` — actualizar la traducción de reglas JSON → condiciones del engine
- `app/renderer/app.js` — añadir selector de prioridad y toggle AND/OR en el editor de reglas
- `app/renderer/index.html` — campos adicionales en el formulario de reglas

---

### M4 · Completar Smart Scanning

**Problema actual:** El ciclo de escaneo ROW→COLUMN está implementado parcialmente. La barra de predicciones (`predictionBar`) no es seleccionable dentro del ciclo de escaneo. El índice `scanRowIndex === -1` representa la barra de predicciones pero la lógica de selección solo toma el primer chip sin permitir navegar entre ellos.

**Objetivo:** Ciclo de escaneo completo: Barra de predicciones → filas del teclado → teclas individuales, con retroalimentación visual de dwell en cada elemento activo.

**Flujo corregido:**
```
Estado: isScanningRow = true
  → scanRowIndex = -1  (prediction bar)
    → isScanningRow = false → scanSuggestionIndex = 0..N  (chips)
      → click chip seleccionado
  → scanRowIndex = 0..4  (filas del teclado)
    → isScanningRow = false → scanKeyIndex = 0..9  (teclas)
      → click tecla seleccionada
```

**Cambios:**
- `app/renderer/app.js`:
  - Añadir `scanSuggestionIndex` al estado `smartKeyboardState`
  - Corregir `handleSmartSelect()` para navegar chips de predicción
  - `startSmartScanning()`: incluir prediction bar en el ciclo
  - Activar animación del `.dwell-indicator` durante el escaneo (ya existe en DOM desde v0.2.4)
- `app/renderer/styles/smart-keyboard.css`:
  - Animar `.dwell-indicator` con `transition: transform linear var(--dwell-duration)`
  - Variable CSS `--dwell-duration` sincronizada con `dwellTime` del perfil

---

## Sprint 3 — Nuevas características ✅ COMPLETADO (v0.4.0)

### N1 ⭐ · Integración Claude AI para sugerencias contextuales

**Objetivo:** Usar Claude Haiku 4.5 (baja latencia, bajo coste) como capa de sugerencias inteligentes en el teclado, complementando el predictor Trie+Bigramas existente cuando este no tiene suficiente contexto.

**Casos de uso:**
1. Completar frases cuando el usuario lleva 3+ palabras escritas
2. Sugerir respuestas rápidas a preguntas frecuentes detectadas en el texto
3. Corrección ortográfica contextual antes de enviar

**Arquitectura propuesta:**
```
Renderer (app.js)
  → IPC 'ai-suggest' { text: "texto parcial", context: "últimas 2 frases" }
  → Main (main.js)
    → Anthropic SDK (claude-haiku-4-5-20251001)
    → Streaming de 5 sugerencias
  → IPC 'ai-suggestions' [array de strings]
  → Renderer: mostrar chips con ícono ✨ diferenciado de los chips del Predictor local
```

**Privacidad:** Solo se envía el texto parcial que el usuario está escribiendo — NUNCA video, landmarks, ni datos de identificación.

**Archivos a crear/modificar:**
- `app/main/ai-service.js` (nuevo) — cliente Anthropic SDK, streaming, cache de contexto
- `app/main/main.js` — IPC handler `ai-suggest`; cargar `ANTHROPIC_API_KEY` desde variable de entorno
- `app/renderer/app.js` — llamar `ai-suggest` cuando predictor local devuelve < 3 sugerencias; mostrar chips ✨
- `app/renderer/styles/smart-keyboard.css` — estilo diferenciado para `.suggestion-chip.ai`
- `.env.example` (nuevo) — documentar `ANTHROPIC_API_KEY=`
- `package.json` — añadir `@anthropic-ai/sdk` como dependencia

**Consultar `/claude-api` antes de implementar** para modelo ID actualizado, pricing y parámetros de streaming.

---

### N3 · Onboarding wizard interactivo

**Objetivo:** Primera vez que se abre la app, mostrar un tutorial guiado de 5 pasos que reduzca la barrera de entrada sin necesidad de leer documentación externa.

**Pasos del wizard:**
1. **Bienvenida** — Explicación breve de qué es Aura y cómo funciona (30 segundos)
2. **Posición de cámara** — Guía visual para centrar el rostro en el encuadre
3. **Calibración de posición neutral** — Instrucción: "Mira al centro de la pantalla y mantén la posición" (3s)
4. **Prueba de gestos** — El usuario prueba cada gesto básico (cejas, boca, cabeza) con feedback visual inmediato
5. **Reglas iniciales** — Configurar automáticamente las 3 reglas más útiles según el gesto más cómodo detectado en el paso 4

**Trigger:** `profile.onboardingCompleted === false` (o campo ausente). Tras completar el wizard, establecer `profile.onboardingCompleted = true`.

**Archivos a crear/modificar:**
- `app/renderer/app.js` — lógica del wizard (estado, transiciones entre pasos)
- `app/renderer/index.html` — modal de onboarding con overlay
- `app/renderer/styles/` — `onboarding.css` (nuevo)
- `app/main/profile-manager.js` — añadir `onboardingCompleted: false` al perfil por defecto

---

### N5 · TTS proactivo de estado y fatiga

**Objetivo:** La app anuncia eventos importantes en voz usando espeak/festival (ya integrados en `os-controller.js`) sin que el usuario tenga que leer la pantalla.

**Eventos a anunciar:**
| Evento | Mensaje |
|--------|---------|
| Calibración completada | "Calibración lista" |
| Fatiga detectada (umbral adaptativo) | "Descansemos un momento" |
| Gesto de pausa de emergencia activado | "Sistema pausado" |
| Sistema reanudado | "Sistema activo" |
| Error de cámara | "Cámara no disponible" |
| Regla ejecutada (opcional, configurable) | "Acción ejecutada" |

**Implementación:** Bajo coste — `osController.readText(mensaje)` ya funciona en las tres plataformas. Solo requiere añadir las llamadas en los puntos correctos.

**Archivos a modificar:**
- `app/main/main.js` — llamar `osController.readText()` en los handlers IPC de los eventos listados
- `app/renderer/app.js` — emitir IPC `tts-announce` desde el renderer cuando detecta fatiga (via `adaptation-update`)
- `app/main/profile-manager.js` — añadir `ttsAnnouncements: { enabled: true, fatigue: true, actions: false }` al perfil

---

## Sprint 4 — Madurez del sistema ✅ COMPLETADO (v0.5.0)

> N2 implementado como **experimental**: la precisión real del mapeo iris→pantalla
> debe validarse con usuarios; puede requerir ajustar el suavizado (gazeAlpha) o
> el dwell de 1.5s según los resultados.

### M5 · Multi-perfil

**Problema actual:** Solo existe `app/profiles/default.json`. No hay forma de cambiar de perfil sin editar el archivo manualmente.

**Objetivo:** Soporte para múltiples perfiles (ej. "Trabajo", "Hogar", "Terapia") con selector en la UI y carga dinámica sin reiniciar la aplicación.

**Cambios:**
- `app/main/profile-manager.js` — refactorizar para aceptar nombre de perfil dinámico; método `listProfiles()`, `switchProfile(name)`, `createProfile(name)`
- `app/main/main.js` — IPC `list-profiles`, `switch-profile`, `create-profile`
- `app/renderer/app.js` — selector de perfil en el header; recarga de reglas y thresholds al cambiar
- `app/renderer/index.html` — dropdown de perfiles en la barra superior

---

### M6 · Panel de estadísticas de uso

**Objetivo:** Vista dedicada para que el usuario (o terapeuta) analice el uso de Aura.

**Métricas a mostrar:**
- Gestos más ejecutados (top 5 por frecuencia)
- Tasa de activaciones accidentales (%) por gesto
- Evolución de thresholds adaptativos (gráfico de línea simple)
- Tiempo medio de uso por sesión
- Palabras más predichas por el teclado inteligente

**Fuente de datos:** `profile.calibration.adaptationHistory` (hasta 50 registros) y `predictor.getLearnings()`.

**Implementación:** Panel nuevo dentro de `settingsPanel` o modal separado. Gráficos con Canvas 2D nativo (sin dependencias externas).

**Archivos a modificar:**
- `app/renderer/app.js` — función `renderStatsPanel()`
- `app/renderer/index.html` — botón "ESTADÍSTICAS" y contenedor del panel
- `app/renderer/styles/` — `stats-panel.css` (nuevo)

---

### N2 · Eye-spelling (deletreo por mirada)

**Objetivo:** Modo de entrada de texto basado exclusivamente en el movimiento de los ojos. El usuario "mira" a celdas de un teclado 5×6 proyectado en pantalla para deletrear letra a letra.

**Requisito técnico crítico:** La precisión actual del tracking de iris en `face-tracking.js` solo detecta extremos (`gazeExtremeLeft`, `gazeExtremeRight`, `gazeUp`). Para eye-spelling se necesita resolución de al menos 5×3 zonas. Requiere recalibración del iris relativa al ojo y posiblemente aumentar `minTrackingConfidence` en FaceMesh.

**Implementación sugerida:**
1. Fase de investigación: medir la precisión alcanzable con los landmarks de iris disponibles (468-477)
2. Calibración 9-puntos: el usuario mira a 9 puntos de referencia en pantalla para mapear iris→pantalla
3. Grid 5×6 de letras con highlight por zona de mirada
4. Dwell 1.5s sobre una celda → selección

**Archivos a crear/modificar:**
- `app/vision/face-tracking.js` — método `getIrisScreenPosition()` con calibración de 9 puntos
- `app/renderer/app.js` — modo eye-spelling, grid de letras, lógica de selección por zona
- `app/renderer/index.html` — canvas overlay para el grid de eye-spelling

---

### N4 · Sistema de plugins de acciones personalizadas

**Objetivo:** Permitir que el usuario o terapeuta añada scripts Node.js personalizados que exponen nuevas acciones al motor de reglas, sin modificar el código fuente de Aura.

**Formato de plugin:**
```javascript
// app/plugins/abrir-zoom.js
module.exports = {
  id: 'abrir-zoom',
  label: 'Abrir Zoom',
  execute: async (osController) => {
    await osController.openApp('zoom');
  }
};
```

**Arquitectura:**
- Al arrancar, `main.js` escanea `app/plugins/*.js` y carga cada plugin
- Las acciones de plugins se añaden al switch de acciones del handler `gesture-update`
- En la UI, el selector de acciones del editor de reglas incluye las acciones de plugins

**Archivos a crear/modificar:**
- `app/main/plugin-manager.js` (nuevo) — `load()`, `getActions()`, `execute(id, osController)`
- `app/main/main.js` — integrar `pluginManager` en el handler `gesture-update` y en `add-rule`
- `app/renderer/app.js` — poblar `actionSelect` con acciones de plugins via IPC `get-plugin-actions`
- `app/plugins/` (nueva carpeta) — plugins de ejemplo: `abrir-zoom.js`, `tomar-captura.js`

---

### N6 · Exportar/importar perfiles

**Objetivo:** Botón para descargar el perfil actual como archivo JSON y otro para cargar un perfil externo. Facilita compartir configuraciones entre dispositivos o que el terapeuta prepare un perfil offline.

**Implementación:**
- **Exportar:** `ipcMain` abre un diálogo `dialog.showSaveDialog()` → guarda `profile.json`
- **Importar:** `dialog.showOpenDialog()` → valida estructura JSON → carga con `profileManager`
- Validación mínima: verificar que el JSON tiene `thresholds`, `rules` y `calibration`

**Archivos a modificar:**
- `app/main/main.js` — IPC `export-profile` e `import-profile` con `dialog` de Electron
- `app/renderer/app.js` — botones "Exportar" / "Importar" en el panel de configuración
- `app/renderer/index.html` — añadir botones en el panel de ajustes

---

## Bug pendiente del Sprint 1

### Bug 5 · Gesto de parpadeo (blink) deshabilitado

**Ubicación:** `app/vision/face-tracking.js` línea ≈260 — comentado con "Temporarily disabled for testing"

**Evaluación pendiente:** Decidir si re-habilitar como gesto opcional configurable en el perfil (`profile.gestures.blinkEnabled: false`). El umbral de parpadeo existe (`blinkThreshold: 0.25`) pero la detección no se usa. El parpadeo era el mecanismo de confirmación original antes de ser reemplazado por `mouthOpen`.

**Opción recomendada:** Re-habilitar como gesto alternativo opcional. Usuarios con mayor control ocular pueden preferir parpadear a abrir la boca para confirmar acciones.

---

## Orden de implementación recomendado

```
Sprint 2: ✅ COMPLETADO (v0.3.0)
Sprint 3: ✅ COMPLETADO (v0.4.0)
Sprint 4: ✅ COMPLETADO (v0.5.0) — N2 en fase experimental

Pendiente:
  Bug 5 (evaluación rápida)
  Validación con usuarios reales de N2 (eye-spelling)
```

---

## Skills de Claude Code recomendadas por tarea

| Tarea | Skills a usar |
|-------|--------------|
| Cualquier cambio en `os-controller.js` o `main.js` | `/security-review` antes de mergear |
| Cambios de UI o comportamiento de gestos | `/run` → `/verify` para confirmar en app real |
| N1 (integración Claude AI) | `/claude-api` para consultar modelo ID, pricing y parámetros |
| Antes de mergear cualquier sprint | `/code-review --effort high` |

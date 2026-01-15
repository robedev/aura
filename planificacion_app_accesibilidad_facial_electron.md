
# 🧠 Aplicación Multiplataforma de Accesibilidad Facial
## Control de Computador mediante Gestos Faciales y de Cabeza (Electron)

**Autor:** Planificación técnica – Experto en desarrollo multiplataforma Electron  
**Enfoque:** Accesibilidad avanzada para personas con cuadriplejia  
**Plataforma:** Windows · Linux · macOS  
**Nombre App:** Aura  

---

## 1. Objetivo General

Desarrollar una aplicación de escritorio multiplataforma que permita a personas con **cuadriplejia** controlar completamente un computador utilizando:

- Movimientos de la **cabeza**
- Gestos de **ojos**
- Gestos de **cejas**
- Gestos de **boca**
- (Opcional) comandos de voz

La aplicación debe actuar como un **asistente permanente**, priorizando:
- Baja fatiga
- Alta tolerancia a errores
- Personalización extrema
- Privacidad total (procesamiento local)

---

## 2. Principios de Diseño

### 2.1 Accesibilidad primero
- Compatible con movilidad mínima
- Gestos naturales y microgestos
- Umbrales configurables

### 2.2 Reducción de fatiga
- Zonas muertas
- Filtros de suavizado
- Confirmaciones no invasivas

### 2.3 Error tolerante
- Undo rápido
- Confirmaciones visuales
- Timeouts ajustables

### 2.4 Aprendizaje adaptativo
- La app se adapta al usuario
- No requiere reaprender gestos constantemente

---

## 3. Arquitectura General

```
┌───────────────┐
│   Electron UI │
│ (React/Vue)   │
└───────┬───────┘
        │ IPC
┌───────▼────────┐
│  Node Backend  │
│  Motor reglas  │
└───────┬────────┘
        │
┌───────▼────────┐
│ Motor Visión   │
│ MediaPipe      │
└───────┬────────┘
        │
┌───────▼────────┐
│ Sistema OS     │
│ Mouse/Teclado  │
└────────────────┘
```

---

## 4. Stack Tecnológico

### 4.1 Frontend
- Electron
- React o Vue
- Tailwind / CSS accesible
- Modo overlay flotante

### 4.2 Backend local
- Node.js
- IPC Electron
- Motor de reglas
- Gestor de perfiles

### 4.3 Visión por computador
- MediaPipe Face Mesh
- Iris Tracking
- Head Pose Estimation
- WebAssembly / Node bindings

### 4.4 Control del sistema
- robotjs (o alternativa moderna)
- APIs de accesibilidad nativas:
  - Windows UI Automation
  - AT-SPI (Linux)
  - macOS Accessibility

---

## 5. Detección Facial y Gestos

### 5.1 Cabeza
- Pitch (arriba / abajo)
- Yaw (izquierda / derecha)
- Roll (inclinación)

**Usos:**
- Movimiento del cursor
- Scroll
- Cambio de modo

---

### 5.2 Ojos
- Dirección de mirada
- Parpadeo corto
- Parpadeo prolongado

**Usos:**
- Click izquierdo
- Click derecho
- Confirmación

---

### 5.3 Cejas
- Elevación
- Asimetría

**Usos:**
- Abrir menú
- Activar asistente
- Cambiar contexto

---

### 5.4 Boca
- Apertura leve
- Sonrisa simple

**Usos:**
- Confirmar acción
- Cancelar
- Activar teclado

---

## 6. Control del Mouse

### 6.1 Movimiento
- Basado en cabeza
- Zona muerta central
- Filtro exponencial
- Velocidad adaptativa

### 6.2 Clicks
- Dwell time (mirada fija)
- Parpadeo prolongado
- Gestos combinados seguros

Ejemplo:
```
Mirada fija 800 ms → Preselección
Parpadeo → Click
```

---

## 7. Teclado Virtual Accesible

### 7.1 Diseño
- Teclas grandes
- Alto contraste
- Predicción agresiva
- Frases rápidas

### 7.2 Métodos de entrada
1. Eye typing
2. Escaneo por filas/columnas
3. Asistente IA de texto

---

## 8. Motor de Reglas

Sistema configurable tipo:

```
SI:
  Mirada fija 1s
Y:
  Ceja levantada
ENTONCES:
  Click derecho
```

Características:
- Editor visual
- Guardado por perfil
- Activación/desactivación rápida

---

## 9. Asistente Permanente

Funciones:
- Abrir / cerrar aplicaciones
- Control multimedia
- Volumen
- Lectura de texto (TTS)
- Dictado por voz (opcional)
- Macros personalizadas

---

## 10. Perfiles de Usuario

Cada perfil incluye:
- Sensibilidad de gestos
- Gestos habilitados
- Reglas personalizadas
- Historial de calibración

---

## 11. Seguridad y Privacidad

- Procesamiento 100% local
- No grabación de video
- Solo landmarks faciales
- Gesto/botón de pausa de emergencia

---

## 12. Testing y Validación

- Pruebas de fatiga prolongadas
- Usuarios reales
- Logs silenciosos
- Modo simulación sin cámara

---

## 13. Fases del Proyecto

### Fase 1 – MVP
- Movimiento de mouse
- Click básico
- Calibración simple

### Fase 2 – Personalización
- Perfiles
- Ajustes finos
- Reglas básicas

### Fase 3 – Teclado y asistente
- Escritura
- Macros
- Acciones rápidas

### Fase 4 – IA adaptativa
- Ajuste automático
- Predicción de intención
- Reducción de errores

---

## 14. Diferencial del Proyecto

No es solo control por gestos.  
Es un **asistente accesible, adaptativo y digno** para personas con cuadriplejia.

---

## 15. Próximos pasos sugeridos

- Diagramas técnicos detallados
- Prototipo funcional Electron
- Pruebas con usuarios reales
- Certificación de accesibilidad

---

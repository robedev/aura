
# 📐 Diagramas Técnicos – Aplicación de Accesibilidad Facial (Electron)

**Proyecto:** Aplicación de control de computador mediante gestos faciales  
**Enfoque:** Accesibilidad avanzada – Cuadriplejia  
**Tecnología base:** Electron · Node.js · MediaPipe  

---

## 1. Diagrama de Arquitectura General

```
┌──────────────────────────────┐
│        Usuario               │
│ (Gestos faciales / cabeza)   │
└─────────────┬────────────────┘
              │ Cámara
┌─────────────▼────────────────┐
│   Motor de Visión Artificial  │
│   MediaPipe (Face Mesh)       │
│   - Ojos                      │
│   - Cejas                     │
│   - Boca                     │
│   - Cabeza                   │
└─────────────┬────────────────┘
              │ Landmarks
┌─────────────▼────────────────┐
│   Motor de Interpretación     │
│   - Filtros                   │
│   - Umbrales                  │
│   - Estados                   │
└─────────────┬────────────────┘
              │ Eventos lógicos
┌─────────────▼────────────────┐
│     Motor de Reglas           │
│  (Gestos → Acciones)          │
└─────────────┬────────────────┘
              │ Acciones
┌─────────────▼────────────────┐
│  Control del Sistema          │
│  Mouse / Teclado / Ventanas   │
└─────────────┬────────────────┘
              │ Feedback
┌─────────────▼────────────────┐
│   Interfaz Electron           │
│   Overlay / Asistente         │
└──────────────────────────────┘
```

---

## 2. Diagrama de Componentes (Electron)

```
Electron App
│
├── Main Process
│   ├── OS Controller
│   ├── Perfil de Usuario
│   ├── Motor de Reglas
│   └── Seguridad / Pausa
│
├── Renderer Process
│   ├── UI Principal
│   ├── Overlay de Confirmación
│   ├── Editor de Reglas
│   └── Panel de Calibración
│
└── IPC
    ├── Eventos de gestos
    ├── Acciones del sistema
    └── Estado del asistente
```

---

## 3. Flujo de Procesamiento de Gestos

```
Captura cámara
      ↓
Detección landmarks
      ↓
Normalización
      ↓
Filtro de suavizado
      ↓
Evaluación de umbrales
      ↓
Estado de gesto
      ↓
Regla asociada
      ↓
Acción sistema
```

---

## 4. Máquina de Estados del Sistema

```
[Inactivo]
     ↓ gesto activar
[Observando]
     ↓ gesto válido
[Preselección]
     ↓ confirmación
[Acción ejecutada]
     ↓ timeout
[Observando]
```

Estados diseñados para evitar activaciones accidentales.

---

## 5. Diagrama de Control del Mouse

```
Movimiento cabeza
      ↓
Cálculo vector
      ↓
Zona muerta
      ↓
Filtro exponencial
      ↓
Velocidad adaptativa
      ↓
Cursor del sistema
```

Clicks:
- Mirada fija (dwell)
- Parpadeo prolongado
- Gesto combinado

---

## 6. Diagrama del Teclado Virtual

```
Modo escritura
     ↓
Selección método
     ├── Mirada
     ├── Escaneo
     └── Asistente IA
     ↓
Predicción texto
     ↓
Confirmación
     ↓
Salida al sistema
```

---

## 7. Diagrama de Perfiles de Usuario

```
Usuario
│
├── Perfil A
│   ├── Sensibilidad
│   ├── Gestos activos
│   ├── Reglas
│   └── Historial calibración
│
├── Perfil B
│   └── ...
```

Cada perfil es completamente independiente.

---

## 8. Diagrama del Motor de Reglas

```
Entrada gesto
      ↓
Condiciones
      ├── Tiempo
      ├── Intensidad
      ├── Estado previo
      ↓
Evaluación
      ↓
Acción asignada
```

---

## 9. Diagrama de Seguridad y Emergencia

```
Gesto emergencia / Botón físico
           ↓
   Pausa inmediata
           ↓
  Bloqueo de inputs
           ↓
   Feedback visual/sonoro
```

---

## 10. Flujo de Calibración Inicial

```
Inicio
  ↓
Detección rostro
  ↓
Posición neutra
  ↓
Registro gestos
  ↓
Prueba control
  ↓
Ajustes finos
  ↓
Guardar perfil
```

---

## 11. Relación con el Sistema Operativo

```
Electron
   ↓
Node Native Module
   ↓
API Accesibilidad SO
   ↓
Eventos OS
```

Compatibilidad:
- Windows UI Automation
- AT-SPI (Linux)
- macOS Accessibility API

---

## 12. Diagramas recomendados a futuro

- UML de clases (motor de reglas)
- Secuencia IPC Electron
- Diagrama de aprendizaje adaptativo
- Arquitectura de plugins

---

**Documento diseñado para:**
- Desarrollo técnico
- Documentación formal
- Postulación a fondos
- Transferencia de conocimiento

---

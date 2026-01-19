# Guía de Gestos Recomendados para AURA

> **Nota:** Este listado no es técnico, es humano. Si AURA respeta esto, el usuario no se adapta a la app, la app se adapta al usuario.

## 🟢 GESTOS DE BAJO ESFUERZO (uso continuo)

### 1️⃣ Mirada fija (dwell gaze)
**Qué es:** Mirar un punto durante X ms (configurable).

*   **Ventajas:**
    *   Natural
    *   Muy poco cansancio
    *   Alta precisión
*   **Usos ideales:**
    *   Seleccionar elemento
    *   Preselección
    *   Hover
    *   Navegación por UI
*   **Recomendación AURA:** Nunca ejecutar acción crítica solo con este gesto.

### 2️⃣ Movimiento de cabeza suave
**Qué es:** Micro movimientos izquierda / derecha / arriba / abajo.

*   **Ventajas:**
    *   Control continuo
    *   Familiar
    *   Poco esfuerzo si está bien filtrado
*   **Usos ideales:**
    *   Movimiento del cursor
    *   Scroll
    *   Ajustes finos
*   **Anti-fatiga:**
    *   Zona muerta amplia
    *   Sensibilidad adaptativa

---

## 🟡 GESTOS DE ESFUERZO MEDIO (confirmaciones)

### 3️⃣ Mantener mirada + gesto facial
**Qué es:** Mirada fija + otro gesto consciente.
**Ejemplo:** Mirar botón -> Luego levantar ceja derecha.

*   **Usos:**
    *   Click
    *   Confirmar acción
    *   Activar opción
*   **Ventaja clave:** Reduce casi a cero los falsos positivos.

### 4️⃣ Elevación de ceja unilateral
**Qué es:** Levantar solo ceja derecha o izquierda.

*   **Ventajas:**
    *   Muy diferenciable
    *   Poco común involuntariamente
*   **Usos:**
    *   Click izquierdo / derecho
    *   Confirmar / cancelar
    *   Cambiar modo

### 5️⃣ Sonrisa leve asimétrica
**Qué es:** Elevar solo un lado de la boca.

*   **Usos:**
    *   Aceptar
    *   Confirmar
    *   Ejecutar macro
*   **Nota clínica:** Mucho mejor que sonrisa completa (menos fatiga).

---

## 🟠 GESTOS DE CONTROL DE ESTADO (no frecuentes)

### 6️⃣ Apertura leve de boca sostenida
**Qué es:** Abrir la boca levemente por >500 ms.

*   **Usos recomendados:**
    *   Activar teclado
    *   Activar modo escritura
    *   Cambiar contexto
*   **Regla AURA:** Nunca usar para clicks.

### 7️⃣ Movimiento de lengua visible (opcional)
**Qué es:** Lengua hacia izquierda o derecha.

*   **Ventajas:**
    *   Muy intencional
    *   Casi cero falsos positivos
*   **Usos:**
    *   Cancelar acción
    *   Undo
    *   Emergencia suave
*   **Advertencia:** Solo habilitar si el usuario está cómodo.

---

## 🔴 GESTOS DE EMERGENCIA (muy importantes)

### 8️⃣ Gesto compuesto de pausa
**Ejemplo seguro:** Mirada arriba + ceja levantada + boca cerrada (1s).

*   **Uso:**
    *   Pausar AURA
    *   Bloquear input
    *   Descanso

### 9️⃣ Desviar mirada extrema
**Qué es:** Mirar fuera de pantalla (izq. o der. extremo).

*   **Usos:**
    *   Cancelar selección
    *   Salir de modo activo

---

## 🔵 GESTOS DE NAVEGACIÓN AVANZADA

### 🔟 Inclinación de cabeza mantenida
**Qué es:** Inclinar cabeza 10–15° y sostener.

*   **Usos:**
    *   Scroll continuo
    *   Zoom
    *   Cambiar panel

---

## 🧩 Resumen recomendado de mapeo inicial (AURA)

| Función | Gesto |
| :--- | :--- |
| **Mover cursor** | Cabeza |
| **Preselección** | Mirada fija |
| **Click** | Mirada + ceja |
| **Click derecho** | Mirada + ceja contraria |
| **Confirmar** | Sonrisa leve |
| **Cancelar** | Lengua o mirada extrema |
| **Teclado** | Boca abierta leve |
| **Pausa** | Gesto compuesto |

## 🧠 Regla de oro AURA

Una acción importante nunca debe depender de un solo gesto.

**Siempre:**
*   Gesto continuo → intención
*   Gesto discreto → confirmación

# Arquitectura Código Base Electron

Arquitectura Código Base Electron
Este documento describe la bajada técnica de los diagramas a una estructura real de proyecto
Electron, incluyendo motor de reglas, algoritmos de filtrado y diseño anti-fatiga, orientado a
accesibilidad para cuadriplejia.


## 1. Estructura del Proyecto

```text
root/
├── app/
│   ├── main/
│   │   ├── main.js
│   │   ├── ipc.js
│   │   ├── os-controller.js
│   │   └── rules-engine.js
│   ├── renderer/
│   │   ├── ui/
│   │   ├── overlay/
│   │   └── calibration/
│   ├── vision/
│   │   ├── face-tracking.js
│   │   └── filters.js
│   ├── profiles/
│   └── config/
└── package.json
```


2. Código Base Electron (Main)
main.js:
- Inicializa Electron
- Carga ventana principal
- Maneja permisos de accesibilidad
- Arranca motor de reglas y visión


3. Motor de Reglas
Diseño basado en reglas declarativas:
Regla = {
condiciones: [gesto, tiempo, estado],
accion: funcion_sistema,
prioridad: numero
}
Evaluación por ciclo:
- Recolectar gestos activos
- Validar condiciones
- Ejecutar acción más prioritaria


4. Algoritmos de Filtrado y Anti-fatiga
Filtros aplicados:
- Media móvil exponencial
- Zona muerta dinámica
- Umbral adaptativo
Anti-fatiga:
- Reducción progresiva de sensibilidad
- Pausas automáticas
- Detección de sobreuso


5. Control del Sistema
Uso de módulos nativos:
- Mouse absoluto
- Clicks seguros
- Teclado virtual
Protección contra clicks accidentales:
- Estados intermedios
- Confirmación visual


6. Calibración
Proceso guiado:
- Registro posición neutra
- Registro microgestos
- Ajuste automático de umbrales


7. Seguridad
- Gesto de emergencia
- Pausa inmediata
- Bloqueo total de input


8. Próximos pasos
- Implementar plugins
- IA adaptativa
- Certificación accesibilidad

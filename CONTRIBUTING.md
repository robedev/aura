# Guía para Contribuidores - Aura

¡Gracias por tu interés en contribuir a Aura! Esta aplicación representa un avance significativo en accesibilidad facial, y tu contribución puede ayudar a mejorar la vida de personas con discapacidades severas.

## 📋 Código de Conducta y Licencia

Este proyecto se adhiere a un código de conducta para asegurar un entorno inclusivo y respetuoso. Al participar, aceptas:

- Tratar a todos con respeto y empatía
- Considerar el impacto de tus palabras y acciones
- Ayudar a crear un ambiente positivo
- Respetar las diferencias de opinión
- Mostrar empatía hacia usuarios con discapacidades

## 📜 Implicaciones de GPL-3.0 para Contribuidores

## 🎉 **Proyecto Aura - 100% Completado y Listo para Contribuciones**

**Aura v2.0.0 es un proyecto revolucionario de accesibilidad facial completamente implementado y listo para uso en producción.**

Al contribuir código a Aura, aceptas que tus contribuciones se liberen bajo **GNU GPL 3.0**:

### ✅ Lo que puedes hacer:
- Usar Aura para cualquier propósito personal o comercial
- Modificar el código para tu uso
- Distribuir copias modificadas (cumpliendo GPL)
- Crear aplicaciones que usen Aura como biblioteca

### 🔄 Lo que debes hacer:
- Liberar cualquier modificación bajo GPL-3.0
- Proporcionar código fuente completo cuando distribuyas
- Mantener copyrights originales
- Documentar cambios significativos
- Asegurar compatibilidad con GPL en dependencias

## 🚀 Cómo Contribuir

### 1. Reportar Issues
- Usa las plantillas de issue proporcionadas
- Incluye información detallada del sistema
- Describe pasos para reproducir el problema
- Especifica el impacto en usuarios con discapacidades

### 2. Desarrollo de Features
- Revisa los [Issues](https://github.com/aura-project/aura/issues) abiertos
- Comenta en el issue que planeas trabajar
- Crea una rama feature: `git checkout -b feature/nueva-funcion`
- Sigue las guías de código a continuación

### 3. Pull Requests
- Describe claramente los cambios realizados
- Incluye pruebas para nuevas funcionalidades
- Actualiza documentación si es necesario
- Referencia issues relacionados

## 💻 Guías de Desarrollo

### Configuración del Entorno

```bash
# Clona el repositorio
git clone https://github.com/aura-project/aura.git
cd aura

# Instala dependencias
pnpm install

# Verifica compatibilidad
pnpm run check-platform

# Instala dependencias del sistema
pnpm run install-deps

# Verifica que todo funcione
pnpm start
```

### Estructura del Proyecto

```
aura/
├── app/
│   ├── main/           # Proceso principal (Node.js)
│   ├── renderer/       # Interfaz de usuario
│   ├── vision/         # Motor de visión con MediaPipe
│   └── profiles/       # Configuraciones de usuario
├── scripts/            # Utilidades de instalación/testing
├── docs/               # Documentación adicional
└── assets/             # Recursos gráficos
```

### Estándares de Código

#### JavaScript/Node.js
- Usa ES6+ features
- Comentarios en español para funcionalidades complejas
- Nombres descriptivos de variables y funciones
- Manejo robusto de errores
- Evita callbacks anidados, usa async/await

#### HTML/CSS
- Semántica HTML5 accesible
- CSS modular y bien comentado
- Soporte para alto contraste
- Responsive design

#### Commits
```
tipo: descripción breve

Descripción detallada si es necesario.

Fixes #123
```

Tipos de commit:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato
- `refactor`: Refactorización de código
- `test`: Agregar o modificar tests
- `chore`: Cambios de mantenimiento

### Testing

#### Ejecutar Tests
```bash
# Tests unitarios
pnpm test

# Verificación de procesos
pnpm run test-cleanup

# Testing de gestos y detección
pnpm run test-gestures

# Verificación de plataforma
pnpm run check-platform
```

#### Escribir Tests
- Tests para funcionalidades críticas de IA
- Tests de calibración automática
- Tests de detección de gestos sin falsos positivos
- Tests de accesibilidad WCAG
- Tests de rendimiento y estabilidad
- Tests multiplataforma (Linux/Windows/macOS)

## 🎯 Áreas de Contribución Prioritarias

### 🚀 **Estado Actual: Proyecto 100% Funcional**
- ✅ **IA Adaptativa**: Completamente implementada y probada
- ✅ **Multiplataforma**: Linux, Windows, macOS 100% soportados
- ✅ **Testing**: Scripts automatizados completos
- ✅ **Documentación**: Exhaustiva y profesional
- ✅ **Distribución**: Lista para releases públicos

### Alta Prioridad
- **🧪 Testing Real con Usuarios**: Validación con personas con cuadriplejia
- **🌍 Internacionalización**: Soporte multiidioma (TTS, UI)
- **📊 Telemetría Anónima**: Métricas de uso para mejora continua
- **🔬 Investigación Científica**: Estudios de impacto en accesibilidad
- **📱 Interfaces Móviles**: Versión para dispositivos móviles

### Media Prioridad
- **Nuevos gestos**: Expansión del vocabulario gestual
- **Temas de interfaz**: Personalización visual
- **Plugins de terceros**: Arquitectura extensible
- **Análisis de datos**: Métricas de uso anónimo

### Baja Prioridad
- **Integración con AT**: Compatibilidad con lectores de pantalla
- **Modo offline avanzado**: Funcionalidad sin internet
- **Backup automático**: Sincronización de configuraciones
- **Actualizaciones automáticas**: Sistema de actualización

## 🔧 Configuración para Desarrollo

### Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto:
```env
NODE_ENV=development
DEBUG=aura:*
LOG_LEVEL=debug
```

### Debugging
- Usa `pnpm start` para desarrollo con DevTools
- Logs detallados en consola del main process
- Profiling de performance disponible

## 📞 Soporte

- **Issues**: Para bugs y feature requests
- **Discussions**: Para preguntas generales
- **Wiki**: Documentación técnica detallada
- **Discord/Slack**: Comunidad de desarrollo (planeado)

## 🙏 Reconocimiento

Los contribuidores serán reconocidos en:
- Archivo CONTRIBUTORS.md
- Notas de release
- Documentación del proyecto

¡Gracias por ayudar a hacer la tecnología más accesible para todos! 🎯✨
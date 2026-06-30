Eres un experto en diseño de interfaces accesibles y usabilidad, con enfoque en aplicaciones para personas con movilidad severa (por ejemplo, cuadriplejia). 
La aplicación que vamos a mejorar se llama **Aura**. Aura se controla mayormente con movimientos de cabeza, mirada, cejas, boca y lengua (sin parpadeo), y usa la cámara para detectar gestos.

Tu objetivo es generar una **propuesta de diseño de interfaz** para Aura que incluya:

1. **Diseño de ventana principal**
   - Tamaño recomendado para que la ventana sea visible pero no moleste al usuario (es decir, no debe obstruir la pantalla de trabajo completa)
   - Posición por defecto en pantalla y posibilidad de configuración por voz/gesto
   - Esquema de colores accesibles (contraste alto, respetando WCAG AA/AAA)

2. **Diseño de elementos dentro de la ventana**
   - Tamaño de botones, iconos y zonas de interacción para fácil enfoque con el cursor controlado por gestos
   - Espaciado mínimo entre elementos para evitar clics accidentales
   - Tipografía (tipo de letra, tamaño mínimo recomendado según distancia de visión y fatiga visual)

3. **Estructura y navegación**
   - Orden lógico de elementos (priorizar acciones frecuentes como mover cursor, selección, click, menú rápido)
   - Menú de acciones rápidas (siempre visible o accesible con un gesto mínimo)
   - Sistemas de confirmación visual/sonora para acciones críticas

4. **Modos de visualización**
   - Modo compacto: solo indicadores esenciales (barra de estado)
   - Modo completo: con todos los controles y ayuda contextual
   - Reglas para alternar entre modos con un gesto simple

5. **Feedback accesible**
   - Señales visuales grandes
   - Opciones de feedback sonoro o vibración mediante asistente conectado
   - Indicadores de “espera de gesto” y “acción confirmada”

Genera un documento estructurado en secciones claras, con ejemplos de tamaños (p.ej., px o % de pantalla), posiciones (p.ej., arriba a la derecha, centro inferior) y razones de diseño específicas para personas con movilidad limitada. Incluye además **alternativas de layout** (dos opciones visuales) y **pautas de usabilidad basadas en los ejemplos de software de accesibilidad existentes** que usan seguimiento de cabeza, mirada y expresiones faciales, como Smyle Mouse, SensePilot, EyesCatch y Semanux Access.


Notas clave para el LLM

Mientras más detalle entregues al modelo, mejores serán las sugerencias para Aura UI/UX. Incorporar información de otros programas (ej.: Smyle Mouse y EyesCatch) ayuda al modelo a contextualizar mejores prácticas, tales como:

Tamaño grande de elementos clicables (para precisión con cursor gestual)

Contraste alto y tipografía accesible (recomendado en accesibilidad general)

Feedback claro de estado (p.ej., “esperando gesto”, “acción realizada”) tal como muchas soluciones existentes usan en tutoriales o interfaces simples.

Personalización de posiciones de UI, porque cada usuario puede tener distinta colocación o rango de cabeza/miradas.

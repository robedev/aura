// Plugin Manager (N4): carga scripts Node.js de app/plugins/ que exponen
// acciones personalizadas al motor de reglas sin modificar el código de Aura.
//
// Formato de plugin:
//   module.exports = {
//     id: 'mi-accion',                     // identificador único (kebab-case)
//     label: 'Mi Acción',                  // texto mostrado en el editor de reglas
//     execute: async (osController) => {}  // recibe el OS controller para actuar
//   };
//
// NOTA DE SEGURIDAD: los plugins ejecutan código Node.js con los mismos
// permisos que Aura. Solo se cargan desde la carpeta local app/plugins/;
// instala únicamente plugins de confianza.

const fs = require('fs');
const path = require('path');

class PluginManager {
  constructor(pluginsDir) {
    this.pluginsDir = pluginsDir;
    this.plugins = new Map(); // 'plugin:<id>' → plugin
  }

  load() {
    if (!fs.existsSync(this.pluginsDir)) {
      console.log('ℹ️ PluginManager: carpeta de plugins no existe, omitiendo');
      return;
    }

    const files = fs.readdirSync(this.pluginsDir).filter(f => f.endsWith('.js'));
    files.forEach(file => {
      try {
        const plugin = require(path.join(this.pluginsDir, file));
        if (plugin && typeof plugin.id === 'string' && typeof plugin.execute === 'function') {
          this.plugins.set(`plugin:${plugin.id}`, plugin);
          console.log(`🔌 Plugin cargado: ${plugin.label || plugin.id} (${file})`);
        } else {
          console.warn(`⚠️ Plugin inválido ignorado: ${file} (requiere id y execute)`);
        }
      } catch (error) {
        console.error(`❌ Error cargando plugin ${file}:`, error.message);
      }
    });

    console.log(`🔌 PluginManager: ${this.plugins.size} plugin(s) activo(s)`);
  }

  // Acciones para poblar el selector del editor de reglas
  getActions() {
    return [...this.plugins.values()].map(p => ({
      id: `plugin:${p.id}`,
      label: `🔌 ${p.label || p.id}`
    }));
  }

  has(actionId) {
    return this.plugins.has(actionId);
  }

  async execute(actionId, osController) {
    const plugin = this.plugins.get(actionId);
    if (!plugin) return false;
    try {
      await plugin.execute(osController);
      return true;
    } catch (error) {
      console.error(`❌ Error ejecutando plugin ${actionId}:`, error.message);
      return false;
    }
  }
}

module.exports = PluginManager;

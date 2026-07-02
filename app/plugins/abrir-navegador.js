// Plugin de ejemplo: abre el navegador predeterminado del sistema
module.exports = {
  id: 'abrir-navegador',
  label: 'Abrir navegador',
  execute: async (osController) => {
    await osController.openApp('browser');
  }
};

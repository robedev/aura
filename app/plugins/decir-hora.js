// Plugin de ejemplo: anuncia la hora actual por voz (TTS)
module.exports = {
  id: 'decir-hora',
  label: 'Decir la hora',
  execute: async (osController) => {
    const now = new Date();
    const horas = now.getHours();
    const minutos = now.getMinutes();
    await osController.readText(`Son las ${horas} y ${minutos} minutos`);
  }
};

#!/usr/bin/env node

const os = require('os');
const { execSync } = require('child_process');

const platform = os.platform();

console.log(`📦 Instalando dependencias para Aura en ${platform}`);
console.log('='.repeat(50));

function runCommand(command, description) {
  try {
    console.log(`\n🔧 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description}: Completado`);
  } catch (error) {
    console.log(`❌ ${description}: Error - ${error.message}`);
  }
}

switch (platform) {
  case 'linux':
    console.log('🐧 Instalando dependencias para Linux...');

    // Detectar distribución
    try {
      const distro = execSync('lsb_release -si 2>/dev/null || cat /etc/os-release | grep "^ID=" | cut -d= -f2 | tr -d \'"\'' , { encoding: 'utf8' }).trim();

      if (distro.includes('ubuntu') || distro.includes('debian')) {
        runCommand('sudo apt-get update', 'Actualizando lista de paquetes');
        runCommand('sudo apt-get install -y xdotool espeak festival', 'Instalando herramientas de accesibilidad');
      } else if (distro.includes('fedora') || distro.includes('centos') || distro.includes('rhel')) {
        runCommand('sudo dnf install -y xdotool espeak festival || sudo yum install -y xdotool espeak festival', 'Instalando herramientas de accesibilidad (RPM)');
      } else if (distro.includes('arch')) {
        runCommand('sudo pacman -S --noconfirm xdotool espeak festival', 'Instalando herramientas de accesibilidad (Arch)');
      } else {
        console.log(`⚠️  Distribución ${distro} no reconocida automáticamente.`);
        console.log('   Instala manualmente: xdotool, espeak, festival');
      }
    } catch (error) {
      console.log('⚠️  No se pudo detectar la distribución.');
      console.log('   Instala manualmente: xdotool, espeak, festival');
    }
    break;

  case 'win32':
    console.log('🪟 Configurando Windows...');
    console.log('✅ PowerShell ya debería estar disponible en Windows moderno');
    console.log('✅ .NET Framework debería estar disponible para TTS');

    // Verificar si necesitamos instalar algo adicional
    try {
      execSync('powershell -Command "Get-Host"', { stdio: 'pipe' });
      console.log('✅ PowerShell: OK');
    } catch (error) {
      console.log('❌ PowerShell: No encontrado. Actualiza Windows.');
    }
    break;

  case 'darwin':
    console.log('🍎 Configurando macOS...');
    console.log('✅ AppleScript y "say" deberían estar disponibles por defecto');
    console.log('🔧 Verifica permisos de accesibilidad:');
    console.log('   1. Ve a Configuración del Sistema > Seguridad y Privacidad > Accesibilidad');
    console.log('   2. Agrega y habilita aplicaciones que necesiten control del sistema');
    break;

  default:
    console.log(`❌ Plataforma ${platform} no soportada`);
    process.exit(1);
}

console.log('\n' + '='.repeat(50));
console.log('🎉 ¡Instalación completada!');
console.log('\nPara verificar: npm run check-platform');
console.log('Para ejecutar: npm start');
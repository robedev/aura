#!/usr/bin/env node

const os = require('os');
const { execSync } = require('child_process');

const platform = os.platform();
const platformNames = {
  linux: 'Linux',
  win32: 'Windows',
  darwin: 'macOS'
};

console.log(`🔍 Verificando compatibilidad de Aura para ${platformNames[platform] || platform}`);
console.log('='.repeat(50));

const checks = {
  linux: {
    'xdotool': 'xdotool --version',
    'espeak/festival': 'which espeak || which festival'
  },
  win32: {
    'PowerShell': 'powershell -Command "Get-Host"',
    'TTS Support': 'powershell -Command "Add-Type -AssemblyName System.Speech; $true"'
  },
  darwin: {
    'osascript': 'osascript -e "return 1"',
    'TTS Support': 'say "test" 2>/dev/null && echo "OK" || echo "FAIL"'
  }
};

let allGood = true;

if (checks[platform]) {
  console.log('\n📋 Verificando dependencias:');

  for (const [dep, command] of Object.entries(checks[platform])) {
    try {
      execSync(command, { stdio: 'pipe' });
      console.log(`✅ ${dep}: OK`);
    } catch (error) {
      console.log(`❌ ${dep}: FALTANTE o NO FUNCIONA`);
      allGood = false;
    }
  }
} else {
  console.log(`❌ Plataforma ${platform} no soportada`);
  allGood = false;
}

console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('🎉 ¡Tu sistema es compatible con Aura!');
  console.log('\nPara ejecutar: npm start');
} else {
  console.log('⚠️  Tu sistema tiene limitaciones. Revisa los requisitos arriba.');
  console.log('\nPara más información: https://github.com/aura-project/docs');
}

console.log('\n💡 Consejos:');
console.log('- Linux: Instala con gestor de paquetes "xdotool espeak"');
console.log('- Windows: Asegúrate de tener PowerShell disponible');
console.log('- macOS: Verifica permisos de accesibilidad en Configuración del Sistema');
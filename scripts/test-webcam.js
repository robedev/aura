#!/usr/bin/env node

/**
 * Script de diagnóstico para probar la funcionalidad de la webcam
 * en Aura sin ejecutar la aplicación completa
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function checkWebcamDevices() {
  console.log('🔍 Verificando dispositivos de webcam...\n');

  try {
    // Linux: usar v4l2-ctl o ls /dev/video*
    const { stdout: devices } = await execAsync('ls /dev/video* 2>/dev/null || echo "No se encontraron dispositivos /dev/video*"');
    console.log('📹 Dispositivos encontrados:', devices.trim());

    // Verificar permisos
    try {
      const { stdout: permissions } = await execAsync('ls -la /dev/video0 2>/dev/null || echo "No se puede acceder a /dev/video0"');
      console.log('🔐 Permisos de /dev/video0:', permissions.trim());
    } catch (error) {
      console.log('🔐 Error verificando permisos:', error.message);
    }

    // Verificar si hay procesos usando la cámara
    try {
      const { stdout: processes } = await execAsync('lsof /dev/video0 2>/dev/null || echo "Ningún proceso usando la cámara"');
      console.log('⚙️  Procesos usando la cámara:', processes.trim());
    } catch (error) {
      console.log('⚙️  Verificación de procesos:', error.message);
    }

    // Verificar aplicaciones que podrían estar usando la cámara
    try {
      const { stdout: apps } = await execAsync('ps aux | grep -E "(cheese|guvcview|firefox|chrome|electron)" | grep -v grep || echo "No se encontraron aplicaciones comunes usando la cámara"');
      console.log('📱 Aplicaciones potencialmente usando cámara:', apps.trim());
    } catch (error) {
      console.log('📱 Verificación de aplicaciones:', error.message);
    }

    console.log('\n💡 RECOMENDACIONES:');
    console.log('1. Si no hay dispositivos /dev/video*, conecta una webcam');
    console.log('2. Si los permisos son incorrectos, ejecuta: sudo chmod 666 /dev/video0');
    console.log('3. Si hay procesos usando la cámara, ciérralos primero');
    console.log('4. Prueba con una aplicación simple como: cheese o guvcview');

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
  }
}

async function testMediaPipeLoading() {
  console.log('\n🌐 Verificando conectividad con MediaPipe CDN...\n');

  try {
    const https = require('https');

    const testUrl = (url) => {
      return new Promise((resolve) => {
        const req = https.request(url, { method: 'HEAD' }, (res) => {
          resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(5000, () => resolve(false));
        req.end();
      });
    };

    const faceMeshUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
    const cameraUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';

    console.log('⏳ Probando FaceMesh...');
    const faceMeshOk = await testUrl(faceMeshUrl);
    console.log(faceMeshOk ? '✅ FaceMesh CDN accesible' : '❌ FaceMesh CDN no accesible');

    console.log('⏳ Probando Camera Utils...');
    const cameraOk = await testUrl(cameraUrl);
    console.log(cameraOk ? '✅ Camera Utils CDN accesible' : '❌ Camera Utils CDN no accesible');

    if (!faceMeshOk || !cameraOk) {
      console.log('\n💡 SOLUCIONES PARA CDN:');
      console.log('1. Verifica tu conexión a internet');
      console.log('2. Puede ser un problema temporal de CDN');
      console.log('3. Considera usar una VPN si hay bloqueos regionales');
    }

  } catch (error) {
    console.error('❌ Error probando CDN:', error.message);
  }
}

async function main() {
  console.log('🧪 DIAGNÓSTICO DE WEBCAM PARA AURA\n');
  console.log('=====================================\n');

  await checkWebcamDevices();
  await testMediaPipeLoading();

  console.log('\n🎯 RESUMEN FINAL:');
  console.log('================');
  console.log('Ejecuta este script y revisa los resultados arriba.');
  console.log('Si todo está OK, la webcam debería funcionar en Aura.');
  console.log('Si hay problemas, sigue las recomendaciones específicas.\n');
}

// Ejecutar diagnóstico
main().catch(console.error);
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing Aura Gesture Detection...');
console.log('='.repeat(50));

// Start Aura application
console.log('\n🚀 Starting Aura application...');
const auraProcess = spawn('npm', ['start'], {
  cwd: path.join(__dirname, '..'),
  detached: true,
  stdio: 'pipe'
});

// Collect output for analysis
let outputBuffer = '';
let errorBuffer = '';

auraProcess.stdout.on('data', (data) => {
  outputBuffer += data.toString();
});

auraProcess.stderr.on('data', (data) => {
  errorBuffer += data.toString();
});

// Wait for initialization
setTimeout(() => {
  console.log('📊 Analyzing gesture detection behavior...');

  // Check for unwanted gesture detections
  const gestureMatches = outputBuffer.match(/Gesture Detected|RULE ENGINE|mouthOpen|dwellGaze|smile|eyebrowRaise|gaze/gi) || [];
  const ruleTriggers = outputBuffer.match(/Triggered/g) || [];

  console.log(`Total gesture detections: ${gestureMatches.length}`);
  console.log(`Rule engine triggers: ${ruleTriggers.length}`);

  // Analyze if there are too many detections without user input
  if (ruleTriggers.length > 5) {
    console.log('⚠️  WARNING: High number of rule triggers detected');
    console.log('   This may indicate false positive gesture detection');
    console.log('   Consider increasing gesture thresholds');
  } else if (ruleTriggers.length === 0) {
    console.log('ℹ️  No rule triggers detected (camera may not be working)');
  } else {
    console.log('✅ Reasonable number of rule triggers detected');
  }

  // Check for calibration messages
  if (outputBuffer.includes('Starting automatic gesture calibration')) {
    console.log('✅ Automatic calibration initiated');
  } else {
    console.log('ℹ️  Automatic calibration not started');
  }

  if (outputBuffer.includes('Automatic calibration completed')) {
    console.log('✅ Automatic calibration completed');
  }

  // Terminate application
  console.log('\n🛑 Terminating Aura...');
  try {
    process.kill(-auraProcess.pid, 'SIGTERM');
  } catch (error) {
    auraProcess.kill('SIGTERM');
  }

  // Final analysis
  setTimeout(() => {
    console.log('\n📈 Final Analysis:');

    if (ruleTriggers.length <= 5 && ruleTriggers.length > 0) {
      console.log('🎉 SUCCESS: Gesture detection appears stable');
      console.log('   No excessive false positives detected');
    } else if (ruleTriggers.length > 5) {
      console.log('❌ ISSUE: Too many false positive detections');
      console.log('   Solution: Increase gesture thresholds or check camera');
    } else {
      console.log('⚠️  UNCLEAR: No gesture data collected');
      console.log('   Check camera connection and permissions');
    }

    process.exit(ruleTriggers.length <= 5 && ruleTriggers.length > 0 ? 0 : 1);
  }, 2000);

}, 8000);
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing Aura process cleanup...');
console.log('='.repeat(50));

// Get initial process count
function getProcessCount(pattern) {
  try {
    const { execSync } = require('child_process');
    const output = execSync(`pgrep -f "${pattern}" | wc -l`, { encoding: 'utf8' });
    return parseInt(output.trim());
  } catch (error) {
    return 0;
  }
}

console.log('📊 Checking initial process state...');
const initialXdotoolCount = getProcessCount('xdotool');
const initialNodeCount = getProcessCount('node.*electron');
console.log(`xdotool processes: ${initialXdotoolCount}`);
console.log(`Node/Electron processes: ${initialNodeCount}`);

// Start Aura application
console.log('\n🚀 Starting Aura application...');
const auraProcess = spawn('npm', ['start'], {
  cwd: path.join(__dirname, '..'),
  detached: true,
  stdio: 'ignore'
});

// Wait for it to start
setTimeout(() => {
  console.log('📊 Checking processes after Aura started...');
  const afterStartXdotoolCount = getProcessCount('xdotool');
  const afterStartNodeCount = getProcessCount('node.*electron');
  console.log(`xdotool processes: ${afterStartXdotoolCount}`);
  console.log(`Node/Electron processes: ${afterStartNodeCount}`);

  // Terminate Aura
  console.log('\n🛑 Terminating Aura...');
  try {
    process.kill(-auraProcess.pid, 'SIGTERM');
  } catch (error) {
    console.log('Error terminating process group:', error.message);
  }

  // Wait for cleanup
  setTimeout(() => {
    console.log('📊 Checking processes after Aura terminated...');
    const afterTermXdotoolCount = getProcessCount('xdotool');
    const afterTermNodeCount = getProcessCount('node.*electron');
    console.log(`xdotool processes: ${afterTermXdotoolCount}`);
    console.log(`Node/Electron processes: ${afterTermNodeCount}`);

    // Analyze results
    console.log('\n📈 Analysis:');
    const xdotoolDiff = afterTermXdotoolCount - initialXdotoolCount;
    const nodeDiff = afterTermNodeCount - initialNodeCount;

    if (xdotoolDiff === 0) {
      console.log('✅ No xdotool processes left behind');
    } else {
      console.log(`⚠️  ${xdotoolDiff} xdotool process(es) may be left behind`);
    }

    if (nodeDiff <= 0) {
      console.log('✅ All Node/Electron processes cleaned up');
    } else {
      console.log(`⚠️  ${nodeDiff} Node/Electron process(es) may be left behind`);
    }

    if (xdotoolDiff === 0 && nodeDiff <= 0) {
      console.log('\n🎉 Cleanup test PASSED - No processes left behind!');
    } else {
      console.log('\n❌ Cleanup test FAILED - Some processes left behind');
      console.log('💡 This may cause issues like automatic typing after closing');
    }

    process.exit(xdotoolDiff === 0 && nodeDiff <= 0 ? 0 : 1);
  }, 3000);
}, 5000);